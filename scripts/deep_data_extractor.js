import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// إعدادات وتكوين السكريبت (Configuration)
const RAW_LINKS_FILE = path.join(process.cwd(), 'src', 'data', 'raw_product_links.json');
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'data', 'processed_fashion_data.json');
const ERROR_LOG_FILE = path.join(process.cwd(), 'src', 'data', 'error_logs.json');

const BATCH_SIZE = 5; // عدد التبويبات المفتوحة في نفس الوقت
const MIN_DELAY = 2000; // الحد الأدنى للانتظار (مللي ثانية)
const MAX_DELAY = 5000; // الحد الأقصى للانتظار (مللي ثانية)

// دالة المحاكاة لتجنب الحظر (Anti-Bot Delay)
const randomDelay = () => new Promise(res => {
    const delayTime = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
    setTimeout(res, delayTime);
});

// مجموعة User-Agents عشوائية للتمويه
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0'
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// قراءة الملفات الأولية بأمان
function loadJsonFile(filePath, defaultData) {
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (e) {
            console.error(`❌ خطأ في قراءة ${filePath}:`, e.message);
        }
    }
    return defaultData;
}

// حفظ الملفات بأمان
function saveJsonFile(filePath, data) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// الاستخراج الفعلي للبيانات من الصفحة الفرعية
async function extractProductData(page, url, storeName) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

    // الانتظار قليلاً للصور والمعلومات التي تُحمل تدريجياً
    await randomDelay();

    return await page.evaluate((store) => {
        // --- 1. العنوان (Title) ---
        const titleEl = document.querySelector('h1.product-title, h1.product-details__title, .product-form h1, h1[class*="title"]');
        const title = titleEl ? titleEl.innerText.trim() : 'بدون عنوان';

        // --- 2. السعر (Price) ---
        let price = 0;
        let currency = 'SAR';
        const priceEl = document.querySelector('.product-price, .price, .product-details__price, span[class*="price"]');
        if (priceEl) {
            const priceText = priceEl.innerText;
            const priceMatch = priceText.match(/[\d,.]+/);
            if (priceMatch) {
                price = parseFloat(priceMatch[0].replace(/,/g, ''));
            }
        }

        // --- 3. الوصف (Description) ---
        // سلة وزد عادة ما يضعان التفاصيل في عناصر معينة
        const descBlocks = document.querySelectorAll('.product-description, .product-details__description, #tabs-description, .description-container, [class*="description"]');
        let description = "";
        descBlocks.forEach(b => description += " " + b.innerText);
        description = description.trim();

        // استخراج أسرع للنصوص في حال لم توجد الكلاسات المعتادة
        if (!description) {
            const articleEl = document.querySelector('article');
            if (articleEl) description = articleEl.innerText.trim();
        }

        // --- 4. الخامات (Materials Extraction Attempt) ---
        // استخراج بدائي لكلمات الخامات الشائعة من الوصف لتوفير جهد الذكاء الاصطناعي لاحقاً
        const materialsKeywords = ['ساتان', 'مخمل', 'شيفون', 'حرير', 'دانتيل', 'كريب', 'تول', 'قطن', 'كتان', 'جورجيت', 'تل', 'جاكار', 'تفته', 'تفتا'];
        let extractedMaterials = [];
        materialsKeywords.forEach(mat => {
            if (description.includes(mat) || title.includes(mat)) {
                extractedMaterials.push(mat);
            }
        });

        // --- 5. الصور (Images & Gallery) ---
        const images = [];
        // سلة تستخدم .product-gallery أو lazyload
        const imgElements = document.querySelectorAll('.product-gallery img, .product-image img, .carousel-item img, [data-src], img[class*="gallery"]');

        imgElements.forEach(img => {
            const src = img.getAttribute('data-src') || img.src;
            if (src && src.startsWith('http') && !src.includes('data:image') && !src.includes('placeholder')) {
                images.push(src);
            }
        });

        // المخرجات الشاملة
        return {
            title,
            price,
            currency,
            description,
            materials: extractedMaterials.length > 0 ? extractedMaterials : ['غير محدد'],
            images: [...new Set(images)], // إزالة التكرار من روابط الصور
            store: store
        };

    }, storeName);
}

