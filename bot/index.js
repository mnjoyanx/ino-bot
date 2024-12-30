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

const WifiStatusSchema = new mongoose.Schema({
  user_id: String,
  status: String,
  timestamp: { type: Date, default: Date.now },
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
const WifiStatus = mongoose.model("WifiStatus", WifiStatusSchema);
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

  if (data.startsWith("register_")) {
    const role = data.split("_")[1];

    if (role === "user") {
      try {
        // Get list of team leaders
        const teamLeaders = await User.find({ role: "teamleader" });

        const teamLeaderButtons = teamLeaders.map((leader) => ({
          text: `Team Leader ${leader.telegram_id}`,
          callback_data: `choose_leader_${leader.telegram_id}`,
        }));

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

  if (data.startsWith("time_select_")) {
    const selectedTime = data.split("_")[2];
    bot.sendMessage(chatId, `You selected: ${selectedTime}`);
    // Add logic to handle selected time
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

// Function to request absence times
async function requestAbsenceTimes(chatId, reason) {
  try {
    const absence = new Absence({
      user_id: chatId.toString(),
      reason: reason,
      status: "pending",
    });
    await absence.save();
    console.log(absence);

    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "09:00", callback_data: "start_time_09:00" },
            { text: "10:00", callback_data: "start_time_10:00" },
            { text: "11:00", callback_data: "start_time_11:00" },
          ],
          [
            { text: "12:00", callback_data: "start_time_12:00" },
            { text: "13:00", callback_data: "start_time_13:00" },
            { text: "14:00", callback_data: "start_time_14:00" },
          ],
        ],
      },
    };

    bot.sendMessage(chatId, "Please select your absence start time:", opts);
  } catch (err) {
    bot.sendMessage(chatId, "Error processing your request.");
    console.error(err);
  }
}

// Add this new function to handle end time selection
async function requestEndTime(chatId) {
  const opts = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "10:00", callback_data: "end_time_10:00" },
          { text: "11:00", callback_data: "end_time_11:00" },
          { text: "12:00", callback_data: "end_time_12:00" },
        ],
        [
          { text: "13:00", callback_data: "end_time_13:00" },
          { text: "14:00", callback_data: "end_time_14:00" },
          { text: "15:00", callback_data: "end_time_15:00" },
        ],
        [
          { text: "16:00", callback_data: "end_time_16:00" },
          { text: "17:00", callback_data: "end_time_17:00" },
          { text: "18:00", callback_data: "end_time_18:00" },
        ],
      ],
    },
  };

  bot.sendMessage(chatId, "Please select your absence end time:", opts);
}

// Modify the callback query handler to handle both start and end times
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  // ... existing callback handling code ...

  if (data.startsWith("start_time_")) {
    const startTime = data.split("_")[2];
    try {
      await Absence.findOneAndUpdate(
        { user_id: chatId.toString(), status: "pending" },
        { start_time: moment(startTime, "HH:mm").toDate() }
      );
      requestEndTime(chatId);
    } catch (err) {
      bot.sendMessage(chatId, "Error saving start time.");
      console.error(err);
    }
  }

  if (data.startsWith("end_time_")) {
    const endTime = data.split("_")[2];
    try {
      const absence = await Absence.findOneAndUpdate(
        { user_id: chatId.toString(), status: "pending" },
        { end_time: moment(endTime, "HH:mm").toDate() },
        { new: true }
      );

      if (absence) {
        const formattedStart = moment(absence.start_time).format("HH:mm");
        const formattedEnd = moment(absence.end_time).format("HH:mm");

        bot.sendMessage(
          chatId,
          `Your absence has been registered:\nFrom: ${formattedStart}\nTo: ${formattedEnd}\nReason: ${absence.reason}\nStatus: Pending approval`
        );

        // Notify team leader
        if (absence.user_id) {
          const user = await User.findOne({ telegram_id: absence.user_id });
          if (user && user.team_leader_id) {
            bot.sendMessage(
              user.team_leader_id,
              `New absence request:\nUser: ${absence.user_id}\nFrom: ${formattedStart}\nTo: ${formattedEnd}\nReason: ${absence.reason}`
            );
          }
        }
      }
    } catch (err) {
      bot.sendMessage(chatId, "Error saving end time.");
      console.error(err);
    }
  }

  // ... rest of the callback handling code ...
});

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

