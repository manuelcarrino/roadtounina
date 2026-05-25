const { test, expect } = require("@playwright/test");

const uniqueEmail = () => `user_${Date.now()}_${Math.random().toString(16).slice(2)}@test.dev`;

test("health check responds", async ({ request }) => {
  const response = await request.get("/health");
  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload.status).toBe("ok");
});

test("register creates a user", async ({ request }) => {
  const response = await request.post("/api/auth/register", {
    data: { email: uniqueEmail(), password: "Password123!" },
  });

  expect(response.status()).toBe(201);
  const payload = await response.json();
  expect(payload.user.email).toContain("@test.dev");
  expect(payload.tokens.accessToken).toBeTruthy();
  expect(payload.tokens.refreshToken).toBeTruthy();
});

test("login returns tokens", async ({ request }) => {
  const email = uniqueEmail();
  const password = "Password123!";

  await request.post("/api/auth/register", {
    data: { email, password },
  });

  const response = await request.post("/api/auth/login", {
    data: { email, password },
  });

  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload.tokens.accessToken).toBeTruthy();
  expect(payload.tokens.refreshToken).toBeTruthy();
});

test("refresh issues new tokens", async ({ request }) => {
  const email = uniqueEmail();
  const password = "Password123!";

  const registerResponse = await request.post("/api/auth/register", {
    data: { email, password },
  });
  const registerPayload = await registerResponse.json();

  const response = await request.post("/api/auth/refresh", {
    data: { refreshToken: registerPayload.tokens.refreshToken },
  });

  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload.tokens.accessToken).toBeTruthy();
  expect(payload.tokens.refreshToken).toBeTruthy();
});

test("logout clears refresh token", async ({ request }) => {
  const email = uniqueEmail();
  const password = "Password123!";

  const registerResponse = await request.post("/api/auth/register", {
    data: { email, password },
  });
  const registerPayload = await registerResponse.json();

  const response = await request.post("/api/auth/logout", {
    data: { refreshToken: registerPayload.tokens.refreshToken },
  });

  expect(response.status()).toBe(204);
});
