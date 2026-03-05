// src/services/deepSearchApi.js

import { generateKeywords } from './keywordMapper';

const SERP_API_KEY = import.meta.env.VITE_SERP_API_KEY;

export async function deepSearchProducts(prefs) {
    try {
        const englishKeywords = generateKeywords(prefs);
        const arabicKeywords = [];

        if (prefs.clothingType) arabicKeywords.push(prefs.clothingType);
        if (!englishKeywords.length) arabicKeywords.push("فستان");

        // --- DUAL QUERY ARCHITECTURE WITH RANDOMIZATION ---

        // 1. Global High-Precision Query (Pure English)
        // We use exclusively English keywords to avoid Google Shopping confusion.
        const globalString = englishKeywords.length > 0 ? englishKeywords.join(" ") : "dress";
        // Append English color if present (e.g., "Navy Blue")
        const globalQuery = globalString;

        // 2. Guaranteed Local Stores Query (Pure Arabic + Local Store Booster)
        const arabicSearchTerms = [];
        if (prefs.clothingType) arabicSearchTerms.push(prefs.clothingType);
        else arabicSearchTerms.push("فستان");

        ['colors', 'fabricMaterial', 'silhouette', 'neckline'].forEach(key => {
            if (prefs[key]) {
                // Remove anything in english or after slashes/parentheses for clean arabic search
                let term = typeof prefs[key] === 'string' ? prefs[key].split(/[\/\(]/)[0].replace(/[a-zA-Z-]/g, '').trim() : '';
                if (term) arabicSearchTerms.push(term);
            }
        });

        const localStoreBoosters = ["نمشي", "ترينديول", "نون", "شي إن", "زارا"];
        const randomLocal = localStoreBoosters[Math.floor(Math.random() * localStoreBoosters.length)];
        const localQuery = [...arabicSearchTerms, randomLocal].join(" ").replace(/\s+/g, ' ').trim();

        // 3. Random Pagination Offset (Ensures different results on regenerate)
        const randomStartGlobal = [0, 40, 80][Math.floor(Math.random() * 3)];
        const randomStartLocal = [0, 20][Math.floor(Math.random() * 2)];

        console.log("🔎 Dual Search Triggered:");
        console.log(`   🌍 Global Precision (Start: ${randomStartGlobal}):`, globalQuery);
        console.log(`   🇸🇦 Local Guarantee (Start: ${randomStartLocal}):`, localQuery);

        const globalUrl = `/api/serp-search?q=${encodeURIComponent(globalQuery)}&direct_link=true&start=${randomStartGlobal}`;
        const localUrl = `/api/serp-search?q=${encodeURIComponent(localQuery)}&direct_link=true&start=${randomStartLocal}`;

        // Fetch Both CONCURRENTLY to maintain speed
        const [globalRes, localRes] = await Promise.all([
            fetch(globalUrl).then(res => res.json()).catch(() => ({ shopping_results: [] })),
            fetch(localUrl).then(res => res.json()).catch(() => ({ shopping_results: [] }))
        ]);

        const rawResults = [
            ...(globalRes.shopping_results || []),
            ...(localRes.shopping_results || [])
        ];

        // Deduplicate results based on product thumbnail or title
        const uniqueItems = [];
        const seenThumbnails = new Set();

        for (const item of rawResults) {
            const key = item.thumbnail || item.title;
            if (!seenThumbnails.has(key)) {
                seenThumbnails.add(key);
                uniqueItems.push(item);
            }
        }

        // Known Local / GCC / Prominent Stores (English and Arabic) from User's List
        const localStoreNames = [
            // E-commerce & Multi-brand
            "shein", "شي إن",
            "namshi", "نمشي",
            "noon", "نون",
            "ounass", "أناس", "أُناس",
            "modanisa", "مودانيسا",
            "trendyol", "ترينديول",
            "bloomingdale", "بلومينغديلز",
            "fashion.sa", "فاشن السعودية",

            // High Street & Fast Fashion
            "redtag", "ريد تاغ",
            "zara", "زارا",
            "next", "نكست",

            // Local Boutiques & Specific Dress Stores
            "marina fashion", "مارينا",
            "warazan", "ورزان",
            "rana", "فساتين رنا",
            "riyadhdress", "riyadh dress", "فساتين الرياض",
            "barllina", "بارلينا"
        ];

        const products = uniqueItems.map((item, index) => {
            const storeNameLower = (item.source || "").toLowerCase();
            const isLocal = localStoreNames.some(local => storeNameLower.includes(local));

            // Determine final URL bypassing Google redirects
            let finalUrl = item.link || item.product_link;

            if (finalUrl && finalUrl.includes('google.com') && (finalUrl.includes('oshop') || finalUrl.includes('search?q='))) {
                const cleanSource = encodeURIComponent(item.source);
                const titleQuery = encodeURIComponent(item.title.replace(/[^\w\s\u0600-\u06FF-]/gi, ' '));
                finalUrl = `https://duckduckgo.com/?q=!ducky+${cleanSource}+${titleQuery}`;
            } else if (finalUrl && finalUrl.includes('google.com/url')) {
                try {
                    const urlObj = new URL(finalUrl);
                    const realUrl = urlObj.searchParams.get('url') || urlObj.searchParams.get('q');
                    if (realUrl) finalUrl = realUrl;
                } catch (e) {
                    // Ignore parse error
                }
            }

            // Fix for local stores (like riyadhdress) returning homepage URLs instead of product pages
            try {
                if (finalUrl && !finalUrl.includes('duckduckgo')) {
                    const u = new URL(finalUrl);
                    // If the path is essentially just the homepage or a language toggle (e.g. '/', '/en-sa', '/ar')
                    // and it has no query parameters indicating a specific product ID
                    if ((u.pathname === '/' || u.pathname.length <= 8) && Array.from(u.searchParams).length === 0) {
                        const titleQuery = encodeURIComponent(item.title.replace(/[^\w\s\u0600-\u06FF-]/gi, ' ').trim());
                        // Use DuckDuckGo "I'm Feeling Lucky" (!ducky) restricted to the site to jump directly to the product
                        finalUrl = `https://duckduckgo.com/?q=!ducky+site:${u.hostname}+${titleQuery}`;
                    }
                }
            } catch (e) {
                // Ignore parse errors if finalUrl is malformed
            }

            return {
                id: index,
                productTitle: item.title,
                price: item.price,
                storeName: item.source,
                imageUrl: item.thumbnail,
                direct_product_url: finalUrl,
                matchScore: 100 - (index * 2), // Rough simulation of rank
                match_reason: isLocal ? "تم العثور عليه محلياً" : "مطابقة عالية للتصميم",
                isLocal: isLocal
            };
        });

        // Split into the UI categories
        const localProducts = products.filter(p => p.isLocal);
        const globalProducts = products.filter(p => !p.isLocal);

        console.log(`🛍 Search Yield: ${localProducts.length} Local, ${globalProducts.length} Global`);

        return {
            localProducts,
            globalProducts,
            allProducts: products
        };
    } catch (err) {
        console.error("Deep search error:", err);
        return [];
    }
}