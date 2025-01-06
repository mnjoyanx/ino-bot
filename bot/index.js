// Required dependencies
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const moment = require("moment");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const Meeting = require("./meeting");
const Vacation = require("./vacation");
const DayOff = require("./dayoff");
const Salary = require("./salary");
const ICal = require("ical-generator").default; // Changed this line
const PerformanceReview = require("./performanceReview"); // Added this line

// Initialize bot with your token
const token = "7729835414:AAHnTWxKBzQvtlEjsuiY6Pau-b-vDZ6j1vQ";
const bot = new TelegramBot(token, { polling: true });

// MongoDB Connection
mongoose
  .connect(
    "mongodb+srv://mnjoyan:QBEPOCpGD0FmQPx3@cluster0.t6zkh.mongodb.net",
    {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
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

        console.trace(teamLeaderButtons);

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
    try {
      const startDateTime = moment().toDate();
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
          const [hours, minutes] = inputTime.split(":");
          const startDateTime = moment()
            .hours(hours)
            .minutes(minutes)
            .seconds(0)
            .toDate();

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
      const endTime = data.split("_")[3];
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
        // const endDateTime = moment(absence.start_time)
        //   .hours(parseInt(endTime.split(":")[0]))
        //   .minutes(parseInt(endTime.split(":")[1]))
        //   .toDate();

        const endDateTime = moment(endTime, "HH:mm").format();

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
              `Start time set to ${startTime.format(
                "HH:mm"
              )}\nPlease select when approval requirement ends:`,
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
          `Start time set to ${startMoment.format(
            "HH:mm"
          )}\nPlease select when approval requirement ends:`,
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
          `Absence request APPROVED ✅\nUser: ${await getUserDisplayName(
            absence.user_id
          )}\nFrom: ${moment(absence.start_time).format("HH:mm")}\nTo: ${moment(
            absence.end_time
          ).format("HH:mm")}\nReason: ${absence.reason}`,
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
          `Your absence request has been APPROVED ✅ by ${approverRole} ${approverName}\nFrom: ${moment(
            absence.start_time
          ).format("HH:mm")}\nTo: ${moment(absence.end_time).format(
            "HH:mm"
          )}\nReason: ${absence.reason}`
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
          `Absence request DENIED ❌\nUser: ${await getUserDisplayName(
            absence.user_id
          )}\nFrom: ${moment(absence.start_time).format("HH:mm")}\nTo: ${moment(
            absence.end_time
          ).format("HH:mm")}\nReason: ${absence.reason}`,
          {
            chat_id: chatId,
            message_id: msg.message_id,
          }
        );

        // Notify user
        bot.sendMessage(
          absence.user_id,
          `Your absence request has been DENIED ❌ by ${denierRole} ${denierName}\nFrom: ${moment(
            absence.start_time
          ).format("HH:mm")}\nTo: ${moment(absence.end_time).format(
            "HH:mm"
          )}\nReason: ${absence.reason}`
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
    try {
      const [hours, minutes] = selectedTime.split(":");
      const startDateTime = moment()
        .hours(hours)
        .minutes(minutes)
        .seconds(0)
        .toDate();

      await Absence.findOneAndUpdate(
        { user_id: chatId.toString(), status: "pending" },
        { start_time: startDateTime }
      );
      requestEndTime(chatId, startDateTime);
    } catch (err) {
      console.error("Error processing quick time selection:", err);
      bot.sendMessage(chatId, "Error processing your request.");
    }
  }
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
      `Your absence has been registered:\nFrom: ${formattedStart}\nTo: ${formattedEnd}\nReason: ${
        absence.reason || "Not specified"
      }\nStatus: Pending approval`
    );

    // Get supervisor's ID based on user's role
    const supervisorId = await getSupervisorId(absence.user_id);

    if (supervisorId) {
      try {
        // Check if approval is required for this time period
        const requiresApproval = await checkApprovalRequired(
          absence.user_id,
          absence.start_time,
          absence.end_time
        );

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

        let messageText = `New absence request from ${requesterRole}:\nUser: ${displayName}\nFrom: ${formattedStart}\nTo: ${formattedEnd}\nReason: ${
          absence.reason || "Not specified"
        }`;

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
            `Your absence request has been automatically approved (no approval required):\nFrom: ${formattedStart}\nTo: ${formattedEnd}\nReason: ${
              absence.reason || "Not specified"
            }`
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
      // Generate time slots for the next few hours
      const timeSlots = generateTimeSlots(new Date(), false, "late_time");
      const opts = {
        reply_markup: {
          inline_keyboard: [
            ...timeSlots,
            [{ text: "Set Manually", callback_data: "late_time_manual" }],
          ],
        },
      };

      bot.sendMessage(chatId, "Please select when you will arrive:", opts);
    } else {
      bot.sendMessage(chatId, "You are not assigned to any team leader.");
    }
  } catch (err) {
    console.error("Error processing late for meeting:", err);
    bot.sendMessage(chatId, "Error processing your request.");
  }
});

// Add to your existing callback query handler
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  // Handle late time selection
  if (data.startsWith("late_time_")) {
    if (data === "late_time_manual") {
      bot.sendMessage(
        chatId,
        "Please enter the time you will arrive (format: HH:mm):"
      );

      bot.once("message", async (timeMsg) => {
        const inputTime = timeMsg.text;
        const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

        if (timeRegex.test(inputTime)) {
          await handleLateNotification(chatId, inputTime);
        } else {
          bot.sendMessage(
            chatId,
            "Invalid time format. Please use HH:mm format (e.g., 09:30)."
          );
        }
      });
    } else {
      const selectedTime = data.split("_")[2];
      await handleLateNotification(chatId, selectedTime);
    }
  }

  // ... rest of your existing callback handlers ...
});

// Add this helper function to handle late notifications
async function handleLateNotification(chatId, arrivalTime) {
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user || !user.team_leader_id) {
      bot.sendMessage(chatId, "Error: User or team leader not found.");
      return;
    }

    // Get user's display name
    const userName = await getUserDisplayName(chatId);

    // Format the notification message
    const message =
      `🕒 *Late Arrival Notification*\n` +
      `Team member: ${userName}\n` +
      `Expected arrival time: ${arrivalTime}`;

    // Send notification to team leader
    await bot.sendMessage(user.team_leader_id, message, {
      parse_mode: "Markdown",
    });

    // Send confirmation to user
    await bot.sendMessage(
      chatId,
      `✅ Your team leader has been notified that you will arrive at ${arrivalTime}.`
    );

    // If user is part of a team, create an absence record
    const absence = new Absence({
      user_id: chatId.toString(),
      reason: "Late Arrival",
      start_time: moment().toDate(),
      end_time: moment(arrivalTime, "HH:mm").toDate(),
      status: "approved", // Auto-approve late notifications
    });
    await absence.save();
  } catch (err) {
    console.error("Error handling late notification:", err);
    bot.sendMessage(chatId, "Error sending late notification.");
  }
}

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

async function generateReport(userId, startDate, endDate) {
  try {
    // Create a new PDF document
    const doc = new PDFDocument();
    const filename = `report_${userId}_${moment().format(
      "YYYYMMDD_HHmmss"
    )}.pdf`;
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
      `Period: ${moment(startDate).format("YYYY-MM-DD")} to ${moment(
        endDate
      ).format("YYYY-MM-DD")}`
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
            `Time: ${startTime.format("HH:mm")} - ${endTime.format(
              "HH:mm"
            )} (${durationFormatted} hours)`
          )
          .text(`Reason: ${absence.reason}`)
          .text(
            `Status: ${
              absence.status.charAt(0).toUpperCase() + absence.status.slice(1)
            }`
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
          text: `CTO: ${await getUserDisplayName(
            subordinates.cto.telegram_id
          )}`,
          callback_data: `report_user_${subordinates.cto.telegram_id}`,
        },
      ]);
    }

    if (subordinates.teamLeaders) {
      for (const leader of subordinates.teamLeaders) {
        keyboard.push([
          {
            text: `Team Leader: ${await getUserDisplayName(
              leader.telegram_id
            )}`,
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
    message += `\nRegistered: ${moment(user.created_at).format(
      "YYYY-MM-DD HH:mm"
    )}\n`;

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
            message += `⏰ ${moment(req.start_time).format("HH:mm")}-${moment(
              req.end_time
            ).format("HH:mm")}\n\n`;
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
        `⚠️ Important Notice ⚠️\n\n${setter.role.toUpperCase()} ${setterName} requires you to stay in the office during:\n\nFrom: ${formattedStart}\nTo: ${formattedEnd}\n\nReason: ${
          requirement.reason
        }\n\nDuring this time period, you must get approval before leaving the building.`
      );
    }
  } catch (err) {
    console.error("Error sending confirmation:", err);
    bot.sendMessage(chatId, "Error sending confirmation messages.");
  }
}

// Add cancel_request command
bot.onText(/\/cancel_request/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Find pending absences for the user
    const pendingAbsences = await Absence.find({
      user_id: chatId.toString(),
      status: "pending",
    }).sort({ created_at: -1 });

    if (pendingAbsences.length === 0) {
      bot.sendMessage(
        chatId,
        "You have no pending absence requests to cancel."
      );
      return;
    }

    // Create keyboard with pending requests
    const keyboard = pendingAbsences.map((absence) => {
      const startTime = moment(absence.start_time).format("HH:mm");
      const endTime = moment(absence.end_time).format("HH:mm");
      const date = moment(absence.created_at).format("DD/MM/YYYY");

      return [
        {
          text: `${date} ${startTime}-${endTime} (${absence.reason})`,
          callback_data: `cancel_absence_${absence._id}`,
        },
      ];
    });

    const opts = {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    };

    bot.sendMessage(
      chatId,
      "Select the absence request you want to cancel:",
      opts
    );
  } catch (err) {
    console.error("Error fetching pending requests:", err);
    bot.sendMessage(chatId, "Error processing your request.");
  }
});

