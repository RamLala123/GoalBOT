const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

// Load or create goals database
let goals = {};
if (fs.existsSync('goals.json')) {
    goals = JSON.parse(fs.readFileSync('goals.json'));
}
function saveGoals() {
    fs.writeFileSync('goals.json', JSON.stringify(goals, null, 2));
}

// --- Replace this with your bot token ---
const TOKEN = "MTQzOTk1MTA5MDE1NzA5MjkxNA.GRVMdg.vTbZJ_7RcoyzcrH87JKljayMiLRnW5EY1rIBqc";
// --- Replace this with your Application ID ---
const APP_ID = "1439951090157092914";
const GUILD_ID = "1439918730275455034";


const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Slash commands setup
const commands = [
    new SlashCommandBuilder()
        .setName('addgoal')
        .setDescription('Add a goal')
        .addStringOption(opt => opt.setName('text').setDescription('Your goal').setRequired(true)),

    new SlashCommandBuilder()
        .setName('goals')
        .setDescription('Show your goals'),

    new SlashCommandBuilder()
        .setName('checkgoal')
        .setDescription('Mark a goal completed')
        .addIntegerOption(opt => opt.setName('id').setDescription('Goal number').setRequired(true)),

    new SlashCommandBuilder()
        .setName('cleargoals')
        .setDescription('Clear completed goals')
].map(cmd => cmd.toJSON());

// Register commands with Discord (GUILD commands = instant update)
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
    try {
        console.log("Registering guild slash commands...");
        await rest.put(
            Routes.applicationGuildCommands(APP_ID, GUILD_ID),
            { body: commands }
        );
        console.log("Guild commands registered.");
    } catch (err) {
        console.error(err);
    }
})();


// Bot login event
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Handle commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const user = interaction.user.id;
    goals[user] = goals[user] || [];

    if (interaction.commandName === 'addgoal') {
        const text = interaction.options.getString('text');
        goals[user].push({ text, done: false });
        saveGoals();
        return interaction.reply(`Added goal: **${text}**`);
    }

    if (interaction.commandName === 'goals') {
        if (goals[user].length === 0)
            return interaction.reply("You have no goals yet!");

        const list = goals[user]
            .map((g, i) => `${i + 1}. [${g.done ? "✔" : " "}] ${g.text}`)
            .join("\n");

        return interaction.reply("**Your goals:**\n" + list);
    }

    if (interaction.commandName === 'checkgoal') {
        const id = interaction.options.getInteger('id') - 1;
        if (!goals[user][id])
            return interaction.reply("Goal not found!");

        goals[user][id].done = true;
        saveGoals();
        return interaction.reply(`Checked off goal ${id + 1}! 🎉`);
    }

    if (interaction.commandName === 'cleargoals') {
        goals[user] = goals[user].filter(g => !g.done);
        saveGoals();
        return interaction.reply("Cleared completed goals!");
    }
});

client.login(TOKEN);
