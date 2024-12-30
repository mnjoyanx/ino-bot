// Required dependencies
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const moment = require("moment");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Initialize bot with your token
const token = "7729835414:AAHnTWxKBzQvtlEjsuiY6Pau-b-vDZ6j1vQ";
const bot = new TelegramBot(token, { polling: true });

// MongoDB Connection
mongoose
  .connect(
    "mongodb+srv://mnjoyan:QBEPOCpGD0FmQPx3@cluster0.t6zkh.mongodb.net",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });

// MongoDB Schemas
const UserSchema = new mongoose.Schema({
  telegram_id: { type: String, unique: true },
  role: String,
  team_leader_id: String,
  team_id: Number,
  created_at: { type: Date, default: Date.now },
  clickup_id: { type: String },
});

const AbsenceSchema = new mongoose.Schema({
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

// Add new schema for approval requirements
const ApprovalRequirementSchema = new mongoose.Schema({
  team_leader_id: String,
  user_id: String, // null means whole team
  start_time: Date,
  end_time: Date,
  reason: String,
  created_at: { type: Date, default: Date.now },
});

// Create models
const User = mongoose.model("User", UserSchema);
const Absence = mongoose.model("Absence", AbsenceSchema);
const ApprovalRequirement = mongoose.model(
  "ApprovalRequirement",
  ApprovalRequirementSchema
);

// Add these roles to the top of the file with other constants
const ROLES = {
  CEO: "ceo",
  CTO: "cto",
  TEAM_LEADER: "teamleader",
  USER: "user",
};

// Command handlers
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Welcome to Office Management Bot! Please /register first."
  );
});

