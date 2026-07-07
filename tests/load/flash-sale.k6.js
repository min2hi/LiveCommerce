/**
 * K6 Load Test — Flash Sale Checkout (Pillar 2)
 *
 * Simulates: 500 concurrent buyers hitting the checkout endpoint
 * simultaneously during a Flash Sale (product stock = 100 units).
 *
 * Expected behaviour:
 *   - Exactly 100 orders confirmed (no oversell)
 *   - 400 requests return 409 (out of stock)
 *   - 0 duplicate orders (idempotency working)
 *   - p95 response time < 500ms
 *
 * Run:
 *   k6 run tests/load/flash-sale.k6.js \
 *     -e BASE_URL=http://localhost:3000 \
 *     -e TOKEN=<jwt_token>
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// ── Custom Metrics ──────────────────────────────────────────────────────
const ordersConfirmed  = new Counter('orders_confirmed');
const ordersRejected   = new Counter('orders_rejected');
const duplicatesBlocked = new Counter('duplicates_blocked');
const checkoutDuration  = new Trend('checkout_duration_ms');

// ── Test Config ─────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    flash_sale_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s',  target: 500 }, // ramp up to 500 VUs in 5s
        { duration: '30s', target: 500 }, // sustain 500 VUs for 30s
        { duration: '5s',  target: 0   }, // ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration:     ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed:       ['rate<0.01'],  // Less than 1% network errors
    orders_confirmed:      ['count<=100'], // NEVER exceed stock limit
  },
};

// ── Test Execution ───────────────────────────────────────────────────────
export default function () {
  const BASE_URL   = __ENV.BASE_URL || 'http://localhost:3000';
  const TOKEN      = __ENV.TOKEN    || 'test_jwt_token';
  const PRODUCT_ID = __ENV.PRODUCT_ID || 'product-uuid-here';

  // Each VU generates its own unique idempotency key
  const idempotencyKey = `k6-${__VU}-${__ITER}-${Date.now()}`;

  const payload = JSON.stringify({
    productId:      PRODUCT_ID,
    quantity:       1,
    idempotencyKey: idempotencyKey,
  });

  const headers = {
    'Content-Type':    'application/json',
    'Authorization':   `Bearer ${TOKEN}`,
    'Idempotency-Key': idempotencyKey,
  };

  const start = Date.now();
  const res = http.post(`${BASE_URL}/api/checkout`, payload, { headers });
  checkoutDuration.add(Date.now() - start);

  // Track outcomes
  if (res.status === 202) {
    ordersConfirmed.add(1);
  } else if (res.status === 409) {
    ordersRejected.add(1);
  } else if (res.status === 200 && res.json('cached')) {
    duplicatesBlocked.add(1);
  }

  check(res, {
    'status is 202 or 409': (r) => r.status === 202 || r.status === 409,
    'no 5xx errors':        (r) => r.status < 500,
    'response has body':    (r) => r.body !== null,
  });

  sleep(0); // No sleep — max pressure
}

// ── Teardown Summary ────────────────────────────────────────────────────
export function handleSummary(data) {
  console.log('\n=== FLASH SALE LOAD TEST SUMMARY ===');
  console.log(`Orders Confirmed:   ${data.metrics.orders_confirmed?.values?.count ?? 0}`);
  console.log(`Orders Rejected:    ${data.metrics.orders_rejected?.values?.count ?? 0}`);
  console.log(`Duplicates Blocked: ${data.metrics.duplicates_blocked?.values?.count ?? 0}`);
  console.log(`p95 Response Time:  ${data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) ?? 'N/A'}ms`);
  return {};
}
