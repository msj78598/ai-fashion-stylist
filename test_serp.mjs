import fetch from 'node-fetch';
import 'dotenv/config';

const SERP_API_KEY = process.env.VITE_SERP_API_KEY;

async function testSerpApi() {
    const query = "High Neck Embellished Gown \u0641\u0633\u062a\u0627\u0646";
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}&gl=sa&hl=en&direct_link=true`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.shopping_results && data.shopping_results.length > 0) {
            console.log("Top Result 1:");
            console.log("Title:", data.shopping_results[0].title);
            console.log("Source:", data.shopping_results[0].source);
            console.log("Link:", data.shopping_results[0].link);
            console.log("Product Link:", data.shopping_results[0].product_link);

            console.log("\nTop Result 2:");
            if (data.shopping_results[1]) {
                console.log("Title:", data.shopping_results[1].title);
                console.log("Source:", data.shopping_results[1].source);
                console.log("Link:", data.shopping_results[1].link);
                console.log("Product Link:", data.shopping_results[1].product_link);
            }
        } else {
            console.log("No shopping results found:", data);
        }
    } catch (error) {
        console.error("Error fetching from SerpApi:", error);
    }
}

testSerpApi();
