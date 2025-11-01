import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase, insertNewThreatDigestSubscription } from './lib_release/bigdata/bigquery.js';
import { todayDateString } from './lib_release/date.js';

dotenv.config();

function validTopicsOfInterest(input) {
  if (typeof input !== 'string') return false;

  // Split by comma, trim whitespace
  const topics = input.split(',').map(t => t.trim()).filter(t => t.length > 0);

  // Allow only safe characters: letters, numbers, spaces, hyphens, underscores
  const isValid = topics.every(t => /^[\w\s-]+$/.test(t));

  return isValid && topics.length > 0;
}


export const webhookReceiver = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST requests are allowed.');
  }

  console.log(req.body);
  console.log(req.headers);

  const { email, attributes } = req.body;

  if (!email) {
    return res.status(400).send('Missing required fields.');
  }

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send('Invalid email format.');
  }

  if(!validTopicsOfInterest(attributes.TOPICS_OF_INTEREST)) {
    return res.status(400).send('Invalid topics of inteterst.');
  }

  await initializeDatabase();
  console.log("email", email, "topics: ",  attributes.TOPICS_OF_INTEREST.split(',').map(t => t.trim()).filter(t => t.length > 0))
  let userRef = {
    email_address: email,
    product_id: uuidv4(),
    customer_id: uuidv4(),
    date_created: todayDateString(),
    include_government: attributes?.INCLUDE_GOVERNMENT ?? false,
    include_regulatory: attributes?.INCLUDE_REGULATORY ?? false,
    topics_of_interest: attributes.TOPICS_OF_INTEREST.split(',').map(t => t.trim()).filter(t => t.length > 0)
  };

  try {
    userRef = await insertNewThreatDigestSubscription(userRef);
    console.log('User ref handled successfully');
  } catch (err) {
    console.error('Error inserting data into BigQuery inserterrors:', JSON.stringify(err.response?.insertErrors));
    return res.status(500).send('Error inserting user ref data');
  }

  return res.status(200).send('Data inserted into BigQuery');

};
