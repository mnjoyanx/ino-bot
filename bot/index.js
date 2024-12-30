// Required dependencies
const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const moment = require("moment");

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
  created_at: { type: Date, default: Date.now },
});

// Create models
const User = mongoose.model("User", UserSchema);
const Absence = mongoose.model("Absence", AbsenceSchema);
const ApprovalRequirement = mongoose.model(
  "ApprovalRequirement",
  ApprovalRequirementSchema
);

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
      bot.sendMessage(chatId, "You have been registered successfully.");
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
    const [, type, id] = data.split("_");

    try {
      const teamMembers = await User.find({
        team_leader_id: chatId.toString(),
      });

      // Create buttons with usernames
      const keyboardButtons = [
        [{ text: "Whole Team", callback_data: "approve_req_team_all" }],
        ...(await Promise.all(
          teamMembers.map(async (member) => {
            const chatMember = await bot.getChatMember(
              member.telegram_id,
              member.telegram_id
            );
            const username = chatMember.user.username
              ? `@${chatMember.user.username}`
              : member.telegram_id;
            const displayName = chatMember.user.first_name
              ? `${chatMember.user.first_name} (${username})`
              : username;

            return [
              {
                text: displayName,
                callback_data: `approve_req_user_${member.telegram_id}`,
              },
            ];
          })
        )),
      ];

      const opts = {
        reply_markup: {
          inline_keyboard: keyboardButtons,
        },
      };

      bot.sendMessage(
        chatId,
        "Please select who needs approval for absence:",
        opts
      );
    } catch (err) {
      bot.sendMessage(chatId, "Error saving approval requirement.");
      console.error(err);
    }
  }

  if (data.startsWith("approve_start_")) {
    const startTime = data.split("_")[2];
    try {
      const startMoment = moment(startTime, "HH:mm");
      await ApprovalRequirement.findOneAndUpdate(
        { team_leader_id: chatId.toString(), start_time: null },
        { start_time: startMoment.toDate() }
      );

      // Generate dynamic time slots for end time
      const timeSlots = generateTimeSlots(
        startMoment.toDate(),
        true,
        "approve_end"
      );

      const opts = {
        reply_markup: {
          inline_keyboard: timeSlots,
        },
      };

      bot.sendMessage(
        chatId,
        "Please select when approval requirement ends:",
        opts
      );
    } catch (err) {
      bot.sendMessage(chatId, "Error saving start time.");
      console.error(err);
    }
  }

  if (data.startsWith("approve_end_")) {
    const endTime = data.split("_")[2];
    try {
      const requirement = await ApprovalRequirement.findOneAndUpdate(
        { team_leader_id: chatId.toString(), end_time: null },
        { end_time: moment(endTime, "HH:mm").toDate() },
        { new: true }
      );

      if (requirement) {
        const formattedStart = moment(requirement.start_time).format("HH:mm");
        const formattedEnd = moment(requirement.end_time).format("HH:mm");

        let targetDisplay = "Whole Team";
        if (requirement.user_id) {
          try {
            const chatMember = await bot.getChatMember(
              requirement.user_id,
              requirement.user_id
            );
            const username = chatMember.user.username
              ? `@${chatMember.user.username}`
              : requirement.user_id;
            targetDisplay = chatMember.user.first_name
              ? `${chatMember.user.first_name} (${username})`
              : username;
          } catch (err) {
            targetDisplay = requirement.user_id;
          }
        }

        bot.sendMessage(
          chatId,
          `Approval requirement set:\nFor: ${targetDisplay}\nFrom: ${formattedStart}\nTo: ${formattedEnd}`
        );

        // Notify affected team members
        const usersToNotify = requirement.user_id
          ? [requirement.user_id]
          : (await User.find({ team_leader_id: chatId.toString() })).map(
              (user) => user.telegram_id
            );

        for (const userId of usersToNotify) {
          bot.sendMessage(
            userId,
            `Your team leader has set approval requirement for absences:\nFrom: ${formattedStart}\nTo: ${formattedEnd}\nDuring this time, you must get approval before leaving the building.`
          );
        }
      }
    } catch (err) {
      bot.sendMessage(chatId, "Error saving end time.");
      console.error(err);
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
        // Notify team leader
        bot.editMessageText(
          `Absence request APPROVED ✅\nUser: ${await getUserDisplayName(absence.user_id)}\nFrom: ${moment(absence.start_time).format("HH:mm")}\nTo: ${moment(absence.end_time).format("HH:mm")}\nReason: ${absence.reason}`,
          {
            chat_id: chatId,
            message_id: msg.message_id,
          }
        );

        // Notify user
        bot.sendMessage(
          absence.user_id,
          `Your absence request has been APPROVED ✅\nFrom: ${moment(absence.start_time).format("HH:mm")}\nTo: ${moment(absence.end_time).format("HH:mm")}\nReason: ${absence.reason}`
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
        // Notify team leader
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
          `Your absence request has been DENIED ❌\nFrom: ${moment(absence.start_time).format("HH:mm")}\nTo: ${moment(absence.end_time).format("HH:mm")}\nReason: ${absence.reason}`
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

    if (user.role === "teamleader") {
      bot.sendMessage(chatId, "Team leaders cannot use the /notify command.");
      return;
    }

    // Create a pending absence record
    const absence = new Absence({
      user_id: chatId.toString(),
      status: "pending",
    });
    await absence.save();

    // Prompt user to choose time selection method
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Now", callback_data: "time_now" },
            { text: "Write Time", callback_data: "time_write" },
            { text: "Select Time", callback_data: "time_select" },
          ],
        ],
      },
    };

    bot.sendMessage(
      chatId,
      "Please choose how to set your absence start time:",
      opts
    );
  } catch (err) {
    bot.sendMessage(chatId, "Error processing your request.");
    console.error(err);
  }
});

