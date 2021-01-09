module.exports = async client => {
  // Log that the bot is online.
  client.logger.log(`${client.user.tag}, ready to serve ${client.users.cache.size} users in ${client.guilds.cache.size} servers.`, "ready");

  // Make the bot "play the game" which is the help command with default prefix.
  client.user.setActivity(`(type ${client.settings.get("default").prefix}help for help)`, { type: "PLAYING" });


  const makePuzzleDbSync = require("../modules/puzzledbsync.js");

  var guilds = client.guilds.cache;
  client.puzzleDbSyncs = [];
  guilds.each(g => {
    const puzzleRootFolderId = client.getSettings(g).puzzleRootFolderId;
    if (puzzleRootFolderId) {
      client.logger.log(`For guild ${g.name} will sync docs from Google Drive folder ${puzzleRootFolderId}`);
      const puzzleDbSync = makePuzzleDbSync(client, puzzleRootFolderId);
      puzzleDbSync.startup();
      client.puzzleDbSyncs.push(puzzleDbSync);
    }
  });

};
