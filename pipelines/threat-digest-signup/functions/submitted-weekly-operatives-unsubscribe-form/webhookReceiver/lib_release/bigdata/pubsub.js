import { PubSub } from '@google-cloud/pubsub';
import dotenv from 'dotenv';

dotenv.config();

const pubsub = new PubSub();

export async function publishMessage(message) {
  const dataBuffer = Buffer.from(JSON.stringify(message));

  const topic = pubsub.topic(process.env.PUBSUB_TOPIC);

  try {
    const messageId = await topic.publishMessage({ data: dataBuffer });
    console.log(`Message ${messageId} published.`);
  } catch (err) {
    console.error('Error publishing message:', err);
  }
}

