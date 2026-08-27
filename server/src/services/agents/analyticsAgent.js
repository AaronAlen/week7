import {
  Product,
  InventoryTransaction,
  ApprovalsQueue,
  RefundRequest
} from '../../models/index.js';
import { callGroqWithFallback } from './groqClient.js';
import { logger } from '../../utils/logger.js';

/**
 * =========================================================================
 * AGENT 4: Interactive Dashboard & Chat Analytics AI Agent
 * =========================================================================
 * Analyzes live database tables and answers questions in natural language.
 */
export const runInventoryAnalyticsAgent = async ({ query, userId }) => {
  const products = await Product.findAll({ order: [['currentStock', 'ASC']] });
  const lowStockProducts = products.filter(p => p.currentStock <= p.safetyThreshold);
  const overTargetProducts = products.filter(p => p.currentStock > p.targetStock);
  
  const recentSales = await InventoryTransaction.findAll({
    where: { type: 'SALE' },
    limit: 50,
    order: [['createdAt', 'DESC']],
    include: [{ model: Product, as: 'product', attributes: ['name', 'sku'] }]
  });

  const salesByProduct = {};
  for (const s of recentSales) {
    const pName = s.product?.name || `Product #${s.productId}`;
    salesByProduct[pName] = (salesByProduct[pName] || 0) + (s.quantity || 0);
  }

  const topSellingList = Object.entries(salesByProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => `${name} (${qty} units sold)`);

  const totalInventoryValuation = products.reduce(
    (sum, p) => sum + (p.currentStock * Number(p.unitCost)), 
    0
  );

  const pendingApprovalsCount = await ApprovalsQueue.count({ where: { status: 'PENDING' } });
  const pendingRefundsCount = await RefundRequest.count({ where: { status: 'PENDING_APPROVAL' } });

  const contextData = {
    totalProductsCount: products.length,
    lowStockCount: lowStockProducts.length,
    lowStockItems: lowStockProducts.map(p => `${p.name} (Current Stock: ${p.currentStock}, Safety Threshold: ${p.safetyThreshold}, Target Stock: ${p.targetStock})`),
    overTargetCount: overTargetProducts.length,
    overTargetItems: overTargetProducts.map(p => `${p.name} (Current Stock: ${p.currentStock} units, Target Stock: ${p.targetStock} units, Surplus: +${p.currentStock - p.targetStock} units)`),
    topFastestMovingProducts: topSellingList.length > 0 ? topSellingList : ['No recent sales recorded yet'],
    totalInventoryValuation: `$${totalInventoryValuation.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    pendingRestockApprovals: pendingApprovalsCount,
    pendingRefundApprovals: pendingRefundsCount,
    allProductList: products.map(p => ({
      name: p.name,
      sku: p.sku,
      currentStock: p.currentStock,
      safetyThreshold: p.safetyThreshold,
      targetStock: p.targetStock,
      surplusOverTarget: p.currentStock > p.targetStock ? p.currentStock - p.targetStock : 0,
      unitCost: `$${Number(p.unitCost).toFixed(2)}`,
      totalValuation: `$${(p.currentStock * Number(p.unitCost)).toFixed(2)}`,
      supplier: p.supplierName,
      status: p.stockStatus
    }))
  };

  const systemPrompt = `You are StockPilot's Senior AI Inventory & Operations Analytics Copilot.
You have real-time live database telemetry spanning catalog products, current vs target stock, safety thresholds, sales velocity, valuation, and approvals.

CRITICAL SCOPE & DOMAIN BOUNDARY:
1. STRICT SCOPE ENFORCEMENT: You must ONLY answer questions directly related to StockPilot's project database: inventory stock levels, product catalog, safety thresholds, target counts, sales velocity, suppliers, purchase orders, restock workflows, and customer refunds.
2. REJECT GENERAL / TRIVIA QUESTIONS: If the user asks an unrelated general knowledge question (e.g., geography, trivia, "what is the capital of India", general world facts, politics, weather, entertainment, etc.), DO NOT answer the general question.
   - Politely decline by responding:
   "I am StockPilot's specialized Inventory & Operations Intelligence Agent. I only answer questions related to our project's inventory database, product catalog, stock levels, suppliers, and procurement workflows."
   - Then provide 2-3 supply chain and catalog questions they can ask about our live inventory.
3. INVENTORY TELEMETRY QUERIES:
   - If the user asks about products exceeding target stock or overstocked items (e.g. "which inventory stock product has higher count than target count"), explicitly name the products where currentStock > targetStock (e.g. "${contextData.overTargetItems.join('; ')}"), state the exact current vs target quantities and the surplus amount.
   - If the user asks about low stock, sales velocity, valuation, or suppliers, cite the exact figures from the LIVE DATABASE SNAPSHOT below.
4. Format your answer using clean markdown, bold highlights, and clear tables or bullet points.

LIVE DATABASE SNAPSHOT:
- Products with Current Stock HIGHER than Target Stock: ${contextData.overTargetCount > 0 ? contextData.overTargetItems.join(' | ') : 'None (no products currently exceed target stock)'}
- Low Stock Items (Current <= Safety Threshold): ${contextData.lowStockCount > 0 ? contextData.lowStockItems.join(' | ') : 'All products healthy'}
- Total Catalog Products: ${contextData.totalProductsCount}
- Top Selling Products: ${contextData.topFastestMovingProducts.join(', ')}
- Total Inventory Capital Valuation: ${contextData.totalInventoryValuation}
- Pending Restock Approvals (> $1000): ${contextData.pendingRestockApprovals}
- Pending Refund Approvals (> $150): ${contextData.pendingRefundApprovals}
- Full Product Detail Records: ${JSON.stringify(contextData.allProductList, null, 2)}`;

  try {
    const completion = await callGroqWithFallback({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.2,
      max_tokens: 1500
    });

    const answer = completion.choices[0]?.message?.content || 'Unable to analyze inventory data at this time.';

    return {
      success: true,
      answer,
      metrics: {
        totalProducts: contextData.totalProductsCount,
        lowStockCount: contextData.lowStockCount,
        fastestMoving: contextData.topFastestMovingProducts[0] || 'N/A',
        valuation: contextData.totalInventoryValuation,
        pendingApprovals: contextData.pendingRestockApprovals,
        pendingRefunds: contextData.pendingRefundApprovals
      }
    };
  } catch (err) {
    logger.error(`[Groq Analytics Error] ${err.message}`);
    
    const qLower = (query || '').toLowerCase();
    let fallbackAnswer = '';

    if (qLower.includes('higher') || qLower.includes('target') || qLower.includes('overstock') || qLower.includes('surplus') || qLower.includes('more than target')) {
      if (overTargetProducts.length > 0) {
        fallbackAnswer = `### 📦 Products with Stock Higher than Target Stock\n\n`;
        fallbackAnswer += `The following **${overTargetProducts.length} product(s)** currently have inventory levels exceeding their configured target stock:\n\n`;
        overTargetProducts.forEach(p => {
          const surplus = p.currentStock - p.targetStock;
          fallbackAnswer += `* **${p.name}** (\`${p.sku}\`):\n`;
          fallbackAnswer += `  - **Current Stock**: **${p.currentStock} units**\n`;
          fallbackAnswer += `  - **Target Stock**: **${p.targetStock} units** (Safety Threshold: ${p.safetyThreshold} units)\n`;
          fallbackAnswer += `  - **Surplus**: **+${surplus} units above target** (Valued at $${(surplus * Number(p.unitCost)).toFixed(2)})\n\n`;
        });
        fallbackAnswer += `> **Recommendation**: Consider promotional campaigns or slowing re-orders to normalize working capital.`;
      } else {
        fallbackAnswer = `### 📦 Stock vs. Target Analysis\n\nCurrently, **no products** have inventory counts exceeding their target stock levels. All items are operating at or below target capacity.`;
      }
    } else if (qLower.includes('capital') || qLower.includes('india') || qLower.includes('weather') || qLower.includes('president') || qLower.includes('movie')) {
      fallbackAnswer = `I am StockPilot's specialized Inventory & Operations Intelligence Agent. I can only answer questions regarding our project's inventory database, product catalog, stock levels, suppliers, sales trends, and procurement workflows.\n\n> **Suggested questions you can ask me:**\n* *"Which inventory stock product has higher count than target count?"*\n* *"Which products are currently below their safety threshold?"*\n* *"What is our total inventory capital valuation?"*\n* *"What are our top fastest-moving products by sales volume?"*`;
    } else if (qLower.includes('low') || qLower.includes('risk') || qLower.includes('shortage') || qLower.includes('reorder')) {
      fallbackAnswer = `### ⚠️ Low Stock & Restock Alerts\n\n`;
      if (lowStockProducts.length > 0) {
        fallbackAnswer += `The following products have fallen below their safety thresholds:\n\n`;
        lowStockProducts.forEach(p => {
          fallbackAnswer += `* **${p.name}** (\`${p.sku}\`): Current **${p.currentStock} units** (Safety Threshold: **${p.safetyThreshold} units**, Target: **${p.targetStock} units**)\n`;
        });
      } else {
        fallbackAnswer = `All products are currently above their safety thresholds. No critical stockouts detected.`;
      }
    } else {
      fallbackAnswer = `### 📊 Live Operations & Inventory Analysis\n\n`;
      fallbackAnswer += `* **Over-Target Inventory**: ${contextData.overTargetCount > 0 ? contextData.overTargetItems.join(', ') : 'None'}\n`;
      fallbackAnswer += `* **Fastest Moving Products**: ${contextData.topFastestMovingProducts.join(', ')}\n`;
      fallbackAnswer += `* **Low Stock Items Requiring Attention**: ${contextData.lowStockCount > 0 ? contextData.lowStockItems.join(', ') : 'All products currently healthy'}\n`;
      fallbackAnswer += `* **Total Inventory Valuation**: ${contextData.totalInventoryValuation}\n`;
      fallbackAnswer += `* **Pending Human Approvals**: ${contextData.pendingRestockApprovals} restock order(s), ${contextData.pendingRefundApprovals} refund(s)\n`;
    }

    return {
      success: true,
      answer: fallbackAnswer,
      metrics: {
        totalProducts: contextData.totalProductsCount,
        lowStockCount: contextData.lowStockCount,
        fastestMoving: contextData.topFastestMovingProducts[0] || 'N/A',
        valuation: contextData.totalInventoryValuation,
        pendingApprovals: contextData.pendingRestockApprovals,
        pendingRefunds: contextData.pendingRefundApprovals
      }
    };
  }
};
