import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
    try {
        const query = "فستان احمر";
        const url = `https://www.noon.com/saudi-ar/search/?q=${encodeURIComponent(query)}`;
        console.log("Fetching:", url);

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
            }
        });

        const $ = cheerio.load(data);
        const nextData = $('#__NEXT_DATA__').html();
        if (nextData) {
            console.log("Found __NEXT_DATA__ length:", nextData.length);
            const json = JSON.parse(nextData);

            // Log the top level keys to find where the catalog is
            console.log("Props keys:", Object.keys(json.props.pageProps));

            // Try alternative paths common in Next.js ecommerce
            let hits = [];

            if (json?.props?.pageProps?.catalog?.hits) {
                hits = json.props.pageProps.catalog.hits;
                console.log("Found hits in pageProps.catalog");
            } else if (json?.props?.pageProps?.initialState?.search?.catalog?.hits) {
                hits = json.props.pageProps.initialState.search.catalog.hits;
                console.log("Found hits in initialState");
            } else if (json?.props?.pageProps?.initialState?.catalog?.hits) {
                hits = json.props.pageProps.initialState.catalog.hits;
                console.log("Found hits in initialState.catalog");
            }

            console.log("Found hits length:", hits.length);

            if (hits && hits.length > 0) {
                const top3 = hits.slice(0, 3).map(h => ({
                    name: h.name,
                    price: h.price,
                    image_key: h.image_key,
                    image_url: h.image_key ? `https://f.nooncdn.com/products/tr:n-t_400/${h.image_key}.jpg` : null,
                    url_raw: h.url,
                    sku: h.sku,
                    full_url: `https://www.noon.com/saudi-ar/${h.url}/${h.sku}/p/`
                }));
                console.log(JSON.stringify(top3, null, 2));
            } else {
                // Deep search for a known hit key if standard paths fail
                console.log("Dumping a generic search of JSON string for 'hits':", nextData.includes('"hits":['));
            }

        } else {
            console.log("NO __NEXT_DATA__ found.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}
test();
