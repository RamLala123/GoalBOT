const {
  Client,
  GatewayIntentBits,
  REST,
  Routes
} = require("discord.js");

const fs = require("fs");

const TOKEN = process.env.TOKEN;
const APP_ID = process.env.APP_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Make sure goals file exists
if (!fs.existsSync("goals.json")) {
  fs.writeFileSync("goals.json", JSON.stringify({}));
}

// Slash command definitions
const commands = [
  {
    name: "goal",
    description: "Manage your goals",
    options: [
      {
        name: "add",
        type: 3,
        description: "Add a new goal",
        required: false
      },
      {
        name: "done",type: 3,
        description: "Mark a goal as completed",
        required: false
      }
    ]
  }
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

// Register commands
async function registerCommands() {
  try {
    console.log("Registering slash commands...");
    await rest.put(
      Routes.applicationGuildCommands(APP_ID, GUILD_ID),
      { body: commands }
    );
    console.log("Commands registered.");
  } catch (err) {
    console.error(err);
  }
}

registerCommands();

// Bot ready
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Handle interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "goal") {
    await interaction.deferReply(); // respond fast

    const userId = interaction.user.id;
    const add = interaction.options.getString("add");
    const done = interaction.options.getString("done");

    let goals = JSON.parse(fs.readFileSync("goals.json", "utf8"));

    if (!goals[userId]) {
      goals[userId] = [];
    }

    // Add goal
    if (add) {
      goals[userId].push(add);
      fs.writeFileSync("goals.json", JSON.stringify(goals));
      return interaction.editReply(`✨ Added goal: **${add}**`);
    }

    // Complete goal
    if (done) {
      goals[userId] = goals[userId].filter(g => g !== done);
      fs.writeFileSync("goals.json", JSON.stringify(goals));
      return interaction.editReply(`✔️ Completed goal: **${done}**`);
    }

    // List goals
    const userGoals = goals[userId];
    if (userGoals.length === 0) {
      return interaction.editReply("📭 You have no goals!");
    }

    const list = userGoals.map((g, i) => `${i + 1}. ${g}`).join("\n");
    return interaction.editReply(`📋 **Your goals:**\n${list}`);
  }
});

// Start bot
client.login(TOKEN);
