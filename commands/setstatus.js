// @ts-check
const slugify = require("../modules/slugify.js")
const csfunctions = require("../modules/csfunctions.js")
require('../modules/channelstats.js')

exports.run = async (client, message, args, _level) => { // eslint-disable-line no-unused-vars
	 let argv = require('yargs/yargs')(args).help(false).version(false).exitProcess(false).argv
	 const status = argv.s
	 if (!status) {
		  message.channel.send("You have to tell me what status to set the puzzle to, like this: 'setstatus -s aha|brains|parallelize|stdp|stuck|none Puzzle Name")
		  return;
	 }
		  
	 const argSlug = slugify(argv._.join("-"));
	 if (!argSlug) {
		  message.channel.send("You have to tell me the name of the puzzle like this: 'setstatus -s aha|brains|parallelize|stdp|stuck|none Puzzle Name")
		  return;
	 }

	 let puzzleName = await csfunctions.find_puzzle(client, message, argSlug, true, false);
	 if (!puzzleName) {
		  client.logger.log(`No channels found in DB for ${argSlug}`);
		  message.channel.send(`Hmm, I can't find any puzzle channels for a puzzle called ${argSlug}. Are you sure you've got the right name?`);
		  return;
	 }
	 
	 // strip leading unicode from puzzleName, if it exists
	 // let oldPuzzleName = puzzleName;
	 // if (puzzleName.codePointAt(0) > 0x1F000) {
	 // 	  puzzleName = puzzleName.substring(1)
	 // }

	 let newPuzzleName;
	 let statusInt;
	 switch (status) {
	 case "aha":
		  newPuzzleName = `\u{1F4A1} ${puzzleName}`
		  statusInt = 2;
		  break;
	 case "brains":
		  newPuzzleName = `\u{1F9E0} ${puzzleName}`
		  statusInt = 3;
		  break;
	 case "stdp":
		  newPuzzleName = `\u{1F92C} ${puzzleName}`
		  statusInt = 4;
		  break;
	 case "stuck":
		  newPuzzleName = `\u{1F616} ${puzzleName}`
		  statusInt = 5;
		  break;
	 case "parallelize":
		  newPuzzleName = `\u{1F46A} ${puzzleName}`
		  statusInt = 6;
		  break;
	 case "none":
		  newPuzzleName = puzzleName;
		  statusInt = 0;
		  break;
	 default:
		  message.channel.send(`I don't know about status ${status}, use one of aha|brains|parallelize|stdp|stuck|none`);
		  return;
	 }
	 // update status in the db
	 channelstats.set_status(puzzleName, statusInt);
	 // rename the puzzle, only rename voice channels b/c if channelsToArchive.length > 1, the setName doesn't work for some reason
	 var channelsToArchive = Array.from(message.guild.channels.cache.filter(c => (slugify(c.name) === puzzleName && c.type === "voice")).values());
	 if (channelsToArchive.length === 0) {
		  client.logger.log(`Channels for puzzle ${puzzleName} not found when changing status`);
		  message.channel.send(`Hmm, I can't find any puzzle channels for a puzzle called ${puzzleName}. Are you sure you've got the right name?`);
		  return;
	 }
	 client.logger.log(`Setting status for ${channelsToArchive.length} channels`)
	 for (const c of channelsToArchive) {
		  c.setName(newPuzzleName).then(newChannel => client.logger.log(`Set channel to ${newChannel.name}`));
	 }

	 message.channel.send(`OK, I set status ${status} for ${puzzleName}`);
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: ['puzzlestatus'],
  permLevel: "User"
};

exports.help = {
  name: "setstatus",
  category: "Puzzles",
	 description: "Set puzzle status",
  usage: "setstatus -s aha|brains|parallelize|stdp|stuck|none puzzle name"
};
