import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import axios from 'axios'
import * as cheerio from 'cheerio'

const noonScraperPlugin = () => ({
  name: 'noon-scraper',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url.startsWith('/api/noon-search')) {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const query = urlParams.searchParams.get('q');

        if (!query) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'Query parameter "q" is required' }));
        }

        try {
          const searchUrl = `https://www.noon.com/saudi-ar/search/?q=${encodeURIComponent(query)}`;
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
          res.end(JSON.stringify({ success: true, results }));
        } catch (error) {
          console.error("Scraping error:", error.message);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed' }));
        }
        return;
      }
      next();
    });
  }
});

const serpApiProxyPlugin = () => ({
  name: 'serp-api-proxy',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url.startsWith('/api/serp-search')) {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const query = urlParams.searchParams.get('q');

        // We read it from process.env since Vite runs this in Node
        const apiKey = process.env.VITE_SERP_API_KEY || '303a194d749e031e6e62416d9ee4f9e0e57a5b9f4a0fee892a15b8fd60c30dc0';

        if (!query) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: 'Query parameter "q" is required' }));
        }

        try {
          // Check if direct_link is requested
          const directLinkParam = urlParams.searchParams.get('direct_link') === 'true' ? '&direct_link=true' : '';

          const searchUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(query)}&gl=sa&hl=ar&api_key=${apiKey}${directLinkParam}`;
          const { data } = await axios.get(searchUrl);

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        } catch (error) {
          console.error("SerpAPI Proxy error:", error.message);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'SerpAPI request failed' }));
        }
        return;
      }
      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), noonScraperPlugin(), serpApiProxyPlugin()],
})
