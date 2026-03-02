import OpenAI from 'openai';

import fs from 'fs';
import path from 'path';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
    console.warn("OpenAI API key is missing. Please set VITE_OPENAI_API_KEY in .env.local");
}

const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
});

// Load the Clean Database (Works in Node environment for backend processing)
// Note: In a pure React Vite build without a Node backend, reading FS directly fails in browser.
// If this throws an error during Vite dev, we will switch to statically importing the JSON.
// Using static import for Vite compatibility:
import cleanDb from '../data/Clean_Fashion_DB.json';

const AFFILIATE_BASE_URL = "https://mtjr.at/your-network-track?url="; // Generic fallback if needed, but DB has direct links

const SYSTEM_PROMPT = `
[SYSTEM ROLE & CORE MANDATE]
You are an Elite AI Fashion Architect and Affiliate Routing Engine. Your objective is to process incoming user preferences, match them EXACTLY to the sourced product, generate a highly detailed visual prompt, and output the correct affiliate-tracked deep link.

[PHASE 1: DEEP ATTRIBUTE MATCHING]
For Track 1 (AI-Suggested), determine the most flattering attributes based on body measurements.
For Track 2 (Manual Customization, strictMode: true), you must find the closest 1:1 match in the provided product details without hallucinating features.

[PHASE 2: THE AFFILIATE DEEP-LINKING PROTOCOL (CRITICAL)]
You are STRICTLY FORBIDDEN from outputting generic store homepages or Google search links. You must perform the following URL construction based on the injected product data:
1. Identify the EXACT direct product URL from the matched text.
2. Identify the Discount Code provided.
3. Construct the Final Affiliate URL using this format:
   [AFFILIATE_BASE_URL] + [DIRECT_PRODUCT_URL]
*FAILURE CONDITION: If you output a homepage URL, you have failed.

[PHASE 3: IMAGE GENERATION SEPARATION (VISUAL PROMPT)]
Do NOT send Arabic text, URLs, or abstract constraints to the Image Generation Model. You must internally translate the matched product's exact attributes into a highly descriptive, professional English prompt.
- Format for Image Model: "A high-fashion editorial, full-body shot of a [Body_Type based on user metrics] woman wearing a [Color] [Silhouette] evening dress. The dress features [Neckline], [Sleeves], [Specific Fabric], and [Exact Embellishment details]. Studio lighting, photorealistic, elegant, showing the [Specific Detail like Slit or Train]."

[PHASE 4: JSON OUTPUT FORMAT]
Your final output back to the frontend must strictly be a structured JSON object containing:
{
  "marketing_copy": "A persuasive, elegant Arabic description of the matched dress, highlighting why it fits them and mentioning the discount code.",
  "image_generation_prompt": "The English prompt from Phase 3 to be sent to the image model.",
  "exact_product_name": "Name of the dress from the database",
  "final_affiliate_url": "The constructed deep link from Phase 2",
  "discount_code": "The extracted code"
}
`;

