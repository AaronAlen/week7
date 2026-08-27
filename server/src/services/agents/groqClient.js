import Groq from 'groq-sdk';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export function getGroqClient() {
  const apiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'gsk_fallback_key') {
    return null;
  }
  return new Groq({ apiKey });
}

export const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'groq/compound',
  'groq/compound-mini'
];

export async function callGroqWithFallback(params) {
  const client = getGroqClient();
  if (!client) {
    throw new Error('GROQ_API_KEY is not configured in production environment variables.');
  }

  let lastError = null;
  for (const model of GROQ_MODELS) {
    try {
      return await client.chat.completions.create({
        ...params,
        model
      });
    } catch (err) {
      lastError = err;
      logger.warn(`[Groq Model ${model} Attempt Failed]: ${err.message}. Trying next model...`);
      continue;
    }
  }
  throw lastError || new Error('All Groq AI models failed.');
}
