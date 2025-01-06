const mongoose = require("mongoose");

const approvalRequirementSchema = new mongoose.Schema({
  team_leader_id: String,
  user_id: String,
  start_time: Date,
  end_time: Date,
  reason: String,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model(
  "ApprovalRequirement",
  approvalRequirementSchema
);
