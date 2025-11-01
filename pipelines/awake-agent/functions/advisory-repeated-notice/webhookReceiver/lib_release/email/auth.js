import fs from 'fs';
import readline from 'readline';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CREDENTIALS_JSON_PATH = path.join(__dirname, 'gmail_api_client_secret.json');
const TOKEN_JSON_PATH = path.join(__dirname, 'token.json');
const SCOPES = ['https://mail.google.com/', 'https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.compose'];


async function getGmailApiCredentials() {
  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_JSON_PATH, 'utf8'));
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(TOKEN_JSON_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_JSON_PATH, 'utf8'));
      oAuth2Client.setCredentials(token);
    } else {
      await getNewToken(oAuth2Client);
    }

    return oAuth2Client;
  } catch (error) {
    console.error('Error loading credentials:', error);
    throw error;
  }
}

async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this URL:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise((resolve) => {
    rl.question('Enter the code from that page here: ', (input) => {
      rl.close();
      resolve(input);
    });
  });

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    fs.writeFileSync(TOKEN_JSON_PATH, JSON.stringify(tokens));
    console.log('Token stored to', TOKEN_JSON_PATH);
  } catch (error) {
    console.error('Error while trying to retrieve access token:', error);
    throw error;
  }
}

export { getGmailApiCredentials };