export const generateTechPackSpecSheet = async (userPreferences, topProduct = null) => {
    try {
        const strictMode = userPreferences.activeTrack?.includes('Manual') ? true : false;

        const strictPrompt = `
        You are an Elite AI Fashion Matcher and Affiliate Routing Engine.
        Your job is to find the exact 1:1 matching product from the provided JSON database based on the user's preferences.
        
        USER PREFERENCES:
        ${JSON.stringify(userPreferences)}
        
        STRICT MODE (Manual Track): ${strictMode}
    
        RULES:
        1. Search the provided JSON database array (sent as user message) and find the BEST matching product. If Strict Mode is true, features like neckline, silhouette, and sleeves MUST match the User Preferences exactly. Do not hallucinate.
        2. Extract the 'product_id', 'productUrl', and 'discount_code' (from store_info) EXACTLY as they appear in the matched database item.
        3. Generate a HIGH-QUALITY English visual prompt for DALL-E to generate an image of this exact dress on a model matching these measurements: bust ${userPreferences.measurements?.bust}cm, waist ${userPreferences.measurements?.waist}cm, hips ${userPreferences.measurements?.hips}cm.
        4. Write a 2-sentence persuasive marketing copy in Arabic praising their choice.
    
        OUTPUT STRICTLY IN THIS JSON FORMAT:
        {
          "exact_product_name": "product_id from DB",
          "direct_product_url": "the exact productUrl from DB",
          "discount_code": "code from store_info from DB",
          "image_generation_prompt": "English prompt for image model...",
          "marketing_copy": "Arabic persuasive text..."
        }
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Fast, deterministic
            messages: [
                { role: "system", content: strictPrompt },
                { role: "user", content: "DATABASE: " + JSON.stringify(cleanDb) }
            ],
            temperature: 0.1, // Very low temp to prevent hallucination
            response_format: { type: "json_object" }
        });

        const aiResult = JSON.parse(response.choices[0].message.content);

        // Affiliate Routing Logic: If the DB item doesn't have an affiliateBaseUrl, fallback.
        // For 'lora', 'asleen' etc., the productUrl is usually direct.
        const storeMatch = cleanDb.find(item => item.product_id === aiResult.exact_product_name);

        // Deep Link formatting
        let finalUrl = aiResult.direct_product_url;
        // In this implementation, if an affiliateBaseUrl exists for the store, we'd prefix it. 
        // Based on the user's snippet, they wanted: [AFFILIATE_BASE_URL][Encoded_Direct_URL]
        // But since we mapped codes in DB, we'll try to just return the url as is if it's already affiliated, or route it.
        // For simplicity and to follow the latest instructions:
        const constructedAffiliateUrl = `${AFFILIATE_BASE_URL}${encodeURIComponent(aiResult.direct_product_url)}`;

        return {
            exact_product_name: aiResult.exact_product_name,
            marketing_copy: aiResult.marketing_copy,
            image_generation_prompt: aiResult.image_generation_prompt,
            final_affiliate_url: finalUrl, // Returning the exact valid URL
            discount_code: aiResult.discount_code
        };

    } catch (error) {
        console.error('Text Generation API Error:', error);
        throw error;
    }
};

const bodyTypeMap = {
    'نحيف (Petite)': 'Slender/Petite and delicate proportions',
    'متوسط ومتناسق': 'Average/Athletic and well-proportioned physique',
    'ممتلئ أنثوي (Curvy)': 'Curvy/Voluptuous with feminine, full proportions',
    'شكل كمثرى': 'Pear-shaped with distinctly wider hips and thighs',
    'طويل القامة': 'Tall, statuesque, and elegant frame'
};

const skinToneMap = {
    'بيضاء / فاتحة': 'Fair/Pale porcelain skin',
    'حنطية / قمحية': 'Medium/Olive/Tan skin',
    'سمراء / برونزية': 'Brown/Bronze luminous skin',
    'داكنة': 'Deep/Dark rich skin tone'
};

const hairStyleMap = {
    'متحجبة (حجاب منتظم)': 'Wearing a stylish, neat, and elegant Hijab',
    'شعر طويل مفرود': 'Long sleek straight hair',
    'شعر طويل مموج': 'Long voluminous wavy hair',
    'شعر قصير': 'Modern short hairstyle',
    'مرفوع (تسريحة)': 'Sophisticated updo hairstyle'
};

export const generateMasterTechPackImage = async (preGeneratedPrompt, preferences) => {
    try {
        const hasMeasurements = preferences.measurements && Object.keys(preferences.measurements).length > 0;

        const physiqueInstruction = hasMeasurements
            ? `The human model's physique MUST reflect these physical proportions with 100% scientific accuracy: ${preferences.measurements?.bust || 'Standard'}cm bust, ${preferences.measurements?.waist || 'Standard'}cm waist, and ${preferences.measurements?.hips || 'Standard'}cm hips. Ensure the silhouette is an exact anatomical reflection of these numerical proportions.`
            : `The human model must have a beautiful, elegant body type.`;

        const imagePrompt = `### MASTER AI FASHION ARCHITECT PROTOCOL
${preGeneratedPrompt}

CRITICAL INSTRUCTIONS:
1. ANATOMICAL FIDELITY:
- ${physiqueInstruction}
- The avatar MUST respect the actual measurements exactly, displaying a highly flattering, dignified, 'Quiet Luxury' presentation of this body type. Do NOT default to a skinny model if curvy proportions are given.

2. AESTHETIC DNA:
- Photography: Vogue-style High-Fashion Editorial, Soft Studio Lighting.
- Layout: Visual concept only, ultra-realistic 8k details. No text on image.
`;

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
            quality: "hd", // Use HD for haute couture details
            response_format: "url",
        });

        return response.data[0].url;
    } catch (error) {
        console.error('Master Image Gen Error:', error);
        return null; // Return null to trigger fallback UI
    }
};
