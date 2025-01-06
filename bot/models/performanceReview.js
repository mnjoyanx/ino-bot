const mongoose = require("mongoose");

const performanceReviewSchema = new mongoose.Schema(
  {
    employee_id: {
      type: String,
      required: true,
    },
    reviewer_id: {
      type: String,
      required: true,
    },
    review_date: {
      type: Date,
      required: true,
    },
    next_review_date: {
      type: Date,
      required: true,
    },
    ratings: {
      performance: { type: Number, min: 1, max: 5 },
      attendance: { type: Number, min: 1, max: 5 },
      teamwork: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      initiative: { type: Number, min: 1, max: 5 },
    },
    achievements: [String],
    areas_of_improvement: [String],
    goals: [String],
    comments: String,
    status: {
      type: String,
      enum: ["draft", "pending", "completed"],
      default: "draft",
    },
    acknowledgment: {
      employee_signed: { type: Boolean, default: false },
      employee_sign_date: Date,
      manager_signed: { type: Boolean, default: false },
      manager_sign_date: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PerformanceReview", performanceReviewSchema);
