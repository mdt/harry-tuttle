const { google } = require('googleapis');

module.exports = (credentials, logger) => {
  let jwtClient = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets'
    ]);
  // try {
  //   await jwtClient.authorize();
  //   logger.log('Connected to Google API');
  // } catch (e) {
  //   logger.error(`Failed to connect to Google API: ${e}`);
  // }
  google.options({
    auth: jwtClient
  });

  return google;
};

