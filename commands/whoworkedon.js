require("../modules/channelstats.js")
const slugify = require('../modules/slugify.js');
const csfunctions = require('../modules/csfunctions.js');
const { table } = require('table');
const { printf } = require('fast-printf');

var format_dTime = (secs) => {
	 var hours = Math.floor(secs / 3600)
	 var minutes = Math.floor(secs / 60) % 60
	 var seconds = Math.floor(secs) % 60
	 return printf('%02d:%02d:%02d', hours, minutes, seconds);
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
	 let data = [["user", "time spent", "last seen"]];
	 for (const row of stats) {
		  let username = "(unknown)";
		  try {
				const user = await message.guild.members.fetch(row.uid.toString()) // must toString because uid is a bigint and JavaScript is stupid
				username = user.displayName
		  } catch (e) {
				client.logger.error(`Unable to find user ${row.uid}: ${e}`)
		  }

		  let joined_time = format_dTime(row.total_seconds)
		  let last_seen;
		  if (row.last_seen == 'now')
				last_seen = 'now';
		  else
				last_seen = format_dTime((Date.now() - row.last_seen)/1000) + " ago";

		  data.push([username, joined_time, last_seen]);
	 }
	 const opts = { drawHorizontalLine: (index, size) => { return index == 0 || index == 1 || index == size; } }
	 const tableOut = table(data, opts);

	 const txt = `Stats for ${puzzleName}:\n\`${tableOut}\``;
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
