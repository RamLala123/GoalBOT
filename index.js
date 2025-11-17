// ========================
//   GoalBot - index.js
// ========================

// Load environment variables safely

// Pull variables from Railway / local .env
const TOKEN = process.env.TOKEN;
const APP_ID = process.env.APP_ID;
const GUILD_ID = process.env.GUILD_ID;

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

// ==========================
//     SLASH COMMANDS
// ==========================

const commands = [
    new SlashCommandBuilder()
        .setName("addgoal")
        .setDescription("Add a goal to your list.")
        .addStringOption(option =>
            option.setName("goal")
                  .setDescription("The goal you want to add")
                  .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName("listgoals")
        .setDescription("List all your goals."),

    new SlashCommandBuilder()
        .setName("finishgoal")
        .setDescription("Mark one of your goals as completed.")
        .addStringOption(option =>
            option.setName("goal")
                  .setDescription("The goal to complete")
                  .setRequired(true)
        )
].map(cmd => cmd.toJSON());

// ==========================
//   Register Commands
// ==========================

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
    try {
        console.log("Registering guild slash commands...");
        await rest.put(
            Routes.applicationGuildCommands(APP_ID, GUILD_ID),
            { body: commands }
        );
        console.log("Guild commands registered.");
    } catch (error) {
        console.error(error);
    }
}

// ==========================
//     SIMPLE GOAL SYSTEM
// ==========================

let goals = {};  
// Example format:
// goals[userId] = ["goal 1", "goal 2"]

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const userId = interaction.user.id;

    if (interaction.commandName === "addgoal") {
        const goal = interaction.options.getString("goal");

        if (!goals[userId]) goals[userId] = [];
        goals[userId].push(goal);

        await interaction.reply(`✅ Goal added: **${goal}**`);
    }

    else if (interaction.commandName === "listgoals") {
        if (!goals[userId] || goals[userId].length === 0) {
            return interaction.reply("📭 You have no goals yet.\nUse `/addgoal` to add one!");
        }

        const formatted = goals[userId]
            .map((g, i) => `${i + 1}. ${g}`)
            .join("\n");

        await interaction.reply(`📋 **Your Goals:**\n${formatted}`);
    }

    else if (interaction.commandName === "finishgoal") {
        const goal = interaction.options.getString("goal");

        if (!goals[userId] || !goals[userId].includes(goal)) {
            return interaction.reply("❌ That goal does not exist in your list.");
        }

        goals[userId] = goals[userId].filter(g => g !== goal);

        await interaction.reply(`🎉 Goal completed: **${goal}**`);
    }
});

// ==========================
//      LOGIN + START
// ==========================

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

registerCommands();
client.login(TOKEN);
