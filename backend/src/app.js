const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");

const routes = require("./routes/router");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

const corsOptions = {
        origin: (origin, callback) => {
                if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                        return callback(null, true);
                }

                return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
};

const globalLimiter = rateLimit({
        windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
        limit: Number.parseInt(process.env.RATE_LIMIT_MAX || "300", 10),
        standardHeaders: true,
        legacyHeaders: false,
});

app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : 0);

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors(corsOptions));
app.use(express.json());
app.use(globalLimiter);

app.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api", routes);

const frontendPath = path.join(__dirname, "../../frontend/dist");

if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));

    app.use((req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
