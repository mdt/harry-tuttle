const { MessageFlags, ClientVoiceManager } = require("discord.js");
const slugify = require("slugify");

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
  const puzzleName = slugify(slugify(args.join("-").toLowerCase()).replace(/[^-0-9a-z_]/g, ''));
  client.logger.log(`Creating puzzle ${puzzleName}`);

  if (!puzzleName) {
    client.logger.log("Puzzle name is empty");
    message.channel.send("Hmm, you have to tell me the name of the puzzle like this: 'newpuzzle A Strange-Looking Crossword'");
    return;  
  }

  const puzzleCategory = message.guild.channels.cache.find(c => c.type === 'category' && c.name.toLowerCase() === 'puzzles');
  if (!puzzleCategory) {
    client.logger.log("No puzzle category found");
    message.channel.send("Hmm, I can't find the 'puzzles' category where I should put new puzzles. Help!");
    return;
  }

  if (message.guild.channels.cache.find(c => c.name === puzzleName)) {
    client.logger.log("Preventing creating of duplicate puzzle ${puzzleName}");
    message.channel.send(`Hmm, it looks like there are already puzzle channels for a puzzle called ${puzzleName}. I won't create duplicates.`);
    return; 
  }

  try {
  //  await message.guild.channels.create(puzzleName, {type: "text", parent: puzzleCategory});
    await message.guild.channels.create(puzzleName, {type: "voice", parent: puzzleCategory});
  } catch (e) {
    client.logger.error(e);
    message.channel.send("Hmm, something went wrong. Maybe check the log?");
    return;
  }

  const solvedCategory = message.guild.channels.cache.find(c => c.type === 'category' && c.name === 'solved');
  

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

  message.channel.send(`OK, I created a new puzzle with a voice channel called ${puzzleName}.`);
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "newpuzzle",
  category: "Miscelaneous",
  description: "Creates channels for a new puzzle",
  usage: "newpuzzle"
};
