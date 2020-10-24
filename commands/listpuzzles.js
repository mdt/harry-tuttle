const { MessageFlags } = require("discord.js");

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  const channels = message.guild.channels.cache.array();
 
  for (const c of channels) {
    try {
      client.logger.log(`Channel: ${c.id}  ${c.position}. (${c.rawPosition}.)  Name: ${c.name} (${c.type }) Parent: ${c.parent ? c.parent.name : ''}`);
    } catch (e) {
      client.logger.error(e);
    }
  }
  client.logger.log('Done');

  message.channel.send("OK, it's in the log. What, you wanted the puzzles to be listed here? Someone had better implement that.");
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
  description: "Lists all the puzzles",
  usage: "listpuzzles"
};
