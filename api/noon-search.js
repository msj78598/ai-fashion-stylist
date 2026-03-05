import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    try {
        const searchUrl = `https://www.noon.com/saudi-ar/search/?q=${encodeURIComponent(q)}`;
        const { data } = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
            }
        });

        const $ = cheerio.load(data);
        let results = [];

        // DOM Scraping for exact links
        const productCards = $('a[href*="/p/"]').filter((i, el) => {
            const href = $(el).attr('href');
            return href && href.includes('/saudi-ar/') && !href.includes('#');
        });

        let seenUrls = new Set();

        productCards.each((i, el) => {
            if (results.length >= 3) return;

            const href = $(el).attr('href');
            const fullUrl = href.startsWith('http') ? href : `https://www.noon.com${href}`;

            const baseUrl = fullUrl.split('?')[0];
            if (seenUrls.has(baseUrl)) return;
            seenUrls.add(baseUrl);

            const imgEl = $(el).find('img').first();
            let image = imgEl.attr('src') || '';
            if (image.includes('data:image') || image.includes('placeholder') || !image) {
                const srcset = imgEl.attr('srcset');
                if (srcset) {
                    image = srcset.split(',')[0].split(' ')[0];
                }
            }

            let name = imgEl.attr('alt') || $(el).attr('title') || 'منتج مقترح من نون';
            const cardText = $(el).text();
            const priceMatch = cardText.match(/(\d+\.?\d*)\s*(ر\.س|SAR)/) || cardText.match(/(ر\.س|SAR)\s*(\d+\.?\d*)/);
            let price = priceMatch ? priceMatch[0] : '';
            if (!price) {
                price = $(el).find('[data-qa="product-name"]').next().text().replace(/[^\d. ر\.سSAR]/g, '');
            }

            if (image && image.startsWith('http')) {
                results.push({
                    name: name.substring(0, 100),
                    price: price || 'السعر موضح بالموقع',
                    image: image.replace('tr:n-t_240', 'tr:n-t_400'),
                    url: fullUrl
                });
            }
        });

        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({ success: true, results });

    } catch (error) {
        console.error("Vercel Serverless Noon Scraping error:", error.message);
        res.status(500).json({ error: 'Scraping Failed' });
    }
}
