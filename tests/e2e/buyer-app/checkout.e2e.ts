/**
 * Buyer App — E2E Test: Flash Sale Checkout Flow
 * Status: STUB — implement when buyer-app frontend is ready
 *
 * Covers:
 *   1. Login as buyer
 *   2. Navigate to livestream page
 *   3. Click "Buy Now" on flash sale product
 *   4. Verify order confirmation appears
 *   5. Verify no duplicate order on double-click
 */
import { test, expect } from "@playwright/test";

test.describe("Flash Sale Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Login as test buyer user
    // await page.goto('/login');
    // await page.fill('[data-testid="email"]', 'buyer@test.com');
    // await page.fill('[data-testid="password"]', 'testpass');
    // await page.click('[data-testid="submit"]');
  });

  test("buyer can checkout during flash sale", async ({ page }) => {
    // TODO: Implement when buyer-app is ready
    test.skip(true, "Buyer app not yet implemented");
  });

  test("double-click does not create duplicate order", async ({ page }) => {
    // TODO: Implement idempotency E2E test
    test.skip(true, "Buyer app not yet implemented");
  });
});