// Handle role selection
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  // Registration handling
  if (data.startsWith("register_")) {
    const role = data.split("_")[1];

    if (role === "user") {
      try {
        // Get list of team leaders
        const teamLeaders = await User.find({ role: "teamleader" });

        console.log(teamLeaders, "tt----");

        const teamLeaderButtons = await Promise.all(
          teamLeaders.map(async (leader) => {
            const chatMember = await bot.getChatMember(
              leader.telegram_id,
              leader.telegram_id
            );
            const username = chatMember.user.username
              ? `@${chatMember.user.username}`
              : leader.telegram_id;
            const displayName = chatMember.user.first_name
              ? `${chatMember.user.first_name} (${username})`
              : username;

            return {
              text: `Team Leader: ${displayName}`,
              callback_data: `choose_leader_${leader.telegram_id}`,
            };
          })
        );

        console.log(teamLeaderButtons, "-----");

        const opts = {
          reply_markup: {
            inline_keyboard: teamLeaderButtons.map((button) => [button]),
          },
        };

        bot.sendMessage(chatId, "Please choose your team leader:", opts);
      } catch (err) {
        bot.sendMessage(chatId, "Error fetching team leaders.");
        console.error(err);
      }
    } else {
      try {
        // Register as team leader
        await User.findOneAndUpdate(
          { telegram_id: chatId.toString() },
          { telegram_id: chatId.toString(), role: "teamleader" },
          { upsert: true }
        );
        bot.sendMessage(chatId, "You have been registered as a team leader.");
      } catch (err) {
        bot.sendMessage(chatId, "Error registering as team leader.");
        console.error(err);
      }
    }
  }

  if (data.startsWith("choose_leader_")) {
    const leaderId = data.split("_")[2];
    try {
      await User.findOneAndUpdate(
        { telegram_id: chatId.toString() },
        {
          telegram_id: chatId.toString(),
          role: "user",
          team_leader_id: leaderId,
        },
        { upsert: true }
      );
      bot.sendMessage(
        chatId,
        "✅ You have been registered successfully. Now you can use /notify to request absence."
      );
    } catch (err) {
      bot.sendMessage(chatId, "Error registering user.");
      console.error(err);
    }
  }

  // Time selection handling
  if (data === "time_now") {
    const now = moment();
    try {
      // Set both date and time components
      const startDateTime = now.toDate();
      await Absence.findOneAndUpdate(
        { user_id: chatId.toString(), status: "pending" },
        { start_time: startDateTime }
      );
      requestEndTime(chatId, startDateTime);
    } catch (err) {
      bot.sendMessage(chatId, "Error saving start time.");
      console.error(err);
    }
  }

  if (data === "time_write") {
    bot.sendMessage(chatId, "Please input the time you want (format: HH:mm):");
    bot.once("message", async (timeMsg) => {
      const inputTime = timeMsg.text;
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

      if (timeRegex.test(inputTime)) {
        try {
          // Create a moment object with today's date and input time
          const startDateTime = moment(inputTime, "HH:mm").toDate();
          await Absence.findOneAndUpdate(
            { user_id: chatId.toString(), status: "pending" },
            { start_time: startDateTime }
          );
          requestEndTime(chatId, startDateTime);
        } catch (err) {
          bot.sendMessage(chatId, "Error saving start time.");
          console.error(err);
        }
      } else {
        bot.sendMessage(
          chatId,
          "Invalid time format. Please use the /notify command again and provide time in HH:mm format."
        );
      }
    });
  }

  // Start time handling
  if (data.startsWith("start_time_")) {
    if (data === "start_time_manual") {
      bot.sendMessage(
        chatId,
        "Please enter the start time in HH:mm format (e.g., 14:30):"
      );

      // Set up listener for manual time input
      bot.once("message", async (timeMsg) => {
        const inputTime = timeMsg.text;
        const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

        if (timeRegex.test(inputTime)) {
          try {
            const startTime = moment(inputTime, "HH:mm");
            await Absence.findOneAndUpdate(
              { user_id: chatId.toString(), status: "pending" },
              { start_time: startTime.toDate() }
            );
            requestEndTime(chatId, startTime.toDate());
          } catch (err) {
            bot.sendMessage(chatId, "Error saving start time.");
            console.error(err);
          }
        } else {
          bot.sendMessage(
            chatId,
            "Invalid time format. Please use the /notify command again and provide time in HH:mm format."
          );
        }
      });
    } else {
      const startTime = data.split("_")[2];
      try {
        const startMoment = moment(startTime, "HH:mm");
        await Absence.findOneAndUpdate(
          { user_id: chatId.toString(), status: "pending" },
          { start_time: startMoment.toDate() }
        );
        requestEndTime(chatId, startMoment.toDate());
      } catch (err) {
        bot.sendMessage(chatId, "Error saving start time.");
        console.error(err);
      }
    }
  }

  // End time handling
  if (data.startsWith("end_time_")) {
    if (data === "end_time_manual") {
      bot.sendMessage(
        chatId,
        "Please enter the end time in HH:mm format (e.g., 18:30):"
      );

      bot.once("message", async (timeMsg) => {
        const inputTime = timeMsg.text;
        const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

        if (timeRegex.test(inputTime)) {
          try {
            // Get the existing absence record to use its date
            const absence = await Absence.findOne({
              user_id: chatId.toString(),
              status: "pending",
            });

            if (!absence) {
              bot.sendMessage(
                chatId,
                "No pending absence found. Please start over with /notify"
              );
              return;
            }

            // Create end time using the same date as start_time
            const endDateTime = moment(absence.start_time)
              .hours(parseInt(inputTime.split(":")[0]))
              .minutes(parseInt(inputTime.split(":")[1]))
              .toDate();

            const updatedAbsence = await Absence.findOneAndUpdate(
              { user_id: chatId.toString(), status: "pending" },
              { end_time: endDateTime },
              { new: true }
            );

            if (updatedAbsence) {
              handleAbsenceConfirmation(chatId, updatedAbsence);
            }
          } catch (err) {
            console.error(err);
            bot.sendMessage(chatId, "Error saving end time.");
          }
        } else {
          bot.sendMessage(
            chatId,
            "Invalid time format. Please use the /notify command again."
          );
        }
      });
    } else {
      const endTime = data.split("_")[2];
      try {
        // Get the existing absence record
        const absence = await Absence.findOne({
          user_id: chatId.toString(),
          status: "pending",
        });

        if (!absence) {
          bot.sendMessage(
            chatId,
            "No pending absence found. Please start over with /notify"
          );
          return;
        }

        // Create end time using the same date as start_time
        const endDateTime = moment(absence.start_time)
          .hours(parseInt(endTime.split(":")[0]))
          .minutes(parseInt(endTime.split(":")[1]))
          .toDate();

        const updatedAbsence = await Absence.findOneAndUpdate(
          { user_id: chatId.toString(), status: "pending" },
          { end_time: endDateTime },
          { new: true }
        );

        if (updatedAbsence) {
          handleAbsenceConfirmation(chatId, updatedAbsence);
        }
      } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, "Error saving end time.");
      }
    }
  }

  // Approval requirement handling
  if (data.startsWith("approve_req_")) {
    const [, , type, id] = data.split("_");

    try {
      if (type === "team" || type === "user") {
        // Store the selected user/team info temporarily
        const targetDisplay =
          type === "user" ? await getUserDisplayName(id) : "Whole Team";

        // Ask for the reason first
        bot.editMessageText(
          `Setting approval requirement for: ${targetDisplay}\nPlease enter the reason for requiring approval during this period:`,
          {
            chat_id: chatId,
            message_id: msg.message_id,
          }
        );

        // Store temporary data for the next step
        global.pendingApproval = {
          chatId,
          type,
          userId: type === "user" ? id : null,
          messageId: msg.message_id,
        };

        // Listen for the reason message
        bot.once("message", async (reasonMsg) => {
          if (reasonMsg.chat.id === chatId) {
            try {
              // Create new approval requirement with reason
              const requirement = new ApprovalRequirement({
                team_leader_id: chatId.toString(),
                user_id: type === "user" ? id : null,
                reason: reasonMsg.text,
              });
              await requirement.save();

              // Generate time slots for start time
              const timeSlots = generateTimeSlots(
                new Date(),
                false,
                "approve_start"
              );

              const opts = {
                reply_markup: {
                  inline_keyboard: [
                    ...timeSlots,
                    [
                      {
                        text: "Set Manually",
                        callback_data: "approve_start_manual",
                      },
                    ],
                  ],
                },
              };

              bot.sendMessage(
                chatId,
                `Reason set: "${reasonMsg.text}"\nPlease select start time:`,
                opts
              );
            } catch (err) {
              console.error("Error saving approval requirement:", err);
              bot.sendMessage(chatId, "Error processing your request.");
            }
          }
        });
      }
    } catch (err) {
      console.error("Error setting approval requirement:", err);
      bot.sendMessage(chatId, "Error processing your request.");
    }
  }

  // Add handlers for start time selection
  if (data.startsWith("approve_start_")) {
    if (data === "approve_start_manual") {
      bot.sendMessage(
        chatId,
        "Please enter the start time in HH:mm format (e.g., 09:30):"
      );

      bot.once("message", async (timeMsg) => {
        const inputTime = timeMsg.text;
        const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

        if (timeRegex.test(inputTime)) {
          try {
            // Create a proper date object for today with the given time
            const [hours, minutes] = inputTime.split(":");
            const startTime = moment().hours(hours).minutes(minutes).seconds(0);

            await ApprovalRequirement.findOneAndUpdate(
              { team_leader_id: chatId.toString(), start_time: null },
              { start_time: startTime.toDate() }
            );

            // Generate time slots for end time
            const timeSlots = generateTimeSlots(
              startTime.toDate(),
              true,
              "approve_end"
            );

            const opts = {
              reply_markup: {
                inline_keyboard: [
                  ...timeSlots,
                  [
                    {
                      text: "Set Manually",
                      callback_data: "approve_end_manual",
                    },
                  ],
                ],
              },
            };

            bot.sendMessage(
              chatId,
              `Start time set to ${startTime.format("HH:mm")}\nPlease select when approval requirement ends:`,
              opts
            );
          } catch (err) {
            console.error("Error saving start time:", err);
            bot.sendMessage(chatId, "Error saving start time.");
          }
        } else {
          bot.sendMessage(
            chatId,
            "Invalid time format. Please use HH:mm format (e.g., 09:30)."
          );
        }
      });
    } else {
      const startTime = data.split("_")[2];
      try {
        // Create a proper date object for today with the given time
        const [hours, minutes] = startTime.split(":");
        const startMoment = moment().hours(hours).minutes(minutes).seconds(0);

        console.log(startMoment, "start moment");

        await ApprovalRequirement.findOneAndUpdate(
          { team_leader_id: chatId.toString(), start_time: null },
          { start_time: startMoment.toDate() }
        );

        // Generate time slots for end time
        const timeSlots = generateTimeSlots(
          startMoment.toDate(),
          true,
          "approve_end"
        );

        const opts = {
          reply_markup: {
            inline_keyboard: [
              ...timeSlots,
              [{ text: "Set Manually", callback_data: "approve_end_manual" }],
            ],
          },
        };

        bot.sendMessage(
          chatId,
          `Start time set to ${startMoment.format("HH:mm")}\nPlease select when approval requirement ends:`,
          opts
        );
      } catch (err) {
        console.error("Error saving start time:", err);
        bot.sendMessage(chatId, "Error saving start time.");
      }
    }
  }

  // Add handlers for end time selection
  if (data.startsWith("approve_end_")) {
    if (data === "approve_end_manual") {
      bot.sendMessage(
        chatId,
        "Please enter the end time in HH:mm format (e.g., 18:30):"
      );

      bot.once("message", async (timeMsg) => {
        const inputTime = timeMsg.text;
        const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

        if (timeRegex.test(inputTime)) {
          try {
            // Create a proper date object for today with the given time
            const [hours, minutes] = inputTime.split(":");
            const endTime = moment().hours(hours).minutes(minutes).seconds(0);

            const requirement = await ApprovalRequirement.findOneAndUpdate(
              { team_leader_id: chatId.toString(), end_time: null },
              { end_time: endTime.toDate() },
              { new: true }
            );

            if (requirement) {
              // Verify that end time is after start time
              if (
                moment(requirement.end_time).isSameOrBefore(
                  requirement.start_time
                )
              ) {
                bot.sendMessage(
                  chatId,
                  "End time must be after start time. Please try again."
                );
                return;
              }
              await sendApprovalConfirmation(chatId, requirement);
            }
          } catch (err) {
            console.error("Error saving end time:", err);
            bot.sendMessage(chatId, "Error saving end time.");
          }
        } else {
          bot.sendMessage(
            chatId,
            "Invalid time format. Please use HH:mm format (e.g., 18:30)."
          );
        }
      });
    } else {
      const endTime = data.split("_")[2];
      try {
        // Create a proper date object for today with the given time
        const [hours, minutes] = endTime.split(":");
        const endMoment = moment().hours(hours).minutes(minutes).seconds(0);

        const requirement = await ApprovalRequirement.findOneAndUpdate(
          { team_leader_id: chatId.toString(), end_time: null },
          { end_time: endMoment.toDate() },
          { new: true }
        );

        if (requirement) {
          // Verify that end time is after start time
          if (
            moment(requirement.end_time).isSameOrBefore(requirement.start_time)
          ) {
            bot.sendMessage(
              chatId,
              "End time must be after start time. Please try again."
            );
            return;
          }
          await sendApprovalConfirmation(chatId, requirement);
        }
      } catch (err) {
        console.error("Error saving end time:", err);
        bot.sendMessage(chatId, "Error saving end time.");
      }
    }
  }

  if (data.startsWith("approve_absence_")) {
    const absenceId = data.split("_")[2];
    try {
      const absence = await Absence.findByIdAndUpdate(
        absenceId,
        { status: "approved" },
        { new: true }
      );

      if (absence) {
        // Notify approver
        bot.editMessageText(
          `Absence request APPROVED ✅\nUser: ${await getUserDisplayName(absence.user_id)}\nFrom: ${moment(absence.start_time).format("HH:mm")}\nTo: ${moment(absence.end_time).format("HH:mm")}\nReason: ${absence.reason}`,
          {
            chat_id: chatId,
            message_id: msg.message_id,
          }
        );

        // Get approver's role and name
        const approver = await User.findOne({ telegram_id: chatId.toString() });
        const approverMember = await bot.getChatMember(chatId, chatId);
        const approverName =
          approverMember.user.first_name ||
          approverMember.user.username ||
          chatId;
        const approverRole = approver ? approver.role : "Unknown";

        // Notify user
        bot.sendMessage(
          absence.user_id,
          `Your absence request has been APPROVED ✅ by ${approverRole} ${approverName}\nFrom: ${moment(absence.start_time).format("HH:mm")}\nTo: ${moment(absence.end_time).format("HH:mm")}\nReason: ${absence.reason}`
        );
      }
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "Error processing approval.");
    }
  }

  if (data.startsWith("deny_absence_")) {
    const absenceId = data.split("_")[2];
    try {
      const absence = await Absence.findByIdAndUpdate(
        absenceId,
        { status: "denied" },
        { new: true }
      );

      if (absence) {
        // Get denier's role and name
        const denier = await User.findOne({ telegram_id: chatId.toString() });
        const denierMember = await bot.getChatMember(chatId, chatId);
        const denierName =
          denierMember.user.first_name || denierMember.user.username || chatId;
        const denierRole = denier ? denier.role : "Unknown";

        // Notify denier
        bot.editMessageText(
          `Absence request DENIED ❌\nUser: ${await getUserDisplayName(absence.user_id)}\nFrom: ${moment(absence.start_time).format("HH:mm")}\nTo: ${moment(absence.end_time).format("HH:mm")}\nReason: ${absence.reason}`,
          {
            chat_id: chatId,
            message_id: msg.message_id,
          }
        );

        // Notify user
        bot.sendMessage(
          absence.user_id,
          `Your absence request has been DENIED ❌ by ${denierRole} ${denierName}\nFrom: ${moment(absence.start_time).format("HH:mm")}\nTo: ${moment(absence.end_time).format("HH:mm")}\nReason: ${absence.reason}`
        );
      }
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "Error processing denial.");
    }
  }
});

