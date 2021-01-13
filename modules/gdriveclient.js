module.exports = (google, logger) => {
  const module = {};
  const drive = google.drive({ version: 'v3' });

  module.getFileList = async (rootFolder) => {
    let q = rootFolder ? `'${rootFolder}' in parents` : '';
    let pageToken = undefined;
    let files = [];
    try {
      do {
        const response = await drive.files.list({
          q: q,
          fields: 'files(id,name,mimeType,parents)',
          pageToken: pageToken
        });
        files.push(...response.data.files);
        pageToken = response.data.nextPageToken;
      } while (pageToken);
      return files;
    } catch (e) {
      logger.error(`Couldn't get Google Drive file list: ${e}`);
      return [];
    }
  };

  return module;
};
