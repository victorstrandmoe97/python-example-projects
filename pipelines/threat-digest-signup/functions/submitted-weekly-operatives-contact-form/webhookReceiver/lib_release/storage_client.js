import process from 'process';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucketName = `${process.env.GOOGLE_CLOUD_PROJECT}-security-stories`;

export async function uploadToGCS(filename, data) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filename);
  
  try {
    await file.save(data);
    console.log(`✓ File ${filename} uploaded to ${bucketName}`);
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    throw error;
  }
}

export async function downloadFromGCS(filename) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filename);
  
  try {
    const [data] = await file.download();
    return data;
  } catch (error) {
    console.error('Error downloading from GCS:', error);
    throw error;
  }
} 