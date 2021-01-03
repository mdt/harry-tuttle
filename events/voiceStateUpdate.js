// voiceStateUpdate event runs when a member joins/leaves a voice channel

require("../modules/channelstats.js")
const slugify = require("slug");

module.exports = async (client, oldState, newState) => {
	 if (oldState.channelID != newState.channelID) {
		  if (oldState.channelID) {
				//client.logger.log(`User ${oldState.id} left channel ${oldState.channel.name}`);
				channelstats.on_channel_leave(oldState.id, slugify(oldState.channel.name))
		  }
		  if (newState.channelID) {
				client.logger.log(`User ${newState.id} joined channel ${newState.channel.name}`);
				if (newState.channel.parent) {
					 channelstats.on_channel_join(newState.id, slugify(newState.channel.name), slugify(newState.channel.parent.name))
				} else {
					 channelstats.on_channel_join(newState.id, slugify(newState.channel.name))
				}
		  }
	 }
};
