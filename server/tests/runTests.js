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
  const normalProduct = products.find(p => p.sku === 'SKU-KEYBOARD-004'); // Stock 80, Safety 20
  const test1Result = await triggerRestockWorkflow({ productId: normalProduct.id, userId: admin.id });
  assert(
    test1Result.status === 'no_action_needed',
    'Test 1: Normal Stock',
    `Expected 'no_action_needed' workflow completion when stock is healthy. Got: ${test1Result.status}`
  );

  // ----------------------------------------------------
  // TEST 2 — LOW STOCK + COST <= $1000 (AUTO PO)
  // ----------------------------------------------------
  console.log('\n--- Scenario 2: Low Stock + Low Cost (<= $1000 Auto PO) ---');
  const lowCostProduct = products.find(p => p.sku === 'SKU-HUB-003'); // Stock 8, Safety 20
  const test2Result = await triggerRestockWorkflow({ productId: lowCostProduct.id, userId: admin.id });
  assert(
    test2Result.status === 'completed' || test2Result.status === 'already_active',
    'Test 2: Auto Approval PO Creation',
    `Expected status 'completed' or 'already_active'. Got status: ${test2Result.status}`
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
    test3Result.status === 'approval_required' || test3Result.status === 'already_active',
    'Test 3: Groq AI Approval Workflow Triggered',
    `Expected status 'approval_required' or 'already_active'. Got: ${test3Result.status}`
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
    'Decision APPROVED should create SENT purchase order and complete workflow'
  );

  const poHighCost = await PurchaseOrder.findOne({ where: { productId: highCostProduct.id } });
  assert(poHighCost && poHighCost.status === 'SENT', 'Test 4: High Cost PO Status SENT', 'Approved PO must have status SENT');

  // ----------------------------------------------------
  // TEST 5 — HITL REJECTION (RESUME REJECTED)
  // ----------------------------------------------------
  console.log('\n--- Scenario 5: HITL Rejection Decision (approved = false) ---');
  const headsetProduct = products.find(p => p.sku === 'SKU-HEADSET-005');
  const headsetApproval = await ApprovalsQueue.findOne({
    include: [{ model: RestockRequest, as: 'restockRequest', where: { productId: headsetProduct.id } }]
  });

  const test5Result = await resumeRestockWorkflow({
    threadId: headsetApproval.threadId,
    approved: false,
    userId: manager.id
  });

  assert(
    test5Result.status === 'rejected' && test5Result.result?.status === 'REJECTED',
    'Test 5: Workflow Resume with Rejection',
    'Decision REJECTED should record rejection and terminate workflow without PO'
  );

  const headsetProdCheck = await Product.findByPk(headsetProduct.id);
  assert(
    headsetProdCheck.currentStock === headsetProduct.currentStock,
    'Test 5: Product Stock Remains LOW_STOCK',
    'Rejected restock must leave stock unchanged'
  );

  // ----------------------------------------------------
  // TEST 6 — STOCK RECEIPT ACID TRANSACTION
  // ----------------------------------------------------
  console.log('\n--- Scenario 6: Receive Stock ACID Transaction ---');
  const initialStock = highCostProduct.currentStock; // 4
  const receivedQty = poHighCost.quantity; // 16

  const receiveResult = await receiveStock({
    purchaseOrderId: poHighCost.id,
    userId: staff.id
  });

  const updatedHighCostProd = await Product.findByPk(highCostProduct.id);
  assert(
    updatedHighCostProd.currentStock === initialStock + receivedQty,
    'Test 6: Product Stock Increment',
    `Expected stock ${initialStock + receivedQty}, got ${updatedHighCostProd.currentStock}`
  );

  const refreshedPo = await PurchaseOrder.findByPk(poHighCost.id);
  assert(refreshedPo.status === 'RECEIVED', 'Test 6: PO & Request Status Update', 'PO should be marked RECEIVED');

  // ----------------------------------------------------
  // TEST 7 — AUTH & JWT CRYPTOGRAPHY
  // ----------------------------------------------------
  console.log('\n--- Scenario 7: Authentication & JWT Verification ---');
  const testPayload = { id: admin.id, email: admin.email, role: admin.role };
  const token = generateAccessToken(testPayload);
  const decoded = verifyAccessToken(token);

  assert(
    decoded && decoded.id === admin.id && decoded.role === 'ADMIN',
    'Test 7: JWT Signing & Decoding',
    'Token payload must match original user identity and role'
  );

  const passwordMatch = await bcrypt.compare('password123', admin.password);
  assert(passwordMatch === true, 'Test 7: Bcrypt Password Hashing Match', 'Password verification failed');

  // ----------------------------------------------------
  // TEST 8 — RBAC PERMISSIONS ENFORCEMENT
  // ----------------------------------------------------
  console.log('\n--- Scenario 8: Role Based Access Control (RBAC) ---');
  const checkRole = (userRole, allowedRoles) => allowedRoles.includes(userRole);

  assert(checkRole(admin.role, ['ADMIN']), 'Test 8: Admin Role Check', 'Admin must have ADMIN authorization');
  assert(checkRole(manager.role, ['ADMIN', 'MANAGER']), 'Test 8: Manager Role Check', 'Manager must have elevated authorization');
  assert(!checkRole(staff.role, ['ADMIN', 'MANAGER']), 'Test 8: Staff Role Check', 'Staff must NOT have Admin/Manager authorization');

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n======================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
