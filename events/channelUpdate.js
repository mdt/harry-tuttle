require("../modules/channelstats.js")
const csfunctions = require("../modules/csfunctions.js")

/// communicate channel renames to the DB
module.exports = async (client, oldChannel, newChannel) => {
	 if (oldChannel.type != "voice" || newChannel.type != "voice") { return; }

	 let needs_sort = false;
	 if (oldChannel.name != newChannel.name) {
		  const updates = channelstats.rename_channel(oldChannel.name, newChannel.name);
		  needs_sort = true;
		  client.logger.log(`Channel rename from ${oldChannel.name} to ${newChannel.name} updated ${updates} rows`);
	 }

	 if (oldChannel.parent != newChannel.parent) {
		  const updates = channelstats.recategorize_channel(newChannel.name, newChannel.parent.name)
		  needs_sort = true;
		  client.logger.log(`Channel recategorize from ${oldChannel.parent.name} to ${newChannel.parent.name} updated ${updates} rows`);
	 }
	 
	 // re-sort the channels in its category
	 if (needs_sort && newChannel.parent) {
		  csfunctions.sort_category(client, newChannel.guild.channels, newChannel.parent);
	 }
}
