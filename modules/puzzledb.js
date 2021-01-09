module.exports = (googleCredentials, logger) => {
  const docId = '1tREaPWvNtEJNlf0VwA4rcoSP_nCtVp8t7QBQ6O3Ez_o';
  const puzzleSheetTitle = 'Puzzles';
  const folderSheetTitle = 'Folders';
  const { GoogleSpreadsheet } = require('google-spreadsheet');
  const doc = new GoogleSpreadsheet(docId);
  var puzzleSheet;
  var folderSheet;

  // puzzleName
  // status
  // spreadsheetId
  // discordVoiceChannelId
  // etc.

  const module = {};

  module.connect = async () => {
    try {
      await doc.useServiceAccountAuth(googleCredentials);
      await doc.loadInfo();
      puzzleSheet = doc.sheetsByTitle[puzzleSheetTitle];
      folderSheet = doc.sheetsByTitle[folderSheetTitle];
      logger.log(`Connected to Puzzle DB, document "${doc.title}", sheets "${puzzleSheet.title}" with ${puzzleSheet.rowCount} rows and "${folderSheet.title}" with ${folderSheet.rowCount} rows`);
    } catch (e) {
      logger.error(`Error connecting to Puzzle DB: ${e}`);
    }
  };

  function makePuzzleRow(data) {
    return {
      puzzleName: data.puzzleName ? data.puzzleName : '[unknown puzzle]',
      status: data.status ? data.status : 'N',
      spreadsheetName: data.spreadsheetName ? data.spreadsheetName : '[unknown name]',
      spreadsheetFileId: data.spreadsheetFileId ? data.spreadsheetFileId : '',
      parentFolderId: data.parentFolderId ? data.parentFolderId : '',
      discordVoiceChannelName: data.discordVoiceChannelName ? data.discordVoiceChannelName : '',
      discordVoiceChannelId: data.discordVoiceChannelId ? data.discordVoiceChannelId : ''
    };
  }

  function makeFolderRow(data) {
    return {
      folderName: data.folderName ? data.folderName : '[unknown folder]',
      fileId: data.fileId ? data.fileId : '',
      discordCategoryName: data.discordCategoryName ? data.discordCategoryName : ''
    }
  }

  module.addPuzzle = async (puzzle) => {
    try {
      puzzleSheet.addRow(makePuzzleRow(puzzle), { raw: true });
    } catch (e) {
      logger.error(`Error adding puzzle to Puzzle DB: ${e}`);
    }
  };

  module.addPuzzles = async (puzzles) => {
    try {
      puzzleSheet.addRows(puzzles.map(p => makePuzzleRow(p)));
    } catch (e) {
      logger.error(`Error adding puzzles to Puzzle DB: ${e}`);
    }
  }

  module.addFolders = async (folders) => {
    try {
      folderSheet.addRows(folders.map(p => makeFolderRow(p)));
    } catch (e) {
      logger.error(`Error adding folders to Puzzle DB: ${e}`);
    }
  }

  module.updatePuzzles = async (puzzles) => {
    try {
      puzzles.forEach(async p => await p.save());
    } catch (e) {
      logger.error(`Error updating puzzles to Puzzle DB: ${e}`);
    }
  }

  module.updateFolders = async (folders) => {
    try {
      folders.forEach(async f => await f.save());
    } catch (e) {
      logger.error(`Error updating folders to Puzzle DB: ${e}`);
    }
  }

  module.deletePuzzle = async (puzzle) => {
    try {
      await puzzle.delete();
    } catch (e) {
      logger.error(`Error deleting puzzle in Puzzle DB: ${e}`);
    }
  }

  module.deleteFolder = async (folder) => {
    try {
      await folder.delete();
    } catch (e) {
      logger.error(`Error deleting folder in Puzzle DB: ${e}`);
    }
  }

  module.allPuzzles = async () => {
    try {
      const rows = await puzzleSheet.getRows();
      // logger.log(`Fetched ${rows.length} puzzles from Puzzle DB`);
      return rows;
    } catch (e) {
      logger.error(`Error fetching rows from Puzzle DB: ${e}`);
    }
  };

  module.allFolders = async () => {
    try {
      const rows = await folderSheet.getRows();
      // logger.log(`Fetched ${rows.length} folders from Puzzle DB`);
      return rows;
    } catch (e) {
      logger.error(`Error fetching rows from Puzzle DB: ${e}`);
    }
  };

  return module;
}
