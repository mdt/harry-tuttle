// @ts-check
const slugify = require("../modules/slugify.js")
const csfunctions = require("../modules/csfunctions.js")
require('../modules/channelstats.js')

exports.run = async (client, message, args, _level) => { // eslint-disable-line no-unused-vars
	 if (args.length < 2) {
		  message.channel.send("You have to tell me the name of the puzzles like this: 'renamepuzzle old-puzzle-name New Puzzle Name");
		  return;
	 }
	 const oldPuzz = slugify(args.shift());
	 let puzzleName = await csfunctions.find_puzzle(client, message, oldPuzz, false, false);
	 if (!puzzleName) {
		  client.logger.log(`No channels found in DB for ${oldPuzz}`);
		  message.channel.send(`Hmm, I can't find any puzzle channels for a puzzle called ${oldPuzz}. Are you sure you've got the right name?`);
		  return;
	 }
	 
	 const newName = slugify(args.join("-"));

	 var channelsToMove = Array.from(message.guild.channels.cache.filter(c => (slugify(c.name) === puzzleName && (c.type === "text" || c.type === "voice"))).values());
	 if (channelsToMove.length === 0) {
		  client.logger.log(`Channels for puzzle ${puzzleName} not found when moving`);
		  message.channel.send(`Hmm, I can't find any puzzle channels for a puzzle called ${puzzleName}. Are you sure you've got the right name?`);
		  return;
	 }

	 for (const c of channelsToMove) {
		  client.logger.log(`renaming ${c}`)
		  c.setName(newName).then(newChannel => client.logger.log(`Set channel to ${newChannel.name}`));		  
	 }
	 message.channel.send(`OK, I renamed ${puzzleName} to ${newName}`);
};

exports.conf = {
  enabled: true,
	 guildOnly: true,
	 aliases: ['rename'],
  permLevel: "User"
};

exports.help = {
  name: "renamepuzzle",
  category: "Puzzles",
	 description: "Rename a puzzle",
  usage: "renamepuzzle old-puzzle-name new puzzle name"
};
