// guildMemberSpeaking event runs when a member starts / stops speaking

require("../modules/channelstats.js")

module.exports = async (client, member, speaking) => {
	 client.logger.log(`guildMemberSpeaking ${member.id} ${speaking}`)
	 channelstats.on_speaking_change(member.id, speaking.add())
};
