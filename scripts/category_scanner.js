import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const STORES = [
    { id: 'laura', name: 'لورا فاشن', domain: 'https://lora.fashion' },
    { id: 'joyce', name: 'فساتين جويس', domain: 'https://joycedress.com' },
    { id: 'nadsh', name: 'فساتين ندش', domain: 'https://nadish.sa' },
    { id: 'shomoukh', name: 'فساتين شموخ', domain: 'https://shmokfash.com' },
    { id: 'noof', name: 'بوتيك نوف', domain: 'https://nouf-dresses.com' },
    { id: 'halwa', name: 'فساتين حلوه', domain: 'https://hellwa.com' },
    { id: 'staylhaven', name: 'Stayl Haven', domain: 'https://stylehaven-sa.com' },
    { id: 'asleen', name: 'فساتين آسلين', domain: 'https://aslen1.com' },
];

async function scanCategories() {
    console.log("🕵️ Starting Category Scanner for Women & Girls Apparel...");
    const browser = await puppeteer.launch({ headless: "new" });

    let allStoresCategories = [];

    for (const store of STORES) {
        console.log(`\n===========================================`);
        console.log(`🏪 Scanning Store: ${store.name} (${store.domain})`);
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        try {
            await page.goto(store.domain, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait a bit for JS to render menus if any
            await new Promise(r => setTimeout(r, 3000));

            const links = await page.evaluate(() => {
                // Try to find nav links, menu links, etc.
                const anchorElements = Array.from(document.querySelectorAll('a'));
                const navLinks = [];
                const seenUrls = new Set();

                for (let a of anchorElements) {
                    const text = a.innerText.trim();
                    let href = a.href;
                    if (text && text.length > 2 && href && href.startsWith('http')) {
                        // Very rough heuristic to pick up category-like links
                        // Typical Salla/Zid category links contain /category/ or the text itself is descriptive
                        if (!seenUrls.has(href)) {
                            navLinks.push({ text, href });
                            seenUrls.add(href);
                        }
                    }
                }
                return navLinks;
            });

            // Filter them loosely for keywords relevant to apparel
            const apparelKeywords = ['فستان', 'فساتين', 'سهرة', 'عباي', 'قفطان', 'جلابي', 'بجام', 'منزل', 'نسائ', 'بنات', 'تنانير', 'تنور', 'بلوز', 'أزياء', 'ملابس', 'كاجوال', 'شتوي', 'صيفي'];
            const excludeKeywords = ['رجالي', 'اكسسوار', 'عطور', 'تجميل', 'مكياج', 'نظارات', 'حقائب', 'شنط', 'احذية', 'أحذية', 'مجوهرات', 'ولادي', 'أطفال', 'الرئيسية', 'تواصل', 'حساب', 'سلة', 'شروط', 'سياسة', 'عن المتجر', 'من نحن', 'تسجيل'];

            const relevantLinks = links.filter(l => {
                const txt = l.text.toLowerCase();
                const url = l.href.toLowerCase();

                // Exclude system links and unwanted categories
                if (excludeKeywords.some(ex => txt.includes(ex) || url.includes(encodeURI(ex)))) return false;

                // Include if it matches apparel keywords OR if it's a Salla category URL
                if (apparelKeywords.some(ak => txt.includes(ak) || url.includes(encodeURI(ak)))) return true;
                if (url.includes('/category/')) return true;

                return false;
            });

            console.log(`📋 Found ${relevantLinks.length} potential Women/Girls Category Links:`);
            relevantLinks.forEach(l => console.log(`   - [${l.text}] -> ${l.href}`));

            allStoresCategories.push({
                ...store,
                categories: relevantLinks.map(l => l.href)
            });

        } catch (err) {
            console.error(`❌ Failed to scan ${store.name}: ${err.message}`);
        } finally {
            await page.close();
        }
    }

    await browser.close();

    // Save to Database JSON
    const outputDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'categories.json');
    fs.writeFileSync(outputPath, JSON.stringify(allStoresCategories, null, 2));

    console.log(`\n✅ Categories saved successfully to src/data/categories.json (${allStoresCategories.length} stores)`);
}

scanCategories();
