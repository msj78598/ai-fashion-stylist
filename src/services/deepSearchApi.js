// src/services/deepSearchApi.js

import { generateKeywords } from './keywordMapper';

const SERP_API_KEY = import.meta.env.VITE_SERP_API_KEY;

export async function deepSearchProducts(prefs) {
    try {
        const englishKeywords = generateKeywords(prefs);
        const arabicKeywords = [];

        if (prefs.clothingType) arabicKeywords.push(prefs.clothingType);
        if (!englishKeywords.length) arabicKeywords.push("فستان");

        if (prefs.customDescription) {
            const cleanDesc = prefs.customDescription.replace(/أريد|فستان|تفصل|موديل/g, '').trim();
            if (cleanDesc) arabicKeywords.push(cleanDesc.substring(0, 30));
        }

        // --- DUAL QUERY ARCHITECTURE ---
        // 1. Global High-Precision Query (Relies on English fashion terms for exact aesthetic matching)
        const globalQuery = [...englishKeywords, ...arabicKeywords].join(" ");

        // 2. Guaranteed Local Stores Query (Relies on pure Arabic to force Google Saudi index)
        const localStoreBoosters = ["نمشي", "ترينديول", "نون", "شي إن", "زارا", "نكست", "أُناس"];
        const randomLocal = localStoreBoosters[Math.floor(Math.random() * localStoreBoosters.length)];

        // We use just the base Arabic clothing type ("فستان سهرة") + the store name.
        // E.g. "فستان نمشي"
        const localQuery = [...arabicKeywords, randomLocal].join(" ");

        console.log("🔎 Dual Search Triggered:");
        console.log("   🌍 Global Precision:", globalQuery);
        console.log("   🇸🇦 Local Guarantee:", localQuery);

        const globalUrl = `/api/serp-search?q=${encodeURIComponent(globalQuery)}&direct_link=true`;
        const localUrl = `/api/serp-search?q=${encodeURIComponent(localQuery)}&direct_link=true`;

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