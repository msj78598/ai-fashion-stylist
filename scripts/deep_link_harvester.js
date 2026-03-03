import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Keywords for Strict Filtering
const EXCLUDE_KEYWORDS = [
    'رجالي', 'men', 'رجل', 'عطر', 'perfume', 'fragrance', 'نظار', 'glasses', 'sunglasses',
    'إكسسوار', 'اكسسوار', 'accessory', 'ساع', 'watch', 'حقيب', 'شنط', 'bag', 'جوارب', 'socks',
    'مكياج', 'makeup', 'أظافر', 'nail', 'تجميل', 'حذاء', 'شوز', 'احذية', 'أحذية', 'shoe', 'كعب',
    'ولادي', 'أولاد', 'boy'
];

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            let distance = 100;
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
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

function shouldExclude(url, titleText) {
    const combined = (url + " " + titleText).toLowerCase();
    return EXCLUDE_KEYWORDS.some(keyword => combined.includes(keyword.toLowerCase()));
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function harvestLinksForStore(browser, store) {
    console.log(`\n================================`);
    console.log(`🛍️ Harvesting Links for ${store.name}`);
    console.log(`================================`);

    let storeLinks = [];
    const uniqueStoreUrls = new Set();

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    for (const categoryUrl of store.categories) {
        if (!categoryUrl || typeof categoryUrl !== 'string') continue;

        console.log(`\n📂 Scanning Category: ${categoryUrl}`);
        let currentPageNum = 1;
        let hasNextPage = true;

        while (hasNextPage && currentPageNum <= 15) { // Safety limit: Max 15 pages per category
            let targetUrl = categoryUrl;
            if (currentPageNum > 1) {
                // simple append logic, might need adjustments based on store URL structures.
                targetUrl = categoryUrl.includes('?') ? `${categoryUrl}&page=${currentPageNum}` : `${categoryUrl}?page=${currentPageNum}`;
            }

            console.log(`   -> Fetching Page ${currentPageNum}: ${targetUrl}`);

            try {
                await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 45000 });

                // ANTI-REDIRECT CHECK
                const currentUrl = page.url();
                if (currentUrl === store.domain || currentUrl === `${store.domain}/` || (currentPageNum > 1 && currentUrl.split('?')[0] === store.domain)) {
                    console.log(`      🛑 Redirected to homepage. Category likely empty or invalid. Skipping.`);
                    break;
                }

                await autoScroll(page);
                await delay(2000); // Give it time to load lazy images/links

                // Extract Links
                const extractedLinks = await page.evaluate((domain) => {
                    const links = [];
                    // Look for Salla/Zid common product cards
                    const products = document.querySelectorAll('.product-item, .product-box, .s-product-card, [class*="product"]');

                    products.forEach(p => {
                        const a = p.querySelector('a');
                        const titleEl = p.querySelector('.product-title, h3, h2, a.text-primary, [class*="title"]');
                        if (a && a.href) {
                            let url = a.href;
                            if (url.startsWith('/')) url = domain + url;
                            let title = titleEl ? titleEl.innerText.trim() : "";
                            links.push({ url, title });
                        }
                    });

                    // Fallback if product-item wrapper is not found
                    if (links.length === 0) {
                        const anchorElements = Array.from(document.querySelectorAll('a'));
                        anchorElements.forEach(a => {
                            let href = a.href;
                            let text = a.innerText.trim();

                            // Check common Salla/Zid product URL patterns '/p/' or 'product' or long IDs
                            if (href && (href.includes('/p/') || href.includes('product') || /\/[a-zA-Z0-9]{8,15}$/.test(href))) {
                                if (href.startsWith('/')) href = domain + href;
                                links.push({ url: href, title: text });
                            }
                        });
                    }

                    return links;
                }, store.domain);

                // Filter and Deduplicate
                let newFoundCount = 0;
                for (const item of extractedLinks) {
                    // Normalization
                    let cleanUrl = item.url.split('?')[0]; // remove tracking queries

                    if (!uniqueStoreUrls.has(cleanUrl)) {
                        if (!shouldExclude(cleanUrl, item.title)) {
                            uniqueStoreUrls.add(cleanUrl);
                            storeLinks.push({
                                url: cleanUrl,
                                store: store.name,
                                category: categoryUrl
                            });
                            newFoundCount++;
                        } else {
                            // console.log(`      🚫 Excluded explicitly: ${cleanUrl}`);
                        }
                    }
                }

                console.log(`      ✅ Found ${newFoundCount} new valid product links on this page.`);

                // SMART PAGING CHECK
                // If 0 new products found on this page, assume we hit the end.
                if (newFoundCount === 0) {
                    hasNextPage = false;
                    console.log(`      🛑 0 new products found. Reached end of category.`);
                } else {
                    currentPageNum++;
                }

            } catch (err) {
                console.error(`      ❌ Error on page ${currentPageNum}: ${err.message}`);
                hasNextPage = false; // Stop paginating if error occurs
            }
        }
    }

    await page.close();
    console.log(`\n🎉 Total valid links for ${store.name}: ${storeLinks.length}`);
    return storeLinks;
}

async function runHarvester() {
    console.log("🕸️ Booting Deep Link Harvester Phase 2...");

    // Read Categories output from Phase 1
    const categoriesPath = path.join(process.cwd(), 'src', 'data', 'categories.json');
    if (!fs.existsSync(categoriesPath)) {
        console.error(`❌ categories.json not found at ${categoriesPath}. Run category_scanner.js first!`);
        process.exit(1);
    }

    const storesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));

    // Target remaining stores: جويس, ندش, شموخ, حلوة, ستايل هافن, آسلين
    const remainingStoreNames = ['فساتين جويس', 'فساتين ندش', 'فساتين شموخ', 'فساتين حلوه', 'Stayl Haven', 'فساتين آسلين'];
    const targetStores = storesData.filter(store => remainingStoreNames.includes(store.name) || remainingStoreNames.includes(store.id));

    const browser = await puppeteer.launch({ headless: "new" });

    // Read existing links to append and avoid duplicates
    const outputDir = path.join(process.cwd(), 'src', 'data');
    const outputPath = path.join(outputDir, 'raw_product_links.json');
    let allLinks = [];
    let existingUrls = new Set();

    if (fs.existsSync(outputPath)) {
        try {
            allLinks = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
            allLinks.forEach(link => existingUrls.add(link.url));
            console.log(`📦 Loaded ${allLinks.length} existing links from database.`);
        } catch (e) {
            console.error("Error reading existing links:", e);
        }
    }

    let stats = {};

    try {
        for (const store of targetStores) {
            const storeResult = await harvestLinksForStore(browser, store);

            // Append only new links
            let newLinksCount = 0;
            for (const link of storeResult) {
                if (!existingUrls.has(link.url)) {
                    allLinks.push(link);
                    existingUrls.add(link.url);
                    newLinksCount++;
                }
            }
            stats[store.name] = newLinksCount;
            console.log(`➕ Added ${newLinksCount} new links for ${store.name} (filtered duplicates).`);
        }
    } finally {
        await browser.close();
    }

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(allLinks, null, 2), 'utf-8');

    // Report
    console.log(`\n==============================================`);
    console.log(`🚀 MASTER HARVESTING REPORT`);
    console.log(`==============================================`);
    console.log(`Total Unique Links Harvested: ${allLinks.length}`);
    console.log(`Data saved to: ${outputPath}\n`);
    console.log(`Breakdown by store:`);
    for (const [storeName, count] of Object.entries(stats)) {
        console.log(` - ${storeName}: ${count} links`);
    }
}

runHarvester();