// Handle notify command
bot.onText(/\/notify/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });

    if (!user) {
      bot.sendMessage(
        chatId,
        "You need to register first by typing /register."
      );
      return;
    }

    // Only CTO should not use notify command since they have no supervisor
    if (user.role === ROLES.CTO) {
      bot.sendMessage(
        chatId,
        "CTO cannot use the /notify command as they have no supervisor."
      );
      return;
    }

    // Show reason selection keyboard
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Doctor", callback_data: "notify_doctor" },
            { text: "Personal", callback_data: "notify_personal" },
          ],
          [
            { text: "Family Issue", callback_data: "notify_family" },
            { text: "Other", callback_data: "notify_other" },
          ],
        ],
      },
    };

    bot.sendMessage(chatId, "Please select your absence reason:", opts);
  } catch (err) {
    bot.sendMessage(chatId, "Error processing your request.");
    console.error(err);
  }
});

// Add or update the callback query handler for notify
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith("notify_")) {
    const reason = data.split("_")[1];

    try {
      if (reason === "other") {
        // For "Other" reason, ask user to type their reason
        bot.sendMessage(chatId, "Please type your reason for absence:");

        // Set up one-time listener for the next message
        bot.once("message", async (reasonMsg) => {
          if (reasonMsg.chat.id === chatId) {
            const customReason = reasonMsg.text;
            // Create absence with custom reason
            const absence = new Absence({
              user_id: chatId.toString(),
              reason: customReason,
              status: "pending",
            });
            await absence.save();

            // Get quick time options
            const quickTimeOptions = generateQuickTimeOptions();

            // Show time selection options with quick select times
            const opts = {
              reply_markup: {
                inline_keyboard: [
                  quickTimeOptions.slice(0, 2), // First row of quick times
                  quickTimeOptions.slice(2, 4), // Second row of quick times
                  [
                    { text: "Now", callback_data: "time_now" },
                    { text: "Set manually", callback_data: "time_write" },
                  ],
                ],
              },
            };

            bot.sendMessage(
              chatId,
              "Please choose your absence start time:",
              opts
            );
          }
        });
      } else {
        // For predefined reasons, proceed directly to time selection
        const absence = new Absence({
          user_id: chatId.toString(),
          reason: reason.charAt(0).toUpperCase() + reason.slice(1),
          status: "pending",
        });
        await absence.save();

        // Get quick time options
        const quickTimeOptions = generateQuickTimeOptions();

        // Show time selection options with quick select times
        const opts = {
          reply_markup: {
            inline_keyboard: [
              quickTimeOptions.slice(0, 2), // First row of quick times
              quickTimeOptions.slice(2, 4), // Second row of quick times
              [{ text: "Now", callback_data: "time_now" }],
            ],
          },
        };

        bot.sendMessage(chatId, "Please choose your absence start time:", opts);
      }
    } catch (err) {
      console.error("Error handling notify callback:", err);
      bot.sendMessage(chatId, "Error processing your request.");
    }
  }

  // Add handler for quick time selection
  if (data.startsWith("time_quick_")) {
    const selectedTime = data.split("_")[2];
    const startTime = moment(selectedTime, "HH:mm").toDate();

    try {
      const absence = await Absence.findOne({
        user_id: chatId.toString(),
        status: "pending",
      }).sort({ created_at: -1 });

      if (absence) {
        absence.start_time = startTime;
        await absence.save();
        await requestEndTime(chatId, startTime);
      }
    } catch (err) {
      console.error("Error processing quick time selection:", err);
      bot.sendMessage(chatId, "Error processing your request.");
    }
  }

  // ... rest of your existing callback handlers ...
});

// Update the generateTimeSlots function to handle both start and end times
function generateTimeSlots(startTime, isEndTime = false, prefix = "") {
  const slots = [];
  const currentTime = moment(startTime);

  // Round up to the nearest hour
  if (currentTime.minutes() > 0) {
    currentTime.add(1, "hour").startOf("hour");
  }

  // Use the provided prefix or default to start/end time
  const callbackPrefix = prefix || (isEndTime ? "end_time_" : "start_time_");

  for (let i = 0; i < 5; i++) {
    const time = currentTime.clone().add(i, "hours");
    const timeStr = time.format("HH:mm");
    slots.push({
      text: timeStr,
      callback_data: `${callbackPrefix}_${timeStr}`,
    });
  }

  // Add manual time selection option if not approval times
  if (!prefix) {
    const manualCallback = isEndTime ? "end_time_manual" : "start_time_manual";
    slots.push({ text: "Set manually", callback_data: manualCallback });
  }

  // Group buttons in rows of 3
  const rows = [];
  for (let i = 0; i < slots.length; i += 3) {
    rows.push(slots.slice(i, i + 3));
  }

  return rows;
}

// Update the requestEndTime function
async function requestEndTime(chatId, startTime) {
  // Generate time slots starting from the selected start time, with isEndTime = true
  const timeSlots = generateTimeSlots(startTime, true);

  const opts = {
    reply_markup: {
      inline_keyboard: timeSlots,
    },
  };

  bot.sendMessage(chatId, "Please select your absence end time:", opts);
}

// Add helper function to get supervisor's ID
async function getSupervisorId(userId) {
  try {
    const user = await User.findOne({ telegram_id: userId.toString() });
    if (!user) return null;

    switch (user.role) {
      case ROLES.USER:
        return user.team_leader_id;
      case ROLES.TEAM_LEADER:
        const ceo = await User.findOne({ role: ROLES.CEO });
        return ceo ? ceo.telegram_id : null;
      case ROLES.CEO:
        const cto = await User.findOne({ role: ROLES.CTO });
        return cto ? cto.telegram_id : null;
      case ROLES.CTO:
        return null; // CTO has no supervisor
      default:
        return null;
    }
  } catch (err) {
    console.error("Error getting supervisor:", err);
    return null;
  }
}

// Update handleAbsenceConfirmation function
async function handleAbsenceConfirmation(chatId, absence) {
  const formattedStart = moment(absence.start_time).format("HH:mm");
  const formattedEnd = moment(absence.end_time).format("HH:mm");

  // Only send the registration message if it's a new request
  if (absence.status === "pending") {
    bot.sendMessage(
      chatId,
      `Your absence has been registered:\nFrom: ${formattedStart}\nTo: ${formattedEnd}\nReason: ${absence.reason || "Not specified"}\nStatus: Pending approval`
    );

    // Get supervisor's ID based on user's role
    const supervisorId = await getSupervisorId(absence.user_id);

    console.log(supervisorId);

    if (supervisorId) {
      try {
        // Check if approval is required for this time period
        const requiresApproval = await checkApprovalRequired(
          absence.user_id,
          absence.start_time,
          absence.end_time
        );

        console.log(requiresApproval, "-----");

        // Get requester's display name
        const chatMember = await bot.getChatMember(
          absence.user_id,
          absence.user_id
        );
        const username = chatMember.user.username
          ? `@${chatMember.user.username}`
          : absence.user_id;
        const displayName = chatMember.user.first_name
          ? `${chatMember.user.first_name} (${username})`
          : username;

        // Get requester's role
        const requester = await User.findOne({ telegram_id: absence.user_id });
        const requesterRole = requester ? requester.role : "Unknown";

        let messageText = `New absence request from ${requesterRole}:\nUser: ${displayName}\nFrom: ${formattedStart}\nTo: ${formattedEnd}\nReason: ${absence.reason || "Not specified"}`;

        // Only add approve/deny buttons if approval is required
        if (requiresApproval) {
          const opts = {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "✅ Approve",
                    callback_data: `approve_absence_${absence._id}`,
                  },
                  {
                    text: "❌ Deny",
                    callback_data: `deny_absence_${absence._id}`,
                  },
                ],
              ],
            },
          };
          messageText += "\n\nApproval required for this time period.";
          bot.sendMessage(supervisorId, messageText, opts);
        } else {
          // Auto-approve if no approval required
          await Absence.findByIdAndUpdate(
            absence._id,
            { status: "approved" },
            { new: true }
          );
          messageText +=
            "\n\nAutomatically approved (no approval required for this time period).";
          bot.sendMessage(supervisorId, messageText);

          // Notify user of auto-approval
          bot.sendMessage(
            absence.user_id,
            `Your absence request has been automatically approved (no approval required):\nFrom: ${formattedStart}\nTo: ${formattedEnd}\nReason: ${absence.reason || "Not specified"}`
          );
        }
      } catch (err) {
        console.error("Error sending supervisor notification:", err);
      }
    } else if (absence.user_id !== chatId) {
      // If no supervisor but not self-notification
      bot.sendMessage(
        chatId,
        "Note: You have no supervisor assigned in the system."
      );
    }
  }
}

// Add helper function to check if approval is required
async function checkApprovalRequired(userId, startTime, endTime) {
  try {
    // Get user's team leader
    const user = await User.findOne({ telegram_id: userId.toString() });
    if (!user || !user.team_leader_id) return false; // Require approval if no team leader found

    console.log(user, "---user");
    // Check for specific approval requirements
    const requirements = await ApprovalRequirement.find({
      team_leader_id: user.team_leader_id,
      $or: [
        { user_id: userId.toString() }, // Individual requirement
        { user_id: null }, // Team-wide requirement
      ],
      start_time: { $lte: endTime },
      end_time: { $gte: startTime },
    });

    console.log(requirements, "requirements");

    // If no requirements found, approval is required by default
    if (requirements.length === 0) return false;

    // If any matching requirement found, approval is required
    return requirements.length > 0;
  } catch (err) {
    console.error("Error checking approval requirements:", err);
    return false; // Default to requiring approval on error
  }
}

