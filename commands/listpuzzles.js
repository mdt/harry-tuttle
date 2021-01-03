// @ts-check
require('../modules/channelstats.js');

exports.run = async (client, message, args, _level) => { // eslint-disable-line no-unused-vars
	 const puzzles = channelstats.get_channels()

	 var category;
	 msg = ""
	 for (const p of puzzles) {
		  let cat = p.category || "Uncategorized";
		  if (category != cat) {
				if (msg != "") { msg += '\n' }
				msg += `**${cat}**\n`;
				category = cat;
		  }
		  if (p.solved) {
				msg += `~~${p.channel}~~\n`;
		  } else {
				msg += `${p.channel}\n`;
		  }
	 }

	 message.channel.send(msg);
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "listpuzzles",
  category: "Miscelaneous",
	 description: "Lists all the puzzles.",
  usage: "listpuzzles"
};
