const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  sender_id: String,
  sender_name: String,
  audience: String,
  message: String,
  is_anonymous: Boolean,
  status: {
    type: String,
    enum: ["pending", "reviewed", "archived"],
    default: "pending",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Feedback", feedbackSchema);