// Handle late for meeting command
bot.onText(/\/late_for_meeting/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user) {
      bot.sendMessage(chatId, "Please register first using /register");
      return;
    }

    if (user.team_leader_id) {
      const opts = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "09:30", callback_data: "time_select_09:30" },
              { text: "10:30", callback_data: "time_select_10:30" },
              { text: "11:30", callback_data: "time_select_11:30" },
            ],
            [
              { text: "12:30", callback_data: "time_select_12:30" },
              { text: "13:30", callback_data: "time_select_13:30" },
              { text: "14:30", callback_data: "time_select_14:30" },
              { text: "15:30", callback_data: "time_select_15:30" },
            ],
            [
              { text: "16:30", callback_data: "time_select_16:30" },
              { text: "17:30", callback_data: "time_select_17:30" },
              { text: "18:30", callback_data: "time_select_18:30" },
            ],
          ],
        },
      };

      bot.sendMessage(
        chatId,
        "Please select the time you will be late for the meeting:",
        opts
      );
    } else {
      bot.sendMessage(chatId, "You are not assigned to any team leader.");
    }
  } catch (err) {
    bot.sendMessage(chatId, "Error processing your request.");
    console.error(err);
  }
});

// Teams list
const teams = [
  { id: 1, name: "OTT", lead: null },
  { id: 2, name: "XCloud", lead: null },
  { id: 3, name: "XPlayer", lead: null },
  { id: 4, name: "OutSourcing", lead: null },
  { id: 5, name: "Sales and Marketing", lead: null },
];

// User data
const users = [];

// Command to register
bot.onText(/\/register/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Check if user is already registered
    const existingUser = await User.findOne({ telegram_id: chatId.toString() });
    if (existingUser) {
      bot.sendMessage(
        chatId,
        `You are already registered as a ${existingUser.role}. Use /remove_account if you want to register with a different role.`
      );
      return;
    }

    // Check if CEO and CTO positions are already taken
    const ceoExists = await User.findOne({ role: ROLES.CEO });
    const ctoExists = await User.findOne({ role: ROLES.CTO });

    const keyboard = [
      [{ text: "Team Lead 👥", callback_data: "register_team_lead" }],
      [{ text: "User 👤", callback_data: "register_user" }],
    ];

    // Only add CTO option if position is not taken
    if (!ctoExists) {
      keyboard.unshift([{ text: "CTO 🔧", callback_data: "register_cto" }]);
    }

    // Only add CEO option if position is not taken
    if (!ceoExists) {
      keyboard.unshift([{ text: "CEO 👔", callback_data: "register_ceo" }]);
    }

    const opts = {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    };

    bot.sendMessage(chatId, "Please select your role:", opts);
  } catch (err) {
    console.error("Error during registration:", err);
    bot.sendMessage(chatId, "Error processing registration request.");
  }
});

// Handle registration type
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data === "register_team_lead") {
    // Prompt team selection for team lead
    const opts = {
      reply_markup: {
        inline_keyboard: teams.map((team) => [
          { text: team.name, callback_data: `team_lead_select_${team.id}` },
        ]),
      },
    };
    bot.sendMessage(chatId, "Please select your team:", opts);
  } else if (data.startsWith("team_lead_select_")) {
    const teamId = parseInt(data.split("_").pop());
    const team = teams.find((t) => t.id === teamId);

    try {
      const existingTeamLead = await User.findOne({
        role: "teamleader",
        team_id: teamId,
      });

      if (existingTeamLead) {
        bot.sendMessage(
          chatId,
          `The team ${team.name} already has a team lead.`
        );
      } else {
        await User.findOneAndUpdate(
          { telegram_id: chatId.toString() },
          {
            telegram_id: chatId.toString(),
            role: "teamleader",
            team_id: teamId,
          },
          { upsert: true }
        );
        bot.sendMessage(
          chatId,
          `You have been registered as the team lead for ${team.name}.`
        );
      }
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "Error registering as team leader.");
    }
  } else if (data === "register_user") {
    // Register as a regular user
    users.push({ id: chatId, role: "user", team: null });
  }
});

// Command to set username
bot.onText(/\/setusername (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1];
  const user = users.find((u) => u.id === chatId);

  if (user) {
    user.username = username;
    bot.sendMessage(chatId, `Your username has been set to ${username}.`);
  } else {
    bot.sendMessage(chatId, "You need to register first by typing /register.");
  }
});

// Enhanced time selection
bot.onText(/\/selecttime/, (msg) => {
  const chatId = msg.chat.id;

  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Now", callback_data: "time_now" },
          { text: "Set Time", callback_data: "time_write" },
        ],
      ],
    },
  };

  bot.sendMessage(chatId, "Please choose how to set the time:", opts);
});

// Helper function to get user display name
async function getUserDisplayName(userId) {
  try {
    const chatMember = await bot.getChatMember(userId, userId);
    const username = chatMember.user.username
      ? `@${chatMember.user.username}`
      : userId;
    return chatMember.user.first_name
      ? `${chatMember.user.first_name} (${username})`
      : username;
  } catch (err) {
    return userId;
  }
}

// Update the /pending_requests command handler
bot.onText(/\/pending_requests/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });

    if (!user) {
      bot.sendMessage(chatId, "Please register first using /register");
      return;
    }

    let pendingRequests = [];

    // Different query based on role
    switch (user.role) {
      case ROLES.CEO:
        // CEO can see requests from CTO
        const ctoUser = await User.findOne({ role: ROLES.CTO });
        if (ctoUser) {
          const ctoRequests = await Absence.find({
            user_id: ctoUser.telegram_id,
            status: "pending",
          });
          pendingRequests = pendingRequests.concat(ctoRequests);
        }
        // And from all team leaders
        const teamLeaderRequests = await Absence.find({
          user_id: {
            $in: (await User.find({ role: ROLES.TEAM_LEADER })).map(
              (u) => u.telegram_id
            ),
          },
          status: "pending",
        });
        pendingRequests = pendingRequests.concat(teamLeaderRequests);
        break;

      case ROLES.CTO:
        // CTO can see requests from all team leaders
        pendingRequests = await Absence.find({
          user_id: {
            $in: (await User.find({ role: ROLES.TEAM_LEADER })).map(
              (u) => u.telegram_id
            ),
          },
          status: "pending",
        });
        break;

      case ROLES.TEAM_LEADER:
        // Team leaders can see requests from their team members
        pendingRequests = await Absence.find({
          status: "pending",
          user_id: {
            $in: (await User.find({ team_leader_id: chatId.toString() })).map(
              (u) => u.telegram_id
            ),
          },
        });
        break;

      default:
        bot.sendMessage(
          chatId,
          "You don't have permission to view pending requests."
        );
        return;
    }

    if (pendingRequests.length === 0) {
      bot.sendMessage(chatId, "No pending requests.");
      return;
    }

    // Send each pending request with approve/deny buttons
    for (const absence of pendingRequests) {
      const requester = await User.findOne({ telegram_id: absence.user_id });
      const displayName = await getUserDisplayName(absence.user_id);
      const roleText = requester ? `(${requester.role})` : "";

      const opts = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Approve",
                callback_data: `approve_absence_${absence._id}`,
              },
              {
                text: "❌ Deny",
                callback_data: `deny_absence_${absence._id}`,
              },
            ],
          ],
        },
      };

      bot.sendMessage(
        chatId,
        `Pending absence request:\nUser: ${displayName} ${roleText}\nFrom: ${moment(
          absence.start_time
        ).format("HH:mm")}\nTo: ${moment(absence.end_time).format(
          "HH:mm"
        )}\nReason: ${absence.reason}`,
        opts
      );
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Error fetching pending requests.");
  }
});

// Add this after other bot.onText handlers
bot.onText(/\/teams/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    // Get all team leaders
    const teamLeaders = await User.find({ role: "teamleader" });

    // Create a message showing all teams
    let message = "🏢 *Company Teams*:\n\n";

    for (const team of teams) {
      // Find team leader for this team
      const teamLeader = teamLeaders.find((leader) => {
        // You might need to adjust this logic based on how team leaders are associated with teams
        const leaderTeamId = leader.team_id; // You'll need to add this field to your User schema
        return leaderTeamId === team.id;
      });

      // Add team info to message
      message += `*${team.name}*\n`;
      if (teamLeader) {
        try {
          const chatMember = await bot.getChatMember(
            teamLeader.telegram_id,
            teamLeader.telegram_id
          );
          const username = chatMember.user.username
            ? `@${chatMember.user.username}`
            : teamLeader.telegram_id;
          const displayName = chatMember.user.first_name
            ? `${chatMember.user.first_name} (${username})`
            : username;
          message += `👤 Team Leader: ${displayName}\n`;
        } catch (err) {
          message += `👤 Team Leader: Not available\n`;
        }
      } else {
        message += `👤 Team Leader: Not assigned\n`;
      }
      message += `\n`;
    }

    // Send message with markdown formatting
    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Error fetching teams:", err);
    bot.sendMessage(chatId, "Error fetching teams information.");
  }
});

