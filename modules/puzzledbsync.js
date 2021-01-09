const slugify = require("../modules/slugify.js");

module.exports = (client, puzzleRootFolderId) => {
  let gdrive = require("./gdriveclient.js")(client.google, client.logger);
  let module = {};

  function getPuzzleStatus(filename) {
    return filename.toLowerCase().startsWith('solved') ? 'S' : 'O';
  }

  function getPuzzleName(filename) {
    return filename.replace(/^solved *-? */gi, '');
  }

  var timer;
  function waitAndThenSyncSheetsToDb() {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(syncSheetsToDb, 5000);
  }

  async function syncSheetsToDb() {
    client.logger.log(`Syncing sheets in folder "${puzzleRootFolderId}" to Puzzle DB`);
    let dbPuzzles = await client.puzzleDb.allPuzzles();
    let dbPuzzlesBySpreadsheetFileId = dbPuzzles.reduce((map, puzzle) => {
      map[puzzle.spreadsheetFileId] = puzzle;
      return map;
    }, {});

    let dbFolders = await client.puzzleDb.allFolders();
    let dbFoldersByFileId = dbFolders.reduce((map, folder) => {
      map[folder.fileId] = folder;
      return map;
    }, {});

    let newPuzzles = [];
    let puzzlesToUpdate = [];
    let newFolders = [];
    let foldersToUpdate = [];
    let foldersToCheck = [puzzleRootFolderId];
    let dbFolder = dbFoldersByFileId[puzzleRootFolderId];
    let folderName = 'Puzzles';
    let discordCategoryName = folderName.toLowerCase();
    if (dbFolder) {
      delete dbFoldersByFileId[puzzleRootFolderId];
      if (dbFolder.folderName !== folderName || dbFolder.discordCategoryName !== discordCategoryName) {
        dbFolder.folderName = folderName;
        dbFolder.discordCategoryName = discordCategoryName;
        client.logger.log(`Updating folder data for ${dbFolder.folderName} in DB`);
        foldersToUpdate.push(dbFolder);
      }
    } else {
      client.logger.log(`Adding new folder ${folderName} to DB`);
      newFolders.push({ folderName: folderName, fileId: puzzleRootFolderId, discordCategoryName: discordCategoryName });
    }

    while (foldersToCheck.length) {
      let currentFolderId = foldersToCheck.shift();
      let driveResponse = await gdrive.getFileList(currentFolderId);
      let files = driveResponse.data.files;
      // client.logger.log(`Fetched ${files.length} files from Google Drive`);
      files.forEach(file => {
        //  client.logger.log(`---Looking at sheet:---`)
        //  client.logger.log(JSON.stringify(file));
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          foldersToCheck.push(file.id);
          let dbFolder = dbFoldersByFileId[file.id];
          let folderName = file.name;
          let discordCategoryName = folderName.toLowerCase().replace(/[^-0-9a-z_ ]/g, '');
          if (dbFolder) {
            delete dbFoldersByFileId[file.id];
            if (dbFolder.folderName !== folderName || dbFolder.discordCategoryName !== discordCategoryName) {
              dbFolder.folderName = folderName;
              dbFolder.discordCategoryName = discordCategoryName;
              client.logger.log(`Updating folder data for ${dbFolder.folderName} in DB`);
              foldersToUpdate.push(dbFolder);
            }
          } else {
            client.logger.log(`Adding new folder ${folderName} to DB`);
            newFolders.push({ folderName: folderName, fileId: file.id, discordCategoryName: discordCategoryName });
          }
          return;
        }
        if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
          let dbPuzzle = dbPuzzlesBySpreadsheetFileId[file.id];
          let puzzleName = getPuzzleName(file.name);
          let status = getPuzzleStatus(file.name);
          let discordVoiceChannelName = slugify(puzzleName);
          if (dbPuzzle) {
            delete dbPuzzlesBySpreadsheetFileId[file.id];
            // client.logger.log(`Found matching puzzle in DB`);
            if (dbPuzzle.status === 'X') {
              // ignore this puzzle completely
              return;
            }
            if (file.parents[0] !== dbPuzzle.parentFolderId || file.name !== dbPuzzle.spreadsheetName || puzzleName !== dbPuzzle.puzzleName || status !== dbPuzzle.status || discordVoiceChannelName !== dbPuzzle.discordVoiceChannelName) {
              dbPuzzle.parentFolderId = file.parents[0];
              dbPuzzle.spreadsheetName = file.name;
              dbPuzzle.status = status;
              dbPuzzle.puzzleName = puzzleName;
              dbPuzzle.discordVoiceChannelName = discordVoiceChannelName;
              client.logger.log(`Updating puzzle data for ${dbPuzzle.puzzleName} in DB`);
              puzzlesToUpdate.push(dbPuzzle);
            }

          } else {
            client.logger.log(`Adding new puzzle ${file.name} to DB`);
            newPuzzles.push({ puzzleName: puzzleName, spreadsheetName: file.name, spreadsheetFileId: file.id, parentFolderId: file.parents[0], status: status, discordVoiceChannelName: discordVoiceChannelName });
          }
          return;
        }
      });
    }

    if (foldersToUpdate.length) {
      await client.puzzleDb.updateFolders(foldersToUpdate);
    }

    if (newFolders.length) {
      await client.puzzleDb.addFolders(newFolders);
    }

    for (var deletedFolderId in dbFoldersByFileId) {
      let deletedFolder = dbFoldersByFileId[deletedFolderId];
      client.logger.log(`Deleting folder ${deletedFolder.folderName} with file id ${deletedFolder.fileId}`);
      await client.puzzleDb.deleteFolder(deletedFolder);
    }

    if (puzzlesToUpdate.length) {
      await client.puzzleDb.updatePuzzles(puzzlesToUpdate);
    }

    if (newPuzzles.length) {
      await client.puzzleDb.addPuzzles(newPuzzles);
    }

    for (var deletedPuzzleId in dbPuzzlesBySpreadsheetFileId) {
      let deletedPuzzle = dbPuzzlesBySpreadsheetFileId[deletedPuzzleId];
      client.logger.log(`Deleting puzzle ${deletedPuzzle.puzzleName} with file id ${deletedPuzzle.spreadsheetFileId}`);
      await client.puzzleDb.deletePuzzle(deletedPuzzle);
    }

    client.logger.log("Done scanning for new puzzles");
    waitAndThenSyncSheetsToDb();
  }

  module.startup = () => {
    waitAndThenSyncSheetsToDb();
  }

  module.shutdown = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return module;
};


