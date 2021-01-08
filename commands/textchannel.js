const slugify = require("../modules/slugify.js");
const csfunctions = require("../modules/csfunctions.js");
require('../modules/channelstats.js');

exports.run = async (client, message, args, _level) => { // eslint-disable-line no-unused-vars
	 let argv = require('yargs/yargs')(args).boolean('d').argv
	 const del = argv.d
		  
	 const argSlug = slugify(argv._.join("-"));
	 if (!argSlug) {
		  message.channel.send("You have to tell me the name of the puzzle");
		  return;
	 }
	 if (del) {
		  // delete the channel
		  var rmChannels = Array.from(message.guild.channels.cache.filter(c => (c.type === "text" && slugify(c.name) === argSlug)).values());
		  if (rmChannels.length === 0) {
				client.logger.log(`Text channels for puzzle ${puzzleName} not found when deleting`);
				message.channel.send(`Hmm, I can't find any texdt channels for a puzzle called ${argSlug}. Are you sure you've got the right name?`);
				return;
		  }
		  for (const c of rmChannels){
				c.delete();
		  }
		  message.channel.send(`OK, I deleted ${rmChannels.length} text channels`);
		  return;
	 }
	 
	 let puzzleName = await csfunctions.find_puzzle(client, message, argSlug, true, false);
	 if (!puzzleName) {
		  client.logger.log(`No channels found in DB for ${argSlug}`);
		  message.channel.send(`Hmm, I can't find any puzzle channels for a puzzle called ${argSlug}. Are you sure you've got the right name?`);
		  return;
	 }

	 if (message.guild.channels.cache.find(c => slugify(c.name) === puzzleName && c.type == 'text')) {
		  client.logger.log("Preventing creating of duplicate puzzle ${puzzleName}");
		  message.channel.send(`Hmm, it looks like there is already a text channel for a puzzle called ${puzzleName}. I won't create duplicates.`);
		  return; 
	 }

	 var existingChannel = Array.from(message.guild.channels.cache.filter(c => (slugify(c.name) === puzzleName)).values());
	 if (existingChannel.length === 0) {
		  client.logger.log(`Channels for puzzle ${puzzleName} not found when creating text channel`);
		  message.channel.send(`Hmm, I can't find any puzzle channels for a puzzle called ${puzzleName}. Are you sure you've got the right name? Also, my database is broken`);
		  return;
	 }
	 
	 const puzzleCategory = existingChannel[0].parent
	 try {
		  await message.guild.channels.create(puzzleName, {type: "text", parent: puzzleCategory});
	 } catch (e) {
		  client.logger.error(e);
		  message.channel.send("Hmm, something went wrong. Maybe check the log?");
		  return;
	 }
	 
	 csfunctions.sort_category(client, message.guild.channels, puzzleCategory);
	 client.logger.log('Done');

	 message.channel.send(`OK, I created a new puzzle in ${puzzleCategory.name} with a text channel called ${puzzleName}. Consider deleting with '~textchannel -d ${puzzleName}' when done`);
}

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "textchannel",
  category: "Puzzles",
  description: "Create a text channel for a puzzle. Use -d to delete the text channel.",
  usage: "textchannel [-d] puzzle name"
};