// Add to your existing callback query handler
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  // Handle cancel absence request
  if (data.startsWith("cancel_absence_")) {
    const absenceId = data.split("_")[2];

    try {
      const absence = await Absence.findById(absenceId);

      if (!absence) {
        bot.editMessageText("Request not found or already cancelled.", {
          chat_id: chatId,
          message_id: msg.message_id,
        });
        return;
      }

      if (absence.status !== "pending") {
        bot.editMessageText("Only pending requests can be cancelled.", {
          chat_id: chatId,
          message_id: msg.message_id,
        });
        return;
      }

      // Delete the absence request
      await Absence.findByIdAndDelete(absenceId);

      // Update message to show cancellation
      bot.editMessageText("✅ Absence request cancelled successfully.", {
        chat_id: chatId,
        message_id: msg.message_id,
      });

      // Notify supervisor about cancellation
      const supervisorId = await getSupervisorId(chatId);
      if (supervisorId) {
        const userDisplayName = await getUserDisplayName(chatId);
        const startTime = moment(absence.start_time).format("HH:mm");
        const endTime = moment(absence.end_time).format("HH:mm");

        bot.sendMessage(
          supervisorId,
          `*Absence Request Cancelled*\n${userDisplayName} has cancelled their absence request:\nFrom: ${startTime}\nTo: ${endTime}\nReason: ${absence.reason}`,
          { parse_mode: "Markdown" }
        );
      }
    } catch (err) {
      console.error("Error cancelling absence:", err);
      bot.sendMessage(chatId, "Error cancelling your request.");
    }
  }

  // ... rest of your existing callback handlers ...
});

// Command handler for my absences
bot.onText(/\/my_absences/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const absences = await Absence.find({
      user_id: chatId.toString(),
    })
      .sort({ created_at: -1 })
      .limit(10);

    if (absences.length === 0) {
      await bot.sendMessage(chatId, "You have no absence records.");
      return;
    }

    let message = "🕒 Your recent absences:\n\n";
    for (const absence of absences) {
      const date = moment(absence.created_at).format("DD/MM/YYYY");
      const startTime = moment(absence.start_time).format("HH:mm");
      const endTime = moment(absence.end_time).format("HH:mm");
      const status = absence.status.toUpperCase();

      message += `📅 ${date}\n`;
      message += `⏰ ${startTime} - ${endTime}\n`;
      message += `📝 Reason: ${absence.reason}\n`;
      message += `📌 Status: ${status}\n\n`;
    }

    await bot.sendMessage(chatId, message);
  } catch (err) {
    console.error("Error fetching absences:", err);
    await bot.sendMessage(chatId, "Error fetching your absences.");
  }
});

// Command handler for team absences
bot.onText(/\/team_absences/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user || user.role === ROLES.USER) {
      await bot.sendMessage(
        chatId,
        "You don't have permission to view team absences."
      );
      return;
    }

    let teamMembers = [];
    switch (user.role) {
      case ROLES.TEAM_LEADER:
        teamMembers = await User.find({ team_leader_id: chatId.toString() });
        break;
      case ROLES.CTO:
        teamMembers = await User.find({ role: ROLES.TEAM_LEADER });
        break;
      case ROLES.CEO:
        teamMembers = await User.find({
          role: { $in: [ROLES.CTO, ROLES.TEAM_LEADER] },
        });
        break;
    }

    if (teamMembers.length === 0) {
      await bot.sendMessage(chatId, "No team members found.");
      return;
    }

    const today = moment().startOf("day");
    const absences = await Absence.find({
      user_id: { $in: teamMembers.map((m) => m.telegram_id) },
      created_at: { $gte: today.toDate() },
    }).sort({ created_at: -1 });

    if (absences.length === 0) {
      await bot.sendMessage(
        chatId,
        "No absences recorded for your team today."
      );
      return;
    }

    let message = "👥 Team Absences Today:\n\n";
    for (const absence of absences) {
      const memberName = await getUserDisplayName(absence.user_id);
      const startTime = moment(absence.start_time).format("HH:mm");
      const endTime = moment(absence.end_time).format("HH:mm");

      message += `👤 ${memberName}\n`;
      message += `⏰ ${startTime} - ${endTime}\n`;
      message += `📝 Reason: ${absence.reason}\n`;
      message += `📌 Status: ${absence.status.toUpperCase()}\n\n`;
    }

    await bot.sendMessage(chatId, message);
  } catch (err) {
    console.error("Error fetching team absences:", err);
    await bot.sendMessage(chatId, "Error fetching team absences.");
  }
});

// Command handler for broadcast messages
bot.onText(/\/broadcast/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });

    if (!user || user.role === ROLES.USER) {
      bot.sendMessage(
        chatId,
        "You don't have permission to broadcast messages."
      );
      return;
    }

    // Store the broadcaster's ID in a temporary state
    global.broadcastState = {
      senderId: chatId,
      role: user.role,
    };

    // Create keyboard based on user's role
    const keyboard = [];

    switch (user.role) {
      case ROLES.CEO:
        keyboard.push(
          [{ text: "All Employees 👥", callback_data: "broadcast_all" }],
          [
            {
              text: "Management Only 👔",
              callback_data: "broadcast_management",
            },
          ],
          [{ text: "Team Leaders 👥", callback_data: "broadcast_teamleaders" }]
        );
        break;
      case ROLES.CTO:
        keyboard.push(
          [
            {
              text: "All Team Leaders 👥",
              callback_data: "broadcast_teamleaders",
            },
          ],
          [{ text: "All Employees 👥", callback_data: "broadcast_all" }]
        );
        break;
      case ROLES.TEAM_LEADER:
        keyboard.push([
          { text: "My Team 👥", callback_data: "broadcast_myteam" },
        ]);
        break;
    }

    const opts = {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    };

    bot.sendMessage(chatId, "Select broadcast audience:", opts);
  } catch (err) {
    console.error("Error in broadcast command:", err);
    bot.sendMessage(chatId, "Error processing broadcast request.");
  }
});

// Add to your existing callback query handler
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith("broadcast_")) {
    const audience = data.split("_")[1];

    // Store the selected audience
    if (global.broadcastState) {
      global.broadcastState.audience = audience;
    }

    // Ask for the message
    bot.sendMessage(
      chatId,
      "Please enter your broadcast message:\n\n" +
        "You can use basic markdown:\n" +
        "*bold text*\n" +
        "_italic text_\n" +
        "`code`\n" +
        "```preformatted text```"
    );

    // Set up one-time listener for the broadcast message
    bot.once("message", async (messageMsg) => {
      if (messageMsg.chat.id === chatId) {
        try {
          const broadcastMessage = messageMsg.text;
          const sender = await User.findOne({ telegram_id: chatId.toString() });
          const senderName = await getUserDisplayName(chatId);

          let recipients = [];

          // Determine recipients based on audience and sender's role
          switch (audience) {
            case "all":
              recipients = await User.find({});
              break;
            case "management":
              recipients = await User.find({
                role: { $in: [ROLES.CTO, ROLES.TEAM_LEADER] },
              });
              break;
            case "teamleaders":
              recipients = await User.find({ role: ROLES.TEAM_LEADER });
              break;
            case "myteam":
              recipients = await User.find({
                team_leader_id: chatId.toString(),
              });
              break;
          }

          // Format the broadcast message
          const formattedMessage =
            `📢 *Broadcast Message*\n` +
            `From: ${sender.role.toUpperCase()} ${senderName}\n` +
            `\n${broadcastMessage}`;

          // Send to all recipients
          let successCount = 0;
          let failCount = 0;

          for (const recipient of recipients) {
            try {
              await bot.sendMessage(recipient.telegram_id, formattedMessage, {
                parse_mode: "Markdown",
              });
              successCount++;
            } catch (err) {
              console.error(`Failed to send to ${recipient.telegram_id}:`, err);
              failCount++;
            }
            // Add a small delay to avoid hitting rate limits
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // Send summary to sender
          bot.sendMessage(
            chatId,
            `✅ Broadcast complete\n` +
              `Successfully sent to: ${successCount} recipients\n` +
              `Failed deliveries: ${failCount}`
          );
        } catch (err) {
          console.error("Error sending broadcast:", err);
          bot.sendMessage(chatId, "Error sending broadcast message.");
        }

        // Clear the broadcast state
        delete global.broadcastState;
      }
    });
  }

  // ... rest of your existing callback handlers ...
});

