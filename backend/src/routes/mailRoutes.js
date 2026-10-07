const express = require("express");
const rateLimit = require("express-rate-limit");
const { sendBulkMail, getHistory, getHistoryItem } = require("../controllers/mailController");
const authMiddleware = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

const sendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many send requests from this account, please try again later." },
});

router.post("/send", authMiddleware, sendLimiter, asyncHandler(sendBulkMail));
router.get("/history", authMiddleware, asyncHandler(getHistory));
router.get("/history/:id", authMiddleware, asyncHandler(getHistoryItem));

module.exports = router;
