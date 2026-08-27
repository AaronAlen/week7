import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

export async function extractDocumentText(filePath, originalFilename) {
  const ext = path.extname(originalFilename || filePath).toLowerCase();
  
  if (!fs.existsSync(filePath)) {
    return '';
  }

  const buffer = fs.readFileSync(filePath);

  if (ext === '.pdf') {
    try {
      const parser = new PDFParse({ data: buffer });
      const res = await parser.getText();
      return res.text || '';
    } catch (err) {
      console.warn(`[PDF Parse Warning] Failed to parse ${originalFilename}:`, err.message);
      return `[PDF Document: ${originalFilename} - binary format]`;
    }
  }

  // Text, JSON, CSV, Markdown, etc.
  try {
    return buffer.toString('utf8');
  } catch (err) {
    return `[Attached Document: ${originalFilename}]`;
  }
}
