const express = require("express");
const { login, me } = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/login", asyncHandler(login));
router.get("/me", authMiddleware, asyncHandler(me));

module.exports = router;
