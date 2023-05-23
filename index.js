import { ApifyClient } from 'apify-client';
import express, { response } from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(express.json());
app.use(cors());

// import { Configuration, OpenAIApi } from "openai";

// const configuration = new Configuration({
//   apiKey: "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",
// });

// const openai = new OpenAIApi(configuration);





// Initialize the ApifyClient with API token
const client = new ApifyClient({
  token: 'apify_api_DlYDzu19yXawaFchGL3hRynEpwcK8x3uR5Bf',
});

async function callGptApi(str, count) {
  if(count ==0){
    return; 
  }
  console.log(`Processing REVIEW - ${str}`);
  const url = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(url, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer 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`
      },
      body: JSON.stringify({
            "messages": [

              {"role": "user", "content":`Get the most valuable sentence that captures the essence of this review from this review making sure that you capture the entire sentence from beginning to end - '${str}'`}
          ],
  
          model: "gpt-3.5-turbo",
      })
  }); 

  const data = await response.json();

  // console.log(data.choices[0].message.content);
  // return data.choices[0].message.content;

  if(data.choices == null){
    return callGptApi(str, count -1)
  }
  else{
    console.log(data.choices[0].message.content);
    return data.choices[0].message.content;
  }

}


// async function truncateString(str) {
//   console.log( `processing REVIEW - ${str}`)
//   const finalrev = await callGptApi(`Get the most valuable sentence from this review making sure that you capture the entire sentence from beginning to end - '${str}'`)
//   return finalrev;
// }


async function getReviewThumbnail(review, imgUrl){
  let photoUrl = imgUrl.split('?')[0]
  let name = review.author.firstName;
  let pfp = review.author.pictureUrl;
  let text = await callGptApi(review.comments, 3);
  let rating = review.rating;
  const url = "https://sync.api.bannerbear.com/v2/images";
  const data = {
    "template": "20KwqnDErWL0bl17dY",
    "modifications": [
      {
        "name": "image_container",
        "image_url": photoUrl
      },
      {
        "name": "border",
        "color": null
      },
      {
        "name": "quote",
        "color": null,
        "border_color": null,
        "border_width": null
      },
      {
        "name": "review",
        "text": text,
        "color": null,
        "background": null
      },
      {
        "name": "avatar",
        "image_url": pfp
          
      },
      {
        "name": "name",
        "text": name,
        "color": null,
        "background": null
      },
      {
        "name": "star_rating",
        "rating": `${20*rating}`
      }
    ],
    "webhook_url": null,
    "transparent": false,
    "metadata": null
  }
  let respons = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",

      "Authorization": "Bearer bb_pr_904bd184f385a5a9ecb1a682e4a195"
    },
    body: JSON.stringify(data),
  })

  let response_json = await respons.json()
  console.log(response_json.image_url)
  return response_json.image_url
}


app.post('/info', async (req, res) => {
  try {
    const { url } = req.body;
    console.log(url)
// Prepare actor input
    const input = {
      // "locationQuery": "Sacramento, California",
      "maxListings": 1,
      "startUrls": [  {
        "url": url
    }],
      "maxReviews": 0,
      "locale": "en-US",
      "calendarMonths": 0,
      "currency": "USD",
      "proxyConfiguration": {
          "useApifyProxy": true
      },
      "maxConcurrency": 50,
      "limitPoints": 5,
      "timeoutMs": 120000
    };

    (async () => {
      // Run the actor and wait for it to finish
      const run = await client.actor("dtrungtin/airbnb-scraper").call(input);

      // Fetch and print actor results from the run's dataset (if any)
      // console.log('Results from dataset');
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      let response = JSON.parse(JSON.stringify(items))
      res.json(response)
    })();

    


  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});


app.post('/reviews', async (req, res) => {
  try {
    const { url } = req.body;
    console.log(url)
// Prepare actor input
    const input = {
      // "locationQuery": "Sacramento, California",
      "maxListings": 1,
      "startUrls": [  {
        "url": url
    }],
      "maxReviews": 5,
      "locale": "en-US",
      "calendarMonths": 0,
      "currency": "USD",
      "proxyConfiguration": {
          "useApifyProxy": true
      },
      "maxConcurrency": 50,
      "limitPoints": 5,
      "timeoutMs": 120000
    };

    (async () => {
      // Run the actor and wait for it to finish
      const run = await client.actor("dtrungtin/airbnb-scraper").call(input);

      // Fetch and print actor results from the run's dataset (if any)
      // console.log('Results from dataset');
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      let response = JSON.parse(JSON.stringify(items))
      let reviews = response[0].reviews
      let photos = response[0].photos
      
      let review_slides = []
      for(let i = 1; i<3; i++){
        let review_url = await getReviewThumbnail(reviews[i], photos[3*i].pictureUrl)
        review_slides.push(review_url)
      }

      console.log(review_slides)
      let res2 = {
        "review_slides": review_slides
      }
      res.json(res2)

    })();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

 