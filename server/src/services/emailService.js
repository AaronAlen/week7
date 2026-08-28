import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let transporter;

const setupTransporter = async () => {
  if (transporter) return transporter;

  if (env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASSWORD) {
    try {
      transporter = nodemailer.createTransport({
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT || 587,
        secure: env.EMAIL_PORT === 465,
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      });
      return transporter;
    } catch (err) {
      logger.warn('📧 Real SMTP Transporter setup failed, falling back to mock logger:', err.message);
    }
  }

  // Fallback dev/logger transporter
  logger.info('📧 Configured mock/log email transporter for development.');
  transporter = nodemailer.createTransport({
    jsonTransport: true
  });
  return transporter;
};

/**
 * Universal email dispatcher:
 * 1. Checks Brevo HTTPS API (Port 443 - zero timeout, bypasses cloud port blocks)
 * 2. Falls back to Nodemailer SMTP (smtp-relay.brevo.com / Gmail)
 */
async function dispatchEmail({ to, subject, html, text }) {
  const brevoApiKey = env.BREVO_API_KEY || (env.EMAIL_PASSWORD && env.EMAIL_PASSWORD.startsWith('xkeysib-') ? env.EMAIL_PASSWORD : null);

  // 1. If Brevo API Key is present, send directly over HTTPS (Port 443) -> 100% bypasses cloud SMTP port blocks!
  if (brevoApiKey) {
    try {
      const senderEmail = env.EMAIL_USER || env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] || 'sourcing@stockpilot.io';
      const senderName = env.EMAIL_FROM?.replace(/<[^>]+>/, '').replace(/"/g, '').trim() || 'StockPilot';

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text || html.replace(/<[^>]+>/g, ' ')
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Brevo API returned error status ${response.status}`);
      }

      logger.info(`📧 Email dispatched via Brevo HTTPS API to ${to}: ${data.messageId || 'Success'}`);
      return { success: true, messageId: data.messageId || 'brevo_sent', recipient: to };
    } catch (apiErr) {
      logger.warn(`📧 Brevo API dispatch error: ${apiErr.message}. Attempting SMTP fallback...`);
    }
  }

  // 2. Nodemailer SMTP Fallback
  const mailer = await setupTransporter();
  const info = await mailer.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    text,
    html
  });

  return { success: true, messageId: info.messageId || 'sent', recipient: to };
}

/**
 * Send Purchase Order Email to supplier
 */
export const sendPurchaseOrderEmail = async ({
  supplierEmail,
  supplierName,
  poId,
  productName,
  sku,
  quantity,
  unitCost,
  totalCost
}) => {
  try {
    let recipient = supplierEmail;
    if (!recipient || recipient.includes('@techlogistics.com') || recipient.includes('@displaydirect.com') || recipient.includes('@connectsol.com') || recipient.includes('@peripheralhub.com') || recipient.includes('@audiotech.com') || recipient.includes('@example.com')) {
      recipient = env.EMAIL_USER || 'aaronbca123@gmail.com';
    }

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">StockPilot - Purchase Order #${poId}</h2>
        <p>Dear <strong>${supplierName}</strong>,</p>
        <p>Please accept this official purchase order for inventory replenishment.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 10px; text-align: left;">Item Details</th>
            <th style="padding: 10px; text-align: right;">Value</th>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;"><strong>Product Name:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7; text-align: right;">${productName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;"><strong>SKU:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7; text-align: right;">${sku}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;"><strong>Order Quantity:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7; text-align: right;">${quantity} units</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7;"><strong>Unit Cost:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #edf2f7; text-align: right;">$${Number(unitCost).toFixed(2)}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #eff6ff;">
            <td style="padding: 10px; color: #1e40af;"><strong>Total Order Amount:</strong></td>
            <td style="padding: 10px; color: #1e40af; text-align: right;">$${Number(totalCost).toFixed(2)}</td>
          </tr>
        </table>

        <p>Please confirm receipt of this order and reply with estimated delivery details.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">This email was automatically generated by StockPilot Inventory Restock Agent.</p>
      </div>
    `;

    return await dispatchEmail({
      to: recipient,
      subject: `OFFICIAL PURCHASE ORDER #${poId} - ${productName}`,
      html
    });
  } catch (error) {
    logger.warn(`📧 Email dispatch timed out/failed for ${supplierEmail}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Send Vendor RFP Award / Negotiation Email
 */
export const sendVendorProposalEmail = async ({
  to,
  vendorName,
  subject,
  content
}) => {
  try {
    let recipient = to;
    if (!recipient || recipient.includes('@example.com') || recipient.includes('@vendor.com') || recipient.includes('@supplier') || recipient.includes('@shenzhen') || recipient.includes('@apex') || recipient.includes('vendor@company.com')) {
      recipient = env.EMAIL_USER || 'aaronbca123@gmail.com';
    }

    const emailSubject = subject || `StockPilot Sourcing RFP Award & Next Steps - ${vendorName}`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 650px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; margin: 0 auto;">
        <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0; font-size: 20px;">StockPilot Procurement & Supply Chain</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Official Vendor RFP Communication</p>
        </div>
        
        <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px; color: #64748b;">
          <p style="margin: 0;"><strong>Recipient:</strong> ${vendorName} &lt;${recipient}&gt;</p>
          <p style="margin: 4px 0 0 0;">Sent autonomously via StockPilot Supplier Intelligence AI Platform.</p>
        </div>
      </div>
    `;

    return await dispatchEmail({
      to: recipient,
      subject: emailSubject,
      text: content,
      html
    });
  } catch (error) {
    logger.warn(`📧 Vendor email dispatch failed for ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Send Customer Support / Refund Decision Email via Brevo / Nodemailer
 */
export const sendCustomerSupportEmail = async ({
  to,
  customerName,
  orderNumber,
  subject,
  content
}) => {
  try {
    let recipient = to;
    if (!recipient || recipient.includes('@example.com') || recipient.includes('alice.johnson@example.com') || recipient.includes('customer@example.com')) {
      recipient = env.EMAIL_USER || 'aaronbca123@gmail.com';
    }

    const emailSubject = subject || `Update Regarding Your Order #${orderNumber || ''} - StockPilot Customer Support`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 650px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; margin: 0 auto; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0; font-size: 20px;">StockPilot Customer Care</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Official Support Communication for Order #${orderNumber || 'General'}</p>
        </div>
        
        <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #334155; margin-bottom: 24px; font-family: inherit;">
${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 12px; color: #64748b;">
          <p style="margin: 0;"><strong>Customer:</strong> ${customerName || 'Valued Customer'} &lt;${recipient}&gt;</p>
          <p style="margin: 4px 0 0 0;">This email was sent by the StockPilot Customer Support Operations Team.</p>
        </div>
      </div>
    `;

    return await dispatchEmail({
      to: recipient,
      subject: emailSubject,
      text: content,
      html
    });
  } catch (error) {
    logger.warn(`📧 Customer support email dispatch failed for ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};
