const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../../models/user");
const config = require("../../config/api.config");

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find admin user
    const user = await User.findOne({
      username,
      role: { $in: ["HR", "ADMIN"] },
    });

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ error: "Invalid credentials" });

    // Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, user: { id: user._id, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
