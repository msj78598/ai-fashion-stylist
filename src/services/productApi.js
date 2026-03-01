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

import productDatabase from '../data/productDatabase.json';

const AFFILIATE_STORES = [
    { title: "لورا فاشن", baseUrl: 'https://mtjr.at/rY6YOtAGkB' },
    { title: "فساتين جويس", baseUrl: 'https://mtjr.at/Q2_9DITIA6' },
    { title: "فساتين ندش", baseUrl: 'https://mtjr.at/5dSA-q_GkV' },
    { title: "فساتين شموخ", baseUrl: 'https://mtjr.at/cwU8lc5q5t' },
    { title: "بوتيك نوف", baseUrl: 'https://mtjr.at/faWBo8or-0' },
    { title: "فساتين حلوه", baseUrl: 'https://mtjr.at/5dAVNxhXWO' },
    { title: "Stayl Haven", baseUrl: 'https://mtjr.at/fvS7XePT3o' },
    { title: "فساتين آسلين", baseUrl: 'https://mtjr.at/ZKAz8nr-Vm' }
];

// We are shifting from generic search URLs to the Deep Linking Protocol.
// Store specific discount codes (user provided examples)
const STORE_DISCOUNT_CODES = {
    "لورا فاشن": "F-ZLHNl",
    "فساتين آسلين": "F-MDU4N",
    "بوتيك نوف": "F-ZLHNl",
    "stayl haven": "F-MDU4N"
};

// Fallback logic for links if needed, but we rely on the scraped direct links.

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
 * Smart Keyword Matcher for Arabic Descriptions
 * Extracts logic words from the AI Rule and checks if they exist in the deeply scraped Product Description.
 */
function evaluateScore(attributeValue, ruleString, maxWeight) {
    if (!attributeValue || !ruleString) return 0;

    const val = String(attributeValue).toLowerCase();
    const rule = String(ruleString).toLowerCase();

    // Exact or direct inclusion check (First Pass)
    if (rule.includes(val) || val.includes(rule)) {
        return maxWeight;
    }

    // Keyword Extraction Check (Second Pass - for Deep Crawler Text)
    // Extract words longer than 2 chars from the AI rule
    const ruleWords = rule.replace(/[^\w\s\u0600-\u06FF]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !['بدون', 'على', 'من', 'في', 'مع', 'أو', 'او'].includes(w));

    // If any significant keyword from the rule exists in the product text, award full points
    const hasMatch = ruleWords.some(keyword => val.includes(keyword));

    if (hasMatch) {
        return maxWeight;
    }

    // No match
    return 0;
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

                // Safely convert arrays to strings if PIE generated an array
                const safeColor = Array.isArray(productDNA?.colors) ? productDNA.colors.join(' ') : productDNA?.colors || '';

                // User's specific requested keys mapping:
                if (key === 'colorMatch' && attrs.color) earned = evaluateScore(attrs.color, rule + " " + safeColor, weight);
                else if (key === 'silhouetteMatch' && attrs.silhouette) earned = evaluateScore(attrs.silhouette, rule + " " + productDNA?.silhouette, weight);
                else if (key === 'lengthMatch' && attrs.length) earned = evaluateScore(attrs.length, rule + " " + productDNA?.length, weight);
                else if (key === 'necklineMatch' && attrs.neckline) earned = evaluateScore(attrs.neckline, rule + " " + productDNA?.neckline, weight);
                else if (key === 'sleeveMatch' && attrs.sleeves) earned = evaluateScore(attrs.sleeves, rule + " " + productDNA?.sleeves, weight);
                else if (key === 'modestyMatch' && attrs.sleeves) earned = evaluateScore(attrs.sleeves, rule + " long sleeve maxi المحتشم", weight);
                else if (key === 'occasionMatch') earned = weight; // Assume occasion fits for mock

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
 * Dynamically fetch products using the local pre-scraped Product Database.
 * No longer relying on external SerpApi calls.
 */
export async function fetchAndScoreProducts(searchQueries, productIntelligence) {
    console.log("Starting Local Database Product Search...");
    console.log(`Database loaded with ${productDatabase.length} products.`);

    // 1. Prepare products with Direct Links and Discount Codes (Deep Linking Protocol)
    const preparedProducts = productDatabase.map(p => {
        const storeKey = p.storeName ? p.storeName.toLowerCase() : "";
        let code = "F-VIP"; // fallback

        // Try to match store name to discount code roughly
        if (storeKey.includes("لورا")) code = "F-ZLHNl";
        else if (storeKey.includes("آسلين") || storeKey.includes("aslen")) code = "F-MDU4N";
        else if (storeKey.includes("نوف")) code = "F-ZLHNl";

        return {
            ...p,
            // We NO LONGER overwrite the organic scraped URL. We preserve the exact deep link.
            discountCode: code
        };
    });

    // 2. Pipe into Scoring Engine
    const scored = processProductsWithIntelligence(
        preparedProducts,
        productIntelligence.productDNA,
        productIntelligence.scoringModel,
        productIntelligence.filterRules
    );

    return scored;
}