// Add command to remove account
bot.onText(/\/remove_account/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user) {
      bot.sendMessage(chatId, "You don't have a registered account.");
      return;
    }

    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Yes, remove my account",
              callback_data: "confirm_remove_account",
            },
            {
              text: "No, keep my account",
              callback_data: "cancel_remove_account",
            },
          ],
        ],
      },
    };

    bot.sendMessage(
      chatId,
      "Are you sure you want to remove your account? This action cannot be undone.",
      opts
    );
  } catch (err) {
    console.error("Error processing remove account request:", err);
    bot.sendMessage(chatId, "Error processing your request.");
  }
});

// Update the callback query handler to include new registration types and account removal
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  // Handle CEO registration
  if (data === "register_ceo") {
    try {
      const ceoExists = await User.findOne({ role: ROLES.CEO });
      if (ceoExists) {
        bot.sendMessage(chatId, "CEO position is already taken.");
        return;
      }

      await User.findOneAndUpdate(
        { telegram_id: chatId.toString() },
        {
          telegram_id: chatId.toString(),
          role: ROLES.CEO,
        },
        { upsert: true }
      );
      bot.sendMessage(chatId, "You have been registered as CEO.");
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "Error registering as CEO.");
    }
  }

  // Handle CTO registration
  if (data === "register_cto") {
    try {
      const ctoExists = await User.findOne({ role: ROLES.CTO });
      if (ctoExists) {
        bot.sendMessage(chatId, "CTO position is already taken.");
        return;
      }

      await User.findOneAndUpdate(
        { telegram_id: chatId.toString() },
        {
          telegram_id: chatId.toString(),
          role: ROLES.CTO,
        },
        { upsert: true }
      );
      bot.sendMessage(chatId, "You have been registered as CTO.");
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "Error registering as CTO.");
    }
  }

  // Handle account removal confirmation
  if (data === "confirm_remove_account") {
    try {
      await User.findOneAndDelete({ telegram_id: chatId.toString() });
      bot.editMessageText(
        "Your account has been successfully removed. You can register again using /register",
        {
          chat_id: chatId,
          message_id: msg.message_id,
        }
      );
    } catch (err) {
      console.error(err);
      bot.sendMessage(chatId, "Error removing your account.");
    }
  }

  if (data === "cancel_remove_account") {
    bot.editMessageText(
      "Account removal cancelled. Your account remains active.",
      {
        chat_id: chatId,
        message_id: msg.message_id,
      }
    );
  }

  // ... rest of your existing callback query handlers ...
});

// Add helper function to get subordinates based on role
async function getSubordinates(userId) {
  try {
    const user = await User.findOne({ telegram_id: userId.toString() });
    if (!user) return [];

    switch (user.role) {
      case ROLES.CEO:
        // CEO can see everyone
        return {
          cto: await User.findOne({ role: ROLES.CTO }),
          teamLeaders: await User.find({ role: ROLES.TEAM_LEADER }),
          users: await User.find({ role: ROLES.USER }),
        };
      case ROLES.CTO:
        // CTO can see team leaders and users
        return {
          teamLeaders: await User.find({ role: ROLES.TEAM_LEADER }),
          users: await User.find({ role: ROLES.USER }),
        };
      case ROLES.TEAM_LEADER:
        // Team leaders can only see their team members
        return {
          users: await User.find({ team_leader_id: userId.toString() }),
        };
      default:
        return [];
    }
  } catch (err) {
    console.error("Error getting subordinates:", err);
    return [];
  }
}

// Add ClickUp API integration
const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN; // Add this to your env variables

// Add helper function to get ClickUp task hours
async function getClickUpTaskHours(userId, startDate, endDate) {
  try {
    const user = await User.findOne({ telegram_id: userId.toString() });
    if (!user || !user.clickup_id) {
      return null;
    }

    // Convert dates to ClickUp format (Unix timestamp in milliseconds)
    const startTimestamp = moment(startDate).valueOf();
    const endTimestamp = moment(endDate).valueOf();

    // Get tasks from ClickUp API
    const response = await axios.get(
      `https://api.clickup.com/api/v2/team/${process.env.CLICKUP_TEAM_ID}/time_entries`,
      {
        headers: {
          Authorization: CLICKUP_API_TOKEN,
        },
        params: {
          start_date: startTimestamp,
          end_date: endTimestamp,
          assignee: user.clickup_id,
        },
      }
    );

    if (!response.data || !response.data.data) {
      return null;
    }

    // Calculate total hours and organize by task
    const taskHours = {
      total: 0,
      tasks: [],
    };

    response.data.data.forEach((entry) => {
      const duration = entry.duration / (1000 * 60 * 60); // Convert milliseconds to hours
      taskHours.total += duration;

      // Add task details
      taskHours.tasks.push({
        taskName: entry.task ? entry.task.name : "No task name",
        duration: duration,
        date: moment(entry.start).format("YYYY-MM-DD"),
        status: entry.task ? entry.task.status.status : "Unknown",
      });
    });

    return taskHours;
  } catch (err) {
    console.error("Error fetching ClickUp data:", err);
    return null;
  }
}

// Update generateReport function to include ClickUp data
async function generateReport(userId, startDate, endDate) {
  try {
    // Create a new PDF document
    const doc = new PDFDocument();
    const filename = `report_${userId}_${moment().format("YYYYMMDD_HHmmss")}.pdf`;
    const filePath = path.join(__dirname, "temp", filename);

    // Ensure temp directory exists
    if (!fs.existsSync(path.join(__dirname, "temp"))) {
      fs.mkdirSync(path.join(__dirname, "temp"));
    }

    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(filePath));

    // Get user details
    const user = await User.findOne({ telegram_id: userId.toString() });
    const userDisplayName = await getUserDisplayName(userId);

    // Add report header
    doc.fontSize(20).text("Absence Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`User: ${userDisplayName}`);
    doc.fontSize(12).text(`Role: ${user.role}`);
    doc.text(
      `Period: ${moment(startDate).format("YYYY-MM-DD")} to ${moment(endDate).format("YYYY-MM-DD")}`
    );
    doc.moveDown();

    // Get absences for date range
    const absences = await Absence.find({
      user_id: userId.toString(),
      created_at: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ created_at: 1 });

    // Calculate total hours and organize absences by status
    let totalHours = 0;
    let approvedHours = 0;
    let deniedHours = 0;
    let pendingHours = 0;

    // Add absences to report
    doc.fontSize(14).text("Absence Records:", { underline: true });
    doc.moveDown();

    if (absences.length === 0) {
      doc.fontSize(12).text("No absences recorded for this period.");
    } else {
      absences.forEach((absence) => {
        const startTime = moment(absence.start_time);
        const endTime = moment(absence.end_time);
        const durationHours = endTime.diff(startTime, "hours", true);

        // Add to total hours based on status
        switch (absence.status) {
          case "approved":
            approvedHours += durationHours;
            break;
          case "denied":
            deniedHours += durationHours;
            break;
          case "pending":
            pendingHours += durationHours;
            break;
        }
        totalHours += durationHours;

        // Format duration for display
        const durationFormatted = durationHours.toFixed(1);

        doc
          .fontSize(12)
          .text(`Date: ${moment(absence.created_at).format("YYYY-MM-DD")}`)
          .text(
            `Time: ${startTime.format("HH:mm")} - ${endTime.format("HH:mm")} (${durationFormatted} hours)`
          )
          .text(`Reason: ${absence.reason}`)
          .text(
            `Status: ${absence.status.charAt(0).toUpperCase() + absence.status.slice(1)}`
          )
          .moveDown();
      });
    }

    // Add statistics
    const totalAbsences = absences.length;
    const approvedAbsences = absences.filter(
      (a) => a.status === "approved"
    ).length;
    const deniedAbsences = absences.filter((a) => a.status === "denied").length;
    const pendingAbsences = absences.filter(
      (a) => a.status === "pending"
    ).length;

    doc
      .moveDown()
      .fontSize(14)
      .text("Statistics:", { underline: true })
      .moveDown()
      .fontSize(12)
      .text("Count Statistics:")
      .text(`Total Absences: ${totalAbsences}`)
      .text(`Approved: ${approvedAbsences}`)
      .text(`Denied: ${deniedAbsences}`)
      .text(`Pending: ${pendingAbsences}`)
      .moveDown()
      .text("Hours Statistics:")
      .text(`Total Hours: ${totalHours.toFixed(1)} hours`)
      .text(`Approved Hours: ${approvedHours.toFixed(1)} hours`)
      .text(`Denied Hours: ${deniedHours.toFixed(1)} hours`)
      .text(`Pending Hours: ${pendingHours.toFixed(1)} hours`);

    // Add average statistics if there are absences
    if (totalAbsences > 0) {
      const avgDuration = totalHours / totalAbsences;
      doc
        .moveDown()
        .text("Averages:")
        .text(`Average Duration per Absence: ${avgDuration.toFixed(1)} hours`);
    }

    // Get ClickUp task hours
    const taskHours = await getClickUpTaskHours(userId, startDate, endDate);

    // Add ClickUp statistics section if available
    if (taskHours) {
      doc
        .moveDown()
        .fontSize(14)
        .text("ClickUp Task Statistics:", { underline: true })
        .moveDown()
        .fontSize(12)
        .text(`Total Task Hours: ${taskHours.total.toFixed(1)} hours`);

      // Add task breakdown
      if (taskHours.tasks.length > 0) {
        doc.moveDown().text("Task Breakdown:");

        // Group tasks by date
        const tasksByDate = {};
        taskHours.tasks.forEach((task) => {
          if (!tasksByDate[task.date]) {
            tasksByDate[task.date] = [];
          }
          tasksByDate[task.date].push(task);
        });

        // Add tasks organized by date
        Object.keys(tasksByDate)
          .sort()
          .forEach((date) => {
            doc.moveDown().text(date, { underline: true });

            tasksByDate[date].forEach((task) => {
              doc
                .text(`• ${task.taskName}`)
                .text(`  Duration: ${task.duration.toFixed(1)} hours`)
                .text(`  Status: ${task.status}`);
            });
          });
      }

      // Add combined statistics
      doc
        .moveDown()
        .fontSize(14)
        .text("Combined Statistics:", { underline: true })
        .moveDown()
        .fontSize(12)
        .text(
          `Total Work Hours: ${(totalHours + taskHours.total).toFixed(1)} hours`
        )
        .text(`• Absence Hours: ${totalHours.toFixed(1)} hours`)
        .text(`• Task Hours: ${taskHours.total.toFixed(1)} hours`)
        .text(
          `Productivity Ratio: ${((taskHours.total / (totalHours + taskHours.total)) * 100).toFixed(1)}%`
        );
    }

    // Add footer with generation date
    doc
      .moveDown(2)
      .fontSize(10)
      .text(`Report generated on: ${moment().format("YYYY-MM-DD HH:mm:ss")}`, {
        align: "center",
        color: "grey",
      });

    // Finalize PDF
    doc.end();

    return filePath;
  } catch (err) {
    console.error("Error generating report:", err);
    return null;
  }
}

