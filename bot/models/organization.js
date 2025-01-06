const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  creator_id: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  departments: [
    {
      name: String,
      head_id: String,
      description: String,
    },
  ],
  settings: {
    working_hours: {
      start: String,
      end: String,
    },
    vacation_policy: {
      annual_days: Number,
      carry_over: Boolean,
    },
    approval_chain: [String],
  },
  active: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Organization", organizationSchema);
