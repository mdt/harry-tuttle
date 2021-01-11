// @ts-check
const slugify = require("../modules/slugify.js");
const csfunctions = require("../modules/csfunctions.js");
const path = require('path');
require('../modules/channelstats.js')

var soundfiles = {};
const cheertypes = ['cheer','raspberry','boo','womp'];

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

exports.run = async (client, message, args, _level) => { // eslint-disable-line no-unused-vars
	 let argv = require('yargs/yargs')(args).help(false).version(false).exitProcess(false).boolean('nocheer').boolean(cheertypes).argv
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
		  //message.channel.send(`Great job solving ${puzzleName}! Please wait while I broadcast some cheering...`)
		  let soundFile;
		  if (argv.boo && soundfiles['boo'].length)
				soundFile = soundfiles['boo'][getRandomInt(0, soundfiles['boo'].length)]
		  else if (argv.raspberry && soundfiles['raspberry'].length)
				soundFile = soundfiles['raspberry'][getRandomInt(0, soundfiles['raspberry'].length)]
		  else if (argv.womp && soundfiles['womp'].length)
				soundFile = soundfiles['womp'][getRandomInt(0, soundfiles['womp'].length)]
		  else
				soundFile = soundfiles['cheer'][getRandomInt(0, soundfiles['cheer'].length)]

		  if (soundFile)
				csfunctions.broadcast_sound(client, message.guild.channels, soundFile);
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
					 // force delete after 5 minutes, otherwise voiceStateUpdate deletes when last user leaves
					 if (c.members.size === 0) {
						  csfunctions.delete_channel(c);
					 } else {
						  setTimeout((channel) => { if (!channel.deleted) csfunctions.delete_channel(channel); }, 300000, c);
					 }
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
	 var doneMessage = `Great job solving ${puzzleName}! I`;
	 if (voiceDone) {
		  doneMessage += " scheduled the voice channel for deletion";
	 }
	 if (textDone && voiceDone) {
		  doneMessage += ", and I";
	 }
	 if (textDone) {
		  doneMessage += " archived the text channel"
	 }
	 doneMessage += '.';
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
  usage: "solvepuzzle [--nocheer | --boo | --raspberry | --womp] puzzle name"
};

// populate soundfiles from filesystem
const fs = require('fs');
//module.startup = () => {
	 for (const audio_dir of cheertypes) {
		  let arr = [];
		  fs.readdirSync(path.join('audio', audio_dir), { withFileTypes: true }).forEach(dirEnt => {
				if (dirEnt.isFile() && dirEnt.name.slice(-5) === ".opus") {
					 arr.push(path.join('audio', audio_dir, dirEnt.name));
				}
		  })
		  soundfiles[audio_dir] = arr;
		  if (arr.length === 0) {
				console.log(`[WARN] no .opus files found for audio ${audio_dir}`);
		  } else {
				console.log(`Loaded ${arr.length} files for audio ${audio_dir}`);
		  }
	 }
//}
