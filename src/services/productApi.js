// src/services/productApi.js
// Placeholder product API service. In a real implementation, these would call
// external APIs or your backend to search for products.
// We are using mock data to demonstrate the Product Intelligence Engine flow.

/**
 * Mock product structure
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} title - Product name
 * @property {string} id
 * @property {string} title - Product name
 * @property {number} price - Price
 * @property {string} currency - Currency
 * @property {string} imageUrl - Image URL
 * @property {string} productUrl - Affiliate URL
 * @property {string} storeName - Store identifier
 * @property {Object} rawAttributes - Attributes for scoring
 */

import axios from 'axios';

// SerpApi Key from user environment variables
const SERPAPI_KEY = import.meta.env.VITE_SERPAPI_KEY;

const AFFILIATE_STORES = [
    { title: "لورا فاشن", keyword: '"لورا فاشن"' },
    { title: "فساتين جويس", keyword: '"فساتين جويس"' },
    { title: "فساتين ندش", keyword: '"فساتين ندش"' },
    { title: "فساتين شموخ", keyword: '"فساتين شموخ"' },
    { title: "بوتيك نوف", keyword: '"بوتيك نوف"' },
    { title: "فساتين حلوه", keyword: '"فساتين حلوه"' },
    { title: "Stayl Haven", keyword: '"stayl haven"' },
    { title: "فساتين آسلين", keyword: '"فساتين آسلين"' },
    { title: "شي ان", keyword: 'site:ar.shein.com' },
    { title: "نون", keyword: 'site:noon.com/saudi-ar-en/' }
];

const MOCK_PRODUCTS = [
    {
        id: "p1",
        title: "فستان سهرة ماكسي حرير أخضر زمردي",
        price: 450,
        currency: "SAR",
        imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop",
        productUrl: "https://mtjr.at/ZKAz8nr-Vm",
        storeName: "asleen",
        rawAttributes: {
            color: "أخضر زمردي",
            material: "حرير",
            length: "ماكسي",
            sleeves: "كم طويل",
            neckline: "ياقة عالية",
            fit: "مخصر",
            silhouette: "A-Line"
        }
    },
    {
        id: "p2",
        title: "فستان سهرة أسود شيفون بدون أكمام",
        price: 300,
        currency: "SAR",
        imageUrl: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=500&auto=format&fit=crop",
        productUrl: "https://mtjr.at/rY6YOtAGkB",
        storeName: "laura",
        rawAttributes: {
            color: "أسود",
            material: "شيفون",
            length: "ماكسي",
            sleeves: "بدون أكمام",
            neckline: "ياقة V",
            fit: "واسع",
            silhouette: "مستقيم"
        }
    },
    {
        id: "p3",
        title: "عباية سهرة فخمة بقصة واسعة",
        price: 800,
        currency: "SAR",
        imageUrl: "https://images.unsplash.com/photo-1610433572201-110753c6cff9?w=500&auto=format&fit=crop",
        productUrl: "https://mtjr.at/Q2_9DITIA6",
        storeName: "joyce",
        rawAttributes: {
            color: "أسود",
            material: "كريب",
            length: "ماكسي",
            sleeves: "كم طويل",
            neckline: "ياقة دائرية",
            fit: "واسع جدا",
            silhouette: "واسع"
        }
    }
];

/**
 * Validates a value against an evaluation rule string in a very basic way.
 * In a production app with a complete JS evaluator or LLM agent, this would be robust.
 */
function evaluateScore(attributeValue, ruleString, maxWeight) {
    if (!attributeValue) return 0;

    const val = String(attributeValue).toLowerCase();
    const rule = String(ruleString).toLowerCase();

    // Very naive heuristic scoring based on simple text includes
    // If the rule mentions the value or vice versa, give some points.
    if (rule.includes(val) || val.includes(rule)) {
        return maxWeight;
    }

    // Partial score fallback
    return Math.floor(maxWeight / 2);
}

/**
 * Evaluates a product against the Product Intelligence Engine's scoring model and filters.
 */
