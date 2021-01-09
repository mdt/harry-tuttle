require("../modules/channelstats.js")
const slugify = require("../modules/slugify.js")
const csfunctions = require("../modules/csfunctions.js")

/// communicate channel renames to the DB
module.exports = async (client, oldChannel, newChannel) => {
	if (oldChannel.type != "voice" || newChannel.type != "voice") { return; }
	if (oldChannel.type !== "voice" || newChannel.type !== "voice") { return; }

	let needs_sort = false;
	let ocSlugged = slugify(oldChannel.name)
	let ncSlugged = slugify(newChannel.name)
	if (ocSlugged !== ncSlugged) {
		const updates = channelstats.rename_channel(ocSlugged, ncSlugged);
		needs_sort = true;
		client.logger.log(`Channel rename from ${oldChannel.name} to ${newChannel.name} updated ${updates} rows`);
	}

	if (oldChannel.parent !== newChannel.parent) {
		const oldCategoryName = oldChannel.parent ? oldChannel.parent.name : '[no category]';
		const newCategoryName = newChannel.parent ? newChannel.parent.name : '[no category]';
		const updates = channelstats.recategorize_channel(ncSlugged, newCategoryName);
		needs_sort = true;
		client.logger.log(`Channel recategorize from ${oldCategoryName} to ${newCategoryName} updated ${updates} rows`);
	}

	// re-sort the channels in its category
	if (needs_sort && newChannel.parent) {
		csfunctions.sort_category(client, newChannel.guild.channels, newChannel.parent);
	}
}
