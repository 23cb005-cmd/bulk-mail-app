const mongoose = require("mongoose");

const recipientResultSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true,
    },
    error: { type: String, default: null },
  },
  { _id: false }
);

const emailSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    recipients: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one recipient is required",
      },
    },
    results: {
      type: [recipientResultSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["success", "partial", "failed"],
      required: true,
    },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Email", emailSchema);