// Command handler for scheduling meetings
bot.onText(/\/schedule_meeting/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user) {
      bot.sendMessage(chatId, "Please register first using /register");
      return;
    }

    // Only allow team leaders and above to schedule meetings
    if (user.role === ROLES.USER) {
      bot.sendMessage(
        chatId,
        "Only team leaders and above can schedule meetings."
      );
      return;
    }

    // Store meeting creator info in global state
    global.meetingState = {
      creatorId: chatId,
      role: user.role,
    };

    // Generate time slots for today and tomorrow
    const timeSlots = [];
    const now = moment();
    const tomorrow = moment().add(1, "day");

    // Today's slots (if not too late)
    if (now.hour() < 17) {
      // Only show today if before 5 PM
      const todaySlots = generateTimeSlots(
        now.toDate(),
        false,
        "meeting_today"
      );
      timeSlots.push([{ text: "📅 Today", callback_data: "header_today" }]);
      timeSlots.push(...todaySlots);
    }

    // Tomorrow's slots
    const tomorrowSlots = generateTimeSlots(
      tomorrow.startOf("day").add(9, "hours").toDate(),
      false,
      "meeting_tomorrow"
    );
    timeSlots.push([{ text: "📅 Tomorrow", callback_data: "header_tomorrow" }]);
    timeSlots.push(...tomorrowSlots);

    // Manual option
    timeSlots.push([
      { text: "📝 Set Custom Time", callback_data: "meeting_time_manual" },
    ]);

    const opts = {
      reply_markup: {
        inline_keyboard: timeSlots,
      },
    };

    bot.sendMessage(chatId, "Select meeting time:", opts);
  } catch (err) {
    console.error("Error in schedule meeting command:", err);
    bot.sendMessage(chatId, "Error processing meeting scheduling request.");
  }
});

// Add to your existing callback query handler
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (
    data.startsWith("meeting_today_") ||
    data.startsWith("meeting_tomorrow_") ||
    data === "meeting_time_manual"
  ) {
    if (data === "meeting_time_manual") {
      bot.sendMessage(chatId, "Please enter the meeting time (format: HH:mm):");

      bot.once("message", async (timeMsg) => {
        const inputTime = timeMsg.text;
        const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

        if (timeRegex.test(inputTime)) {
          await promptMeetingLocation(chatId, inputTime);
        } else {
          bot.sendMessage(
            chatId,
            "Invalid time format. Please use HH:mm format (e.g., 14:30)"
          );
        }
      });
    } else {
      const [type, day, time] = data.split("_");
      await promptMeetingLocation(chatId, time);
    }
  }

  // ... rest of your existing callback handlers ...
});

async function promptMeetingLocation(chatId, meetingTime) {
  try {
    if (!global.meetingState) {
      bot.sendMessage(
        chatId,
        "Error: Meeting session expired. Please start over."
      );
      return;
    }

    global.meetingState.time = meetingTime;

    const locationKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Large Meeting Room", callback_data: "location_room1" }],
          [{ text: "Small Meeting Room", callback_data: "location_room2" }],
        ],
      },
    };

    bot.sendMessage(chatId, "Select meeting location:", locationKeyboard);
  } catch (err) {
    console.error("Error prompting meeting location:", err);
    bot.sendMessage(chatId, "Error processing meeting location.");
  }
}

