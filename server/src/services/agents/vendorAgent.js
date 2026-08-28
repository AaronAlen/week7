import { VendorEvaluation, AgentLog } from '../../models/index.js';
import { callGroqWithFallback } from './groqClient.js';
import { logger } from '../../utils/logger.js';

/**
 * =========================================================================
 * AGENT 5: Autonomous Vendor Selection & Supplier Intelligence AI Agent
 * =========================================================================
 * Multi-Criteria Decision Analysis (MCDA) across Price, Warranty, Quality, Lead Time, and Reliability.
 */
export const runVendorEvaluationAgent = async ({
  title = 'Multi-Vendor Supplier Comparison',
  productCategory = 'General Catalog',
  targetQuantity = 100,
  priorityFocus = 'BALANCED',
  vendorProposals = [],
  documentSnippets = [],
  uploadedFiles = [],
  userId,
  senderName = 'Procurement Specialist',
  senderRole = 'MANAGER',
  senderEmail = 'procurement@stockpilot.com'
}) => {
  const hasProposals = Array.isArray(vendorProposals) && vendorProposals.length >= 2;
  const hasDocuments = Array.isArray(documentSnippets) && documentSnippets.length >= 2;

  if (!hasProposals && !hasDocuments && (vendorProposals.length + documentSnippets.length) < 2) {
    throw new Error('At least 2 vendor proposals or uploaded quote documents are required for multi-vendor comparison.');
  }

  const systemPrompt = `You are StockPilot's Chief Procurement Officer & Supplier Intelligence AI Agent.
Evaluate and compare multiple vendor proposals, contract terms, warranties, quality standards, and pricing structures.
Extract vendor contact information (email, phone) and commercial details directly from raw document text.

You must respond with ONLY a valid JSON object matching this exact structure:
{
  "bestVendorName": "string",
  "bestVendorEmail": "string",
  "bestVendorPhone": "string",
  "overallRecommendationScore": number, // 0 to 100
  "extractedVendors": [
    {
      "vendorName": "string",
      "vendorEmail": "string",
      "vendorPhone": "string",
      "unitPrice": number,
      "warrantyMonths": number,
      "leadTimeDays": number,
      "qualityGrade": "string",
      "defectRatePct": "string",
      "paymentTerms": "string",
      "notes": "string"
    }
  ],
  "scoringMatrix": [
    {
      "vendorName": "string",
      "vendorEmail": "string",
      "vendorPhone": "string",
      "priceScore": number, // 0-100
      "qualityScore": number, // 0-100
      "warrantyScore": number, // 0-100
      "leadTimeScore": number, // 0-100
      "compositeScore": number, // 0-100
      "pros": ["string"],
      "cons": ["string"],
      "estimatedTotalContractCost": number
    }
  ],
  "executiveSummary": "string", // Multi-paragraph detailed analysis explaining why the winner was chosen
  "keyTradeoffs": [
    {
      "comparison": "string",
      "analysis": "string"
    }
  ],
  "riskAnalysis": "string", // Hidden traps, MOQ constraints, SLA risks
  "negotiationStrategy": "string", // Actionable counter-offer advice to extract better pricing or terms
  "emailSubject": "string", // Subject line for procurement email
  "emailDraft": "string", // Formal procurement email to the chosen vendor signed by ${senderName} (${senderRole}) without any phone number
  "smsDraft": "string" // Natural, polite, human-written business SMS (e.g. 'Hi [Vendor Name] team, this is ${senderName} from StockPilot. We have approved your quotation for ${targetQuantity} units of ${title}. Please reply with your pro-forma invoice to confirm the order. Thank you!')
}`;

  const userPrompt = `Compare and evaluate vendor proposals for procurement:
Procurement Title: ${title}
Product Category: ${productCategory}
Target Volume: ${targetQuantity} units
Strategic Priority Focus: ${priorityFocus} (options: BALANCED, LOWEST_PRICE, HIGHEST_QUALITY, LONGEST_WARRANTY, FASTEST_LEAD_TIME)
Sender / Logged-in User: ${senderName} (${senderRole}) <${senderEmail}>

${vendorProposals.length > 0 ? `SUBMITTED VENDOR PROPOSALS & CONTRACT DETAILS:\n${JSON.stringify(vendorProposals, null, 2)}` : 'No manual form inputs provided. Extract all vendor proposals and contact info directly from the attached documents below.'}

ATTACHED VENDOR DOCUMENTS, QUOTATION SHEETS & WARRANTY CONTRACTS:
${documentSnippets.length > 0 ? documentSnippets.join('\n\n====================\n\n') : 'No additional raw document text provided.'}

EVALUATION & DISPATCH INSTRUCTIONS:
1. Parse every distinct vendor quote and extract their official contact email address and phone number.
2. Rank all vendors from highest composite score to lowest in the "scoringMatrix" according to ${priorityFocus}.
3. EMAIL SIGNATURE RULE: Sign the email using ONLY the logged-in user's details:
   Best regards,
   ${senderName}
   ${senderRole} | StockPilot Sourcing
   ${senderEmail}
   CRITICAL: DO NOT include any phone number in the email. DO NOT use placeholders like [Your Name], [Phone], [Email].
4. SMS DRAFT RULE: Write a warm, courteous, and completely natural human-written SMS text that any vendor can instantly understand (e.g. "Hi [Vendor Name] team, this is ${senderName} from StockPilot. We have approved your quotation for ${targetQuantity} units of ${title}. Please reply with your pro-forma invoice to confirm the order. Thank you!"). DO NOT use robotic shorthand like 'awarded 500x' or 'check your email'.`;

  const completion = await callGroqWithFallback({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 4000
  });

  const decision = JSON.parse(completion.choices[0]?.message?.content || '{}');

  // Sanitize emailDraft to guarantee no phone numbers and replace any lingering placeholders
  if (decision.emailDraft) {
    let cleanedEmail = decision.emailDraft
      .replace(/\[Your Name\]/gi, senderName)
      .replace(/\[Name\]/gi, senderName)
      .replace(/\[Email\]/gi, senderEmail)
      .replace(/\[Phone\]/gi, '')
      .replace(/(?:Phone|Tel|Mobile|WhatsApp)[\s:]*\[?[+\d\s()-]+\]?/gi, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();

    // Ensure proper user sign-off if AI truncated signature
    if (!cleanedEmail.includes(senderName)) {
      cleanedEmail += `\n\nBest regards,\n${senderName}\n${senderRole} | StockPilot Sourcing\n${senderEmail}`;
    }

    decision.emailDraft = cleanedEmail;
  }

  // Sanitize smsDraft to guarantee human, courteous, natural messaging (< 115 characters)
  const shortVendor = (decision.bestVendorName || 'Vendor').split(' ')[0];
  decision.smsDraft = `Hi ${shortVendor} team, StockPilot has approved your quote for ${targetQuantity}x units. Please reply to confirm!`;

  // Save to database
  const evaluation = await VendorEvaluation.create({
    title,
    productCategory,
    targetQuantity: Number(targetQuantity),
    priorityFocus,
    vendorProposals,
    bestVendorName: decision.bestVendorName,
    overallRecommendationScore: decision.overallRecommendationScore,
    scoringMatrix: decision.scoringMatrix || [],
    executiveSummary: decision.executiveSummary,
    keyTradeoffs: decision.keyTradeoffs || [],
    negotiationStrategy: decision.negotiationStrategy,
    emailDraft: decision.emailDraft,
    uploadedFiles,
    evaluatedBy: userId || null
  });

  // Log action
  await AgentLog.create({
    action: 'VENDOR_INTELLIGENCE_EVALUATION',
    status: 'EVALUATION_COMPLETED',
    message: `Sourcing intelligence evaluated ${vendorProposals.length} vendor proposals for '${title}'. Winner: ${decision.bestVendorName} (Score: ${decision.overallRecommendationScore}/100). Strategic Priority: ${priorityFocus}.`
  });

  return {
    success: true,
    evaluationId: evaluation.id,
    decision,
    evaluation
  };
};
