import dotenv from 'dotenv';
import { initializeDatabase, getThreatDigestSubscription } from './lib_release/bigdata/bigquery.js';
import { publishMessage } from './lib_release/bigdata/pubsub.js';

dotenv.config();


export const webhookReceiver = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST requests are allowed.');
  }
  console.log(req.body);
  if(!req.body || !req.body.email) {
    return res.status(400).send('Missing required fields.');
  }

  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(400).send('Invalid email format.');
  }

  try {
    await initializeDatabase();
    const usersubscriberRef = await getThreatDigestSubscription(req.body.email);
  
    if(!usersubscriberRef) {
      return res.status(404).send('Subscription not found');
    }

    const message = {
      customer_id: usersubscriberRef.customer_id,
      email_address: usersubscriberRef.email_address,
      table_id: 'threat_digest_customer_configs',
    };
    await publishMessage(message);
    return res.status(200).send('User unsubscribed');
  }catch(error){
    console.error(error);
    return res.status(500).send(error);
  }
};
