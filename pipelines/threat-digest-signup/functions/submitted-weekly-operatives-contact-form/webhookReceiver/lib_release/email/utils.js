import fs from 'fs';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { getGmailApiCredentials } from './auth.js';
import * as dieterVanDerStockCommonBlocks from './common_blocks/dieter_van_der_stock.js';
import * as tldrCommonBlocks from './common_blocks/tldr.js';
import * as riskybiz from './common_blocks/riskybiz.js';
import { todayDateString, computeDateRange } from '../date.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readTrustedSources() {
    const sourcesPath = path.join(__dirname, './trusted_sources.json');
    return JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
}

const trustedSources = readTrustedSources();

function constructQuery(senders, dateRange) {
    const { startDate } = computeDateRange(dateRange.daysAgo);
    const senderQuery = senders.map(sender => `from:${sender}`).join(' OR ');
    return `${senderQuery} after:${startDate}`;
}

function getSender(headers) {
  const fromHeader = headers.find(header => header.name === 'From');
  if (!fromHeader){
    return 'Unknown Sender';
  }
  
  const emailRegex = /<([^>]+)>/;
  const match = fromHeader.value.match(emailRegex);
  return match ? match[1] : fromHeader.value;
}


function getSubject(headers) {
  const subjectHeader = headers.find(header => header.name === 'Subject');
  return subjectHeader ? subjectHeader.value : 'No Subject';
}

function getDate(headers) {
  const receivedHeader = headers.find(header => header.name === 'Received');
  if (receivedHeader) {
    const dateMatch = receivedHeader.value.match(/;\s*(.+)$/);
    if (dateMatch) {
      return new Date(dateMatch[1]).toISOString();
    }
  }
  
  // Fall back to sent date if received date isn't available
  const dateHeader = headers.find(header => header.name === 'Date');
  return dateHeader ? new Date(dateHeader.value).toISOString() : todayDateString();
}

export async function readIncomingEmails(dateRange) {
  
  const auth = await getGmailApiCredentials();
  const gmail = google.gmail({ version: 'v1', auth });
  const query = constructQuery(trustedSources.senders, dateRange);
  
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
    });
    const messages = response.data.messages || [];

    if (messages.length === 0) {
      console.log('No new messages found.');
      return [];
    }

    console.log(`Found ${messages.length} message(s) from the specified senders in the last week:`);
    
    let emails = [];
    
    for (const message of messages) {
      const msg = await gmail.users.messages.get({ userId: 'me', id: message.id });
      const headers = msg.data.payload.headers;
      
      let content = '';
      const parts = msg.data.payload.parts || [];
      const contentPart = parts.find(part => part.mimeType === 'text/plain' || part.mimeType === 'text/html');
      
      if (contentPart && contentPart.body && contentPart.body.data) {
        // eslint-disable-next-line no-undef
        content = Buffer.from(contentPart.body.data, 'base64').toString('utf-8');
      }

      emails.push({
        emailRef: {
          email_id: uuidv4(),
          date_received: getDate(headers),
          title: getSubject(headers),
          sender: getSender(headers)
        },
        emailContent: content
      });
    }
    
    return emails;
  } catch (error) {
    console.error('Error reading incoming emails:', error);
    return [];
  }
}


function minimizeEmailContent(emails) {
  const commonBlocks = [
    ...dieterVanDerStockCommonBlocks.default,
    ...tldrCommonBlocks.default,
    ...riskybiz.default,
  ];

  return emails.map(({ emailRef, emailContent }) => {
    let minimizedContent = emailContent;
    
    // Remove numbered references [1] through [23]
    minimizedContent = minimizedContent.replace(/\[\d{1,2}\](?=\s|$)/g, '');

    // Remove content between < > and replace it with \r\n
    minimizedContent = minimizedContent.replace(/<[^>]*>/g, '\r\n');
    
    for (const block of commonBlocks) {
      const escapedBlock = block.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Create a regex to match the block, ignoring case
      const blockRegex = new RegExp(escapedBlock.replace(/\s+/g, '\\s+'), 'gi');
      minimizedContent = minimizedContent.replace(blockRegex, '');
    }
    
    return {
      emailRef,
      emailContent: minimizedContent
    };
  });
}

async function sendEmail(html, week) {
  const auth = await getGmailApiCredentials();
  const gmail = google.gmail({ version: 'v1', auth });

  const email = [
      'Content-Type: text/html;  charset="UTF-8"',
      'MIME-Version: 1.0',
      'Content-Transfer-Encoding: 7bit',
      'to: victorstrandmoe@gmail.com',
      'from: victorstrandmoe@example.com',
      `subject: Newsletter Week ${week}`,
      '',
      html,
  ].join('\n');

  const base64EncodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
          raw: base64EncodedEmail,
      },
  });

  console.log('Email sent successfully:', response.data);
}




export { getSender, getSubject, minimizeEmailContent, sendEmail };
