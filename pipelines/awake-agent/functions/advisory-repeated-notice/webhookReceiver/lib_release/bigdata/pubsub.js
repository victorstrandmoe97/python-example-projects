import { PubSub } from '@google-cloud/pubsub';
import dotenv from 'dotenv';

dotenv.config();

const pubsub = new PubSub();

export async function publishMessage(message) {
  const topicName = process.env.PUBSUB_TOPIC;

  try {
    const messageId = await pubsub.topic(topicName).publishMessage(message);
    console.log(`Message ${messageId} published.`);
  } catch (err) {
    console.error('Error publishing message:', err);
  }
}
