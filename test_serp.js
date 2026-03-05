import https from 'https';

const API_KEY = process.env.VITE_SERP_API_KEY || "ccd35eaba3e8a4a5bb86a07bebe8ab3a059fe7b79da9338f0d8efafbd63ba134";
const query = encodeURIComponent("فستان riyadhdress");
const url = `https://serpapi.com/search.json?engine=google_shopping&q=${query}&api_key=${API_KEY}&direct_link=true`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        const results = json.shopping_results || [];
        console.log(JSON.stringify(results.slice(0, 5).map(r => ({ title: r.title, link: r.link, source: r.source })), null, 2));
    });
}).on('error', (err) => {
    console.error(err);
});
