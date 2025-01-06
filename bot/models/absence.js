const mongoose = require("mongoose");

const absenceSchema = new mongoose.Schema({
  user_id: String,
  reason: String,
  detailed_reason: String,
  start_time: Date,
  end_time: Date,
  actual_start_time: Date,
  actual_end_time: Date,
  status: String,
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Absence", absenceSchema);
