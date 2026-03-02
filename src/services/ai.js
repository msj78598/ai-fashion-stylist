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

        // Assemble separated avatar details into a cohesive instruction for the LLM
        const skin = userPreferences.skinTone || '';
        const shape = userPreferences.bodyShape || '';
        const hair = userPreferences.hairStyle || '';
        const avatarPref = `Skin Tone: ${skin}, Body Shape: ${shape}, Hair/Head Style: ${hair}`;

        const strictPrompt = `
        You are an Elite AI Fashion Matcher and Recommendation Engine.
        
        USER PREFERENCES:
        ${JSON.stringify(userPreferences)}
        
        AVATAR PREFERENCE: ${avatarPref}
        STRICT MODE (Manual Track): ${strictMode}
    
        YOUR MISSION (SMART ZONING ARCHITECTURE):
        Search the provided JSON database array. Instead of a random list of matches, categorize your findings into 4 STRICT ZONES.
        
        ZONE 1: exact_match (The Exact Match 100%)
        - Must match User Preferences (Color, Silhouette, Neckline, Sleeves) exactly. Max 1 item.
        - Write a main_marketing_text in Arabic praising this choice.
        
        ZONE 2: color_alternatives (Same Cut, Different Color)
        - Same Silhouette and Neckline, but a DIFFERENT color available in the DB.
        
        ZONE 3: silhouette_alternatives (Same Color/Neckline, Different Cut)
        - Same Color and Neckline, but an alternative cut (e.g. asked for Mermaid, found A-Line).
        
        ZONE 4: detail_alternatives (Same Color/Cut, Different Neckline/Sleeves)
        - Same Color and Silhouette, but different neckline or sleeves.

        VISUAL PROMPT LOGIC (CRITICAL):
        - If STRICT MODE = true (Manual Track): Build the "visual_prompt" strictly based on the User's Preferences literally (plus the Avatar Preference), regardless of whether you found a 100% exact_match product or not.
        - If STRICT MODE = false (AI-Suggested Track): Build the "visual_prompt" based on the exact features of the best available product you found in the database.

        NULL RULE: If a feature is "null" in the DB, consider it a wildcard. Do not crash.
        GRACEFUL DEGRADATION: If you cannot find an exact match, try your hardest to fill the alternative zones.
    
        OUTPUT STRICTLY IN THIS JSON FORMAT. If a zone has no relevant products, return an empty array [] for that key:
        {
          "visual_prompt": "English prompt based on the logic rules above AND the user's Avatar preference",
          "main_marketing_text": "Arabic text praising the choice",
          "exact_match": [
            {
              "product_id": "exact id from DB",
              "direct_product_url": "the exact productUrl from DB",
              "discount_code": "code from store_info",
              "match_reason": "Arabic text explaining the match (e.g., 'تطابق مثالي 100% مع اختياراتك')"
            }
          ],
          "color_alternatives": [
            { "product_id": "id", "direct_product_url": "url", "discount_code": "code", "match_reason": "Arabic reasoning (e.g., 'نفس تصميمك المفضل.. ولكن بلون مختلف')" }
          ],
          "silhouette_alternatives": [
            { "product_id": "id", "direct_product_url": "url", "discount_code": "code", "match_reason": "Arabic reasoning" }
          ],
          "detail_alternatives": [
            { "product_id": "id", "direct_product_url": "url", "discount_code": "code", "match_reason": "Arabic reasoning" }
          ]
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

        // Secure Routing Logic: Return direct URLs without dummy link wrappers
        const wrapAffiliate = (array) => {
            if (!Array.isArray(array)) return [];
            return array.map(match => ({
                ...match,
                final_affiliate_url: match.direct_product_url
            }));
        };

        return {
            marketing_copy: aiResult.main_marketing_text,
            image_generation_prompt: aiResult.visual_prompt,
            exact_match: wrapAffiliate(aiResult.exact_match),
            color_alternatives: wrapAffiliate(aiResult.color_alternatives),
            silhouette_alternatives: wrapAffiliate(aiResult.silhouette_alternatives),
            detail_alternatives: wrapAffiliate(aiResult.detail_alternatives)
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
