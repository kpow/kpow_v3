import axios from "axios";
import { parseXMLAsync, GOODREADS_API_BASE, GOODREADS_USER_ID, GOODREADS_API_KEY } from "../server/utils/api-utils";

async function testGoodreadsApi() {
  console.log("Testing Goodreads API connection...");
  
  try {
    const url = `${GOODREADS_API_BASE}/review/list/${GOODREADS_USER_ID}.xml`;
    console.log(`URL: ${url}`);
    
    const response = await axios.get(url, {
      params: {
        key: GOODREADS_API_KEY,
        v: "2",
        per_page: 1,
        page: 1,
        shelf: "read",
        sort: "date_read",
        order: "d",
      },
    });

    console.log("Goodreads API response received:");
    console.log(`Status: ${response.status}`);
    console.log(`Headers: ${JSON.stringify(response.headers, null, 2)}`);
    
    // Show the first 200 characters of the response data
    if (typeof response.data === 'string') {
      console.log(`Data (first 200 chars): ${response.data.substring(0, 200)}...`);
    }
    
    const result = await parseXMLAsync(response.data);
    console.log("XML parsed successfully");
    
    // Check if we have reviews in the response
    if (result && result.GoodreadsResponse && result.GoodreadsResponse.reviews) {
      const reviews = result.GoodreadsResponse.reviews[0];
      console.log(`Total reviews: ${reviews.$.total}`);
      console.log(`Reviews in this page: ${reviews.review ? reviews.review.length : 0}`);
      
      if (reviews.review && reviews.review.length > 0) {
        const firstBook = reviews.review[0].book[0];
        console.log(`First book title: ${firstBook.title[0]}`);
      }
    } else {
      console.error("Unexpected API response format:", JSON.stringify(result, null, 2));
    }
    
    console.log("Goodreads API test completed successfully");
  } catch (error) {
    console.error("Error testing Goodreads API:", error);
  }
}

// Run the test
testGoodreadsApi()
  .then(() => {
    console.log("Test script completed");
    process.exit(0);
  })
  .catch(error => {
    console.error("Test script failed:", error);
    process.exit(1);
  });