export function processProductsWithIntelligence(products, productDNA, scoringModel, filterRules) {
    const scoredProducts = [];

    for (const product of products) {
        let isExcluded = false;

        // 1. Apply Hard Filters
        if (filterRules && Array.isArray(filterRules)) {
            for (const filter of filterRules) {
                // Naive filter implementation. e.g. "sleeveType in ['sleeveless']"
                const rule = filter.rule.toLowerCase();
                const attrs = product.rawAttributes || {};

                if (rule.includes('price >') && product.price > 1000) { // simplified
                    isExcluded = true; break;
                }

                if (rule.includes('sleeve') && attrs.sleeves && rule.includes(attrs.sleeves.toLowerCase())) {
                    isExcluded = true; break;
                }

                if (rule.includes('length') && attrs.length && rule.includes(attrs.length.toLowerCase())) {
                    isExcluded = true; break;
                }
            }
        }

        if (isExcluded) continue;

        // 2. Apply Scoring Model
        let totalScore = 0;
        let matchDetails = [];

        if (scoringModel && scoringModel.criteria) {
            for (const criteria of scoringModel.criteria) {
                const weight = criteria.weight || 0;
                const key = criteria.key; // e.g. 'colorMatch', 'silhouetteMatch'
                const rule = criteria.evaluationRule;

                let earned = 0;
                const attrs = product.rawAttributes || {};

                // User's specific requested keys mapping:
                if (key === 'colorMatch' && attrs.color) earned = evaluateScore(attrs.color, rule + " " + (productDNA?.colors?.join(' ')), weight);
                if (key === 'silhouetteMatch' && attrs.silhouette) earned = evaluateScore(attrs.silhouette, rule + " " + productDNA?.silhouette, weight);
                if (key === 'lengthMatch' && attrs.length) earned = evaluateScore(attrs.length, rule + " " + productDNA?.length, weight);
                if (key === 'necklineMatch' && attrs.neckline) earned = evaluateScore(attrs.neckline, rule + " " + productDNA?.neckline, weight);
                if (key === 'sleeveMatch' && attrs.sleeves) earned = evaluateScore(attrs.sleeves, rule + " " + productDNA?.sleeves, weight);
                if (key === 'modestyMatch' && attrs.sleeves) earned = evaluateScore(attrs.sleeves, rule + " long sleeve maxi", weight);
                if (key === 'occasionMatch') earned = weight; // Assume occasion fits for mock

                totalScore += earned;
                matchDetails.push({ key, earned, weight });
            }
        } else {
            // Fallback score if no model provided
            totalScore = 50;
        }

        // Normalize score to 100 max just in case
        totalScore = Math.min(100, Math.floor(totalScore));

        // CRITICAL CONSTRAINT: Drop products with score < 65%
        if (totalScore >= 65) {
            scoredProducts.push({
                ...product,
                matchScore: totalScore,
                matchDetails: matchDetails
            });
        }
    }

    // 3. Sort Descending by Score
    return scoredProducts.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Dynamically fetch products using SerpApi across the 10 target stores.
 */
export async function fetchAndScoreProducts(searchQueries, productIntelligence) {
    console.log("Starting Real-Time Product Search via SerpApi...");

    // 1. Build the target domain string
    const storeKeywords = AFFILIATE_STORES.map(s => s.keyword).join(' OR ');

    // We use the first generated search query from the AI (usually the most accurate)
    let aiQuery = "فستان سهرة";
    if (searchQueries && searchQueries.length > 0) {
        aiQuery = searchQueries[0];
    }

    const finalGoogleQuery = `(${storeKeywords}) ${aiQuery}`;
    console.log("Executing Google Query:", finalGoogleQuery);

    let liveProducts = [];

    try {
        // Run against SerpApi
        const response = await axios.get('https://serpapi.com/search.json', {
            params: {
                engine: 'google',
                q: finalGoogleQuery,
                hl: 'ar',
                gl: 'sa', // Google Saudi Arabia
                api_key: SERPAPI_KEY
            }
        });

        const results = response.data.organic_results || [];
        console.log(`SerpApi returned ${results.length} organic results.`);

        // 2. Map Organic Results to Product Schema
        liveProducts = results.map((item, index) => {

            // Extract price if available in rich snippets
            let price = 0;
            if (item.rich_snippet && item.rich_snippet.top && item.rich_snippet.top.extensions) {
                const priceMatch = item.rich_snippet.top.extensions.join(" ").match(/[\d,.]+/);
                if (priceMatch) price = parseFloat(priceMatch[0].replace(/,/g, ''));
            }

            // Extract image from thumbnail or main image
            let imageUrl = item.thumbnail || "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop";

            // Determine Store Name
            let storeName = "متجر غير معروف";
            for (const store of AFFILIATE_STORES) {
                if (item.title.includes(store.title) || item.link.includes(store.title.replace(' ', ''))) {
                    storeName = store.title;
                    break;
                }
            }
            if (item.link.includes('shein')) storeName = "شي ان";
            if (item.link.includes('noon')) storeName = "نون";

            return {
                id: `live_${index}`,
                title: item.title,
                price: price || 400, // Fallback price 
                currency: "SAR",
                imageUrl: imageUrl,
                productUrl: item.link,
                storeName: storeName,
                // We use the snippet + title as the "rawAttributes" to allow the evaluator to find keyword matches
                rawAttributes: {
                    color: item.snippet + " " + item.title,
                    material: item.snippet + " " + item.title,
                    length: item.snippet + " " + item.title,
                    sleeves: item.snippet + " " + item.title,
                    neckline: item.snippet + " " + item.title,
                    fit: item.snippet + " " + item.title,
                    silhouette: item.snippet + " " + item.title
                }
            };
        });

    } catch (err) {
        console.error("SerpApi Fetch Error:", err);
        // Fallback to MOCK_PRODUCTS if API fails
        console.log("Falling back to MOCK_PRODUCTS due to API failure.");
        liveProducts = MOCK_PRODUCTS;
    }

    // 3. Pipe into Scoring Engine
    const scored = processProductsWithIntelligence(
        liveProducts,
        productIntelligence.productDNA,
        productIntelligence.scoringModel,
        productIntelligence.filterRules
    );

    return scored;
}
