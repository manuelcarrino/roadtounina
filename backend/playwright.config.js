const path = require("path");

const testDbPath = path.join(
  __dirname,
  "data",
  `roadtounina.e2e.${Date.now()}.sqlite`
);

module.exports = {
  testDir: "./tests/e2e",
  timeout: 30000,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3002",
  },
  webServer: {
    command: "node index.js",
    port: 3002,
    reuseExistingServer: false,
    env: {
      PORT: "3002",
      SQLITE_PATH: testDbPath,
      DB_SYNC: "alter",
      DB_LOGGING: "false",
      JWT_ACCESS_SECRET: "test-access-secret",
      JWT_REFRESH_SECRET: "test-refresh-secret",
      JWT_ACCESS_TTL: "15m",
      JWT_REFRESH_TTL: "7d",
      TARGET_PAGE: "Universita degli Studi di Napoli Federico II",
      PAGE_TITLE_MAX_LEN: "120",
      FRONTEND_ORIGIN: "",
      TRUST_PROXY: "false",
      RATE_LIMIT_WINDOW_MS: "60000",
      RATE_LIMIT_MAX: "1000",
      GAME_RATE_LIMIT_WINDOW_MS: "60000",
      GAME_RATE_LIMIT_MAX: "1000",
      NODE_ENV: "test",
    },
  },
};
