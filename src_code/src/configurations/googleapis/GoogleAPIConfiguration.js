/** Import neccessary modules */
const { google } = require("googleapis");

/** Google API credentials */
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectURI = process.env.GOOGLE_REDIRECT_URI;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

/** Create an instance of OAuth2 client */
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectURI
);

/** Set the credentials using the refresh token */
oauth2Client.setCredentials({ refresh_token: refreshToken });

/** Create an instance of Google Drive with the authenticated OAuth2 client */
const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
});

/** Exports the Google Drive instance for use in other modules */
module.exports = drive;
