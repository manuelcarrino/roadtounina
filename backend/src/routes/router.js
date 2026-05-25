const express = require("express");

const authRoutes = require("./authRoutes");
const gameRoutes = require("./gameRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/games", gameRoutes);

module.exports = router;
