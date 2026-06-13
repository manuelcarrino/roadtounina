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
    email,
    username,
  };
};

const authHeaders = (token) => ({ Authorization: `Bearer ${token}` });

test("start game returns in_progress (always random start)", async ({ request }) => {
  const { accessToken } = await registerAndLogin(request);
  
  const response = await request.post("/api/games/start", {
    headers: authHeaders(accessToken),
  });

  expect(response.status()).toBe(201);
  const payload = await response.json();
  expect(payload.status).toBe("in_progress");
  expect(payload.startPage).toBeTruthy();
});

test("get active game returns current game", async ({ request }) => {
  const { accessToken } = await registerAndLogin(request);

  await request.post("/api/games/start", {
    headers: authHeaders(accessToken),
  });

  const response = await request.get("/api/games/me/active", {
    headers: authHeaders(accessToken),
  });

  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload.status).toBe("in_progress");
});

test("move rejects non-linked next page", async ({ request }) => {
  const { accessToken } = await registerAndLogin(request);

  const startResponse = await request.post("/api/games/start", {
    headers: authHeaders(accessToken),
  });
  const game = await startResponse.json();

  const response = await request.post(`/api/games/${game.id}/move`, {
    headers: authHeaders(accessToken),
    data: { nextPage: "Pagina che non esiste 123" },
  });

  expect(response.status()).toBe(400);
});

test("abandon game deletes the game", async ({ request }) => {
  const { accessToken } = await registerAndLogin(request);

  const startResponse = await request.post("/api/games/start", {
    headers: authHeaders(accessToken),
  });
  const game = await startResponse.json();

  const response = await request.post(`/api/games/${game.id}/abandon`, {
    headers: authHeaders(accessToken),
  });

  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(payload.deleted).toBe(true);
});

test("leaderboard returns array", async ({ request }) => {
  const response = await request.get("/api/games/leaderboard", {
    headers: authHeaders("invalid"),
  });

  expect(response.status()).toBe(401);

  const { accessToken } = await registerAndLogin(request);
  const authResponse = await request.get("/api/games/leaderboard", {
    headers: authHeaders(accessToken),
  });

  expect(authResponse.status()).toBe(200);
  const payload = await authResponse.json();
  expect(Array.isArray(payload)).toBe(true);
});

test("completed games returns array", async ({ request }) => {
  const response = await request.get("/api/games/completed");
  expect(response.status()).toBe(200);
  const payload = await response.json();
  expect(Array.isArray(payload)).toBe(true);
});

