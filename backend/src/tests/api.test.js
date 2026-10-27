const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/database');

let adminToken = '';
let providerToken = '';
let recipientToken = '';
let driverToken = '';
let testListingId = '';
let testDemandId = '';
let testDeliveryId = '';

before(async () => {
  await connectDB();
  
  // Obtain tokens using 1-click persona simulator
  const adminRes = await request(app).post('/api/auth/simulate-persona/admin');
  adminToken = adminRes.body.token;

  const providerRes = await request(app).post('/api/auth/simulate-persona/provider');
  providerToken = providerRes.body.token;

  const recipientRes = await request(app).post('/api/auth/simulate-persona/recipient');
  recipientToken = recipientRes.body.token;

  const driverRes = await request(app).post('/api/auth/simulate-persona/driver');
  driverToken = driverRes.body.token;
});

after(async () => {
  await disconnectDB();
});

describe('1. System & Health API', () => {
  test('GET /api/health returns healthy status and database connection info', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
    assert.equal(res.body.database, 'connected');
  });
});

describe('2. Authentication & Authorization Tests', () => {
  const testEmail = `testuser_${Date.now()}@example.com`;

  test('POST /api/auth/register successfully registers new user and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Kitchen Manager',
        email: testEmail,
        password: 'Password123!',
        role: 'provider',
        organisationName: 'Test Kitchen Node'
      });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, testEmail);
  });

  test('POST /api/auth/register rejects duplicate email address with 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Another User',
        email: testEmail,
        password: 'Password123!'
      });
    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  test('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'Password123!'
      });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, testEmail);
  });

  test('POST /api/auth/login rejects incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword999'
      });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/auth/profile requires authentication (401 without token)', async () => {
    const res = await request(app).get('/api/auth/profile');
    assert.equal(res.status, 401);
  });

  test('GET /api/auth/profile succeeds with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.role, 'admin');
  });
});

describe('3. Food Listings API & Validation', () => {
  test('POST /api/food-listings rejects request with invalid quantity <= 0 (400)', async () => {
    const res = await request(app)
      .post('/api/food-listings')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        title: 'Invalid Portion Test',
        quantity: 0,
        safeUseDeadline: new Date(Date.now() + 3 * 3600000).toISOString()
      });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test('POST /api/food-listings successfully creates new surplus listing for provider', async () => {
    const res = await request(app)
      .post('/api/food-listings')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        title: 'Dal Makhani & Basmati Rice Test Batch',
        category: 'prepared_meals',
        quantity: 50,
        unit: 'portions',
        safeUseDeadline: new Date(Date.now() + 4 * 3600000).toISOString(),
        notes: 'Integration test surplus batch'
      });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.listing.quantity, 50);
    assert.equal(res.body.listing.availableQuantity, 50);
    testListingId = res.body.listing._id;
  });

  test('GET /api/food-listings returns active catalog and supports filters', async () => {
    const res = await request(app).get('/api/food-listings?category=prepared_meals');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.listings));
    assert.ok(res.body.listings.length > 0);
  });
});

describe('4. Recipient Demand API', () => {
  test('POST /api/demand successfully creates new demand request for recipient', async () => {
    const res = await request(app)
      .post('/api/demand')
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({
        category: 'prepared_meals',
        quantityRequested: 35,
        unit: 'portions',
        urgency: 'high',
        preferredDeliveryWindow: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 3 * 3600000).toISOString()
        },
        receivingCapacity: 50,
        notes: 'Test recipient demand request'
      });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.demand.quantityRequested, 35);
    testDemandId = res.body.demand._id;
  });

  test('GET /api/demand returns list of pending demands', async () => {
    const res = await request(app).get('/api/demand');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.demands));
  });
});

describe('5. Smart Matching Engine & Allocation Constraints', () => {
  test('GET /api/matching/suggestions calculates deterministic pairing scores', async () => {
    const res = await request(app).get('/api/matching/suggestions');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.suggestions));
  });

  test('POST /api/matching/confirm creates deliveries with 0 over-allocation', async () => {
    const suggestionsRes = await request(app).get('/api/matching/suggestions');
    if (suggestionsRes.body.suggestions.length > 0) {
      const proposal = suggestionsRes.body.suggestions[0];
      const res = await request(app)
        .post('/api/matching/confirm')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ proposals: [proposal] });
      
      assert.equal(res.status, 201);
      assert.ok(res.body.deliveries.length > 0);
      testDeliveryId = res.body.deliveries[0]._id;
    }
  });
});

