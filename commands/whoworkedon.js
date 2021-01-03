require("../modules/channelstats.js")
const slugify = require('slug');

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
	 const puzzleName = slugify(slugify(args.join("-").toLowerCase()).replace(/[^-0-9a-z_]/g, ''));
	 client.logger.log(`Getting stats for puzzle ${puzzleName}`);

	 if (!puzzleName) {
		  client.logger.log("Puzzle name is empty");
		  message.channel.send("Hmm, you have to tell me the name of the puzzle like this: 'whoworkedon A Strange-Looking Crossword'");
		  return;  
	 }

	 const stats = channelstats.get_channel_stats(puzzleName)
	 if (!stats || stats.length == 0) {
		  client.logger.log("No channel stats found for puzzle ${puzzleName}");
		  message.channel.send(`I wasn't able to find anything about a puzzle called ${puzzleName}`);
		  return;
	 }

	 txt = ""
	 for (const row of stats) {
		  let username = "(unknown)";
		  try {
				const user = await message.guild.members.fetch(row.uid.toString())
				username = user.displayName
		  } catch (e) {
				client.logger.error(`Unable to find user ${row.uid}`)
		  }

		  let joined_time = format_dTime(row.joined_seconds)
		  let spoke_time = format_dTime(row.speaking_seconds)
		  txt += `${username}: ${joined_time} (spoke for ${spoke_time})\n`
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