// المشغل الرئيسي المعزز بالـ Batching
async function runDeepExtractor() {
    console.log("🚀 بدء تشغيل Deep Data Extractor Phase 3...");

    const rawLinks = loadJsonFile(RAW_LINKS_FILE, []);
    if (rawLinks.length === 0) {
        console.error("❌ لا توجد روابط في raw_product_links.json. أوقف التشغيل.");
        return;
    }

    // إعداد قاعدة البيانات والروابط المعالجة لتجنب التكرار
    const processedDB = loadJsonFile(OUTPUT_FILE, []);
    const errorLogs = loadJsonFile(ERROR_LOG_FILE, []);

    // تسجيل الروابط المكتملة لعدم إعادتها إذا توقف السكريبت
    const processedUrls = new Set(processedDB.map(item => item.productUrl));

    // فلترة الروابط التي لم تتم معالجتها بعد
    const pendingLinks = rawLinks.filter(linkObj => !processedUrls.has(linkObj.url));

    console.log(`📊 إجمالي الروابط: ${rawLinks.length}`);
    console.log(`✅ المنجزة مسبقاً: ${processedUrls.size}`);
    console.log(`⏳ المتبقية للمعالجة: ${pendingLinks.length}`);

    if (pendingLinks.length === 0) {
        console.log("🎉 جميع الروابط معالجة بالفعل!");
        return;
    }

    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ]
    });

    let successCount = 0;
    let failCount = 0;

    // معالجة بصيغة Batches للحفاظ على الذاكرة
    for (let i = 0; i < pendingLinks.length; i += BATCH_SIZE) {
        const batch = pendingLinks.slice(i, i + BATCH_SIZE);
        console.log(`\n📦 جاري معالجة الدفعة [${i + 1} إلى ${Math.min(i + BATCH_SIZE, pendingLinks.length)}] من أصل ${pendingLinks.length}...`);

        const promises = batch.map(async (linkObj) => {
            const page = await browser.newPage();
            await page.setUserAgent(getRandomUserAgent());

            // تعطيل تحميل الموارد غير الضرورية لتسريع السحب وتوفير الذاكرة
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                const resourceType = req.resourceType();
                if (['stylesheet', 'font', 'media', 'fetch', 'xhr'].includes(resourceType)) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            try {
                console.log(`   🔍 استخراج بيانات: ${linkObj.url}`);
                const data = await extractProductData(page, linkObj.url, linkObj.store);

                return {
                    productUrl: linkObj.url,
                    domain_category: linkObj.category,
                    ...data,
                    crawled_at: new Date().toISOString()
                };

            } catch (error) {
                console.error(`   ❌ فشل في ${linkObj.url}: ${error.message}`);
                errorLogs.push({ url: linkObj.url, store: linkObj.store, error: error.message, time: new Date().toISOString() });
                failCount++;
                return null;
            } finally {
                await page.close();
            }
        });

        // انتظار انتهاء الدفعة
        const results = await Promise.all(promises);

        // حفظ البيانات الصالحة
        results.forEach(res => {
            if (res) {
                processedDB.push(res);
                successCount++;
            }
        });

        // حفظ دوري (Progressive Save)
        saveJsonFile(OUTPUT_FILE, processedDB);
        saveJsonFile(ERROR_LOG_FILE, errorLogs);

        // استراحة لتجنب الحظر بين كل دفعة وأخرى
        console.log("   ⏳ أخذ استراحة تكتيكية قصيرة (Anti-Bot)...");
        await randomDelay();
    }

    await browser.close();

    console.log(`\n==============================================`);
    console.log(`🏁 التقرير النهائي لاستخراج البيانات العميقة`);
    console.log(`==============================================`);
    console.log(`✅ المنتجات المستخرجة بنجاح في هذه الجلسة: ${successCount}`);
    console.log(`❌ الروابط التي فشلت وتم تسجيلها: ${failCount}`);
    console.log(`💾 إجمالي قاعدة البيانات حالياً: ${processedDB.length} منتج متكامل`);
    console.log(`📁 تم الحفظ في: ${OUTPUT_FILE}`);
}

runDeepExtractor();
