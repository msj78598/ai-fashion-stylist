import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Helper to avoid bot blocking
const delay = ms => new Promise(res => setTimeout(res, ms));

const STORES = [
    { id: 'laura', name: 'لورا فاشن', domain: 'https://lora.fashion', discountCode: null },
    { id: 'joyce', name: 'فساتين جويس', domain: 'https://joycedress.com', discountCode: 'F-ZLHNL' },
    { id: 'nadsh', name: 'فساتين ندش', domain: 'https://nadish.sa', discountCode: null },
    { id: 'shomoukh', name: 'فساتين شموخ', domain: 'https://shmokfash.com', discountCode: null },
    { id: 'noof', name: 'بوتيك نوف', domain: 'https://nouf-dresses.com', discountCode: 'F-MV9TA' },
    { id: 'halwa', name: 'فساتين حلوه', domain: 'https://hellwa.com', discountCode: 'F-4NR7I' },
    { id: 'staylhaven', name: 'Stayl Haven', domain: 'https://stylehaven-sa.com', discountCode: 'F-MDU4N' },
    { id: 'asleen', name: 'فساتين آسلين', domain: 'https://aslen1.com', discountCode: null },
];

async function scrapeStore(browser, store) {
    console.log(`\n🚀 Starting Deep Trace for: ${store.name} (${store.domain})`);
    const page = await browser.newPage();

    // Fake User Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    let finalProducts = [];
    const MAX_PRODUCTS = 50; // Increased to pull a much larger database of dresses

    try {
        console.log(`📡 Fetching main catalog...`);
        await page.goto(store.domain, { waitUntil: 'networkidle2', timeout: 45000 });

        // --- PASS 1: Get Surface Links ---
        const surfaceData = await page.evaluate((storeInfo) => {
            const items = Array.from(document.querySelectorAll('.product-item, .product-box, .s-product-card, [class*="product"]'));
            const extracted = [];

            for (const el of items) {
                const titleEl = el.querySelector('.product-title, h3, h2, a.text-primary, [class*="title"]');
                const title = titleEl ? titleEl.innerText.trim() : null;

                const priceEl = el.querySelector('.product-price, .price, [class*="price"]');
                let price = priceEl ? priceEl.innerText.replace(/[^0-9.]/g, '') : "0";

                const imgEl = el.querySelector('img');
                const imageUrl = imgEl ? (imgEl.src || imgEl.getAttribute('data-src')) : null;

                const linkEl = el.querySelector('a');
                let productUrl = linkEl ? linkEl.href : null;

                if (productUrl && productUrl.startsWith('/')) {
                    productUrl = storeInfo.domain + productUrl;
                }

                if (title && imageUrl && productUrl) {
                    extracted.push({ title, price: parseFloat(price) || 0, imageUrl, productUrl });
                }
            }
            return extracted;
        }, store);

        // Deduplicate
        const uniqueLinks = new Set();
        const catalogProducts = surfaceData.filter(p => {
            if (uniqueLinks.has(p.productUrl)) return false;
            uniqueLinks.add(p.productUrl);
            return true;
        }).slice(0, MAX_PRODUCTS);

        console.log(`🔍 Found ${catalogProducts.length} unique products. Beginning deep extraction...`);

        // --- PASS 2: Deep Crawl Each Product ---
        for (let i = 0; i < catalogProducts.length; i++) {
            const prod = catalogProducts[i];
            console.log(`   -> [${i + 1}/${catalogProducts.length}] Deep Scraping: ${prod.title}`);
            const detailPage = await browser.newPage();
            await detailPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            try {
                // Ensure absolute URL
                let targetUrl = prod.productUrl;
                if (!targetUrl.startsWith('http')) {
                    targetUrl = store.domain.replace(/\/$/, '') + '/' + targetUrl.replace(/^\//, '');
                }

                await detailPage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });

                // Extract Description HTML/Text 
                const fullDescription = await detailPage.evaluate(() => {
                    const descBlocks = document.querySelectorAll('.product-description, .product-details__description, #tabs-description, .description-container, [class*="description"]');
                    let text = "";
                    descBlocks.forEach(b => text += " " + b.innerText);
                    return text.trim();
                });

                // Combine title and description for PIE Engine
                const deepDNAText = `${prod.title} - ${fullDescription}`;

                finalProducts.push({
                    id: `${store.id}_${i}`,
                    title: prod.title,
                    price: prod.price,
                    currency: "SAR",
                    imageUrl: prod.imageUrl,
                    productUrl: targetUrl,
                    storeName: store.name,
                    rawAttributes: {
                        color: deepDNAText,
                        material: deepDNAText,
                        length: deepDNAText,
                        sleeves: deepDNAText,
                        neckline: deepDNAText,
                        fit: deepDNAText,
                        silhouette: deepDNAText,
                        fullDescription: fullDescription
                    }
                });

                // Anti-bot delay
                await delay(1000 + Math.random() * 1500);

            } catch (deepErr) {
                console.log(`      ⚠️ Warning: Could not deep scrape URL (${prod.productUrl}). Skipping.`);
            } finally {
                await detailPage.close();
            }
        }

        console.log(`✅ Extracted ${finalProducts.length} deep profiles from ${store.name}`);

    } catch (err) {
        console.error(`❌ Failed to scrape ${store.name} catalog: ${err.message}`);
    } finally {
        await page.close();
    }

    return finalProducts;
}

async function runScraper() {
    console.log("👗 Booting Affiliate Fashion Scraper...");
    const browser = await puppeteer.launch({ headless: "new" });

    let allProducts = [];

    for (const store of STORES) {
        const storeProducts = await scrapeStore(browser, store);
        allProducts = allProducts.concat(storeProducts);
    }

    await browser.close();

    // Save to Database JSON
    const outputDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'productDatabase.json');
    fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2));

    console.log(`\n🎉 Deep Scraping Complete! Saved ${allProducts.length} rich profiles to ${outputPath}`);
}

runScraper();
