import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../src/data/productDatabase.json');

// Asleen Store Fashion Category URL
const TARGET_URL = 'https://mtjr.at/ZKAz8nr-Vm';

async function scrapeAsleen() {
    console.log('🚀 Starting Asleen Scraper...');

    // Launch headless browser
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Set viewport and user agent to simulate real user
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        console.log(`📡 Fetching ${TARGET_URL}...`);
        // Wait until network is idle to ensure dynamic content loads (Salla stores often use JS rendering)
        await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        // Auto-scroll to load lazy-loaded elements
        await autoScroll(page);

        // Get the loaded HTML
        const html = await page.content();
        const $ = cheerio.load(html);

        const products = [];

        // Target Salla's typical product card container
        $('.product-item').each((index, element) => {
            const title = $(element).find('.product-title').text().trim() || $(element).find('h3').text().trim();
            const urlPath = $(element).find('a').attr('href');
            const productUrl = urlPath ? (urlPath.startsWith('http') ? urlPath : `https://asleen.sa${urlPath}`) : null;

            // Extract image (often lazy loaded via data-src)
            let imageUrl = $(element).find('img').attr('data-src') || $(element).find('img').attr('src');

            // Extract price (Salla uses specific price tags)
            let priceText = $(element).find('.product-price').text().trim() || $(element).find('.price').text().trim();
            // Clean price text to extract just the number
            const priceMatch = priceText.match(/[\d,.]+/);
            const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;

            if (title && productUrl && price > 0) {
                products.push({
                    id: `asleen_${Date.now()}_${index}`,
                    title: title,
                    price: price,
                    currency: "SAR",
                    imageUrl: imageUrl || 'https://via.placeholder.com/500x750',
                    productUrl: productUrl,
                    storeName: "asleen",
                    // Placeholder DNA, to be populated by ChatGPT later
                    rawAttributes: {
                        color: "غير محدد",
                        material: "غير محدد",
                        length: "غير محدد",
                        sleeves: "غير محدد",
                        neckline: "غير محدد",
                        fit: "غير محدد",
                        silhouette: "غير محدد"
                    }
                });
            }
        });

        console.log(`✅ Scraped ${products.length} products from Asleen.`);

        await saveToDatabase(products);

    } catch (error) {
        console.error('❌ Scraping Error:', error.message);
    } finally {
        await browser.close();
        console.log('🛑 Browser closed.');
    }
}

// Helper to scroll to bottom of page to trigger lazy loading
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

// Helper to save data incrementally to JSON
async function saveToDatabase(newProducts) {
    try {
        let db = { lastUpdated: null, products: [] };

        // Read existing DB if it exists
        try {
            const data = await fs.readFile(DB_PATH, 'utf-8');
            db = JSON.parse(data);
        } catch (err) {
            console.log('No existing database found, creating new one.');
        }

        // Merge keeping logic simple (replace for now or add unique)
        // Here we just merge and ensure no massive duplicates by ID, or we just overwrite store-specific
        db.products = [...db.products.filter(p => p.storeName !== 'asleen'), ...newProducts];
        db.lastUpdated = new Date().toISOString();

        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
        console.log(`💾 Saved to ${DB_PATH}. Total DB Size: ${db.products.length} products.`);
    } catch (err) {
        console.error('❌ DB Save Error:', err.message);
    }
}

scrapeAsleen();