// Modify the callback query handler for time selection
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  if (data === "time_now") {
    const now = moment();
    const formattedTime = now.format("HH:mm");
    try {
      await Absence.findOneAndUpdate(
        { user_id: chatId.toString(), status: "pending" },
        { start_time: now.toDate() }
      );
      requestEndTime(chatId);
    } catch (err) {
      bot.sendMessage(chatId, "Error saving start time.");
      console.error(err);
    }
  } else if (data === "time_write") {
    bot.sendMessage(chatId, "Please input the time you want (format: HH:mm):");
    // Set up a one-time message listener for the written time
    bot.once("message", async (timeMsg) => {
      const inputTime = timeMsg.text;
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;

      if (timeRegex.test(inputTime)) {
        try {
          await Absence.findOneAndUpdate(
            { user_id: chatId.toString(), status: "pending" },
            { start_time: moment(inputTime, "HH:mm").toDate() }
          );
          requestEndTime(chatId);
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

  // Keep existing handlers for start_time_ and end_time_
  if (data.startsWith("start_time_")) {
    // ... existing start_time_ handler code ...
  }

  if (data.startsWith("end_time_")) {
    // ... existing end_time_ handler code ...
  }
});

// Handle approve_required command
bot.onText(/\/approve_required/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await User.findOne({ telegram_id: chatId.toString() });

    if (!user) {
      bot.sendMessage(chatId, "You need to register first using /register");
      return;
    }

    if (user.role !== "teamleader") {
      bot.sendMessage(
        chatId,
        "This command is only available for team leaders."
      );
      return;
    }

    // First, ask who this requirement applies to
    const teamMembers = await User.find({ team_leader_id: chatId.toString() });

    const keyboardButtons = [
      [{ text: "Whole Team", callback_data: "approve_req_team_all" }],
      ...teamMembers.map((member) => [
        {
          text: `User ${member.telegram_id}`,
          callback_data: `approve_req_user_${member.telegram_id}`,
        },
      ]),
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
    bot.sendMessage(chatId, "Error processing your request.");
    console.error(err);
  }
});

// Add to your existing callback query handler
bot.on("callback_query", async (callbackQuery) => {
  const msg = callbackQuery.message;
  const chatId = msg.chat.id;
  const data = callbackQuery.data;

  // ... existing callback handling code ...

  if (data.startsWith("approve_req_")) {
    const [, type, id] = data.split("_");

    try {
      // Store temporary data
      const requirement = new ApprovalRequirement({
        team_leader_id: chatId.toString(),
        user_id: type === "team" ? null : id,
      });
      await requirement.save();

      // Ask for start time
      const opts = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "09:00", callback_data: "approve_start_09:00" },
              { text: "10:00", callback_data: "approve_start_10:00" },
              { text: "11:00", callback_data: "approve_start_11:00" },
            ],
            [
              { text: "12:00", callback_data: "approve_start_12:00" },
              { text: "13:00", callback_data: "approve_start_13:00" },
              { text: "14:00", callback_data: "approve_start_14:00" },
            ],
          ],
        },
      };

      bot.sendMessage(
        chatId,
        "Please select when approval requirement starts:",
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
      await ApprovalRequirement.findOneAndUpdate(
        { team_leader_id: chatId.toString(), start_time: null },
        { start_time: moment(startTime, "HH:mm").toDate() }
      );

      // Ask for end time
      const opts = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "12:00", callback_data: "approve_end_12:00" },
              { text: "13:00", callback_data: "approve_end_13:00" },
              { text: "14:00", callback_data: "approve_end_14:00" },
            ],
            [
              { text: "15:00", callback_data: "approve_end_15:00" },
              { text: "16:00", callback_data: "approve_end_16:00" },
              { text: "17:00", callback_data: "approve_end_17:00" },
            ],
            [
              { text: "18:00", callback_data: "approve_end_18:00" },
              { text: "19:00", callback_data: "approve_end_19:00" },
              { text: "20:00", callback_data: "approve_end_20:00" },
            ],
          ],
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
        const target = requirement.user_id
          ? `User ${requirement.user_id}`
          : "Whole Team";

        bot.sendMessage(
          chatId,
          `Approval requirement set:\nFor: ${target}\nFrom: ${formattedStart}\nTo: ${formattedEnd}`
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
});

// Start the bot
console.log("Bot is running...");
