// @ts-check
const slugify = require("../modules/slugify.js")
const csfunctions = require("../modules/csfunctions.js")
require('../modules/channelstats.js')

exports.run = async (client, message, args, _level) => { // eslint-disable-line no-unused-vars
	 let argv = require('yargs/yargs')(args).help(false).version(false).exitProcess(false).boolean('really-i-mean-it').argv
	 const argSlug = slugify(argv._.join("-"));
	 if (!argSlug) {
		  message.channel.send("You have to tell me the name of the puzzle like this: 'deletepuzzle --really-i-mean-it Puzzle Name")
		  return;
	 }

	 let puzzleName = await csfunctions.find_puzzle(client, message, argSlug, false, false);
	 if (!puzzleName) {
		  client.logger.log(`No channels found in DB for ${argSlug}`);
		  message.channel.send(`Hmm, I can't find any puzzle channels for a puzzle called ${argSlug}. Are you sure you've got the right name?`);
		  return;
	 }
	 
	 if (!argv['really-i-mean-it']) {
		  message.channel.send(`Use --really-i-mean-it if you really want to delete ${puzzleName}`);
		  return;
	 }

	 var channelsToArchive = Array.from(message.guild.channels.cache.filter(c => (slugify(c.name) === puzzleName)).values());
	 if (channelsToArchive.length === 0) {
		  client.logger.log(`Channels for puzzle ${puzzleName} not found when archiving`);
		  message.channel.send(`Hmm, I can't find any puzzle channels for a puzzle called ${puzzleName}. Are you sure you've got the right name?`);
		  return;
	 }
	 let delMembers = 0;
	 for (const delC of channelsToArchive) {
		  if (delC.type === "text") {
				delC.delete();
		  } else if (delC.type === "voice") {
				delMembers += csfunctions.delete_channel(delC);
		  }
	 }
	 if (delMembers > 0) {
		  // wait for all events to delete db
		  setTimeout((name) => { channelstats.delete_channel(name); }, 1000, puzzleName);
	 } else {
		  channelstats.delete_channel(puzzleName);
	 }
	 message.channel.send(`OK, I deleted ${puzzleName}`);
};

exports.conf = {
  enabled: true,
	 guildOnly: true,
	 aliases: ['delete'],
  permLevel: "User"
};

exports.help = {
  name: "deletepuzzle",
  category: "Puzzles",
	 description: "Delete a puzzle and its statistics forever!",
  usage: "deletepuzzle --really-i-mean-it puzzle name"
};
