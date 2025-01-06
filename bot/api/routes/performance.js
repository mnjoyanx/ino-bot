const router = require("express").Router();
const Performance = require("../../models/performanceReview");
const User = require("../../models/user");

// Get all performance reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await Performance.find()
      .populate("employee_id", "name telegram_id role")
      .populate("reviewer_id", "name telegram_id role");
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get performance reviews by employee ID
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const reviews = await Performance.find({
      employee_id: req.params.employeeId,
    })
      .populate("reviewer_id", "name telegram_id role")
      .sort({ review_date: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get performance reviews by reviewer ID
router.get("/reviewer/:reviewerId", async (req, res) => {
  try {
    const reviews = await Performance.find({
      reviewer_id: req.params.reviewerId,
    })
      .populate("employee_id", "name telegram_id role")
      .sort({ review_date: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new performance review
router.post("/", async (req, res) => {
  try {
    // Check if employee exists
    const employee = await User.findOne({ telegram_id: req.body.employee_id });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const newReview = new Performance({
      employee_id: employee._id,
      reviewer_id: req.user.id,
      review_date: req.body.review_date || new Date(),
      next_review_date: req.body.next_review_date,
      ratings: {
        performance: req.body.ratings.performance,
        attendance: req.body.ratings.attendance,
        teamwork: req.body.ratings.teamwork,
        communication: req.body.ratings.communication,
        initiative: req.body.ratings.initiative,
      },
      achievements: req.body.achievements,
      areas_of_improvement: req.body.areas_of_improvement,
      goals: req.body.goals,
      comments: req.body.comments,
      status: "draft",
    });

    const savedReview = await newReview.save();
    const populatedReview = await Performance.findById(savedReview._id)
      .populate("employee_id", "name telegram_id role")
      .populate("reviewer_id", "name telegram_id role");

    res.status(201).json(populatedReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update performance review
router.put("/:id", async (req, res) => {
  try {
    const review = await Performance.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Only allow updates if review is in draft or if user is HR/Admin
    if (review.status !== "draft" && !["HR", "ADMIN"].includes(req.user.role)) {
      return res.status(403).json({ error: "Cannot modify completed review" });
    }

    const updatedReview = await Performance.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ratings: req.body.ratings,
          achievements: req.body.achievements,
          areas_of_improvement: req.body.areas_of_improvement,
          goals: req.body.goals,
          comments: req.body.comments,
          next_review_date: req.body.next_review_date,
        },
      },
      { new: true }
    )
      .populate("employee_id", "name telegram_id role")
      .populate("reviewer_id", "name telegram_id role");

    res.json(updatedReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update review status (submit/approve/reject)
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["draft", "pending", "completed", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const review = await Performance.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Add status change validation based on user role
    if (status === "completed" && !["HR", "ADMIN"].includes(req.user.role)) {
      return res.status(403).json({ error: "Only HR can complete reviews" });
    }

    const updatedReview = await Performance.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status,
          ...(status === "completed"
            ? {
                "acknowledgment.manager_signed": true,
                "acknowledgment.manager_sign_date": new Date(),
              }
            : {}),
        },
      },
      { new: true }
    )
      .populate("employee_id", "name telegram_id role")
      .populate("reviewer_id", "name telegram_id role");

    res.json(updatedReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Employee acknowledgment of review
router.patch("/:id/acknowledge", async (req, res) => {
  try {
    const review = await Performance.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Verify the requesting user is the employee
    if (review.employee_id.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized acknowledgment" });
    }

    const updatedReview = await Performance.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          "acknowledgment.employee_signed": true,
          "acknowledgment.employee_sign_date": new Date(),
        },
      },
      { new: true }
    )
      .populate("employee_id", "name telegram_id role")
      .populate("reviewer_id", "name telegram_id role");

    res.json(updatedReview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get performance analytics
router.get("/analytics", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.review_date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const reviews = await Performance.find(query);

    // Calculate average ratings
    const averageRatings = reviews.reduce((acc, review) => {
      Object.keys(review.ratings).forEach((key) => {
        acc[key] = (acc[key] || 0) + review.ratings[key];
      });
      return acc;
    }, {});

    Object.keys(averageRatings).forEach((key) => {
      averageRatings[key] = averageRatings[key] / reviews.length;
    });

    // Calculate completion rates
    const totalReviews = reviews.length;
    const completedReviews = reviews.filter(
      (r) => r.status === "completed"
    ).length;
    const pendingReviews = reviews.filter((r) => r.status === "pending").length;

    res.json({
      totalReviews,
      completedReviews,
      pendingReviews,
      completionRate: (completedReviews / totalReviews) * 100,
      averageRatings,
      periodStart: startDate,
      periodEnd: endDate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
