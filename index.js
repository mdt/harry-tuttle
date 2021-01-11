// This will check if the node version you are running is the required
// Node version, if it isn't it will throw the following error to inform
// you.
if (Number(process.version.slice(1).split(".")[0]) < 12) throw new Error("Node 12.0.0 or higher is required. Update Node on your system.");

// Load up the discord.js library
const Discord = require("discord.js");
// We also load the rest of the things we need in this file:
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);
const Enmap = require("enmap");
const path = require('path');

const config = require("./config.js");
const slugify = require("./modules/slugify.js")
var localConfig = {};
try {
  // Anything in config.js can be overridden in config-local.js which should never be checked in.
  localConfig = require("./config-local.js");
} catch (e) {
  // No local config is just fine
}

// This is your client. Some people call it `bot`, some people call it `self`,
// some might call it `cootchie`. Either way, when you see `client.something`,
// or `bot.something`, this is what we're referring to. Your client.
const client = new Discord.Client({
  ws: {
    intents: config.intents
  }
});

// Here we load the config file that contains our token and our prefix values.
client.config = {...config, ...localConfig};
// client.config.token contains the bot's token
// client.config.prefix contains the message prefix

// Require our logger
client.logger = require("./modules/Logger");

// Let's start by getting some useful functions that we'll use throughout
// the bot, like logs and elevation features.
require("./modules/functions.js")(client);

// Aliases and commands are put in collections where they can be read from,
// catalogued, listed, etc.
client.commands = new Enmap();
client.aliases = new Enmap();

// Now we integrate the use of Evie's awesome EnMap module, which
// essentially saves a collection to disk. This is great for per-server configs,
// and makes things extremely easy for this purpose.
const dataDir = process.env.PERSISTENT_FILE_PATH || path.join('.', 'data');
client.settings = new Enmap({ name: "settings", dataDir: dataDir });

const googleSecrets = process.env.GOOGLE_API_CREDENTIALS ? JSON.parse(process.env.GOOGLE_API_CREDENTIALS) : client.config.googleApiCredentials;
client.google = require("./modules/gapiclient.js")(googleSecrets, client.logger);
client.puzzleDbs = {};
client.puzzleDbSyncs = {};

// We're doing real fancy node 8 async/await stuff here, and to do that
// we need to wrap stuff in an anonymous function. It's annoying but it works.

const init = async () => {

  // Here we load **commands** into memory, as a collection, so they're accessible
  // here and everywhere else.
  const cmdFiles = await readdir("./commands/");
  client.logger.log(`Loading a total of ${cmdFiles.length} commands.`);
  cmdFiles.forEach(f => {
    if (!f.endsWith(".js")) return;
    const response = client.loadCommand(f);
    if (response) console.log(response);
  });

  // Then we load events, which will include our message and ready event.
  const evtFiles = await readdir("./events/");
  client.logger.log(`Loading a total of ${evtFiles.length} events.`);
  evtFiles.forEach(file => {
    const eventName = file.split(".")[0];
    client.logger.log(`Loading Event: ${eventName}`);
    const event = require(`./events/${file}`);
    // Bind the client to any event, before the existing arguments
    // provided by the discord.js event. 
    // This line is awesome by the way. Just sayin'.
    client.on(eventName, event.bind(null, client));
  });

  // Generate a cache of client permissions for pretty perm names in commands.
  client.levelCache = {};
  for (let i = 0; i < client.config.permLevels.length; i++) {
    const thisLevel = client.config.permLevels[i];
    client.levelCache[thisLevel.name] = thisLevel.level;
  }

  // Here we login the client.
  // read parent categories to ignore
  client.ignore_categories = new Set()
  if (process.env.CHANNEL_IGNORE_CATEGORIES) {
	 for (const cat of process.env.CHANNEL_IGNORE_CATEGORIES.split(',')) {
		client.ignore_categories.add(slugify(cat))
	 }
  }
  client.login(process.env.DISCORD_API_SECRET || client.config.token);

  // End top-level async/await function.
};

init();
