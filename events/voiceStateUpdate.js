// voiceStateUpdate event runs when a member joins/leaves a voice channel

require("../modules/channelstats.js")
const slugify = require("slug");

module.exports = async (client, oldState, newState) => {
	 const uid = parseInt(newState.id, 10) // using the GuildMember ID doesn't work when lookup in at whoworkedon.js for some reason
	 //client.logger.log(`voiceStateUpdate ${oldState.id} ${newState.id} ${uid} ${oldState.channel} ${newState.channel}`)
	 if (oldState.channelID != newState.channelID) {
		  if (oldState.channelID) {
				//client.logger.log(`User ${oldState.id} left channel ${oldState.channel.name}`);
				channelstats.on_channel_leave(oldState.id, oldState.channel.name)
		  }
		  if (newState.channelID) {
				//client.logger.log(`User ${newState.id} joined channel ${newState.channel.name}`);
				channelstats.on_channel_join(newState.id, newState.channel.name)
		  }
	 }
};
