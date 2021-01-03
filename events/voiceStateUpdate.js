// voiceStateUpdate event runs when a member joins/leaves a voice channel

require("../modules/channelstats.js")

module.exports = async (client, oldState, newState) => {
	 const uid = parseInt(newState.id, 10)
	 client.logger.log(`voiceStateUpdate ${uid} ${oldState.channel} ${newState.channel}`)
	 if (oldState.channelID != newState.channelID) {
		  if (oldState.channelID) {
				client.logger.log(`User ${uid} left channel ${oldState.channel.name} (${oldState.channelID})`);
				channelstats.on_channel_leave(uid, parseInt(oldState.channelID, 10))
		  }
		  if (newState.channelID) {
				client.logger.log(`User ${uid} joined channel ${newState.channel.name} (${newState.channelID})`);
				channelstats.on_channel_join(uid, parseInt(newState.channelID, 10), newState.channel.name)

				// join the channel so we can get speaking information
				const connection = await newState.channel.join();
		  }
	 }
};
