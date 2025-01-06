const router = require("express").Router();
const User = require("../../models/user");
const Absence = require("../../models/absence");
const DayOff = require("../../models/dayoff");
const Vacation = require("../../models/vacation");
const moment = require("moment");

// Get all users with availability status
router.get("/", async (req, res) => {
  try {
    // Get all users
    const users = await User.find().select("-password");

    const currentTime = new Date();

    // Get current absences, dayoffs, and vacations
    const [absences, dayoffs, vacations] = await Promise.all([
      Absence.find({
        start_time: { $lte: currentTime },
        end_time: { $gte: currentTime },
        status: "approved",
      }),
      DayOff.find({
        date: {
          $gte: moment(currentTime).startOf("day"),
          $lte: moment(currentTime).endOf("day"),
        },
        status: "approved",
      }),
      Vacation.find({
        start_date: { $lte: currentTime },
        end_date: { $gte: currentTime },
        status: "approved",
      }),
    ]);

    // Create maps for quick lookup
    const absenceMap = new Map(
      absences.map((absence) => [absence.user_id, absence])
    );
    const dayoffMap = new Map(
      dayoffs.map((dayoff) => [dayoff.user_id, dayoff])
    );
    const vacationMap = new Map(
      vacations.map((vacation) => [vacation.user_id, vacation])
    );

    // Add availability information to each user
    const usersWithAvailability = users.map((user) => {
      const userObject = user.toObject();
      const currentAbsence = absenceMap.get(user.telegram_id);
      const currentDayoff = dayoffMap.get(user.telegram_id);
      const currentVacation = vacationMap.get(user.telegram_id);

      // Check vacation first (longest duration)
      if (currentVacation) {
        return {
          ...userObject,
          isAvailable: false,
          willAvailable: moment(currentVacation.end_date)
            .add(1, "days")
            .format("YYYY-MM-DD 09:00"),
          unavailabilityType: "vacation",
          unavailabilityReason: currentVacation.reason,
        };
      }

      // Then check dayoff
      if (currentDayoff) {
        return {
          ...userObject,
          isAvailable: false,
          willAvailable: moment(currentDayoff.date)
            .endOf("day")
            .format("YYYY-MM-DD HH:mm"),
          unavailabilityType: "dayoff",
          unavailabilityReason: currentDayoff.reason,
        };
      }

      // Finally check absence (shortest duration)
      if (currentAbsence) {
        return {
          ...userObject,
          isAvailable: false,
          willAvailable: moment(currentAbsence.end_time).format(
            "YYYY-MM-DD HH:mm"
          ),
          unavailabilityType: "absence",
          unavailabilityReason: currentAbsence.reason,
        };
      }

      return {
        ...userObject,
        isAvailable: true,
      };
    });

    res.json(usersWithAvailability);
  } catch (err) {
    console.error("Error fetching users with availability:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get user by ID with availability status
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findOne({ telegram_id: req.params.id }).select(
      "-password"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    const currentTime = new Date();

    // Check all types of unavailability
    const [currentAbsence, currentDayoff, currentVacation] = await Promise.all([
      Absence.findOne({
        user_id: req.params.id,
        start_time: { $lte: currentTime },
        end_time: { $gte: currentTime },
        status: "approved",
      }),
      DayOff.findOne({
        user_id: req.params.id,
        date: {
          $gte: moment(currentTime).startOf("day"),
          $lte: moment(currentTime).endOf("day"),
        },
        status: "approved",
      }),
      Vacation.findOne({
        user_id: req.params.id,
        start_date: { $lte: currentTime },
        end_date: { $gte: currentTime },
        status: "approved",
      }),
    ]);

    const userObject = user.toObject();

    // Check in order of duration (vacation > dayoff > absence)
    if (currentVacation) {
      return res.json({
        ...userObject,
        isAvailable: false,
        willAvailable: moment(currentVacation.end_date)
          .add(1, "days")
          .format("YYYY-MM-DD 09:00"),
        unavailabilityType: "vacation",
        unavailabilityReason: currentVacation.reason,
      });
    }

    if (currentDayoff) {
      return res.json({
        ...userObject,
        isAvailable: false,
        willAvailable: moment(currentDayoff.date)
          .endOf("day")
          .format("YYYY-MM-DD HH:mm"),
        unavailabilityType: "dayoff",
        unavailabilityReason: currentDayoff.reason,
      });
    }

    if (currentAbsence) {
      return res.json({
        ...userObject,
        isAvailable: false,
        willAvailable: moment(currentAbsence.end_time).format(
          "YYYY-MM-DD HH:mm"
        ),
        unavailabilityType: "absence",
        unavailabilityReason: currentAbsence.reason,
      });
    }

    res.json({
      ...userObject,
      isAvailable: true,
    });
  } catch (err) {
    console.error("Error fetching user with availability:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update user
router.put("/:id", async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { telegram_id: req.params.id },
      req.body,
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    // Check availability after update
    const currentTime = new Date();
    const currentAbsence = await Absence.findOne({
      user_id: req.params.id,
      start_time: { $lte: currentTime },
      end_time: { $gte: currentTime },
      status: "approved",
    });

    const userObject = user.toObject();

    if (currentAbsence) {
      res.json({
        ...userObject,
        isAvailable: false,
        willAvailable: moment(currentAbsence.end_time).format(
          "YYYY-MM-DD HH:mm"
        ),
        absenceReason: currentAbsence.reason,
      });
    } else {
      res.json({
        ...userObject,
        isAvailable: true,
      });
    }
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
