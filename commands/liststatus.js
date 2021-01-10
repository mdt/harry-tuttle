// @ts-check
require('../modules/channelstats.js');

exports.run = async (client, message, args, _level) => { // eslint-disable-line no-unused-vars
	 const puzzles = channelstats.channel_status()

	 var status;
	 msg = ""
	 for (const p of puzzles) {
		  let st;
		  switch (p.status) {
		  case 0:
				st = "Unsolved";
				break;
		  case 1:
				st = "Solved";
				break;
		  case 2:
				st = "Needs aha";
				break;
		  case 3:
				st = "Fresh brains";
				break;
		  case 4:
				st = "STDP!";
				break;
		  case 5:
				st = "Stuck";
				break;
		  case 6:
				st = "Parallelize";
				break;
		  }
		  if (status != st) {
				if (msg != "") { msg += '\n' }
				msg += `__**${st}**__\n`;
				status = st;
		  }
		  if (st == "Solved") {
				msg += `~~${p.channel}~~ (${p.category})\n`;
		  } else {
				msg += `${p.channel} (${p.category})\n`;
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
  name: "liststatus",
  category: "Puzzles",
	 description: "Lists puzzles by status",
  usage: "liststatus"
};
