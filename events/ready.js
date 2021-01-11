const makePuzzleDb = require("../modules/puzzledb.js");
const makePuzzleDbSync = require("../modules/puzzledbsync.js");

module.exports = async client => {
  // Log that the bot is online.
  client.logger.log(`${client.user.tag}, ready to serve ${client.users.cache.size} users in ${client.guilds.cache.size} servers.`, "ready");

  // Make the bot "play the game" which is the help command with default prefix.
  client.user.setActivity(`(type ${client.getSettings().prefix}help for help)`, { type: "PLAYING" });

  const googleSecrets = process.env.GOOGLE_API_CREDENTIALS ? JSON.parse(process.env.GOOGLE_API_CREDENTIALS) : client.config.googleApiCredentials;
  const guilds = client.guilds.cache;
  guilds.each(async g => {
    const puzzleDbDocId = client.getSettings(g).puzzleDbDocId;
    if (puzzleDbDocId && puzzleDbDocId.length > 20) {
      client.logger.log(`For guild ${g.name} Puzzle DB doc is ${puzzleDbDocId}`);
      const puzzleDb = makePuzzleDb(puzzleDbDocId, googleSecrets, client.logger);
      await puzzleDb.connect();
      client.puzzleDbs[g.id] = puzzleDb;

      const puzzleRootFolderId = client.getSettings(g).puzzleRootFolderId;
      if (puzzleRootFolderId && puzzleRootFolderId.length > 20) {
        client.logger.log(`For guild ${g.name} will sync docs from Google Drive folder ${puzzleRootFolderId}`);
        const puzzleDbSync = makePuzzleDbSync(client, puzzleRootFolderId, puzzleDb);
        puzzleDbSync.startup();
        client.puzzleDbSyncs[g.id] = puzzleDbSync;
      }
    }
  });
};