// Add the reports command handler
bot.onText(/\/reports/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user) {
      bot.sendMessage(chatId, "You need to register first using /register");
      return;
    }

    // Get subordinates based on user's role
    const subordinates = await getSubordinates(chatId);
    const keyboard = [];

    // Build keyboard based on available subordinates
    if (subordinates.cto) {
      keyboard.push([
        {
          text: `CTO: ${await getUserDisplayName(subordinates.cto.telegram_id)}`,
          callback_data: `report_user_${subordinates.cto.telegram_id}`,
        },
      ]);
    }

    if (subordinates.teamLeaders) {
      for (const leader of subordinates.teamLeaders) {
        keyboard.push([
          {
            text: `Team Leader: ${await getUserDisplayName(leader.telegram_id)}`,
            callback_data: `report_user_${leader.telegram_id}`,
          },
        ]);
      }
    }

    if (subordinates.users) {
      for (const member of subordinates.users) {
        keyboard.push([
          {
            text: `Member: ${await getUserDisplayName(member.telegram_id)}`,
            callback_data: `report_user_${member.telegram_id}`,
          },
        ]);
      }
    }

    if (keyboard.length === 0) {
      bot.sendMessage(chatId, "You don't have access to any reports.");
      return;
    }

    const opts = {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    };

    bot.sendMessage(chatId, "Select a user to generate report:", opts);
  } catch (err) {
    console.error("Error handling reports command:", err);
    bot.sendMessage(chatId, "Error processing your request.");
  }
});

// Add callback handler for report generation
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith("report_user_")) {
    const targetUserId = data.split("_")[2];

    // Ask for report period
    const keyboard = [
      [
        {
          text: "Last 7 days",
          callback_data: `report_period_${targetUserId}_7`,
        },
      ],
      [
        {
          text: "Last 30 days",
          callback_data: `report_period_${targetUserId}_30`,
        },
      ],
      [
        {
          text: "Last 90 days",
          callback_data: `report_period_${targetUserId}_90`,
        },
      ],
      [
        {
          text: "All time",
          callback_data: `report_period_${targetUserId}_all`,
        },
      ],
    ];

    const opts = {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    };

    bot.editMessageText("Select report period:", {
      chat_id: chatId,
      message_id: msg.message_id,
      reply_markup: opts.reply_markup,
    });
  }

  if (data.startsWith("report_period_")) {
    const [, , userId, period] = data.split("_");
    let startDate,
      endDate = new Date();

    if (period === "all") {
      startDate = new Date(0); // Beginning of time
    } else {
      startDate = moment().subtract(parseInt(period), "days").toDate();
    }

    bot.editMessageText("Generating report...", {
      chat_id: chatId,
      message_id: msg.message_id,
    });

    const reportPath = await generateReport(userId, startDate, endDate);

    if (reportPath) {
      // Send the PDF file
      await bot.sendDocument(chatId, reportPath, {
        caption: `Absence report for ${await getUserDisplayName(userId)}`,
      });

      // Clean up the temporary file
      fs.unlink(reportPath, (err) => {
        if (err) console.error("Error deleting temporary file:", err);
      });
    } else {
      bot.sendMessage(chatId, "Error generating report.");
    }
  }
});

// Add whoami command
bot.onText(/\/whoami/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });

    if (!user) {
      bot.sendMessage(
        chatId,
        "You are not registered. Use /register to create an account."
      );
      return;
    }

    // Get user's display name
    const displayName = await getUserDisplayName(chatId);

    // Build the message
    let message = `👤 *Your Profile*\n\n`;
    message += `Name: ${displayName}\n`;
    message += `Role: ${user.role}\n`;

    // Add team information for team members
    if (user.role === ROLES.USER && user.team_leader_id) {
      const teamLeader = await User.findOne({
        telegram_id: user.team_leader_id,
      });
      const teamLeaderName = await getUserDisplayName(user.team_leader_id);
      const team = teams.find((t) => t.id === teamLeader?.team_id);

      message += `Team: ${team ? team.name : "Unknown"}\n`;
      message += `Team Leader: ${teamLeaderName}\n`;
    }

    // Add team information for team leaders
    if (user.role === ROLES.TEAM_LEADER && user.team_id) {
      const team = teams.find((t) => t.id === user.team_id);
      if (team) {
        message += `Leading Team: ${team.name}\n`;

        // Count team members
        const teamMembers = await User.countDocuments({
          team_leader_id: user.telegram_id,
        });
        message += `Team Members: ${teamMembers}\n`;
      }
    }

    // Add supervisor information based on role
    if (user.role !== ROLES.CTO) {
      const supervisorId = await getSupervisorId(chatId);
      if (supervisorId) {
        const supervisorName = await getUserDisplayName(supervisorId);
        const supervisor = await User.findOne({ telegram_id: supervisorId });
        message += `Reports to: ${supervisorName} (${supervisor.role})\n`;
      }
    }

    // Add registration date
    message += `\nRegistered: ${moment(user.created_at).format("YYYY-MM-DD HH:mm")}\n`;

    // Add absence statistics
    const totalAbsences = await Absence.countDocuments({
      user_id: chatId.toString(),
    });
    const approvedAbsences = await Absence.countDocuments({
      user_id: chatId.toString(),
      status: "approved",
    });
    const pendingAbsences = await Absence.countDocuments({
      user_id: chatId.toString(),
      status: "pending",
    });

    message += `\n📊 *Statistics*\n`;
    message += `Total Absences: ${totalAbsences}\n`;
    message += `Approved: ${approvedAbsences}\n`;
    message += `Pending: ${pendingAbsences}\n`;

    // Send the message with markdown formatting
    bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });
  } catch (err) {
    console.error("Error in whoami command:", err);
    bot.sendMessage(chatId, "Error retrieving your information.");
  }
});

// Add change_role command
bot.onText(/\/change_role/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });

    if (!user) {
      bot.sendMessage(
        chatId,
        "You need to register first using /register before changing roles."
      );
      return;
    }

    // Check available positions
    const ceoExists = await User.findOne({ role: ROLES.CEO });
    const ctoExists = await User.findOne({ role: ROLES.CTO });

    // Build available roles keyboard
    const keyboard = [
      [{ text: "Team Lead 👥", callback_data: "change_role_teamleader" }],
      [{ text: "User 👤", callback_data: "change_role_user" }],
    ];

    // Add CTO option if position is not taken or if current user is CTO
    if (!ctoExists || user.role === ROLES.CTO) {
      keyboard.unshift([{ text: "CTO 🔧", callback_data: "change_role_cto" }]);
    }

    // Add CEO option if position is not taken or if current user is CEO
    if (!ceoExists || user.role === ROLES.CEO) {
      keyboard.unshift([{ text: "CEO 👔", callback_data: "change_role_ceo" }]);
    }

    const opts = {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    };

    bot.sendMessage(
      chatId,
      `Current role: *${user.role}*\nSelect your new role:`,
      { parse_mode: "Markdown", reply_markup: opts.reply_markup }
    );
  } catch (err) {
    console.error("Error in change_role command:", err);
    bot.sendMessage(chatId, "Error processing your request.");
  }
});

