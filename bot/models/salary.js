const mongoose = require("mongoose");

const salarySchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  base_salary: {
    type: Number,
    required: true,
  },
  bonuses: [
    {
      amount: Number,
      reason: String,
      date: Date,
    },
  ],
  deductions: [
    {
      amount: Number,
      reason: String,
      date: Date,
    },
  ],
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
  payment_date: Date,
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Salary", salarySchema);