// Add to your callback query handler
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith("location_")) {
    const location = data.split("_")[1];
    try {
      const user = await User.findOne({ telegram_id: chatId.toString() });
      const creator = await getUserDisplayName(chatId);
      let recipients = [];

      // Get team members based on role
      if (user.role === ROLES.TEAM_LEADER) {
        recipients = await User.find({ team_leader_id: chatId.toString() });
      } else if (user.role === ROLES.CTO) {
        recipients = await User.find({ role: ROLES.TEAM_LEADER });
      } else if (user.role === ROLES.CEO) {
        recipients = await User.find({});
      }

      const locationNames = {
        room1: "Large Meeting Room",
        room2: "Small Meeting Room",
      };

      // Create the meeting time based on whether it's today or tomorrow
      let meetingDateTime = moment();
      const [hours, minutes] = global.meetingState.time.split(":");

      // If the meeting time is earlier than current time, set it for tomorrow
      if (
        meetingDateTime.hours() > parseInt(hours) ||
        (meetingDateTime.hours() === parseInt(hours) &&
          meetingDateTime.minutes() >= parseInt(minutes))
      ) {
        meetingDateTime = meetingDateTime.add(1, "day");
      }

      meetingDateTime
        .hours(parseInt(hours))
        .minutes(parseInt(minutes))
        .seconds(0);

      // Save the meeting
      const meeting = new Meeting({
        creator_id: chatId.toString(),
        time: meetingDateTime.toDate(),
        location: location,
      });
      await meeting.save();

      const message =
        `📅 *Meeting Scheduled*\n\n` +
        `⏰ Time: ${meetingDateTime.format("DD/MM/YYYY HH:mm")}\n` +
        `📍 Location: ${locationNames[location]}\n` +
        `👤 Organized by: ${creator}`;

      // Send to all recipients
      let successCount = 0;
      let failCount = 0;

      // Always include the creator in the recipients
      const allRecipients = [...recipients, user];

      for (const recipient of allRecipients) {
        try {
          await bot.sendMessage(recipient.telegram_id, message, {
            parse_mode: "Markdown",
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to send to ${recipient.telegram_id}:`, err);
          failCount++;
        }
        // Add a small delay between messages
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Update the original message to show completion
      await bot.editMessageText(
        `✅ Meeting scheduled successfully!\n\n${message}`,
        {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: "Markdown",
        }
      );

      // Clear meeting state
      delete global.meetingState;
    } catch (err) {
      console.error("Error scheduling meeting:", err);
      bot.sendMessage(chatId, "Error scheduling the meeting.");
    }
  }

  // ... rest of your existing callback handlers ...
});

// Command handler for viewing planned meetings
bot.onText(/\/my_meetings/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user) {
      bot.sendMessage(chatId, "Please register first using /register");
      return;
    }

    // Get current time
    const now = moment();

    // Find all meetings where this user is a recipient
    let meetings = [];

    // If user is a team member, get meetings from their team leader
    if (user.role === ROLES.USER && user.team_leader_id) {
      const teamLeaderMeetings = await Meeting.find({
        creator_id: user.team_leader_id,
        time: { $gte: now.toDate() },
      }).sort({ time: 1 });
      meetings = meetings.concat(teamLeaderMeetings);
    }

    // If user is a team leader, get meetings from CTO and their own meetings
    if (user.role === ROLES.TEAM_LEADER) {
      const cto = await User.findOne({ role: ROLES.CTO });
      if (cto) {
        const ctoMeetings = await Meeting.find({
          creator_id: cto.telegram_id,
          time: { $gte: now.toDate() },
        });
        meetings = meetings.concat(ctoMeetings);
      }
    }

    // If user is CTO or team leader, get meetings from CEO
    if (user.role === ROLES.CTO || user.role === ROLES.TEAM_LEADER) {
      const ceo = await User.findOne({ role: ROLES.CEO });
      if (ceo) {
        const ceoMeetings = await Meeting.find({
          creator_id: ceo.telegram_id,
          time: { $gte: now.toDate() },
        });
        meetings = meetings.concat(ceoMeetings);
      }
    }

    // Get meetings created by the user themselves
    const ownMeetings = await Meeting.find({
      creator_id: chatId.toString(),
      time: { $gte: now.toDate() },
    });
    meetings = meetings.concat(ownMeetings);

    // Sort all meetings by time
    meetings.sort(
      (a, b) => moment(a.time).valueOf() - moment(b.time).valueOf()
    );

    if (meetings.length === 0) {
      bot.sendMessage(chatId, "You have no upcoming meetings.");
      return;
    }

    // Group meetings by date
    const meetingsByDate = {};
    for (const meeting of meetings) {
      const date = moment(meeting.time).format("YYYY-MM-DD");
      if (!meetingsByDate[date]) {
        meetingsByDate[date] = [];
      }
      meetingsByDate[date].push(meeting);
    }

    // Format message
    let message = "📅 *Your Upcoming Meetings*\n\n";

    for (const date in meetingsByDate) {
      const formattedDate = moment(date).format("dddd, MMMM D");
      message += `*${formattedDate}*\n`;

      for (const meeting of meetingsByDate[date]) {
        const time = moment(meeting.time).format("HH:mm");
        const creator = await getUserDisplayName(meeting.creator_id);
        const locationNames = {
          room1: "Large Meeting Room",
          room2: "Small Meeting Room",
        };

        message += `⏰ ${time}\n`;
        message += `📍 ${locationNames[meeting.location]}\n`;
        message += `👤 Organized by: ${creator}\n\n`;
      }
    }

    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Error fetching meetings:", err);
    bot.sendMessage(chatId, "Error retrieving your meetings.");
  }
});

// Add these functions for automated messages

// Function to send daily schedule
async function sendDailySchedule() {
  try {
    // Get all users
    const users = await User.find({});
    const today = moment().startOf("day");
    const tomorrow = moment().add(1, "day").startOf("day");

    for (const user of users) {
      try {
        // Get today's meetings for the user
        let meetings = new Set();

        // Get meetings from team leaders
        if (
          user.role === ROLES.USER &&
          user.team_leaders &&
          user.team_leaders.length > 0
        ) {
          const teamLeaderMeetings = await Meeting.find({
            creator_id: { $in: user.team_leaders },
            time: {
              $gte: today.toDate(),
              $lt: tomorrow.toDate(),
            },
          }).sort({ time: 1 });
          teamLeaderMeetings.forEach((meeting) => meetings.add(meeting));
        }

        // Get own meetings
        const ownMeetings = await Meeting.find({
          creator_id: user.telegram_id,
          time: {
            $gte: today.toDate(),
            $lt: tomorrow.toDate(),
          },
        });
        ownMeetings.forEach((meeting) => meetings.add(meeting));

        // If there are meetings, send schedule
        if (meetings.size > 0) {
          let message =
            "🌅 *Good morning! Here's your schedule for today:*\n\n";

          const sortedMeetings = Array.from(meetings).sort(
            (a, b) => moment(a.time).valueOf() - moment(b.time).valueOf()
          );

          for (const meeting of sortedMeetings) {
            const time = moment(meeting.time).format("HH:mm");
            const creator = await getUserDisplayName(meeting.creator_id);
            const locationNames = {
              room1: "Meeting Room 1",
              room2: "Meeting Room 2",
              conference: "Conference Room",
              online: "Online Meeting",
            };

            message += `⏰ ${time}\n`;
            message += `📍 ${locationNames[meeting.location]}\n`;
            message += `👤 Organized by: ${creator}\n\n`;
          }

          await bot.sendMessage(user.telegram_id, message, {
            parse_mode: "Markdown",
          });
        }
      } catch (err) {
        console.error(
          `Error sending daily schedule to ${user.telegram_id}:`,
          err
        );
      }
      // Add delay between messages
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (err) {
    console.error("Error in daily schedule:", err);
  }
}

// Function to send meeting reminders
async function sendMeetingReminders() {
  try {
    // Get meetings starting in the next 15 minutes
    const now = moment();
    const fifteenMinutesLater = moment().add(15, "minutes");

    const upcomingMeetings = await Meeting.find({
      time: {
        $gte: now.toDate(),
        $lt: fifteenMinutesLater.toDate(),
      },
    });

    for (const meeting of upcomingMeetings) {
      try {
        // Get all recipients for this meeting
        const creator = await User.findOne({ telegram_id: meeting.creator_id });
        let recipients = new Set();

        if (creator.role === ROLES.TEAM_LEADER) {
          const teamMembers = await User.find({
            team_leaders: { $in: [creator.telegram_id] },
          });
          teamMembers.forEach((member) => recipients.add(member));
        } else if (creator.role === ROLES.CTO) {
          const teamLeaders = await User.find({ role: ROLES.TEAM_LEADER });
          teamLeaders.forEach((tl) => recipients.add(tl));
        } else if (creator.role === ROLES.CEO) {
          const allUsers = await User.find({});
          allUsers.forEach((u) => recipients.add(u));
        }

        // Add creator to recipients
        recipients.add(creator);

        const locationNames = {
          room1: "Meeting Room 1",
          room2: "Meeting Room 2",
          conference: "Conference Room",
          online: "Online Meeting",
        };

        const creatorName = await getUserDisplayName(meeting.creator_id);
        const meetingTime = moment(meeting.time).format("HH:mm");

        const message =
          `⚠️ *Meeting Reminder*\n\n` +
          `Meeting starts in 15 minutes!\n\n` +
          `⏰ Time: ${meetingTime}\n` +
          `📍 Location: ${locationNames[meeting.location]}\n` +
          `👤 Organized by: ${creatorName}`;

        // Send reminder to all recipients
        for (const recipient of recipients) {
          try {
            await bot.sendMessage(recipient.telegram_id, message, {
              parse_mode: "Markdown",
            });
          } catch (err) {
            console.error(
              `Failed to send reminder to ${recipient.telegram_id}:`,
              err
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (err) {
        console.error(`Error processing meeting ${meeting._id}:`, err);
      }
    }
  } catch (err) {
    console.error("Error in meeting reminders:", err);
  }
}

// Set up scheduled tasks (add this at the bottom of your file)
const schedule = require("node-schedule");

// Send daily schedule at 9:00 AM every day
schedule.scheduleJob("0 9 * * *", sendDailySchedule);

// Check for upcoming meetings every 5 minutes
schedule.scheduleJob("*/5 * * * *", sendMeetingReminders);

// Command to request vacation
bot.onText(/\/request_vacation/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user) {
      bot.sendMessage(chatId, "Please register first using /register");
      return;
    }

    // Initialize vacation request state
    global.vacationState = {
      user_id: chatId.toString(),
      step: "start_date",
    };

    bot.sendMessage(
      chatId,
      "Please enter the start date of your vacation (format: DD/MM/YYYY):"
    );
  } catch (err) {
    console.error("Error starting vacation request:", err);
    bot.sendMessage(chatId, "Error processing vacation request.");
  }
});

// Command to view my vacations
bot.onText(/\/my_vacations/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user) {
      bot.sendMessage(chatId, "Please register first using /register");
      return;
    }

    const currentYear = moment().year();
    const startOfYear = moment().startOf("year");
    const endOfYear = moment().endOf("year");

    const vacations = await Vacation.find({
      user_id: chatId.toString(),
      start_date: {
        $gte: startOfYear.toDate(),
        $lte: endOfYear.toDate(),
      },
    }).sort({ start_date: 1 });

    if (vacations.length === 0) {
      bot.sendMessage(chatId, "You have no vacations recorded for this year.");
      return;
    }

    let message = `🌴 *Your Vacations in ${currentYear}*\n\n`;
    let totalDays = 0;

    for (const vacation of vacations) {
      const startDate = moment(vacation.start_date);
      const endDate = moment(vacation.end_date);
      const days = endDate.diff(startDate, "days") + 1;
      totalDays += days;

      message += `📅 ${startDate.format("DD/MM/YYYY")} - ${endDate.format(
        "DD/MM/YYYY"
      )}\n`;
      message += `📝 Reason: ${vacation.reason}\n`;
      message += `✨ Status: ${vacation.status.toUpperCase()}\n`;
      message += `📊 Duration: ${days} days\n\n`;
    }

    message += `Total vacation days this year: ${totalDays} days`;
    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Error fetching vacations:", err);
    bot.sendMessage(chatId, "Error retrieving your vacations.");
  }
});

// Add to your message handler for vacation request flow
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (
    !global.vacationState ||
    global.vacationState.user_id !== chatId.toString()
  ) {
    return;
  }

  try {
    switch (global.vacationState.step) {
      case "start_date":
        const startDate = moment(msg.text, "DD/MM/YYYY", true);
        if (!startDate.isValid()) {
          bot.sendMessage(chatId, "Invalid date format. Please use DD/MM/YYYY");
          return;
        }

        if (startDate.isBefore(moment(), "day")) {
          bot.sendMessage(
            chatId,
            "Start date cannot be in the past. Please enter a future date."
          );
          return;
        }

        global.vacationState.start_date = startDate.toDate();
        global.vacationState.step = "end_date";
        bot.sendMessage(
          chatId,
          "Please enter the end date of your vacation (format: DD/MM/YYYY):"
        );
        break;

      case "end_date":
        const endDate = moment(msg.text, "DD/MM/YYYY", true);
        if (!endDate.isValid()) {
          bot.sendMessage(chatId, "Invalid date format. Please use DD/MM/YYYY");
          return;
        }

        if (endDate.isBefore(moment(global.vacationState.start_date))) {
          bot.sendMessage(chatId, "End date cannot be before start date.");
          return;
        }

        global.vacationState.end_date = endDate.toDate();
        global.vacationState.step = "reason";
        bot.sendMessage(chatId, "Please enter the reason for your vacation:");
        break;

      case "reason":
        const reason = msg.text;
        if (reason.length < 3) {
          bot.sendMessage(chatId, "Please provide a more detailed reason.");
          return;
        }

        // Create vacation request
        const vacation = new Vacation({
          user_id: chatId.toString(),
          start_date: global.vacationState.start_date,
          end_date: global.vacationState.end_date,
          reason: reason,
        });
        await vacation.save();

        // Notify team leaders
        const user = await User.findOne({ telegram_id: chatId.toString() });
        if (user.team_leaders && user.team_leaders.length > 0) {
          const userName = await getUserDisplayName(chatId);
          const startDate = moment(global.vacationState.start_date).format(
            "DD/MM/YYYY"
          );
          const endDate = moment(global.vacationState.end_date).format(
            "DD/MM/YYYY"
          );
          const days =
            moment(global.vacationState.end_date).diff(
              moment(global.vacationState.start_date),
              "days"
            ) + 1;

          const notificationMessage =
            `🏖 *Vacation Request*\n\n` +
            `From: ${userName}\n` +
            `📅 Period: ${startDate} - ${endDate}\n` +
            `📊 Duration: ${days} days\n` +
            `📝 Reason: ${reason}\n\n` +
            `Please approve or reject this request:`;

          for (const leaderId of user.team_leaders) {
            try {
              await bot.sendMessage(leaderId, notificationMessage, {
                parse_mode: "Markdown",
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "✅ Approve",
                        callback_data: `vacation_approve_${vacation._id}`,
                      },
                      {
                        text: "❌ Reject",
                        callback_data: `vacation_reject_${vacation._id}`,
                      },
                    ],
                  ],
                },
              });
            } catch (err) {
              console.error(`Failed to notify team leader ${leaderId}:`, err);
            }
          }
        }

        bot.sendMessage(
          chatId,
          "✅ Your vacation request has been submitted and your team leaders have been notified. You'll receive an update once it's reviewed."
        );

        // Clear vacation state
        delete global.vacationState;
        break;
    }
  } catch (err) {
    console.error("Error processing vacation request:", err);
    bot.sendMessage(chatId, "Error processing your request. Please try again.");
    delete global.vacationState;
  }
});

// Add to your callback query handler for vacation approvals/rejections
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith("vacation_")) {
    const [action, status, vacationId] = data.split("_");
    try {
      const vacation = await Vacation.findById(vacationId);
      if (!vacation) {
        bot.answerCallbackQuery(
          callbackQuery.id,
          "Vacation request not found."
        );
        return;
      }

      // Handle approval or rejection
      if (action === "approve") {
        vacation.status = "approved";
        await vacation.save();
        bot.answerCallbackQuery(callbackQuery.id, "Vacation request approved!");
      } else if (action === "reject") {
        vacation.status = "rejected";
        await vacation.save();
        bot.answerCallbackQuery(callbackQuery.id, "Vacation request rejected.");
      } else {
        bot.answerCallbackQuery(callbackQuery.id, "Invalid action.");
      }
    } catch (err) {
      console.error(`Error handling vacation callback:`, err);
      bot.answerCallbackQuery(
        callbackQuery.id,
        "Error processing vacation request."
      );
    }
  }
});

// Command to cancel vacation request
bot.onText(/\/cancel_vacation/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const pendingVacations = await Vacation.find({
      user_id: chatId.toString(),
      status: "pending",
    });

    if (pendingVacations.length === 0) {
      bot.sendMessage(
        chatId,
        "You have no pending vacation requests to cancel."
      );
      return;
    }

    const keyboard = {
      inline_keyboard: pendingVacations.map((vacation) => [
        {
          text: `${moment(vacation.start_date).format("DD/MM/YYYY")} - ${moment(
            vacation.end_date
          ).format("DD/MM/YYYY")}`,
          callback_data: `cancel_vacation_${vacation._id}`,
        },
      ]),
    };

    bot.sendMessage(chatId, "Select the vacation request you want to cancel:", {
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error("Error listing vacations to cancel:", err);
    bot.sendMessage(chatId, "Error processing your request.");
  }
});

// Add to your existing callback query handler
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  // Handle vacation cancellation
  if (data.startsWith("cancel_vacation_")) {
    try {
      const vacationId = data.split("_")[2];
      const vacation = await Vacation.findOne({ _id: vacationId });

      if (!vacation) {
        await bot.answerCallbackQuery(
          callbackQuery.id,
          "Vacation request not found."
        );
        return;
      }

      if (vacation.status !== "pending") {
        await bot.answerCallbackQuery(
          callbackQuery.id,
          "Only pending vacation requests can be cancelled."
        );
        return;
      }

      // Delete the vacation request
      await Vacation.deleteOne({ _id: vacationId });

      // Get user info for notifications
      const user = await User.findOne({ telegram_id: chatId.toString() });
      const userName = await getUserDisplayName(chatId);

      // Notify team leaders
      if (user.team_leaders && user.team_leaders.length > 0) {
        const notificationMessage =
          `❌ *Vacation Request Cancelled*\n\n` +
          `${userName} has cancelled their vacation request:\n` +
          `📅 ${moment(vacation.start_date).format("DD/MM/YYYY")} - ${moment(
            vacation.end_date
          ).format("DD/MM/YYYY")}`;

        for (const leaderId of user.team_leaders) {
          try {
            await bot.sendMessage(leaderId, notificationMessage, {
              parse_mode: "Markdown",
            });
          } catch (err) {
            console.error(`Failed to notify team leader ${leaderId}:`, err);
          }
        }
      }

      // Update the message to show cancellation
      await bot.editMessageText("✅ Vacation request cancelled successfully.", {
        chat_id: chatId,
        message_id: msg.message_id,
      });

      await bot.answerCallbackQuery(
        callbackQuery.id,
        "Vacation request cancelled successfully"
      );
    } catch (err) {
      console.error("Error cancelling vacation:", err);
      await bot.answerCallbackQuery(
        callbackQuery.id,
        "Error cancelling vacation request."
      );
    }
  }
});

// Command to request a day off
bot.onText(/\/request_dayoff/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user) {
      bot.sendMessage(chatId, "Please register first using /register");
      return;
    }

    // Initialize day off request state
    global.dayOffState = {
      user_id: chatId.toString(),
      step: "date",
    };

    // Generate keyboard with next 7 days
    const keyboard = {
      inline_keyboard: [],
    };

    // Add today if it's before work hours (e.g., before 9 AM)
    const now = moment();
    if (now.hour() < 9) {
      keyboard.inline_keyboard.push([
        {
          text: `Today (${now.format("DD/MM")})`,
          callback_data: `dayoff_date_${now.format("YYYY-MM-DD")}`,
        },
      ]);
    }

    // Add next 7 days
    for (let i = 1; i <= 7; i++) {
      const date = moment().add(i, "days");
      keyboard.inline_keyboard.push([
        {
          text: `${date.format("dddd")} (${date.format("DD/MM")})`,
          callback_data: `dayoff_date_${date.format("YYYY-MM-DD")}`,
        },
      ]);
    }

    bot.sendMessage(chatId, "📅 Select the date for your day off:", {
      reply_markup: keyboard,
    });
  } catch (err) {
    console.error("Error starting day off request:", err);
    bot.sendMessage(chatId, "Error processing day off request.");
  }
});

// Add to your callback query handler
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  // Handle day off date selection
  if (data.startsWith("dayoff_date_")) {
    try {
      const selectedDate = data.split("_")[2];

      // Store the selected date in global state
      if (!global.dayOffState) {
        global.dayOffState = {};
      }

      global.dayOffState = {
        user_id: chatId.toString(),
        date: selectedDate,
        step: "reason",
      };

      await bot.editMessageText(
        "📝 Please reply with the reason for your day off:",
        {
          chat_id: chatId,
          message_id: msg.message_id,
        }
      );

      await bot.answerCallbackQuery(callbackQuery.id);
    } catch (err) {
      console.error("Error processing day off date:", err);
      bot.answerCallbackQuery(
        callbackQuery.id,
        "Error processing your selection."
      );
    }
  }

  // ... rest of your callback handlers ...
});

// Add to your message handler
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (!global.dayOffState || global.dayOffState.user_id !== chatId.toString()) {
    return;
  }

  if (global.dayOffState.step === "reason") {
    try {
      const reason = msg.text;
      if (!reason || reason.length < 3) {
        bot.sendMessage(
          chatId,
          "Please provide a more detailed reason (at least 3 characters)."
        );
        return;
      }

      // Create day off request
      const dayOff = new DayOff({
        user_id: chatId.toString(),
        date: moment(global.dayOffState.date).toDate(),
        reason: reason,
      });
      await dayOff.save();

      // Notify team leaders
      const user = await User.findOne({ telegram_id: chatId.toString() });
      if (user.team_leaders && user.team_leaders.length > 0) {
        const userName = await getUserDisplayName(chatId);
        const notificationMessage =
          `🌟 *Day Off Request*\n\n` +
          `From: ${userName}\n` +
          `📅 Date: ${moment(global.dayOffState.date).format(
            "DD/MM/YYYY"
          )} (${moment(global.dayOffState.date).format("dddd")})\n` +
          `📝 Reason: ${reason}\n\n` +
          `Please approve or reject this request:`;

        for (const leaderId of user.team_leaders) {
          try {
            await bot.sendMessage(leaderId, notificationMessage, {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "✅ Approve",
                      callback_data: `dayoff_approve_${dayOff._id}`,
                    },
                    {
                      text: "❌ Reject",
                      callback_data: `dayoff_reject_${dayOff._id}`,
                    },
                  ],
                ],
              },
            });
          } catch (err) {
            console.error(`Failed to notify team leader ${leaderId}:`, err);
          }
        }
      }

      bot.sendMessage(
        chatId,
        "✅ Your day off request has been submitted and your team leaders have been notified. You'll receive an update once it's reviewed."
      );

      // Clear day off state
      delete global.dayOffState;
    } catch (err) {
      console.error("Error processing day off request:", err);
      bot.sendMessage(
        chatId,
        "Error processing your request. Please try again."
      );
      delete global.dayOffState;
    }
  }
});

// Update the callback query handler to properly handle day off cancellation
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  // Handle day off cancellation
  if (data.startsWith("cancel_dayoff_")) {
    try {
      const dayOffId = data.split("_")[2];
      const dayOff = await DayOff.findOne({ _id: dayOffId });

      if (!dayOff) {
        await bot.answerCallbackQuery(
          callbackQuery.id,
          "Day off request not found."
        );
        return;
      }

      // Check if the day off is in the past
      if (moment(dayOff.date).isBefore(moment(), "day")) {
        await bot.answerCallbackQuery(
          callbackQuery.id,
          "Cannot cancel past day offs."
        );
        return;
      }

      // Check if the status is either pending or approved
      if (!["pending", "approved"].includes(dayOff.status)) {
        await bot.answerCallbackQuery(
          callbackQuery.id,
          "This day off request cannot be cancelled."
        );
        return;
      }

      // Delete the day off request
      await DayOff.deleteOne({ _id: dayOffId });

      // Get user info for notifications
      const user = await User.findOne({ telegram_id: chatId.toString() });
      const userName = await getUserDisplayName(chatId);

      // Create notification message based on status
      const statusText =
        dayOff.status === "approved" ? "approved day off" : "day off request";

      // Notify team leaders
      if (user.team_leaders && user.team_leaders.length > 0) {
        const notificationMessage =
          `❌ *Day Off Cancellation*\n\n` +
          `${userName} has cancelled their ${statusText} for:\n` +
          `📅 ${moment(dayOff.date).format("DD/MM/YYYY")} (${moment(
            dayOff.date
          ).format("dddd")})\n` +
          `📝 Original reason: ${dayOff.reason}`;

        for (const leaderId of user.team_leaders) {
          try {
            await bot.sendMessage(leaderId, notificationMessage, {
              parse_mode: "Markdown",
            });
          } catch (err) {
            console.error(`Failed to notify team leader ${leaderId}:`, err);
          }
        }
      }

      // Update the message to show cancellation
      await bot.editMessageText(
        `✅ ${
          dayOff.status === "approved" ? "Approved day off" : "Day off request"
        } cancelled successfully.`,
        {
          chat_id: chatId,
          message_id: msg.message_id,
        }
      );

      await bot.answerCallbackQuery(
        callbackQuery.id,
        "Day off cancelled successfully"
      );
    } catch (err) {
      console.error("Error cancelling day off:", err);
      await bot.answerCallbackQuery(
        callbackQuery.id,
        "Error cancelling day off."
      );
    }
  }

  // Handle day off approval/rejection
  if (data.startsWith("dayoff_approve_") || data.startsWith("dayoff_reject_")) {
    try {
      const [action, status, dayOffId] = data.split("_");
      const dayOff = await DayOff.findById(dayOffId);

      if (!dayOff) {
        await bot.answerCallbackQuery(
          callbackQuery.id,
          "Day off request not found."
        );
        return;
      }

      dayOff.status = status;
      await dayOff.save();

      // Notify the employee
      const statusText = status === "approve" ? "approved" : "rejected";
      const emoji = status === "approve" ? "✅" : "❌";
      const teamLeader = await getUserDisplayName(chatId);

      const notificationMessage =
        `${emoji} Your day off request has been ${statusText}\n\n` +
        `📅 Date: ${moment(dayOff.date).format("DD/MM/YYYY")} (${moment(
          dayOff.date
        ).format("dddd")})\n` +
        `👤 Reviewed by: ${teamLeader}`;

      await bot.sendMessage(dayOff.user_id, notificationMessage);

      // Update the original message
      await bot.editMessageText(
        `${msg.text}\n\n${emoji} ${statusText.toUpperCase()} by ${teamLeader}`,
        {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: "Markdown",
        }
      );

      await bot.answerCallbackQuery(
        callbackQuery.id,
        `Day off request ${statusText}`
      );
    } catch (err) {
      console.error("Error processing day off response:", err);
      await bot.answerCallbackQuery(
        callbackQuery.id,
        "Error processing your response."
      );
    }
  }

  // ... rest of your existing callback handlers ...
});
// Command to view my day offs
bot.onText(/\/my_dayoffs/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user) {
      bot.sendMessage(chatId, "Please register first using /register");
      return;
    }

    const currentYear = moment().year();
    const startOfYear = moment().startOf("year");
    const endOfYear = moment().endOf("year");

    const dayOffs = await DayOff.find({
      user_id: chatId.toString(),
      date: {
        $gte: startOfYear.toDate(),
        $lte: endOfYear.toDate(),
      },
    }).sort({ date: 1 });

    if (dayOffs.length === 0) {
      bot.sendMessage(chatId, "You have no day offs recorded for this year.");
      return;
    }

    let message = `🌟 *Your Day Offs in ${currentYear}*\n\n`;

    for (const dayOff of dayOffs) {
      const date = moment(dayOff.date);
      message += `📅 ${date.format("DD/MM/YYYY")} (${date.format("dddd")})\n`;
      message += `📝 Reason: ${dayOff.reason}\n`;
      message += `✨ Status: ${dayOff.status.toUpperCase()}\n\n`;
    }

    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Error fetching day offs:", err);
    bot.sendMessage(chatId, "Error retrieving your day offs.");
  }
});

// Command to cancel day off
bot.onText(/\/cancel_dayoff/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    // Find day offs that are either pending or approved and not in the past
    const cancelableDayOffs = await DayOff.find({
      user_id: chatId.toString(),
      status: { $in: ["pending", "approved"] },
      date: { $gte: moment().startOf("day").toDate() },
    });

    if (cancelableDayOffs.length === 0) {
      bot.sendMessage(
        chatId,
        "You have no day off requests that can be cancelled. Note: Past day offs cannot be cancelled."
      );
      return;
    }

    const keyboard = {
      inline_keyboard: cancelableDayOffs.map((dayOff) => [
        {
          text: `${moment(dayOff.date).format("DD/MM/YYYY")} (${moment(
            dayOff.date
          ).format("dddd")}) - ${dayOff.status.toUpperCase()}`,
          callback_data: `cancel_dayoff_${dayOff._id}`,
        },
      ]),
    };

    bot.sendMessage(
      chatId,
      "Select the day off request you want to cancel:\n(You can cancel both pending and approved requests)",
      { reply_markup: keyboard }
    );
  } catch (err) {
    console.error("Error listing day offs to cancel:", err);
    bot.sendMessage(chatId, "Error processing your request.");
  }
});

// Command to view my salary
bot.onText(/\/my_salary/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user) {
      bot.sendMessage(chatId, "Please register first using /register");
      return;
    }

    // Get current month's salary
    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();

    const salary = await Salary.findOne({
      user_id: chatId.toString(),
      month: currentMonth,
      year: currentYear,
    });

    if (!salary) {
      bot.sendMessage(
        chatId,
        "No salary information available for current month."
      );
      return;
    }

    // Calculate total with bonuses and deductions
    const totalBonuses = salary.bonuses.reduce(
      (sum, bonus) => sum + bonus.amount,
      0
    );
    const totalDeductions = salary.deductions.reduce(
      (sum, deduction) => sum + deduction.amount,
      0
    );
    const netSalary = salary.base_salary + totalBonuses - totalDeductions;

    let message = `💰 *Salary Information - ${moment().format(
      "MMMM YYYY"
    )}*\n\n`;
    message += `Base Salary: $${salary.base_salary}\n\n`;

    if (salary.bonuses.length > 0) {
      message += `*Bonuses:*\n`;
      salary.bonuses.forEach((bonus) => {
        message += `➕ $${bonus.amount} - ${bonus.reason}\n`;
      });
      message += `\n`;
    }

    if (salary.deductions.length > 0) {
      message += `*Deductions:*\n`;
      salary.deductions.forEach((deduction) => {
        message += `➖ $${deduction.amount} - ${deduction.reason}\n`;
      });
      message += `\n`;
    }

    message += `*Net Salary: $${netSalary}*\n`;
    message += `Status: ${salary.status.toUpperCase()}`;

    if (salary.payment_date) {
      message += `\nPayment Date: ${moment(salary.payment_date).format(
        "DD/MM/YYYY"
      )}`;
    }

    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Error fetching salary:", err);
    bot.sendMessage(chatId, "Error retrieving salary information.");
  }
});

// Command to view salary history
bot.onText(/\/salary_history/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user) {
      bot.sendMessage(chatId, "Please register first using /register");
      return;
    }

    // Get last 6 months of salary history
    const sixMonthsAgo = moment().subtract(6, "months");

    const salaryHistory = await Salary.find({
      user_id: chatId.toString(),
      created_at: { $gte: sixMonthsAgo.toDate() },
    }).sort({ year: -1, month: -1 });

    if (salaryHistory.length === 0) {
      bot.sendMessage(chatId, "No salary history available.");
      return;
    }

    let message = `📊 *Salary History (Last 6 months)*\n\n`;

    for (const salary of salaryHistory) {
      const totalBonuses = salary.bonuses.reduce(
        (sum, bonus) => sum + bonus.amount,
        0
      );
      const totalDeductions = salary.deductions.reduce(
        (sum, deduction) => sum + deduction.amount,
        0
      );
      const netSalary = salary.base_salary + totalBonuses - totalDeductions;

      message += `*${moment()
        .month(salary.month - 1)
        .format("MMMM")} ${salary.year}*\n`;
      message += `Net Salary: $${netSalary}\n`;
      message += `Status: ${salary.status.toUpperCase()}\n\n`;
    }

    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Error fetching salary history:", err);
    bot.sendMessage(chatId, "Error retrieving salary history.");
  }
});

// Command to view detailed salary for a specific month (for managers)
bot.onText(/\/team_salaries/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user || user.role === ROLES.USER) {
      bot.sendMessage(
        chatId,
        "Only team leaders and above can view team salaries."
      );
      return;
    }

    // Get team members based on role
    let teamMembers = [];
    if (user.role === ROLES.TEAM_LEADER) {
      teamMembers = await User.find({ team_leaders: chatId.toString() });
    } else if (user.role === ROLES.CTO) {
      const teamLeaders = await User.find({ role: ROLES.TEAM_LEADER });
      teamMembers = await User.find({
        team_leaders: { $in: teamLeaders.map((tl) => tl.telegram_id) },
      });
    }

    const currentMonth = moment().month() + 1;
    const currentYear = moment().year();

    let message = `👥 *Team Salaries - ${moment().format("MMMM YYYY")}*\n\n`;

    for (const member of teamMembers) {
      const salary = await Salary.findOne({
        user_id: member.telegram_id,
        month: currentMonth,
        year: currentYear,
      });

      if (salary) {
        const totalBonuses = salary.bonuses.reduce(
          (sum, bonus) => sum + bonus.amount,
          0
        );
        const totalDeductions = salary.deductions.reduce(
          (sum, deduction) => sum + deduction.amount,
          0
        );
        const netSalary = salary.base_salary + totalBonuses - totalDeductions;

        const memberName = await getUserDisplayName(member.telegram_id);
        message += `*${memberName}*\n`;
        message += `Base: $${salary.base_salary}\n`;
        message += `Net: $${netSalary}\n`;
        message += `Status: ${salary.status.toUpperCase()}\n\n`;
      }
    }

    bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Error fetching team salaries:", err);
    bot.sendMessage(chatId, "Error retrieving team salaries.");
  }
});

// Command to export calendar
bot.onText(/\/export_calendar/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user) {
      bot.sendMessage(chatId, "Please register first using /register");
      return;
    }

    // Create new calendar
    const calendar = new ICal({
      name: "Office Calendar",
      timezone: "Asia/Bangkok",
    });

    // Add all events (same as before)
    const meetings = await Meeting.find({
      $or: [
        { creator_id: chatId.toString() },
        { participants: chatId.toString() },
      ],
    });

    meetings.forEach((meeting) => {
      calendar.createEvent({
        start: moment(meeting.time).toDate(),
        end: moment(meeting.time).add(1, "hour").toDate(),
        summary: `Meeting: ${meeting.location}`,
        description: meeting.description || "Team meeting",
        location: meeting.location,
      });
    });

    const vacations = await Vacation.find({
      user_id: chatId.toString(),
      status: "approved",
    });

    vacations.forEach((vacation) => {
      calendar.createEvent({
        start: moment(vacation.start_date).toDate(),
        end: moment(vacation.end_date).add(1, "day").toDate(),
        summary: "Vacation",
        description: vacation.reason,
        allDay: true,
      });
    });

    const dayOffs = await DayOff.find({
      user_id: chatId.toString(),
      status: "approved",
    });

    dayOffs.forEach((dayOff) => {
      calendar.createEvent({
        start: moment(dayOff.date).toDate(),
        end: moment(dayOff.date).add(1, "day").toDate(),
        summary: "Day Off",
        description: dayOff.reason,
        allDay: true,
      });
    });

    // Generate calendar file
    const calendarData = calendar.toString();
    const fileName = `calendar_${moment().format("YYYY-MM-DD")}.ics`;
    const filePath = path.join(__dirname, fileName);

    // Write to temporary file
    fs.writeFileSync(filePath, calendarData);

    // Send file
    await bot.sendDocument(chatId, filePath, {
      caption:
        "📅 Your calendar export is ready. Import this file into your preferred calendar app.",
    });

    // Delete temporary file
    fs.unlinkSync(filePath);

    bot.sendMessage(
      chatId,
      `✅ Calendar export includes:\n` +
        `- ${meetings.length} meetings\n` +
        `- ${vacations.length} vacations\n` +
        `- ${dayOffs.length} day offs\n\n` +
        `Import the .ics file into your calendar app to view all events.`
    );
  } catch (err) {
    console.error("Error exporting calendar:", err);
    bot.sendMessage(
      chatId,
      "❌ Error generating calendar export. Please try again later."
    );
  }
});

// Command to view absences
bot.onText(/\/absences/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user) {
      bot.sendMessage(chatId, "Please register first using /register");
      return;
    }

    // Different views based on role
    if (user.role === "teamleader") {
      // Team leaders see their team's absences
      const teamAbsences = await Absence.find({
        user_id: { $ne: chatId.toString() }, // Exclude team leader's own absences
        status: { $in: ["pending", "approved"] },
      })
        .sort({ start_time: -1 })
        .limit(10); // Get last 10 absences

      if (teamAbsences.length === 0) {
        bot.sendMessage(chatId, "No absences found for your team.");
        return;
      }

      let message = "🗓 *Recent Team Absences:*\n\n";
      for (const absence of teamAbsences) {
        const userName = await getUserDisplayName(absence.user_id);
        const startTime = moment(absence.start_time).format("DD/MM HH:mm");
        const endTime = moment(absence.end_time).format("DD/MM HH:mm");
        const status = absence.status === "pending" ? "⏳" : "✅";

        message += `*${userName}*\n`;
        message += `${startTime} - ${endTime}\n`;
        message += `Reason: ${absence.reason}\n`;
        message += `Status: ${status} ${absence.status}\n\n`;
      }

      bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
    } else {
      // Regular users see their own absences
      const userAbsences = await Absence.find({
        user_id: chatId.toString(),
      })
        .sort({ start_time: -1 })
        .limit(5); // Get last 5 absences

      if (userAbsences.length === 0) {
        bot.sendMessage(chatId, "You have no recorded absences.");
        return;
      }

      let message = "🗓 *Your Recent Absences:*\n\n";
      for (const absence of userAbsences) {
        const startTime = moment(absence.start_time).format("DD/MM HH:mm");
        const endTime = moment(absence.end_time).format("DD/MM HH:mm");
        const statusEmoji = {
          pending: "⏳",
          approved: "✅",
          denied: "❌",
        }[absence.status];

        message += `*${startTime} - ${endTime}*\n`;
        message += `Reason: ${absence.reason}\n`;
        message += `Status: ${statusEmoji} ${absence.status}\n\n`;
      }

      // Add pagination or filter options
      const opts = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "View More", callback_data: "absences_more" },
              { text: "Filter", callback_data: "absences_filter" },
            ],
          ],
        },
        parse_mode: "Markdown",
      };

      bot.sendMessage(chatId, message, opts);
    }
  } catch (err) {
    console.error("Error fetching absences:", err);
    bot.sendMessage(chatId, "Error fetching absences. Please try again.");
  }
});

// Handle "View More" callback
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data === "absences_more") {
    try {
      const skip = parseInt(data.split("_")[2] || 0);
      const userAbsences = await Absence.find({
        user_id: chatId.toString(),
      })
        .sort({ start_time: -1 })
        .skip(skip)
        .limit(5);

      if (userAbsences.length === 0) {
        bot.answerCallbackQuery(callbackQuery.id, "No more absences to show");
        return;
      }

      let message = "🗓 *More Absences:*\n\n";
      for (const absence of userAbsences) {
        const startTime = moment(absence.start_time).format("DD/MM HH:mm");
        const endTime = moment(absence.end_time).format("DD/MM HH:mm");
        const statusEmoji = {
          pending: "⏳",
          approved: "✅",
          denied: "❌",
        }[absence.status];

        message += `*${startTime} - ${endTime}*\n`;
        message += `Reason: ${absence.reason}\n`;
        message += `Status: ${statusEmoji} ${absence.status}\n\n`;
      }

      const opts = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "View More",
                callback_data: `absences_more_${skip + 5}`,
              },
              {
                text: "Filter",
                callback_data: "absences_filter",
              },
            ],
          ],
        },
        parse_mode: "Markdown",
      };

      bot.editMessageText(message, {
        chat_id: chatId,
        message_id: msg.message_id,
        ...opts,
      });
    } catch (err) {
      console.error("Error fetching more absences:", err);
      bot.answerCallbackQuery(callbackQuery.id, "Error fetching more absences");
    }
  }

  if (data === "absences_filter") {
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "All", callback_data: "filter_all" },
            { text: "Pending", callback_data: "filter_pending" },
            { text: "Approved", callback_data: "filter_approved" },
          ],
          [
            { text: "This Week", callback_data: "filter_week" },
            { text: "This Month", callback_data: "filter_month" },
          ],
        ],
      },
    };

    bot.editMessageText("Choose filter:", {
      chat_id: chatId,
      message_id: msg.message_id,
      ...opts,
    });
  }
});

// Add inline query handler
bot.on("inline_query", async (query) => {
  const inlineQueryId = query.id;
  const searchText = query.query.toLowerCase();
  const userId = query.from.id.toString();

  try {
    // Check if user is registered
    const user = await User.findOne({ telegram_id: userId });
    if (!user) {
      return bot.answerInlineQuery(inlineQueryId, [
        {
          type: "article",
          id: "not_registered",
          title: "⚠️ Not Registered",
          description: "You need to register first using /register",
          input_message_content: {
            message_text:
              "Please register with the bot first using /register command",
          },
        },
      ]);
    }

    // If no search text, show default options
    if (!searchText) {
      return bot.answerInlineQuery(inlineQueryId, [
        {
          type: "article",
          id: "absence",
          title: "🚶 Request Absence",
          description: "Create a new absence request",
          input_message_content: {
            message_text: "Use /absence command to request an absence",
          },
        },
        {
          type: "article",
          id: "dayoff",
          title: "📅 Request Day Off",
          description: "Request a day off",
          input_message_content: {
            message_text: "Use /request_dayoff command to request a day off",
          },
        },
        {
          type: "article",
          id: "vacation",
          title: "🏖 Request Vacation",
          description: "Request a vacation",
          input_message_content: {
            message_text: "Use /request_vacation command to request a vacation",
          },
        },
      ]);
    }

    const results = [];

    // Search meetings
    if ("meeting".includes(searchText)) {
      const meetings = await Meeting.find({
        $or: [{ creator_id: userId }, { participants: userId }],
        time: { $gte: new Date() },
      }).limit(5);

      meetings.forEach((meeting) => {
        results.push({
          type: "article",
          id: `meeting_${meeting._id}`,
          title: `📅 Meeting: ${moment(meeting.time).format("DD/MM HH:mm")}`,
          description: `Location: ${meeting.location}`,
          input_message_content: {
            message_text: `*Meeting Details*\n📅 ${moment(meeting.time).format("DD/MM/YYYY HH:mm")}\n📍 ${meeting.location}`,
            parse_mode: "Markdown",
          },
        });
      });
    }

    // Search absences
    if ("absence".includes(searchText)) {
      const absences = await Absence.find({
        user_id: userId,
        status: "approved",
        end_time: { $gte: new Date() },
      }).limit(5);

      absences.forEach((absence) => {
        results.push({
          type: "article",
          id: `absence_${absence._id}`,
          title: `🚶 Absence: ${moment(absence.start_time).format("DD/MM HH:mm")}`,
          description: absence.reason,
          input_message_content: {
            message_text: `*Absence*\n⏰ ${moment(absence.start_time).format("DD/MM HH:mm")} - ${moment(absence.end_time).format("HH:mm")}\n📝 ${absence.reason}`,
            parse_mode: "Markdown",
          },
        });
      });
    }

    // Search team members (for team leaders only)
    if (user.role !== ROLES.USER && "team".includes(searchText)) {
      let teamMembers = [];
      if (user.role === ROLES.TEAM_LEADER) {
        teamMembers = await User.find({ team_leader_id: userId });
      } else if (user.role === ROLES.CTO) {
        teamMembers = await User.find({ role: ROLES.TEAM_LEADER });
      } else if (user.role === ROLES.CEO) {
        teamMembers = await User.find({
          role: { $in: [ROLES.CTO, ROLES.TEAM_LEADER] },
        });
      }

      for (const member of teamMembers) {
        const displayName = await getUserDisplayName(member.telegram_id);
        results.push({
          type: "article",
          id: `member_${member.telegram_id}`,
          title: `👤 ${displayName}`,
          description: `Role: ${member.role}`,
          input_message_content: {
            message_text: `*Team Member*\n👤 ${displayName}\n📋 Role: ${member.role}`,
            parse_mode: "Markdown",
          },
        });
      }
    }

    // If no results found
    if (results.length === 0) {
      results.push({
        type: "article",
        id: "no_results",
        title: "❌ No Results Found",
        description: "Try different search terms",
        input_message_content: {
          message_text: "No results found for your search",
        },
      });
    }

    return bot.answerInlineQuery(inlineQueryId, results);
  } catch (err) {
    console.error("Error handling inline query:", err);
    return bot.answerInlineQuery(inlineQueryId, [
      {
        type: "article",
        id: "error",
        title: "❌ Error",
        description: "An error occurred while processing your request",
        input_message_content: {
          message_text: "An error occurred. Please try again later.",
        },
      },
    ]);
  }
});

// Add inline keyboard handler for shared messages
bot.on("callback_query", async (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  // Handle inline message actions
  if (data.startsWith("view_")) {
    const [action, type, id] = data.split("_");

    try {
      switch (type) {
        case "meeting":
          const meeting = await Meeting.findById(id);
          if (meeting) {
            const creatorName = await getUserDisplayName(meeting.creator_id);
            const message =
              `*Meeting Details*\n` +
              `📅 ${moment(meeting.time).format("DD/MM/YYYY HH:mm")}\n` +
              `📍 ${meeting.location}\n` +
              `👤 Created by: ${creatorName}`;

            await bot.editMessageText(message, {
              chat_id: chatId,
              message_id: msg.message_id,
              parse_mode: "Markdown",
            });
          }
          break;

        case "absence":
          const absence = await Absence.findById(id);
          if (absence) {
            const userName = await getUserDisplayName(absence.user_id);
            const message =
              `*Absence Details*\n` +
              `👤 ${userName}\n` +
              `⏰ ${moment(absence.start_time).format("DD/MM HH:mm")} - ${moment(absence.end_time).format("HH:mm")}\n` +
              `📝 ${absence.reason}\n` +
              `✨ Status: ${absence.status.toUpperCase()}`;

            await bot.editMessageText(message, {
              chat_id: chatId,
              message_id: msg.message_id,
              parse_mode: "Markdown",
            });
          }
          break;
      }
    } catch (err) {
      console.error("Error handling inline action:", err);
      await bot.answerCallbackQuery(
        callbackQuery.id,
        "Error processing request"
      );
    }
  }
});

// Main performance review command
bot.onText(/\/performance_review/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });
    if (!user || !["teamleader", "cto", "ceo"].includes(user.role)) {
      bot.sendMessage(
        chatId,
        "Access denied. Only Team leaders, CTO, and CEO can access performance reviews."
      );
      return;
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: "➕ New Review", callback_data: "review_new" },
          { text: "📋 View Reviews", callback_data: "review_view" },
        ],
        [
          { text: "📊 Analytics", callback_data: "review_analytics" },
          { text: "📅 Schedule Reviews", callback_data: "review_schedule" },
        ],
        [
          { text: "🎯 Goals Tracking", callback_data: "review_goals" },
          { text: "📝 Templates", callback_data: "review_templates" },
        ],
      ],
    };

    bot.sendMessage(
      chatId,
      "*Performance Review Management*\n\n" +
        "Select an action to manage employee performance reviews:",
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
  } catch (err) {
    console.error("Error in performance review:", err);
    bot.sendMessage(chatId, "Error accessing performance review system.");
  }
});

// Handle new review creation
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data === "review_new") {
    try {
      // Initialize review state
      global.reviewState = {
        step: "select_employee",
        chatId: chatId,
      };

      // Get list of employees under the reviewer
      const user = await User.findOne({ telegram_id: chatId.toString() });
      let employees = [];

      if (user.role === "HR") {
        employees = await User.find({ role: { $ne: "HR" } });
      } else {
        employees = await User.find({ team_leader_id: chatId.toString() });
      }

      // Create keyboard with proper array of arrays structure
      const keyboard = {
        inline_keyboard: await Promise.all(
          employees.map(async (emp) => {
            const displayName = await getUserDisplayName(emp.telegram_id);
            return [
              {
                // Note the array wrapper here
                text: displayName,
                callback_data: `review_employee_${emp.telegram_id}`,
              },
            ];
          })
        ),
      };

      await bot.editMessageText(
        "*New Performance Review*\n\n" + "Select an employee to review:",
        {
          chat_id: chatId,
          message_id: msg.message_id,
          parse_mode: "Markdown",
          reply_markup: keyboard,
        }
      );

      await bot.answerCallbackQuery(callbackQuery.id);
    } catch (err) {
      console.error("Error creating new review:", err);
      bot.answerCallbackQuery(callbackQuery.id, "Error creating new review");
    }
  }
});

// Handle review analytics
bot.on("callback_query", async (callbackQuery) => {
  if (callbackQuery.data === "review_analytics") {
    const chatId = callbackQuery.message.chat.id;
    try {
      const reviews = await PerformanceReview.find({
        review_date: {
          $gte: moment().subtract(6, "months").toDate(),
        },
      });

      // Calculate average ratings
      const avgRatings = {
        performance: 0,
        attendance: 0,
        teamwork: 0,
        communication: 0,
        initiative: 0,
      };

      reviews.forEach((review) => {
        Object.keys(avgRatings).forEach((key) => {
          avgRatings[key] += review.ratings[key];
        });
      });

      Object.keys(avgRatings).forEach((key) => {
        avgRatings[key] = (avgRatings[key] / reviews.length).toFixed(1);
      });

      const message =
        "*Performance Analytics (Last 6 Months)*\n\n" +
        `Total Reviews: ${reviews.length}\n` +
        `Average Ratings:\n` +
        `- Performance: ${avgRatings.performance}⭐️\n` +
        `- Attendance: ${avgRatings.attendance}⭐️\n` +
        `- Teamwork: ${avgRatings.teamwork}⭐️\n` +
        `- Communication: ${avgRatings.communication}⭐️\n` +
        `- Initiative: ${avgRatings.initiative}⭐️\n\n` +
        "Select an option for detailed analysis:";

      const keyboard = {
        inline_keyboard: [
          [
            { text: "📊 Detailed Stats", callback_data: "analytics_detailed" },
            { text: "📈 Trends", callback_data: "analytics_trends" },
          ],
          [
            { text: "🎯 Goals Progress", callback_data: "analytics_goals" },
            { text: "📑 Export Report", callback_data: "analytics_export" },
          ],
        ],
      };

      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id,
        parse_mode: "Markdown",
        reply_markup: keyboard,
      });
    } catch (err) {
      console.error("Error generating analytics:", err);
      bot.answerCallbackQuery(callbackQuery.id, "Error generating analytics");
    }
  }
});

// Handle /feedback command
bot.onText(/\/feedback/, (msg) => {
  const chatId = msg.chat.id;

  // Ask for the audience
  bot.sendMessage(chatId, "Who is the audience for your feedback?", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Team Leader", callback_data: "audience_team_leader" },
          { text: "HR", callback_data: "audience_hr" },
        ],
      ],
    },
  });
});

// Handle callback queries for audience selection
bot.on("callback_query", (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;
  const data = callbackQuery.data;

  if (data === "audience_team_leader" || data === "audience_hr") {
    const audience = data === "audience_team_leader" ? "Team Leader" : "HR";

    // Ask if the feedback is anonymous
    bot.sendMessage(chatId, "Do you want to send the feedback anonymously?", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Yes", callback_data: `anonymous_yes_${audience}` },
            { text: "No", callback_data: `anonymous_no_${audience}` },
          ],
        ],
      },
    });
  } else if (data.startsWith("anonymous_yes_") || data.startsWith("anonymous_no_")) {
    const isAnonymous = data.startsWith("anonymous_yes_");
    const audience = data.split("_").pop();

    // Ask for the feedback message
    bot.sendMessage(chatId, `Please type your feedback for the ${audience}:`);

    // Listen for the feedback message
    bot.once("message", (feedbackMsg) => {
      const feedback = feedbackMsg.text;
      const sender = isAnonymous ? "Anonymous" : feedbackMsg.from.username;

      // Process the feedback (e.g., save to database, send to audience, etc.)
      console.log(`Feedback from ${sender} to ${audience}: ${feedback}`);

      // Acknowledge the feedback
      bot.sendMessage(chatId, "Thank you for your feedback!");
    });
  }
});
   