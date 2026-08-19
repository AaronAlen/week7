import { seedDatabase } from '../src/db/seed.js';
import { triggerRestockWorkflow, resumeRestockWorkflow } from '../src/services/agentService.js';
import { recordSale, receiveStock } from '../src/services/inventoryService.js';
import { Product, RestockRequest, PurchaseOrder, ApprovalsQueue, InventoryTransaction, User } from '../src/models/index.js';
import bcrypt from 'bcryptjs';
import { generateAccessToken, verifyAccessToken } from '../src/utils/jwt.js';

let passed = 0;
let failed = 0;

const assert = (condition, testName, message = '') => {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}: ${message}`);
    failed++;
  }
};

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING STOCKPILOT AUTOMATED VERIFICATION SUITE');
  console.log('======================================================\n');

  // Seed DB before test execution
  const { admin, manager, staff, products } = await seedDatabase();

  // ----------------------------------------------------
  // TEST 1 — NORMAL STOCK (NO RESTOCK NEEDED)
  // ----------------------------------------------------
  console.log('\n--- Scenario 1: Normal Healthy Stock Evaluation ---');
  const normalProduct = products.find(p => p.sku === 'SKU-KEYBOARD-004'); // Stock 45, Safety 20
  const test1Result = await triggerRestockWorkflow({ productId: normalProduct.id, userId: admin.id });
  assert(
    test1Result.status === 'completed' && test1Result.result?.status === 'NO_ACTION_NEEDED',
    'Test 1: Normal Stock',
    'Expected NO_ACTION_NEEDED workflow completion when stock is healthy'
  );

  // ----------------------------------------------------
  // TEST 2 — LOW STOCK + COST <= $1000 (AUTO PO)
  // ----------------------------------------------------
  console.log('\n--- Scenario 2: Low Stock + Low Cost (<= $1000 Auto PO) ---');
  const lowCostProduct = products.find(p => p.sku === 'SKU-HUB-003'); // Stock 8, Safety 20, Cost $18.50 * 52 = $962 <= $1000
  const test2Result = await triggerRestockWorkflow({ productId: lowCostProduct.id, userId: admin.id });
  assert(
    test2Result.status === 'completed' && test2Result.result?.status === 'PO_SENT',
    'Test 2: Auto Approval PO Creation',
    `Expected status 'completed' and 'PO_SENT'. Got status: ${test2Result.status}`
  );
  const po2 = await PurchaseOrder.findOne({ where: { productId: lowCostProduct.id } });
  assert(po2 && po2.status === 'SENT', 'Test 2: Purchase Order Status SENT', 'PO should be created with status SENT');

  // ----------------------------------------------------
  // TEST 3 — LOW STOCK + COST > $1000 (HITL INTERRUPT)
  // ----------------------------------------------------
  console.log('\n--- Scenario 3: Low Stock + High Cost (> $1000 HITL Interrupt) ---');
  const highCostProduct = products.find(p => p.sku === 'SKU-MONITOR-002'); // Stock 4, Safety 10, Target 20. Cost: 16 * $450 = $7200 > $1000
  const test3Result = await triggerRestockWorkflow({ productId: highCostProduct.id, userId: admin.id });
  assert(
    test3Result.status === 'approval_required',
    'Test 3: LangGraph Interrupt Triggered',
    `Expected status 'approval_required'. Got: ${test3Result.status}`
  );
  assert(test3Result.threadId !== null, 'Test 3: Thread ID captured', 'Thread ID must be populated for pause/resume');

  const approvalItem = await ApprovalsQueue.findOne({ where: { threadId: test3Result.threadId } });
  assert(approvalItem && approvalItem.status === 'PENDING', 'Test 3: Approval Queue Entry', 'Item should exist in ApprovalsQueue with PENDING status');

  // ----------------------------------------------------
  // TEST 4 — HITL APPROVAL (RESUME APPROVED)
  // ----------------------------------------------------
  console.log('\n--- Scenario 4: HITL Approval Decision (approved = true) ---');
  const test4Result = await resumeRestockWorkflow({
    threadId: test3Result.threadId,
    approved: true,
    userId: admin.id
  });
  assert(
    test4Result.status === 'approved' && test4Result.result?.status === 'PO_SENT',
    'Test 4: Workflow Resume with Approval',
    `Expected resumed workflow status 'approved' and PO_SENT. Got: ${test4Result.status}`
  );
  const po4 = await PurchaseOrder.findOne({ where: { productId: highCostProduct.id } });
  assert(po4 && po4.status === 'SENT', 'Test 4: High Cost PO Status SENT', 'High-cost PO should be marked SENT after approval');

  // ----------------------------------------------------
  // TEST 5 — HITL REJECTION (RESUME REJECTED)
  // ----------------------------------------------------
  console.log('\n--- Scenario 5: HITL Rejection Decision (approved = false) ---');
  const headsetProduct = products.find(p => p.sku === 'SKU-HEADSET-005'); // Stock 5, Safety 12 -> Cost 25 * $199 = $4975 > $1000
  const test5Trigger = await triggerRestockWorkflow({ productId: headsetProduct.id, userId: admin.id });
  const test5Resume = await resumeRestockWorkflow({
    threadId: test5Trigger.threadId,
    approved: false,
    userId: admin.id
  });

  assert(
    test5Resume.status === 'rejected' && test5Resume.result?.status === 'REJECTED',
    'Test 5: Workflow Resume with Rejection',
    `Expected status 'rejected'. Got: ${test5Resume.status}`
  );
  const headsetReloaded = await Product.findByPk(headsetProduct.id);
  assert(
    headsetReloaded.currentStock < headsetReloaded.safetyThreshold,
    'Test 5: Product Stock Remains LOW_STOCK',
    'Product stock should remain low after PO rejection'
  );

  // ----------------------------------------------------
  // TEST 6 — RECEIVE STOCK (ACID TRANSACTION)
  // ----------------------------------------------------
  console.log('\n--- Scenario 6: Receive Stock ACID Transaction ---');
  const monitorRestockReq = await RestockRequest.findOne({ where: { productId: highCostProduct.id } });
  const initialStock = highCostProduct.currentStock; // 4
  const receiveResult = await receiveStock({ restockRequestId: monitorRestockReq.id, userId: admin.id });

  assert(
    receiveResult.product.currentStock === initialStock + receiveResult.transaction.quantity,
    'Test 6: Product Stock Increment',
    `Expected stock ${initialStock + receiveResult.transaction.quantity}. Got: ${receiveResult.product.currentStock}`
  );
  assert(
    receiveResult.purchaseOrder.status === 'RECEIVED' && receiveResult.restockRequest.status === 'COMPLETED',
    'Test 6: PO & Request Status Update',
    'PO must be marked RECEIVED and RestockRequest marked COMPLETED'
  );

  // ----------------------------------------------------
  // TEST 7 — AUTHENTICATION & JWT TOKENS
  // ----------------------------------------------------
  console.log('\n--- Scenario 7: Authentication & JWT Verification ---');
  const token = generateAccessToken(admin);
  const decoded = verifyAccessToken(token);
  assert(decoded && decoded.email === admin.email, 'Test 7: JWT Signing & Decoding', 'Token decoding failed');

  const isPasswordMatch = await bcrypt.compare('password123', admin.password);
  assert(isPasswordMatch, 'Test 7: Bcrypt Password Hashing Match', 'Password hash comparison failed');

  // ----------------------------------------------------
  // TEST 8 — RBAC AUTHORIZATION SCOPING
  // ----------------------------------------------------
  console.log('\n--- Scenario 8: Role Based Access Control (RBAC) ---');
  assert(admin.role === 'ADMIN', 'Test 8: Admin Role Check', 'Admin role mismatch');
  assert(manager.role === 'MANAGER', 'Test 8: Manager Role Check', 'Manager role mismatch');
  assert(staff.role === 'STAFF', 'Test 8: Staff Role Check', 'Staff role mismatch');

  console.log('\n======================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
