// src/services/productApi.js
// Placeholder product API service. In a real implementation, these would call
// external APIs or your backend to search for products on Shein, Noon, and Aslen.
// For now we return static mock data that includes the affiliate link provided
// by the user.

/**
 * Mock product structure
 * @typedef {Object} Product
 * @property {string} name - Product name
 * @property {string} price - Price string
 * @property {string} image - Image URL (placeholder)
 * @property {string} store - Store identifier ('shein' | 'noon' | 'aslen')
 * @property {string} affiliateLink - Affiliate URL for the product
 */

/**
 * Search Shein products (placeholder).
 * @param {string} query
 * @returns {Promise<Product[]>}
 */
export async function searchShein(query) {
    // TODO: integrate real Shein API.
    return [];
}

/**
 * Search Noon products (placeholder).
 * @param {string} query
 * @returns {Promise<Product[]>}
 */
export async function searchNoon(query) {
    // TODO: integrate real Noon API.
    return [];
}

/**
 * Search Aslen products (placeholder). Returns a single mock product using the
 * affiliate link supplied by the user.
 * @param {string} query
 * @returns {Promise<Product[]>}
 */
export async function searchAslen(query) {
    const affiliateLink = "https://mtjr.at/ZKAz8nr-Vm";
    const mockProduct = {
        name: `منتج Aslen مرتبط بـ "${query}"`,
        price: "قريباً",
        image: "https://via.placeholder.com/150", // placeholder image
        store: "aslen",
        affiliateLink,
    };
    return [mockProduct];
}
