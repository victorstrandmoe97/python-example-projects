import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

if (!process.env.TAVILY_API_KEY) {
  throw new Error('TAVILY_API_KEY is not set in environment variables');
}

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

//TODO: Fill out before using
const INCLUDE_DOMAINS = [
  "securityweek.com",
  "nypost.com",
  "houstonchronicle.com",
  "sg.finance.yahoo.com",
  "cyberscoop.com",
  "news.yahoo.com",
  "csoonline.com"
]

const EXCLUDE_DOMAINS = [
  "bundle.app"
]
export async function findWebSourceFor(summary, daysAgo)
{
  if(!summary || summary.length == 0)
  {
    console.error('No summary provided');
    return null;
  }

  if(!daysAgo || daysAgo == 0)
  {
    console.error('No daysAgo provided');
    throw new Error('No daysAgo provided. Check config reading');
  }

  if(summary.length > 395) {
    console.error('Summary too long');
    summary = summary.substring(0, 394);
  }

  const request = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json', 
    },
    body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `${summary}`,
        search_depth: "basic",
        include_answer: false,
        topic: "news",
        include_images: false,
        include_image_descriptions: false,
        include_raw_content: false,
        max_results: 3,
        days: daysAgo
      })
    });


    try {
      const response = await request.json();
      if(!response.results || response.results.length == 0)
      {
        console.error('No Tavily results found');
        return null;
      }

      if(response.results[0].score < 0.65)
      {
        console.error('Tavily score too low');
        return null
      }

      return response.results[0].url;
    }catch(error){
      console.error('Error fetching Tavily web source:', error);
      throw error;
    }
}