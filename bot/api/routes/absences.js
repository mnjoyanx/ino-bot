const router = require("express").Router();
const Absence = require("../../models/absence");

// Get all absences
router.get("/", async (req, res) => {
  try {
    const absences = await Absence.find();
    res.json(absences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get absences by user ID
router.get("/user/:userId", async (req, res) => {
  try {
    const absences = await Absence.find({ user_id: req.params.userId });
    res.json(absences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update absence status
router.patch("/:id/status", async (req, res) => {
  try {
    const absence = await Absence.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!absence) return res.status(404).json({ error: "Absence not found" });
    res.json(absence);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
