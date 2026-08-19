import { StateGraph, MemorySaver, START, END } from '@langchain/langgraph';
import { RestockStateAnnotation } from './state.js';
import { evaluateStockNode } from './nodes/evaluateStockNode.js';
import { humanApprovalNode } from './nodes/humanApprovalNode.js';
import { executeRestockNode } from './nodes/executeRestockNode.js';
import { logger } from '../utils/logger.js';

// Route decision logic function
const routeDecision = (state) => {
  if (state.status === 'NO_ACTION_NEEDED') {
    logger.agent(`[routeDecision] No action needed, ending workflow.`);
    return END;
  }
  if (state.requiresHumanReview) {
    logger.agent(`[routeDecision] Total cost $${state.totalCost} > $1000. Routing to humanApprovalNode.`);
    return 'humanApprovalNode';
  }
  logger.agent(`[routeDecision] Total cost $${state.totalCost} <= $1000. Routing to executeRestockNode.`);
  return 'executeRestockNode';
};

// Build the workflow graph
const workflow = new StateGraph(RestockStateAnnotation)
  .addNode('evaluateStockNode', evaluateStockNode)
  .addNode('humanApprovalNode', humanApprovalNode)
  .addNode('executeRestockNode', executeRestockNode)
  .addEdge(START, 'evaluateStockNode')
  .addConditionalEdges('evaluateStockNode', routeDecision, {
    'humanApprovalNode': 'humanApprovalNode',
    'executeRestockNode': 'executeRestockNode',
    [END]: END
  })
  .addEdge('humanApprovalNode', 'executeRestockNode')
  .addEdge('executeRestockNode', END);

// Compile graph with memory saver checkpointer for state persistence across interrupt/resume
const memory = new MemorySaver();
export const restockAgent = workflow.compile({ checkpointer: memory });
