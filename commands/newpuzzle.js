// @ts-check
const slugify = require("../modules/slugify.js");

exports.run = async (client, message, args, _level) => { // eslint-disable-line no-unused-vars
	 // specify category with option "-c"
	 // if no category is specified, the puzzle gets created in the 'puzzles' category
	 client.logger.log(`message: ${message} args: ${args}`)
	 let argv = require('yargs/yargs')(args).argv
	 const category = (argv.c && argv.c.toLowerCase()) || "puzzles"
	 
	 // discord allows unicode in channel names, but no whitespace or some special characters. this seems to be undocumented so we'll just be aggressive about pruning
	 const puzzleName = slugify(argv._.join("-"));
	 client.logger.log(`Creating puzzle ${puzzleName} in category ${category}`);

	 if (!puzzleName) {
		  client.logger.log("Puzzle name is empty");
		  message.channel.send("Hmm, you have to tell me the name of the puzzle like this: 'newpuzzle [-c category-name] A Strange-Looking Crossword'");
		  return;  
	 }

	 let puzzleCategory = message.guild.channels.cache.find(c => c.type === 'category' && c.name.toLowerCase() === category);
	 if (!puzzleCategory) {
		  client.logger.log("Creating puzzle category ${category}");
		  puzzleCategory = await message.guild.channels.create(category, { type: "category" })
	 }

	 if (message.guild.channels.cache.find(c => c.name.toLowerCase() === puzzleName)) {
		  client.logger.log("Preventing creating of duplicate puzzle ${puzzleName}");
		  message.channel.send(`Hmm, it looks like there are already puzzle channels for a puzzle called ${puzzleName}. I won't create duplicates.`);
		  return; 
	 }

	 try {
		  //  await message.guild.channels.create(puzzleName, {type: "text", parent: puzzleCategory});
		  await message.guild.channels.create(puzzleName, {type: "voice", parent: puzzleCategory});
	 } catch (e) {
		  client.logger.error(e);
		  message.channel.send("Hmm, something went wrong. Maybe check the log?");
		  return;
	 }

	 const channels = message.guild.channels.cache.filter(c => (c.parent === puzzleCategory));
	 const textChannels = channels.filter(c => (c.type === 'text'));
	 const sortedTextChannels = Array.from(textChannels.sorted((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())).values())
	 for (const [i, c] of sortedTextChannels.entries()) {
		  try {
				client.logger.log(`Setting position ${i}: Channel: ${c.id}  ${c.position}. (${c.rawPosition}.)  Name: ${c.name} (${c.type }) Parent: ${c.parent ? c.parent.name : ''}`);
				await c.setPosition(i);
		  } catch (e) {
				client.logger.error(e);
		  }
	 }

	 const voiceChannels = channels.filter(c => (c.type === 'voice'))
	 const sortedVoiceChannels = Array.from(voiceChannels.sorted((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())).values())
	 for (const [i, c] of sortedVoiceChannels.entries()) {
		  try {
				client.logger.log(`Setting position ${i}: Channel: ${c.id}  ${c.position}. (${c.rawPosition}.)  Name: ${c.name} (${c.type }) Parent: ${c.parent ? c.parent.name : ''}`);
				await c.setPosition(i);
		  } catch (e) {
				client.logger.error(e);
		  }
	 }
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
  category: "Miscelaneous",
  description: "Creates channels for a new puzzle",
  usage: "newpuzzle [-c category] puzzle name"
};
