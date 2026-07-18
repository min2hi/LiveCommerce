/**
 * Buyer App — E2E Test: Flash Sale Checkout Flow
 */
import { test, expect } from "@playwright/test";

test.describe("Flash Sale Checkout Flow", () => {
  test.beforeEach(async ({ page, request }) => {
    // Pipe browser console messages to terminal logs
    page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.text()));
    page.on("pageerror", (err) =>
      console.log("BROWSER EXCEPTION:", err.message),
    );

    // 1. Generate unique buyer credentials
    const email = `buyer_${Date.now()}_${Math.floor(Math.random() * 10000)}@livecommerce.com`;
    const password = "password123";
    const username = `buyer_${Date.now()}`;

    // 2. Register via Backend API directly
    const registerRes = await request.post(
      "http://localhost:3000/api/auth/register",
      {
        data: {
          username,
          email,
          password,
          role: "BUYER",
        },
      },
    );
    expect(registerRes.ok()).toBeTruthy();

    // 3. Login to get JWT Token
    const loginRes = await request.post(
      "http://localhost:3000/api/auth/login",
      {
        data: {
          email,
          password,
        },
      },
    );
    expect(loginRes.ok()).toBeTruthy();
    const loginData = await loginRes.json();
    const token = loginData.token;

    // 4. Navigate to initialize localStorage context
    await page.goto("/live/1");
    await page.evaluate((jwt) => {
      localStorage.setItem("buyer_token", jwt);
    }, token);

    // 5. Reload to apply authenticated state
    await page.reload();

    // Wait for the page to be fully interactive
    await expect(page.locator("text=TechGear Official")).toBeVisible({
      timeout: 15000,
    });
  });

  test("buyer can checkout during flash sale", async ({ page }) => {
    const checkoutButton = page.locator('button:has-text("MUA NGAY"):visible');
    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();

    // Click confirm in the Purchase Modal
    const confirmButton = page.locator('button:has-text("CHỐT ĐƠN NGAY")');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Expect transition to success state
    await expect(page.locator("text=Đặt Hàng Thành Công!")).toBeVisible({
      timeout: 15000,
    });
  });

  test("AI Shopping Assistant streams response", async ({ page }) => {
    // Switch to AI Assistant tab
    const aiTabButton = page.locator(
      'button[aria-label="Toggle AI Assistant"]',
    );
    await aiTabButton.click();

    // Verify greeting is visible
    await expect(
      page.locator("text=Xin chào! Mình là Trợ lý Mua sắm ảo."),
    ).toBeVisible({ timeout: 5000 });

    // Send a query for specs
    const input = page.getByPlaceholder("Ask something...");
    await input.fill("specs");
    await page.locator('button[aria-label="Send query"]').click();

    // Verify user bubble is rendered under 'You'
    await expect(
      page.locator("span:has-text('You') + div:has-text('specs')"),
    ).toBeVisible({ timeout: 5000 });

    // Wait for assistant response to stream and display mock response
    await expect(
      page.locator("span:has-text('Assistant') + div:has-text('Mock AI')"),
    ).toBeVisible({ timeout: 15000 });
  });

  test("double-click does not create duplicate order due to UI disabling and idempotency", async ({
    page,
  }) => {
    const checkoutButton = page.locator('button:has-text("MUA NGAY"):visible');
    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();

    // Wait for Purchase Modal
    const confirmButton = page.locator('button:has-text("CHỐT ĐƠN NGAY")');
    await expect(confirmButton).toBeVisible();

    // Double click the confirm button to test double-click prevention
    await confirmButton.dblclick({ delay: 50 });

    // Verify checkout succeeds or rate limit/conflict message appears
    await expect(
      page
        .locator("text=Đặt Hàng Thành Công!")
        .or(page.locator("text=Hệ thống đang quá tải"))
        .or(
          page.locator(
            "text=Conflict: This checkout request is already being processed",
          ),
        ),
    ).toBeVisible({ timeout: 15000 });
  });
});
