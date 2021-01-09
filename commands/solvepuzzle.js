// @ts-check
const slugify = require("../modules/slugify.js");
const csfunctions = require("../modules/csfunctions.js");
const path = require('path');
require('../modules/channelstats.js')

exports.run = async (client, message, args, _level) => { // eslint-disable-line no-unused-vars
	 let argv = require('yargs/yargs')(args).boolean('nocheer').boolean('boo').boolean('raspberry').argv
	 const argSlug = slugify(argv._.join("-"));
	 client.logger.log(`Archiving channels for puzzle ${argSlug}`);

	 if (!argSlug) {
		  client.logger.log("Puzzle name is empty");
		  message.channel.send("Hmm, you have to tell me the name of the puzzle like this: 'solvepuzzle A Strange-Looking Crossword'");
		  return;  
	 }
	 const puzzleName = await csfunctions.find_puzzle(client, message, argSlug, true, false);
	 if (!puzzleName) {
		  client.logger.log(`No channels found in DB for ${argSlug}`);
		  message.channel.send(`Hmm, I can't find any puzzle channels for a puzzle called ${argSlug}. Are you sure you've got the right name?`);
		  return;
	 }

	 var channelsToArchive = Array.from(message.guild.channels.cache.filter(c => (slugify(c.name) === puzzleName)).values());
	 if (channelsToArchive.length === 0) {
		  client.logger.log(`Channels for puzzle ${puzzleName} not found when archiving`);
		  message.channel.send(`Hmm, I can't find any puzzle channels for a puzzle called ${puzzleName}. Are you sure you've got the right name?`);
		  return;
	 }

	 if (!argv.nocheer)
	 {
		  message.channel.send(`Great job solving ${puzzleName}! Please wait while I broadcast some cheering...`)
		  if (argv.boo)
				await csfunctions.broadcast_sound(client, message.guild.channels, 'boo.aac');
		  else if (argv.raspberry)
				await csfunctions.broadcast_sound(client, message.guild.channels, 'raspberry.aac');
		  else
				await csfunctions.broadcast_sound(client, message.guild.channels, 'cheer.aac');
	 }

	 const dbUpdCount = channelstats.solve_puzzle(puzzleName);
	 client.logger.log(`Marked ${dbUpdCount} puzzles solved in DB`)

	 // assume channelsToArchive are all in the same category
	 let category = channelsToArchive[0].parent
	 let solvedCateogry;
	 if (category) {
		  solvedCategory = category.name + " (SOLVED)";
	 } else {
		  solvedCategory = "archived";
	 }
	 var solvedCategoryObj;

	 var moveMembers = [];
	 var textDone = false;
	 var voiceDone = false;
	 for (const c of channelsToArchive) {
		  if (c.type === "text") {
				try {
					 client.logger.log(`Moving text channel ${c.name} to solved puzzles`);
					 if (!solvedCategoryObj) {
						  solvedCategoryObj = message.guild.channels.cache.find(c => c.type === 'category' && c.name.toLowerCase() === solvedCategory.toLowerCase());
						  if (!solvedCategoryObj) {
								solvedCategoryObj = await message.guild.channels.create(solvedCategory, { type: "category" })
						  }
					 }
					 await c.setParent(solvedCategoryObj);
					 textDone = true;
				} catch (e) {
					 message.channel.send("Hmm, something went wrong. Maybe check the log?");
					 client.logger.error(e);
				}
		  } else if (c.type === "voice") {
				try {
					 var moveMembers = [];
					 for (const member in c.members.values()) {
						  moveMembers.push(member.edit({channel: 763849637177720852})); // The Main Room
					 }
					 await Promise.all(moveMembers);
					 client.logger.log(`Deleting voice channel ${c.name}`);
					 await c.delete();
					 voiceDone = true;
				} catch (e) {
					 message.channel.send("Hmm, something went wrong. Maybe check the log?");
					 client.logger.error(e);
				}
		  }
	 }

	 // Sort puzzle in the "solved" category
	 if (solvedCategoryObj) {
		  csfunctions.sort_category(client, message.guild.channels, solvedCategoryObj);
	 }

	 // if category is now empty, delete it
	 if (category.children.size == 0) {
		  client.logger.log(`Deleting category ${category.name}, it's empty`);
		  category.delete()
	 }

	 client.logger.log('Done');
	 var doneMessage = "OK, I";
	 if (voiceDone) {
		  doneMessage += " deleted the voice channel";
	 }
	 if (textDone && voiceDone) {
		  doneMessage += ", and I";
	 }
	 if (textDone) {
		  doneMessage += " archived the text channel"
	 }
	 doneMessage += ` for ${puzzleName}.`;
	 message.channel.send(doneMessage);
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ["solved"],
  permLevel: "User"
};

exports.help = {
  name: "solvepuzzle",
  category: "Puzzles",
  description: "Marks a puzzle as solved, and archives the channels",
  usage: "solvepuzzle puzzle name"
};