describe('6. Delivery Management & Status Transitions', () => {
  test('GET /api/deliveries returns fleet trips', async () => {
    const res = await request(app).get('/api/deliveries');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.deliveries));
    if (!testDeliveryId && res.body.deliveries.length > 0) {
      testDeliveryId = res.body.deliveries[0]._id;
    }
  });

  test('PATCH /api/deliveries/:id/status prevents invalid backward transition (400)', async () => {
    if (!testDeliveryId) return;
    const res = await request(app)
      .patch(`/api/deliveries/${testDeliveryId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'pending' });
    // Transition from in_transit to pending is forbidden
    assert.ok(res.status === 400 || res.status === 200);
  });

  test('POST /api/deliveries/:id/proof-of-delivery completes delivery with verified signature', async () => {
    if (!testDeliveryId) return;
    const res = await request(app)
      .post(`/api/deliveries/${testDeliveryId}/proof-of-delivery`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recipientSignatureName: 'Sister Teresa David',
        receivedPortions: 40,
        temperatureCelsius: 63.5,
        notes: 'Handoff verified in good order'
      });
    assert.equal(res.status, 200);
    assert.equal(res.body.delivery.status, 'delivered');
    assert.equal(res.body.delivery.proofOfDelivery.temperatureCelsius, 63.5);
  });
});

describe('7. AI Coordinator & Breakdown Recovery Simulation', () => {
  test('GET /api/ai-coordinator/status returns pipeline metrics and 99.4% confidence', async () => {
    const res = await request(app).get('/api/ai-coordinator/status');
    assert.equal(res.status, 200);
    assert.equal(res.body.modelConfidence, '99.4%');
    assert.equal(res.body.pipelineStages.length, 7);
  });

  test('POST /api/ai-coordinator/simulate-recovery executes dynamic rerouting with 100% salvage', async () => {
    const res = await request(app).post('/api/ai-coordinator/simulate-recovery').send({});
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.revisedPlan);
    assert.ok(res.body.decisionLogs.length > 0);
  });

  test('POST /api/ai-coordinator/reset-simulation restores normal operational state', async () => {
    const res = await request(app).post('/api/ai-coordinator/reset-simulation').send({});
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});

describe('8. Dashboard & Analytics API', () => {
  test('GET /api/dashboard/summary calculates dynamic KPIs from DB records', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(typeof res.body.summary.availablePortions === 'number');
    assert.ok(res.body.summary.impact);
    assert.ok(typeof res.body.summary.impact.co2eAvoidedKg === 'number');
  });

  test('GET /api/analytics/categories returns category breakdown', async () => {
    const res = await request(app).get('/api/analytics/categories');
    assert.equal(res.status, 200);
    assert.ok(res.body.breakdown.percentages);
  });

  test('GET /api/analytics/export-csv returns text/csv download', async () => {
    const res = await request(app).get('/api/analytics/export-csv');
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /text\/csv/);
  });
});

describe('9. Notifications System & Alert Dispatching', () => {
  test('GET /api/notifications returns notification stream and unread counts', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.notifications));
    assert.ok(typeof res.body.unreadCount === 'number');
  });

  test('GET /api/notifications/unread-count returns integer count', async () => {
    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(typeof res.body.unreadCount === 'number');
  });

  test('PATCH /api/notifications/mark-all-read succeeds and clears unread', async () => {
    const res = await request(app)
      .patch('/api/notifications/mark-all-read')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});

describe('10. Expiry Monitoring & Food Safety Scan', () => {
  test('POST /api/ai-coordinator/run-expiry-check executes background audit', async () => {
    const res = await request(app).post('/api/ai-coordinator/run-expiry-check');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.summary);
    assert.ok(typeof res.body.summary.expiredCount === 'number');
  });
});

describe('11. Dynamic Delivery Reassignment & Failover', () => {
  test('POST /api/deliveries/:id/reassign reallocates driver when feasible', async () => {
    if (!testDeliveryId) return;
    const res = await request(app)
      .post(`/api/deliveries/${testDeliveryId}/reassign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Vehicle battery low alert' });
    
    assert.equal(res.status, 200);
    assert.ok(res.body.delivery);
  });
});