// Add the change_role handlers to your callback query handler
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith("change_role_")) {
    const newRole = data.split("_")[2];
    try {
      const user = await User.findOne({ telegram_id: chatId.toString() });

      if (user.role === newRole) {
        bot.sendMessage(chatId, "You already have this role.");
        return;
      }

      // Check if the role is available
      if (newRole === ROLES.CEO || newRole === ROLES.CTO) {
        const existingUser = await User.findOne({ role: newRole });
        if (existingUser && existingUser.telegram_id !== chatId.toString()) {
          bot.sendMessage(
            chatId,
            `The ${newRole.toUpperCase()} position is already taken.`
          );
          return;
        }
      }

      // Handle team leader role change
      if (user.role === ROLES.TEAM_LEADER) {
        // Check if there are team members
        const teamMembers = await User.find({
          team_leader_id: chatId.toString(),
        });
        if (teamMembers.length > 0) {
          bot.sendMessage(
            chatId,
            "You cannot change roles while you have team members. Please reassign your team members first."
          );
          return;
        }
      }

      // Clear team-specific fields when changing roles
      const updateFields = {
        role: newRole,
        team_leader_id: null,
        team_id: null,
      };

      // Update user's role
      await User.findOneAndUpdate(
        { telegram_id: chatId.toString() },
        updateFields,
        { new: true }
      );

      // Send confirmation message
      const confirmationMessage = `Your role has been changed to *${newRole}*`;
      let additionalInfo = "";

      if (newRole === ROLES.USER) {
        additionalInfo = "\nPlease select a team leader using /select_leader";
      } else if (newRole === ROLES.TEAM_LEADER) {
        additionalInfo = "\nPlease select your team using /select_team";
      }

      bot.editMessageText(confirmationMessage + additionalInfo, {
        chat_id: chatId,
        message_id: msg.message_id,
        parse_mode: "Markdown",
      });

      // Notify relevant parties about the role change
      if (newRole === ROLES.CEO || newRole === ROLES.CTO) {
        // Notify all team leaders about new CEO/CTO
        const teamLeaders = await User.find({ role: ROLES.TEAM_LEADER });
        const displayName = await getUserDisplayName(chatId);

        for (const leader of teamLeaders) {
          bot.sendMessage(
            leader.telegram_id,
            `*Organization Update*\n${displayName} is now the ${newRole.toUpperCase()}`,
            { parse_mode: "Markdown" }
          );
        }
      }
    } catch (err) {
      console.error("Error changing role:", err);
      bot.sendMessage(chatId, "Error changing your role.");
    }
  }
});

// Add change_superior command
bot.onText(/\/change_superior/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });

    if (!user) {
      bot.sendMessage(
        chatId,
        "You need to register first using /register before changing superior."
      );
      return;
    }

    // CTO and CEO can't change superior
    if (user.role === ROLES.CTO || user.role === ROLES.CEO) {
      bot.sendMessage(
        chatId,
        `${user.role.toUpperCase()} cannot change superior.`
      );
      return;
    }

    const keyboard = [];

    if (user.role === ROLES.USER) {
      // Get all team leaders
      const teamLeaders = await User.find({ role: ROLES.TEAM_LEADER });

      if (teamLeaders.length === 0) {
        bot.sendMessage(chatId, "No team leaders available.");
        return;
      }

      // Create buttons for each team leader
      for (const leader of teamLeaders) {
        const displayName = await getUserDisplayName(leader.telegram_id);
        keyboard.push([
          {
            text: displayName,
            callback_data: `change_superior_${leader.telegram_id}`,
          },
        ]);
      }
    } else if (user.role === ROLES.TEAM_LEADER) {
      // Get CEO
      const ceo = await User.findOne({ role: ROLES.CEO });

      if (!ceo) {
        bot.sendMessage(chatId, "No CEO available to report to.");
        return;
      }

      const ceoName = await getUserDisplayName(ceo.telegram_id);
      keyboard.push([
        {
          text: `CEO: ${ceoName}`,
          callback_data: `change_superior_${ceo.telegram_id}`,
        },
      ]);
    }

    const currentSuperior = await getSupervisorId(chatId);
    let currentSuperiorName = "None";
    if (currentSuperior) {
      currentSuperiorName = await getUserDisplayName(currentSuperior);
    }

    const opts = {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    };

    bot.sendMessage(
      chatId,
      `Current superior: *${currentSuperiorName}*\nSelect your new superior:`,
      { parse_mode: "Markdown", reply_markup: opts.reply_markup }
    );
  } catch (err) {
    console.error("Error in change_superior command:", err);
    bot.sendMessage(chatId, "Error processing your request.");
  }
});

// Add the change_superior handler to your callback query handler
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith("change_superior_")) {
    const newSuperiorId = data.split("_")[2];

    try {
      const user = await User.findOne({ telegram_id: chatId.toString() });
      const newSuperior = await User.findOne({ telegram_id: newSuperiorId });

      if (!user || !newSuperior) {
        bot.sendMessage(chatId, "Error: User or superior not found.");
        return;
      }

      // Prevent selecting the same superior
      if (user.team_leader_id === newSuperiorId) {
        bot.sendMessage(chatId, "This is already your current superior.");
        return;
      }

      // Update fields based on role
      const updateFields = {};

      if (user.role === ROLES.USER) {
        updateFields.team_leader_id = newSuperiorId;
        // Also update team_id if the team leader has one
        if (newSuperior.team_id) {
          updateFields.team_id = newSuperior.team_id;
        }
      } else if (
        user.role === ROLES.TEAM_LEADER &&
        newSuperior.role === ROLES.CEO
      ) {
        updateFields.team_leader_id = newSuperiorId;
      }

      // Update user's superior
      const updatedUser = await User.findOneAndUpdate(
        { telegram_id: chatId.toString() },
        updateFields,
        { new: true }
      );

      // Get superior's display name
      const superiorName = await getUserDisplayName(newSuperiorId);

      // Send confirmation messages
      bot.editMessageText(
        `Your superior has been changed to *${superiorName}*`,
        {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: "Markdown",
        }
      );

      // Notify new superior
      const userDisplayName = await getUserDisplayName(chatId);
      bot.sendMessage(
        newSuperiorId,
        `*New Team Member*\n${userDisplayName} (${user.role}) is now reporting to you.`,
        { parse_mode: "Markdown" }
      );

      // Notify old superior if exists
      if (user.team_leader_id && user.team_leader_id !== newSuperiorId) {
        bot.sendMessage(
          user.team_leader_id,
          `*Team Update*\n${userDisplayName} is no longer reporting to you.`,
          { parse_mode: "Markdown" }
        );
      }
    } catch (err) {
      console.error("Error changing superior:", err);
      bot.sendMessage(chatId, "Error changing your superior.");
    }
  }

  // ... rest of your existing callback handlers ...
});

// Update the helper function to generate quick time options
function generateQuickTimeOptions() {
  const options = [];

  //   // Add "Now" as the first option
  //   options.push({
  //     text: "Now",
  //     callback_data: "time_now",
  //   });

  // Add absolute times (15:00, 16:00, etc.)
  const now = moment();
  const currentHour = now.hour();

  for (let i = 0; i < 4; i++) {
    // Round to next hour
    const time = moment()
      .hour(currentHour + i)
      .minute(0);
    if (time.isAfter(now)) {
      // Only show future times
      options.push({
        text: `${time.format("HH:00")}`,
        callback_data: `time_quick_${time.format("HH:00")}`,
      });
    }
  }

  // Add manual time option
  options.push({
    text: "Set Manually",
    callback_data: "time_write",
  });

  return options;
}

// Add approve_required command
bot.onText(/\/approve_required/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });

    if (!user) {
      bot.sendMessage(chatId, "You need to register first using /register.");
      return;
    }

    // Only team leaders and above can set approval requirements
    if (user.role === ROLES.USER) {
      bot.sendMessage(
        chatId,
        "Only team leaders and above can set approval requirements."
      );
      return;
    }

    // Get team members if team leader
    let teamMembers = [];
    if (user.role === ROLES.TEAM_LEADER) {
      teamMembers = await User.find({ team_leader_id: chatId.toString() });
    }

    // Create keyboard with options
    const keyboard = [
      [{ text: "Whole Team", callback_data: "approve_req_team" }],
    ];

    // Add individual team members if any
    if (teamMembers.length > 0) {
      for (const member of teamMembers) {
        const displayName = await getUserDisplayName(member.telegram_id);
        keyboard.push([
          {
            text: displayName,
            callback_data: `approve_req_user_${member.telegram_id}`,
          },
        ]);
      }
    }

    // Add time period options
    keyboard.push([
      { text: "View Current", callback_data: "approve_req_view" },
      { text: "Remove All", callback_data: "approve_req_remove" },
    ]);

    const opts = {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    };

    bot.sendMessage(chatId, "Select who needs approval for absences:", opts);
  } catch (err) {
    console.error("Error in approve_required command:", err);
    bot.sendMessage(chatId, "Error processing your request.");
  }
});

