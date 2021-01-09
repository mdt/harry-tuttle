module.exports = (google, logger) => {
  const module = {};
  const drive = google.drive({ version: 'v3' });

  module.getFileList = async (rootFolder) => {
    return await drive.files.list({
      q: `'${rootFolder}' in parents`,
      fields: 'files(id,name,mimeType,parents)'
    });
  };

  module.getSheets = async (rootFolder) => {
    return await drive.files.list(
      {
        q: `'${rootFolder}' in parents and mimeType = 'application/vnd.google-apps.spreadsheet'`,
        fields: 'files(id,name,mimeType,parents)'
      });
  };

  return module;
};