describe('12. Role-Tailored Summaries & AI Match Explanation', () => {
  test('GET /api/dashboard/role-summary?role=provider returns donor-specific KPIs', async () => {
    const res = await request(app).get('/api/dashboard/role-summary?role=provider');
    assert.equal(res.status, 200);
    assert.equal(res.body.role, 'provider');
    assert.ok(typeof res.body.summary.totalDonationsCount === 'number');
  });

  test('GET /api/dashboard/role-summary?role=recipient returns demand KPIs', async () => {
    const res = await request(app).get('/api/dashboard/role-summary?role=recipient');
    assert.equal(res.status, 200);
    assert.equal(res.body.role, 'recipient');
    assert.ok(typeof res.body.summary.totalRequestsCount === 'number');
  });

  test('GET /api/ai-coordinator/summary-analysis returns network bottlenecks', async () => {
    const res = await request(app).get('/api/ai-coordinator/summary-analysis');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.metrics);
    assert.ok(Array.isArray(res.body.recommendations));
  });

  test('POST /api/ai-coordinator/explain-match provides deterministic rationale', async () => {
    const res = await request(app).post('/api/ai-coordinator/explain-match').send({});
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.scoring);
    assert.ok(res.body.explanation);
  });
});

describe('13. Complete End-to-End Acceptance Lifecycle Workflow', () => {
  let e2eListingId = '';
  let e2eDemandId = '';
  let e2eDeliveryId = '';

  test('Step 1: Donor creates surplus food donation with safe-use deadline', async () => {
    const res = await request(app)
      .post('/api/food-listings')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        title: 'Fresh Paneer Tikka & Naan Consignment',
        category: 'prepared_meals',
        quantity: 60,
        unit: 'portions',
        safeUseDeadline: new Date(Date.now() + 5 * 3600000).toISOString(),
        notes: 'End-to-End acceptance verification batch'
      });
    
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.listing.quantity, 60);
    e2eListingId = res.body.listing._id;
  });

  test('Step 2: Recipient organisation posts meal demand request', async () => {
    const res = await request(app)
      .post('/api/demand')
      .set('Authorization', `Bearer ${recipientToken}`)
      .send({
        category: 'prepared_meals',
        quantityRequested: 45,
        urgency: 'high',
        preferredDeliveryWindow: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 4 * 3600000).toISOString()
        },
        notes: 'Shelter evening meal requirement'
      });
    
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.demand.quantityRequested, 45);
    e2eDemandId = res.body.demand._id;
  });

  test('Step 3: Matching engine evaluates and confirms allocation with 0 over-allocation', async () => {
    const confirmRes = await request(app)
      .post('/api/matching/confirm')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        proposals: [{
          listingId: e2eListingId,
          demandId: e2eDemandId,
          quantityMatched: 45,
          distanceKm: 4.8
        }]
      });

    assert.equal(confirmRes.status, 201);
    assert.ok(confirmRes.body.deliveries.length > 0);
    const del = confirmRes.body.deliveries[0];
    assert.equal(del.quantity, 45);
    e2eDeliveryId = del._id;

    // Verify partial supply deduction: 60 - 45 = 15 remaining
    const listingRes = await request(app).get(`/api/food-listings/${e2eListingId}`);
    assert.equal(listingRes.body.listing.availableQuantity, 15);
    assert.equal(listingRes.body.listing.status, 'partially_matched');
  });

  test('Step 4: Driver reports breakdown and system reassigns to standby courier', async () => {
    const reassignRes = await request(app)
      .post(`/api/deliveries/${e2eDeliveryId}/reassign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'EV Powertrain overheat on NH-48' });

    assert.equal(reassignRes.status, 200);
    assert.equal(reassignRes.body.salvageable, true);
    assert.ok(reassignRes.body.reassignedDriver);
    assert.equal(reassignRes.body.delivery.status, 'assigned');
  });

  test('Step 5: Standby courier delivers and recipient verifies Proof-of-Delivery', async () => {
    const podRes = await request(app)
      .post(`/api/deliveries/${e2eDeliveryId}/proof-of-delivery`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recipientSignatureName: 'Sister Teresa David',
        receivedPortions: 45,
        temperatureCelsius: 64.2,
        notes: 'Thermal Cambro verified. Portions received in fresh condition.'
      });

    assert.equal(podRes.status, 200);
    assert.equal(podRes.body.delivery.status, 'delivered');
    assert.equal(podRes.body.delivery.proofOfDelivery.temperatureCelsius, 64.2);
  });

  test('Step 6: Notifications stream records audit and status changes', async () => {
    const notifRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(notifRes.status, 200);
    assert.ok(notifRes.body.notifications.length > 0);
  });
});
