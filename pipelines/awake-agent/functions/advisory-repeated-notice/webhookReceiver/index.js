import dotenv from 'dotenv';
import { insertNewThreatDigestSubscription } from './lib_release/bigdata/bigquery.js';

dotenv.config();


export const webhookReceiver = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Only POST requests are allowed.');
  }

  console.log(req.body);
  console.log(req.headers);

  const { attack_surface, cve_code } = req.body;

  if (!email) {
    return res.status(400).send('Missing required fields.');
  }


  return res.status(200).send('Data inserted into BigQuery');

};
