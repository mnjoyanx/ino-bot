const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  telegram_id: {
    type: String,
    required: true,
    unique: true,
  },
  username: String,
  first_name: String,
  last_name: String,
  role: {
    type: String,
    enum: ["USER", "TEAM_LEADER", "HR", "ADMIN"],
    default: "USER",
  },
  team_leader_id: String,
  teamId: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
});

module.exports = mongoose.model("User", userSchema);
