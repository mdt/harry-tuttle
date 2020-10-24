const { MessageFlags } = require("discord.js");

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  const channels = message.guild.channels.cache.filter(c => (c.parent && c.parent.name.toLowerCase() === 'puzzles'));
 
  const textChannels = channels.filter(c => (c.type === 'text'));
  const sortedTextChannels = Array.from(textChannels.sorted((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())).values())
  for (const [i, c] of sortedTextChannels.entries()) {
    try {
      client.logger.log(`Setting position ${i}: Channel: ${c.id}  ${c.position}. (${c.rawPosition}.)  Name: ${c.name} (${c.type }) Parent: ${c.parent ? c.parent.name : ''}`);
      await c.setPosition(i);
    } catch (e) {
      client.logger.error(e);
    }
  }

  const voiceChannels = channels.filter(c => (c.type === 'voice'))
  const sortedVoiceChannels = Array.from(voiceChannels.sorted((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())).values())
  for (const [i, c] of sortedVoiceChannels.entries()) {
    try {
      client.logger.log(`Setting position ${i}: Channel: ${c.id}  ${c.position}. (${c.rawPosition}.)  Name: ${c.name} (${c.type }) Parent: ${c.parent ? c.parent.name : ''}`);
      await c.setPosition(i);
    } catch (e) {
      client.logger.error(e);
    }
  }
  client.logger.log('Done');

  message.channel.send("OK, I sorted the puzzles alphabetically.");
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "Bot Owner"
};

exports.help = {
  name: "sortpuzzles",
  category: "Miscelaneous",
  description: "Sorts all the puzzles alphabetically",
  usage: "sortpuzzles"
};
