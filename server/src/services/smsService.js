import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let twilioClient = null;

const getTwilioClient = async () => {
  if (twilioClient) return twilioClient;

  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
    try {
      const { default: twilio } = await import('twilio');
      twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      return twilioClient;
    } catch (err) {
      logger.warn('📱 Twilio SDK initialization failed, falling back to mock logger:', err.message);
    }
  }

  return null;
};

/**
 * Send Purchase Order SMS to supplier
 */
export const sendPurchaseOrderSMS = async ({
  supplierPhone,
  supplierName,
  poId,
  productName,
  sku,
  quantity,
  totalCost
}) => {
  if (!env.SMS_ENABLED) {
    logger.info(`📱 SMS service is disabled in environment config. Skipping SMS for PO #${poId}.`);
    return { success: false, reason: 'SMS_DISABLED' };
  }

  // If supplierPhone is a demo 555 number or missing, route to verified trial recipient
  let recipientPhone = supplierPhone || '+916382315385';
  if (recipientPhone.includes('555') || recipientPhone.includes('019283')) {
    recipientPhone = '+916382315385';
  }

  const messageBody = `[StockPilot PO #${poId}] Dear ${supplierName}, official Purchase Order created for ${quantity}x '${productName}' (SKU: ${sku}). Total: $${Number(totalCost).toFixed(2)}. Please confirm delivery timeline.`;

  try {
    const client = await getTwilioClient();
    if (client && env.TWILIO_PHONE_NUMBER) {
      const res = await client.messages.create({
        body: messageBody,
        from: env.TWILIO_PHONE_NUMBER,
        to: recipientPhone
      });
      logger.info(`📱 Purchase Order SMS dispatched via Twilio to ${recipientPhone} (SID: ${res.sid})`);
      return { success: true, sid: res.sid, provider: 'twilio', recipient: recipientPhone };
    }

    // Fallback Dev / Logger SMS transport
    logger.info(`📱 [MOCK SMS DISPATCH] To: ${recipientPhone} | Text: "${messageBody}"`);
    return { success: true, provider: 'mock_logger', message: 'Mock SMS logged' };
  } catch (error) {
    logger.warn(`📱 SMS dispatch failed for ${recipientPhone}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Send Vendor Award / Negotiation SMS
 */
export const sendVendorProposalSMS = async ({
  to,
  vendorName,
  message
}) => {
  let recipientPhone = (to || '+916382315385').trim().replace(/[\s()-]/g, '');
  if (!recipientPhone.startsWith('+')) {
    recipientPhone = `+${recipientPhone}`;
  }

  // If phone is a mock 555 number, route to verified trial recipient so user receives live SMS
  if (recipientPhone.includes('555') || recipientPhone === '+15550199' || recipientPhone === '+15551234567') {
    recipientPhone = '+916382315385';
  }

  const textContent = message || `[StockPilot] Dear ${vendorName}, your proposal has been selected for our procurement RFP. Please reply with pro-forma invoice.`;

  try {
    const client = await getTwilioClient();
    if (client && env.SMS_ENABLED && env.TWILIO_PHONE_NUMBER) {
      const res = await client.messages.create({
        body: textContent,
        from: env.TWILIO_PHONE_NUMBER,
        to: recipientPhone
      });
      logger.info(`📱 Vendor SMS dispatched via Twilio to ${recipientPhone} (SID: ${res.sid})`);
      return { success: true, sid: res.sid, provider: 'twilio', recipient: recipientPhone };
    }

    // Fallback Mock Logger Transport
    logger.info(`📱 [MOCK SMS DISPATCH] To: ${recipientPhone} (${vendorName}) | Text: "${textContent}"`);
    return { success: true, provider: 'mock_logger', message: 'Mock SMS logged successfully', recipient: recipientPhone };
  } catch (error) {
    logger.warn(`📱 Vendor SMS dispatch failed for ${recipientPhone}: ${error.message} (Code: ${error.code})`);
    return { success: false, error: error.message, code: error.code };
  }
};
