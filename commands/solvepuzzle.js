// @ts-check
const slugify = require("slug");

exports.run = async (client, message, args, _level) => { // eslint-disable-line no-unused-vars
  const puzzleName = slugify(slugify(args.join("-").toLowerCase()).replace(/[^-0-9a-z_]/g, ''));
  client.logger.log(`Archiving channels for puzzle ${puzzleName}`);

  if (!puzzleName) {
    client.logger.log("Puzzle name is empty");
    message.channel.send("Hmm, you have to tell me the name of the puzzle like this: 'solvepuzzle A Strange-Looking Crossword'");
    return;  
  }

  const puzzleCategory = message.guild.channels.cache.find(c => c.type === 'category' && c.name.toLowerCase() === 'puzzles');
  if (!puzzleCategory) {
    client.logger.log("No puzzle category found");
    message.channel.send("Hmm, I can't find the 'puzzles' category where I should look for puzzles to archive. Help!");
    return;
  }

  const solvedCategory = message.guild.channels.cache.find(c => c.type === 'category' && c.name.toLowerCase() === 'solved');
  if (!solvedCategory) {
    client.logger.log("No solved-puzzle category found");
    message.channel.send("Hmm, I can't find the 'solved' category where I should put the archives text channel. Help!");
    return;
  }

  const channelsToArchive = Array.from(message.guild.channels.cache.filter(c => (slugify(c.name.toLowerCase()).replace(/[^-0-9a-z_]/g, '') === puzzleName && c.parent && c.parent.name.toLowerCase() === 'puzzles')).values());
  if (channelsToArchive.length === 0) {
    client.logger.log("Channels for puzzle ${puzzleName} not found when archiving");
    message.channel.send(`Hmm, I can't find any puzzle channels for a puzzle called ${puzzleName}. Are you sure you've got the right name?`);
    return;
  }

  var textDone = false;
  var voiceDone = false;
  for (const c of channelsToArchive) {
    if (c.type === "text") {
      try {
        client.logger.log(`Moving text channel ${c.name} to solved puzzles`);
        await c.setParent(solvedCategory);
        textDone = true;
      } catch (e) {
        message.channel.send("Hmm, something went wrong. Maybe check the log?");
        client.logger.error(e);
      }
    } else if (c.type === "voice") {
      try {
        client.logger.log(`Deleting voice channel ${c.name}`);
        await c.delete();
        voiceDone = true;
      } catch (e) {
        message.channel.send("Hmm, something went wrong. Maybe check the log?");
        client.logger.error(e);
      }
    }
  }

  // Sort puzzle in the "solved" category
  const solvedChannels = message.guild.channels.cache.filter(c => (c.parent && c.parent.name.toLowerCase() === 'solved'));
  const textChannelsToSort = solvedChannels.filter(c => (c.type === 'text'));
  const sortedTextChannels = Array.from(textChannelsToSort.sorted((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())).values())
  for (const [i, c] of sortedTextChannels.entries()) {
    try {
      client.logger.log(`Setting position ${i}: Channel: ${c.id}  ${c.position}. (${c.rawPosition}.)  Name: ${c.name} (${c.type }) Parent: ${c.parent ? c.parent.name : ''}`);
      await c.setPosition(i);
    } catch (e) {
      client.logger.error(e);
    }
  }


  client.logger.log('Done');
  var doneMessage = "OK, I";
  if (voiceDone) {
    doneMessage += " deleted the voice channel";
  }
  if (textDone && voiceDone) {
    doneMessage += ", and I";
  }
  if (textDone) {
    doneMessage += " archived the text channel"
  }
  doneMessage += ` for ${puzzleName}.`;
  message.channel.send(doneMessage);
};

exports.conf = {
  enabled: true,
  guildOnly: true,
  aliases: [],
  permLevel: "User"
};

exports.help = {
  name: "solvepuzzle",
  category: "Miscelaneous",
  description: "Marks a puzzle as solved, and archives the channels",
  usage: "solvepuzzle"
};
