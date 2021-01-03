/*
Sort the puzzles in a category
category is a CategoryChannel object
*/
exports.sort_category = async (client, channels, category) => {
	 channels = channels.cache.filter(c => (c.parent === category));
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
		  prompt += `\n${c.channel}`;
	 }
	 const response = slugify(await client.awaitReply(message, prompt));
	 return find_puzzle(client, message, response);
}
exports.find_puzzle = find_puzzle;
