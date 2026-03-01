// src/services/dynamicInventory.js
import productDatabase from '../data/productDatabase.json';

/**
 * Extracts pure Arabic keywords from a long descriptive option string.
 * Example: "ألوان داكنة (عنابي، زيتي، كحلي، أسود)" 
 * -> ["ألوان", "داكنة", "عنابي", "زيتي", "كحلي", "أسود"]
 */
function extractKeywords(optionText) {
    if (!optionText) return [];

    // Remove non-Arabic characters, brackets, slashes
    const cleanText = optionText.replace(/[a-zA-Z0-9\(\)\/]/g, ' ').replace(/[-_،,؛;]/g, ' ');

    // Split into words, filter out common stop words and tiny words
    const stopWords = ['في', 'من', 'على', 'او', 'أو', 'مع', 'بدون', 'إلى', 'عن', 'ذات', 'شكل', 'قصة', 'طول', 'تفاصيل', 'نوع'];
    const words = cleanText.split(/\s+/).filter(w => {
        return w.length > 2 && !stopWords.includes(w);
    });

    return words;
}

/**
 * Filters the static IntakeForm questions against the current 300+ product database.
 * If an option has absolutely zero products matching its keywords, it is hidden.
 */
export function getFilteredQuestions(staticQuestions) {
    if (!productDatabase || productDatabase.length === 0) {
        return staticQuestions; // Fallback if DB is empty
    }

    // Combine all text from all products into one massive searchable string for extreme performance
    // Since it's only 300 products, joining them is very fast and easy to search against
    const globalInventoryText = productDatabase.map(p =>
        (p.title + " " + (p.rawAttributes?.fullDescription || "")).toLowerCase()
    ).join(" | ");

    // We don't want to filter foundational logic questions, only style choices.
    const questionsToFilter = [
        'clothingType', 'occasion', 'silhouette', 'clothingLength', 'neckline',
        'collarStyle', 'sleevesLength', 'sleevesStyle', 'waistStyle',
        'backDesign', 'fabricMaterial', 'fabricPattern', 'fabricEmbroidery', 'colors'
    ];

    // Some options must ALWAYS be kept to prevent breaking the flow or because they denote "Skip" or "Custom"
    const alwaysKeepOptions = [
        'المسار الآلي', 'المسار اليدوي', 'تحديد درجة لون مخصصة',
        'تصميم نظيف بدون إضافات', 'لبس يومي / كاجوال أنيق', 'سفر وعطلة'
    ];

    return staticQuestions.map(q => {
        // If it's an input field or a textarea, or a question we don't want to filter, return it as is
        if (!questionsToFilter.includes(q.id) || !q.options) {
            return q;
        }

        const filteredOptions = q.options.filter(option => {
            // Keep foundational options
            if (alwaysKeepOptions.some(ak => option.includes(ak))) return true;

            const keywords = extractKeywords(option);
            // If we couldn't parse the option into keywords, keep it just in case
            if (keywords.length === 0) return true;

            // Check if ANY of the extracted Arabic keywords exist ANYWHERE in the global database text.
            // A match of just 1 relevant keyword means there's at least one dress that *might* fit.
            const isAvailable = keywords.some(kw => globalInventoryText.includes(kw));

            return isAvailable;
        });

        // Safety Catch: If filtering resulted in ZERO options, it means our keyword extraction was too strict.
        // We revert to the original options so the UI doesn't break completely.
        if (filteredOptions.length === 0) {
            console.warn(`[Smart Intake] Kept all static options for '${q.id}' (All filtered out by database).`);
            return q;
        }

        return { ...q, options: filteredOptions };
    });
}
