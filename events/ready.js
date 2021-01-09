module.exports = async client => {
  // Log that the bot is online.
  client.logger.log(`${client.user.tag}, ready to serve ${client.users.cache.size} users in ${client.guilds.cache.size} servers.`, "ready");

  // Make the bot "play the game" which is the help command with default prefix.
  client.user.setActivity(`(type ${client.getSettings().prefix}help for help)`, { type: "PLAYING" });


  const makePuzzleDbSync = require("../modules/puzzledbsync.js");

  var guilds = client.guilds.cache;
  client.puzzleDbSyncs = [];
  guilds.each(g => {
    if (g.id === '763849636729192470') { // HACK! until we have persistent setting storage
      client.logger.log(`For guild ${g.name} will sync docs from Google Drive folder 1qlzeV5_gnltJdvVy3wCJR9WCn8G1PnC5`);
      const puzzleDbSync = makePuzzleDbSync(client, '1qlzeV5_gnltJdvVy3wCJR9WCn8G1PnC5');
      puzzleDbSync.startup();
      client.puzzleDbSyncs.push(puzzleDbSync);
      return;
    }
    const puzzleRootFolderId = client.getSettings(g).puzzleRootFolderId;
    if (puzzleRootFolderId && puzzleRootFolderId !== 'replace-me') {
      client.logger.log(`For guild ${g.name} will sync docs from Google Drive folder ${puzzleRootFolderId}`);
      const puzzleDbSync = makePuzzleDbSync(client, puzzleRootFolderId);
      puzzleDbSync.startup();
      client.puzzleDbSyncs.push(puzzleDbSync);
    }
  });
};
