const { test, expect } = require("@playwright/test");

const uniqueEmail = () => `user_${Date.now()}_${Math.random().toString(16).slice(2)}@test.dev`;
const uniqueUsername = () => `usr_${Math.random().toString(16).slice(2, 12)}`;

const registerAndLogin = async (request) => {
  const email = uniqueEmail();
  const username = uniqueUsername();
  const password = "Password123!";

  const registerResponse = await request.post("/api/auth/register", {
    data: { email, username, password },
  });
  const registerPayload = await registerResponse.json();

  return {
    accessToken: registerPayload.tokens.accessToken,
  };
};

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

test("me endpoint returns array", async ({ request }) => {
  const { accessToken } = await registerAndLogin(request);

  const response = await request.get("/api/games/me", {
    headers: authHeaders(accessToken),
  });

  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(Array.isArray(payload)).toBe(true);
});

test("active game returns 204 when none", async ({ request }) => {
  const { accessToken } = await registerAndLogin(request);

  const response = await request.get("/api/games/me/active", {
    headers: authHeaders(accessToken),
  });

  expect(response.status()).toBe(204);
});