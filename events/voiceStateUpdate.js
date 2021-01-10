// voiceStateUpdate event runs when a member joins/leaves a voice channel

const csfunctions = require("../modules/csfunctions.js")
require("../modules/channelstats.js")
const slugify = require("../modules/slugify.js");

module.exports = async (client, oldState, newState) => {
	 if (oldState.channelID != newState.channelID) {
		  if (oldState.channelID && !csfunctions.ignore_channel(client, oldState.channel)) {
				let oldName = slugify(oldState.channel.name);
				if (oldState.member && !oldState.member.user.bot)
					 channelstats.on_channel_leave(oldState.id, oldName);
				if (oldState.channel.members.size === 0 && channelstats.channel_details(oldName).status === 1) {
					 csfunctions.delete_channel(oldState.channel);
				}
		  }
		  if (newState.channelID && !csfunctions.ignore_channel(client, newState.channel)) {
				if (newState.member && !newState.member.user.bot)
				{
					 if (newState.channel.parent) {
						  channelstats.on_channel_join(newState.id, slugify(newState.channel.name), slugify(newState.channel.parent.name))
					 } else {
						  channelstats.on_channel_join(newState.id, slugify(newState.channel.name))
					 }
				}
		  }
	 }
};
