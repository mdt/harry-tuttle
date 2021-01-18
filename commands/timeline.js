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
	 client.logger.log(`Getting stats for user ${message.author.username}`);

	 let stats = channelstats.get_user_stats(message.author.id);
	 let data = [["puzzle", "time spent", "last seen"]];
	 for (const row of stats) {
		  let joined_time = format_dTime(row.total_seconds)
		  let last_seen;
		  if (row.last_seen == 'now')
				last_seen = 'now';
		  else
				last_seen = format_dTime((Date.now() - row.last_seen)/1000) + " ago";

		  data.push([row.channel, joined_time, last_seen]);
	 }
	 const opts = { drawHorizontalLine: (index, size) => { return index == 0 || index == 1 || index == size; } }
	 const tableOut = table(data, opts);

	 let txt = "";
	 if (message.guild)
		  txt = `Solve timeline for ${message.member.displayName}:\n`;
	 txt += `\`${tableOut}\``;
	 message.channel.send(txt)
}

exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "timeline",
  category: "Puzzles",
	 description: "Puzzles the user worked on",
  usage: "timeline"
};
