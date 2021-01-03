require("../modules/channelstats.js")
const slugify = require('../modules/slugify.js');
const csfunctions = require('../modules/csfunctions.js');

var format_dTime = (secs) => {
	 var hours = Math.floor(secs / 3600)
	 var minutes = Math.floor(secs / 60) % 60
	 var seconds = Math.floor(secs) % 60

	 if (hours > 0) {
		  return `${hours} hours ${minutes} minutes ${seconds} seconds`
	 } else if (minutes > 0) {
		  return `${minutes} minutes ${seconds} seconds`
	 } else {
		  return `${seconds} seconds`
	 }
}

exports.run = async (client, message, args, _level) => {
	 const argSlug = slugify(args.join("-"));
	 client.logger.log(`Getting stats for puzzle ${argSlug}`);

	 if (!argSlug) {
		  client.logger.log("Puzzle name is empty");
		  message.channel.send("Hmm, you have to tell me the name of the puzzle like this: 'whoworkedon A Strange-Looking Crossword'");
		  return;  
	 }
	 const puzzleName = await csfunctions.find_puzzle(client, message, argSlug, false, true);
	 if (!puzzleName) {
		  client.logger.log(`No channel stats found for puzzle ${argSlug}`);
		  message.channel.send(`I wasn't able to find anything about a puzzle called ${argSlug}`);
		  return;
	 }

	 let stats = channelstats.get_channel_stats(puzzleName)
	 txt = ""
	 for (const row of stats) {
		  let username = "(unknown)";
		  try {
				const user = await message.guild.members.fetch(row.uid.toString()) // must toString because uid is a bigint and JavaScript is stupid
				username = user.displayName
		  } catch (e) {
				client.logger.error(`Unable to find user ${row.uid}: ${e}`)
		  }

		  let joined_time = format_dTime(row.total_seconds)
		  txt += `${username}: ${joined_time}\n`
	 }
	 message.channel.send(txt)
}

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "whoworkedon",
  category: "Miscelaneous",
	 description: "Tell who worked on a puzzle",
  usage: "whoworkedon [-s min_seconds] puzzle name"
};
