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
  console.log("this is from mssageeee");
  
  if (!env.SMS_ENABLED) {
    logger.info(`📱 SMS service is disabled in environment config. Skipping SMS for PO #${poId}.`);
    return { success: false, reason: 'SMS_DISABLED' };
  }

  if (!supplierPhone) {
    logger.warn(`📱 No supplier phone number provided for ${supplierName} (PO #${poId}). Skipping SMS notification.`);
    return { success: false, reason: 'NO_PHONE', message: 'No supplier phone number configured' };
  }

  const messageBody = `[StockPilot PO #${poId}] Dear ${supplierName}, official Purchase Order created for ${quantity}x '${productName}' (SKU: ${sku}). Total: $${Number(totalCost).toFixed(2)}. Please confirm delivery timeline.`;

  try {
    const client = await getTwilioClient();
    if (client) {
      const res = await client.messages.create({
        body: messageBody,
        from: env.TWILIO_PHONE_NUMBER,
        to: supplierPhone
      });
      logger.info(`📱 Purchase Order SMS dispatched via Twilio to ${supplierPhone} (SID: ${res.sid})`);
      return { success: true, sid: res.sid, provider: 'twilio' };
    }

    // Fallback Dev / Logger SMS transport
    logger.info(`📱 [MOCK SMS DISPATCH] To: ${supplierPhone} | Text: "${messageBody}"`);
    return { success: true, provider: 'mock_logger', message: 'Mock SMS logged' };
  } catch (error) {
    logger.warn(`📱 SMS dispatch failed for ${supplierPhone}: ${error.message}`);
    return { success: false, error: error.message };
  }
};
