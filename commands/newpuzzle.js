const slugify = require("../modules/slugify.js");
const csfunctions = require("../modules/csfunctions.js");
require("../modules/channelstats.js");

exports.run = async (client, message, args, _level) => { // eslint-disable-line no-unused-vars
	 // specify category with option "-c"
	 // if no category is specified, the puzzle gets created in the 'puzzles' category
	 // note that categories are purely a convenience feature for puzzle creation; we expect puzzle names to be globally unique.
	 //client.logger.log(`message: ${message} args: ${args}`)
	 let argv = require('yargs/yargs')(args).help(false).version(false).exitProcess(false).argv
	 const category = (argv.c && argv.c.toLowerCase()) || "puzzles"
	 
	 // discord allows unicode in channel names, but no whitespace or some special characters. this seems to be undocumented so we'll just be aggressive about pruning
	 const puzzleName = slugify(argv._.join("-"));
	 client.logger.log(`Creating puzzle ${puzzleName} in category ${category}`);

	 if (!puzzleName) {
		  client.logger.log("Puzzle name is empty");
		  message.channel.send("Hmm, you have to tell me the name of the puzzle like this: 'newpuzzle [-c category-name] A Strange-Looking Crossword'");
		  return;  
	 }

	 if (message.guild.channels.cache.find(c => slugify(c.name) === puzzleName && c.type != 'category')) {
		  client.logger.log(`Preventing creating of duplicate puzzle ${puzzleName}`);
		  message.channel.send(`Hmm, it looks like there is already a puzzle called ${puzzleName}. I won't create duplicates.`);
		  return; 
	 }

	 let puzzleCategory = message.guild.channels.cache.find(c => c.type === 'category' && c.name.toLowerCase() === category);
	 if (!puzzleCategory) {
		  client.logger.log("Creating puzzle category ${category}");
		  puzzleCategory = await message.guild.channels.create(category, { type: "category" })
	 }

	 try {
		  //  await message.guild.channels.create(puzzleName, {type: "text", parent: puzzleCategory});
		  await message.guild.channels.create(puzzleName, {type: "voice", parent: puzzleCategory});
	 } catch (e) {
		  client.logger.error(e);
		  message.channel.send("Hmm, something went wrong. Maybe check the log?");
		  return;
	 }

	 channelstats.on_channel_create(puzzleName, category);
	 csfunctions.sort_category(client, message.guild.channels, puzzleCategory);
	 client.logger.log('Done');

	 message.channel.send(`OK, I created a new puzzle in ${category} with a voice channel called ${puzzleName}.`);
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "newpuzzle",
  category: "Puzzles",
  description: "Creates channels for a new puzzle",
  usage: "newpuzzle [-c category] puzzle name"
};
