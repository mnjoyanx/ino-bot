const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  creator_id: {
    type: String,
    required: true,
  },
  time: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
    enum: ["room1", "room2", "conference", "online"],
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Meeting", meetingSchema);