// Handle absence reason selection
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data.startsWith("notify_")) {
    const reason = data.split("_")[1];

    if (reason === "other") {
      bot.sendMessage(chatId, "Please write your reason:");
      // Set user state to waiting for reason
      // You'll need to implement state management
    } else {
      requestAbsenceTimes(chatId, reason);
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

// Update the requestAbsenceTimes function
async function requestAbsenceTimes(chatId, reason) {
  try {
    const absence = new Absence({
      user_id: chatId.toString(),
      reason: reason,
      status: "pending",
    });
    await absence.save();

    const timeSlots = generateTimeSlots(new Date());

    const opts = {
      reply_markup: {
        inline_keyboard: timeSlots,
      },
    };

    bot.sendMessage(chatId, "Please select your absence start time:", opts);
  } catch (err) {
    bot.sendMessage(chatId, "Error processing your request.");
    console.error(err);
  }
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

// Update the handleAbsenceConfirmation function to check status
async function handleAbsenceConfirmation(chatId, absence) {
  const formattedStart = moment(absence.start_time).format("HH:mm");
  const formattedEnd = moment(absence.end_time).format("HH:mm");

  // Only send the registration message if it's a new request
  if (absence.status === "pending") {
    bot.sendMessage(
      chatId,
      `Your absence has been registered:\nFrom: ${formattedStart}\nTo: ${formattedEnd}\nReason: ${absence.reason}\nStatus: Pending approval`
    );

    // Notify team leader with username if exists
    const user = await User.findOne({ telegram_id: absence.user_id });
    if (user && user.team_leader_id) {
      try {
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

        // Add approve/deny buttons
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
          user.team_leader_id,
          `New absence request:\nUser: ${displayName}\nFrom: ${formattedStart}\nTo: ${formattedEnd}\nReason: ${absence.reason}`,
          opts
        );
      } catch (err) {
        // Fallback to just user_id if can't get username
        bot.sendMessage(
          user.team_leader_id,
          `New absence request:\nUser: ${absence.user_id}\nFrom: ${formattedStart}\nTo: ${formattedEnd}\nReason: ${absence.reason}`
        );
      }
    }
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

  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Register as Team Lead",
            callback_data: "register_team_lead",
          },
          { text: "Register as User", callback_data: "register_user" },
        ],
      ],
    },
  };

  bot.sendMessage(chatId, "Please select your registration type:", opts);
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
    // Assign team to team lead
    const teamId = parseInt(data.split("_").pop());
    const team = teams.find((t) => t.id === teamId);

    if (team.lead) {
      bot.sendMessage(chatId, `The team ${team.name} already has a team lead.`);
    } else {
      team.lead = chatId;
      users.push({ id: chatId, role: "team_lead", team: teamId });
      bot.sendMessage(
        chatId,
        `You have been registered as the team lead for ${team.name}. Please set your username by typing /setusername <your_username>.`
      );
    }
  } else if (data === "register_user") {
    // Register as a regular user
    users.push({ id: chatId, role: "user", team: null });
    bot.sendMessage(
      chatId,
      "You have been registered as a user. Please set your username by typing /setusername <your_username>."
    );
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
          { text: "Write Time", callback_data: "time_write" },
        ],
      ],
    },
  };

  bot.sendMessage(chatId, "Please choose how to set the time:", opts);
});

// Start the bot
console.log("Bot is running...");

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

// Add a command to view pending requests for team leaders
bot.onText(/\/pending_requests/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });

    if (!user || user.role !== "teamleader") {
      bot.sendMessage(
        chatId,
        "This command is only available for team leaders."
      );
      return;
    }

    const pendingRequests = await Absence.find({
      status: "pending",
      user_id: {
        $in: (await User.find({ team_leader_id: chatId.toString() })).map(
          (u) => u.telegram_id
        ),
      },
    });

    if (pendingRequests.length === 0) {
      bot.sendMessage(chatId, "No pending requests.");
      return;
    }

    // Send each pending request with approve/deny buttons
    for (const absence of pendingRequests) {
      const displayName = await getUserDisplayName(absence.user_id);
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
        `Pending absence request:\nUser: ${displayName}\nFrom: ${moment(absence.start_time).format("HH:mm")}\nTo: ${moment(absence.end_time).format("HH:mm")}\nReason: ${absence.reason}`,
        opts
      );
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Error fetching pending requests.");
  }
});
