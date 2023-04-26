import { ApifyClient } from 'apify-client';
import express, { response } from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());


// Initialize the ApifyClient with API token
const client = new ApifyClient({
  token: 'apify_api_DlYDzu19yXawaFchGL3hRynEpwcK8x3uR5Bf',
});




app.post('/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;
    
// Prepare actor input
    const input = {
      "locationQuery": "Sacramento, California",
      "maxListings": 1,
      "startUrls": [  {
        "url": url
    }],
      "maxReviews": 10,
      "calendarMonths": 0,
      "currency": "USD",
      "proxyConfiguration": {
          "useApifyProxy": true
      },
      "maxConcurrency": 50,
      "limitPoints": 100,
      "timeoutMs": 60000
    };

    (async () => {
      // Run the actor and wait for it to finish
      const run = await client.actor("dtrungtin/airbnb-scraper").call(input);

      // Fetch and print actor results from the run's dataset (if any)
      // console.log('Results from dataset');
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      response = JSON.stringify(items)
    })();

    res.json(response)


  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}.`);
});




