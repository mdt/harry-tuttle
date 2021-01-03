const slug = require("slug");

/// for converting discord API channel names into our internal format
/// case insensitive
/// discord allows unicode in channel names, but no whitespace or some special characters. this seems to be undocumented so we'll just be aggressive about pruning
module.exports = (name) => {
	 return slugify(name.toLowerCase()).replace(/[^-0-9a-z_]/g, '');
}
