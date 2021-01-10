const slugify = require('./slugify.js')

const sortFunc = (a, b) => {
	 const comp = slugify(a.name).localeCompare(slugify(b.name));
	 if (comp === 0) {
		  if (a.type === "text" && b.type === "voice") {
				return 1;
		  } else if (a.type === "voice" && b.type === "text") {
				return -1;
		  } else {
				return 0;
		  }
	 }
	 return comp;
}

/*
Sort the puzzles in a category
category is a CategoryChannel object
*/
exports.sort_category = async (client, channels, category) => {
	 channels = channels.cache.filter(c => (c.parent === category));
	 const sortedChannels = Array.from(channels.sorted(sortFunc).values())
	 for (const [i, c] of sortedChannels.entries()) {
		  try {
				client.logger.log(`Setting position ${i}: Channel: ${c.id}  ${c.position}. (${c.rawPosition}.)  Name: ${c.name} (${c.type }) Parent: ${c.parent ? c.parent.name : ''}`);
				await c.setPosition(i);
		  } catch (e) {
				client.logger.error(e);
		  }
	 }
}

/*
Ignore channels for tracking on join / leaves if parent category is named env['CHANNEL_IGNORE_CATEGORIES']
*/
exports.ignore_channel = (client, channel) => {
	 return channel.parent && client.ignore_categories.has(slugify(channel.parent.name));
}

/*
Function to find a puzzle. If multiple matches, prompts the user to pick one
accept_partial: automatically accept a partial match if only 1, else prompt to confirm

TODO: extend DB to know if a puzzle is solved or is in progress instead of relying on Discord, this
als prevents silliness in this function where an input partial matches an already-solved puzzle, then we
ask to confirm but we can't find the puzzle to delete.
*/
const find_puzzle = async (client, message, search_str, unsolved_only, accept_partial = true) => {
	 require('./channelstats.js')
	 const slugify = require('./slugify.js')

	 var channels = channelstats.find_channels(search_str, unsolved_only)
	 if (channels.length == 0)
		  return null;
	 if (channels.length == 1) {
		  if (search_str == channels[0].channel) {
				return channels[0].channel;
		  }
		  confirm = async () => {
				let response = await client.awaitReply(message, `Did you mean ${channels[0].channel}? (yes/no)`);
				response = response.toLowerCase();
				if (response == 'y' || response == 'yes') {
					 return true;
				} else if (response == 'n' || response == 'no') {
					 return false;
				} else {
					 return confirm();
				}
		  }
		  if (accept_partial || await confirm()) {
				return channels[0].channel;
		  } else {
				return null;
		  }
	 }

	 // prompt the user to pick a channel
	 prompt = `I found these puzzles matching ${search_str}, which one do you mean?`;
	 for (const c of channels) {
		  if (c.channel === search_str)
				return c.channel;
		  prompt += `\n${c.channel}`;
	 }
	 const response = slugify(await client.awaitReply(message, prompt));
	 return find_puzzle(client, message, response);
}
exports.find_puzzle = find_puzzle;

/*
play a sound file on all voice channels with >1 human member
channels = GuildChannelManager
*/
exports.broadcast_sound = async (client, channels, soundFilePath) => {
	 client.logger.log(`Broadcasting sound file ${soundFilePath}`);
	 for (const c of channels.cache.values()) {
		  await c.fetch();
	 }
	 var channelsToPlay = Array.from(channels.cache.filter(c => (c.type === "voice" && c.members.size > 0)).values())
	 //const broadcast = client.voice.createBroadcast();
	 //broadcast.play(soundFilePath)
	 var connection;
	 for (const c of channelsToPlay) {
		  client.logger.log(`Sending ${soundFilePath} to ${c.name}`)
		  connection = await c.join()
		  let dispatcher = connection.play(soundFilePath);
		  await new Promise(fulfill => dispatcher.on('finish', fulfill));
		  dispatcher.destroy();
	 }
	 client.logger.log(`Done broadcasting ${soundFilePath}`);
	 if (connection) {
		  connection.disconnect();
	 }
}

exports.delete_channel = async (channel) => {
	 let category = channel.parent	 

	 var moveMembers = [];
	 for (const member in channel.members.values()) {
		  moveMembers.push(member.edit({channel: 763849637177720852})); // The Main Room
	 }
	 await Promise.all(moveMembers);
	 
	 // when all the members get moved, the category gets deleted!
	 if (!channel.deleted)
	 {
		  console.log(`Deleting voice channel ${channel.name}`);
		  await channel.delete()

		  // if category is now empty, delete it
		  if (category.children.size == 0) {
				console.log(`Deleting category ${category.name}, it's empty`);
				category.delete()
		  }
	 }
}