// Add the approve_required handlers to your callback query handler
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith("approve_req_")) {
    const action = data.split("_")[2];
    const userId = data.split("_")[3];

    try {
      switch (action) {
        case "team":
        case "user":
          // Store target info in global state
          global.approvalTarget = {
            userId: action === "team" ? null : userId,
            chatId: chatId,
          };

          const targetText = global.approvalTarget.userId
            ? await getUserDisplayName(global.approvalTarget.userId)
            : "whole team";

          // Show time slots for start time
          const timeSlots = generateTimeSlots(new Date());
          timeSlots.push([
            { text: "Set Manually", callback_data: "approve_time_write" },
          ]);

          const opts = {
            reply_markup: {
              inline_keyboard: timeSlots,
            },
          };

          bot.editMessageText(
            `Setting approval requirement for ${targetText}\nSelect start time:`,
            {
              chat_id: chatId,
              message_id: msg.message_id,
              reply_markup: opts.reply_markup,
            }
          );
          break;

        case "view":
          // Show current requirements
          const requirements = await ApprovalRequirement.find({
            team_leader_id: chatId.toString(),
          });

          if (requirements.length === 0) {
            bot.sendMessage(chatId, "No approval requirements set.");
            return;
          }

          let message = "*Current Approval Requirements*\n\n";

          for (const req of requirements) {
            const target = req.user_id
              ? await getUserDisplayName(req.user_id)
              : "Whole Team";

            message += `👤 *${target}*\n`;
            message += `⏰ ${moment(req.start_time).format("HH:mm")}-${moment(req.end_time).format("HH:mm")}\n\n`;
          }

          bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
          break;

        case "remove":
          // Remove all requirements
          await ApprovalRequirement.deleteMany({
            team_leader_id: chatId.toString(),
          });

          bot.sendMessage(
            chatId,
            "✅ All approval requirements have been removed."
          );
          break;
      }
    } catch (err) {
      console.error("Error handling approval requirement:", err);
      bot.sendMessage(chatId, "Error processing your request.");
    }
  }

  // Handle start time selection
  if (data.startsWith("time_slot_") || data === "approve_time_write") {
    try {
      if (data === "approve_time_write") {
        bot.editMessageText("Please enter the start time (format: HH:mm):", {
          chat_id: chatId,
          message_id: msg.message_id,
        });

        bot.once("message", async (timeMsg) => {
          if (timeMsg.chat.id === chatId) {
            handleApprovalStartTime(chatId, timeMsg.text);
          }
        });
      } else {
        const startTime = data.split("_")[2];
        handleApprovalStartTime(chatId, startTime);
      }
    } catch (err) {
      console.error("Error processing start time selection:", err);
      bot.sendMessage(chatId, "Error processing your request.");
    }
  }

  // Handle end time selection
  if (data.startsWith("end_time_slot_") || data === "end_time_write") {
    try {
      if (data === "end_time_write") {
        bot.editMessageText("Please enter the end time (format: HH:mm):", {
          chat_id: chatId,
          message_id: msg.message_id,
        });

        bot.once("message", async (timeMsg) => {
          if (timeMsg.chat.id === chatId) {
            handleApprovalEndTime(chatId, timeMsg.text);
          }
        });
      } else {
        const endTime = data.split("_")[3];
        handleApprovalEndTime(chatId, endTime);
      }
    } catch (err) {
      console.error("Error processing end time selection:", err);
      bot.sendMessage(chatId, "Error processing your request.");
    }
  }
});

// Add helper functions for handling time selection
async function handleApprovalStartTime(chatId, startTime) {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

  if (!timeRegex.test(startTime)) {
    bot.sendMessage(chatId, "Invalid time format. Please use HH:mm format.");
    return;
  }

  // Store start time
  global.approvalTarget.startTime = startTime;

  // Show time slots for end time
  const timeSlots = generateTimeSlots(moment(startTime, "HH:mm").toDate());
  timeSlots.push([{ text: "Set Manually", callback_data: "end_time_write" }]);

  // Filter out times before start time
  const filteredSlots = timeSlots.filter((row) => {
    return row.every((slot) => {
      if (slot.callback_data === "end_time_write") return true;
      const slotTime = slot.callback_data.split("_")[3];
      return moment(slotTime, "HH:mm").isAfter(moment(startTime, "HH:mm"));
    });
  });

  const opts = {
    reply_markup: {
      inline_keyboard: filteredSlots.map((row) =>
        row.map((slot) => ({
          ...slot,
          callback_data:
            slot.callback_data === "end_time_write"
              ? slot.callback_data
              : `end_${slot.callback_data}`,
        }))
      ),
    },
  };

  bot.sendMessage(
    chatId,
    `Start time set to ${startTime}\nNow select end time:`,
    opts
  );
}

async function handleApprovalEndTime(chatId, endTime) {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

  if (!timeRegex.test(endTime)) {
    bot.sendMessage(chatId, "Invalid time format. Please use HH:mm format.");
    return;
  }

  if (
    moment(endTime, "HH:mm").isSameOrBefore(
      moment(global.approvalTarget.startTime, "HH:mm")
    )
  ) {
    bot.sendMessage(chatId, "End time must be after start time.");
    return;
  }

  try {
    // Create new approval requirement
    const requirement = new ApprovalRequirement({
      team_leader_id: global.approvalTarget.chatId.toString(),
      user_id: global.approvalTarget.userId,
      start_time: moment(global.approvalTarget.startTime, "HH:mm").toDate(),
      end_time: moment(endTime, "HH:mm").toDate(),
    });

    await requirement.save();

    const targetText = requirement.user_id
      ? await getUserDisplayName(requirement.user_id)
      : "whole team";

    bot.sendMessage(
      chatId,
      `✅ Approval requirement set for ${targetText}\nTime period: ${global.approvalTarget.startTime}-${endTime}`
    );

    // Clear global state
    delete global.approvalTarget;
  } catch (err) {
    console.error("Error saving approval requirement:", err);
    bot.sendMessage(chatId, "Error saving approval requirement.");
  }
}

// Add helper function for sending confirmation
async function sendApprovalConfirmation(chatId, requirement) {
  try {
    const formattedStart = moment(requirement.start_time).format("HH:mm");
    const formattedEnd = moment(requirement.end_time).format("HH:mm");

    // Get the role of the person setting the requirement
    const setter = await User.findOne({ telegram_id: chatId.toString() });
    if (!setter) {
      throw new Error("User not found");
    }

    let usersToNotify = [];
    let targetDisplay = "";

    switch (setter.role) {
      case ROLES.CEO:
        if (requirement.user_id) {
          // Individual CTO selected
          const cto = await User.findOne({
            telegram_id: requirement.user_id,
            role: ROLES.CTO,
          });
          if (cto) {
            usersToNotify = [cto.telegram_id];
            targetDisplay = await getUserDisplayName(cto.telegram_id);
          }
        } else {
          // Whole team selected (all CTOs)
          const ctos = await User.find({ role: ROLES.CTO });
          usersToNotify = ctos.map((cto) => cto.telegram_id);
          targetDisplay = "All CTOs";
        }
        break;

      case ROLES.CTO:
        if (requirement.user_id) {
          // Individual team leader selected
          const teamLeader = await User.findOne({
            telegram_id: requirement.user_id,
            role: ROLES.TEAM_LEADER,
          });
          if (teamLeader) {
            usersToNotify = [teamLeader.telegram_id];
            targetDisplay = await getUserDisplayName(teamLeader.telegram_id);
          }
        } else {
          // All team leaders
          const teamLeaders = await User.find({ role: ROLES.TEAM_LEADER });
          usersToNotify = teamLeaders.map((tl) => tl.telegram_id);
          targetDisplay = "All Team Leaders";
        }
        break;

      case ROLES.TEAM_LEADER:
        if (requirement.user_id) {
          // Individual team member selected
          const teamMember = await User.findOne({
            telegram_id: requirement.user_id,
            team_leader_id: chatId.toString(),
          });
          if (teamMember) {
            usersToNotify = [teamMember.telegram_id];
            targetDisplay = await getUserDisplayName(teamMember.telegram_id);
          }
        } else {
          // Whole team selected
          const teamMembers = await User.find({
            team_leader_id: chatId.toString(),
          });
          usersToNotify = teamMembers.map((member) => member.telegram_id);
          targetDisplay = "Your Entire Team";
        }
        break;
    }

    if (usersToNotify.length === 0) {
      bot.sendMessage(
        chatId,
        "No valid users found to set approval requirement for."
      );
      return;
    }

    // Send confirmation to the person who set the requirement
    bot.sendMessage(
      chatId,
      `✅ Approval requirement set:\nFor: ${targetDisplay}\nFrom: ${formattedStart}\nTo: ${formattedEnd}\nReason: ${requirement.reason}`
    );

    // Notify affected users
    const setterName = await getUserDisplayName(chatId);
    for (const userId of usersToNotify) {
      bot.sendMessage(
        userId,
        `⚠️ Important Notice ⚠️\n\n${setter.role.toUpperCase()} ${setterName} requires you to stay in the office during:\n\nFrom: ${formattedStart}\nTo: ${formattedEnd}\n\nReason: ${requirement.reason}\n\nDuring this time period, you must get approval before leaving the building.`
      );
    }
  } catch (err) {
    console.error("Error sending confirmation:", err);
    bot.sendMessage(chatId, "Error sending confirmation messages.");
  }
}

// Add command to link ClickUp ID
bot.onText(/\/set_clickup_id (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const clickupId = match[1];

  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user) {
      bot.sendMessage(chatId, "Please register first using /register");
      return;
    }

    // Update user with ClickUp ID
    await User.findOneAndUpdate(
      { telegram_id: chatId.toString() },
      { clickup_id: clickupId }
    );

    bot.sendMessage(chatId, "Your ClickUp ID has been successfully linked!");
  } catch (err) {
    console.error("Error setting ClickUp ID:", err);
    bot.sendMessage(chatId, "Error linking your ClickUp ID.");
  }
});
