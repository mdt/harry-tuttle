// @ts-check
const slugify = require("../modules/slugify.js");
const csfunctions = require("../modules/csfunctions.js");
require('../modules/channelstats.js')

exports.run = async (client, message, args, _level) => { // eslint-disable-line no-unused-vars
	 const argSlug = slugify(args.join("-"));
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

	 const dbUpdCount = channelstats.solve_puzzle(puzzleName);
	 client.logger.log(`Marked ${dbUpdCount} puzzles solved in DB`)

	 // assume channelsToArchive are all in the same category
	 let category = channelsToArchive[0].parent
	 if (category) {
		  category = category.name
	 } else {
		  category = "puzzles"
	 }
	 let solvedCategory = category + " (SOLVED)"
	 var solvedCategoryObj;

	 var textDone = false;
	 var voiceDone = false;
	 for (const c of channelsToArchive) {
		  if (c.type === "text") {
				try {
					 client.logger.log(`Moving text channel ${c.name} to solved puzzles`);
					 if (!solvedCategoryObj) {
						  solvedCategoryObj = message.guild.channels.cache.find(c => c.type === 'category' && c.name.toLowerCase() === solvedCategory.toLowerCase());
						  if (!solvedCategoryObj) {
								solvedCategoryObj = message.guild.channels.create(solvedCategory, { type: "category" })
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
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "solvepuzzle",
  category: "Puzzles",
  description: "Marks a puzzle as solved, and archives the channels",
  usage: "solvepuzzle puzzle name"
};
