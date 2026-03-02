import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
    console.warn("OpenAI API key is missing. Please set VITE_OPENAI_API_KEY in .env.local");
}

const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Web/React specific: allow calling OpenAI directly from frontend
});

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
        const productInject = topProduct ? `
### CRITICAL REAL-WORLD INJECTION (MANDATORY PHASE 1-2 DATA):
A real product has been successfully fetched from the database. YOU MUST formulate your entire JSON response around this EXACT item.

**REAL DATABASE PRODUCT DETAILS:**
- Exact Product Name: ${topProduct.title}
- Store: ${topProduct.storeName}
- Raw Description / Colors / Cuts: ${topProduct.rawAttributes?.color || ''}
- Direct Product URL: ${topProduct.productUrl}
- Affiliate Base URL: ${topProduct.affiliateBaseUrl || ''}
- Store Discount Code: ${topProduct.discountCode}
` : "";

        const prompt = `
### USER SELECTION DATA (MANDATORY ALIGNMENT):
0. THE TWO-TRACK PROTOCOL (CRITICAL! READ CAREFULLY):
${userPreferences.activeTrack?.includes('AI-Suggested')
                ? `> YOU ARE IN TRACK A (AI-SUGGESTED SCIENCE): 
    - Base your text analysis and design recommendations on fashion science to flatter the user's specific measurements: ${userPreferences.measurements?.bust}cm Bust, ${userPreferences.measurements?.waist}cm Waist, ${userPreferences.measurements?.hips}cm Hips.
    - Emphasize WHY the suggested cuts work for their specific body.`
                : `> YOU ARE IN TRACK B (STRICT MANUAL EXECUTION):
    - STICK 100% LITERALLY TO EVERY SELECTION PROVIDED BELOW.
    - ZERO artistic deviation in the structural elements.`
            }

1. Garment Essence:
   - Type: ${userPreferences.clothingType || 'Haute Couture Dress'}
   - Purpose: ${userPreferences.occasion || 'Evening'}

2. Structural Blueprint (Fixed):
   - Silhouette: ${userPreferences.silhouette || 'Default/Designer choice'}
   - Total Length: ${userPreferences.clothingLength || 'Default/Designer choice'}
   - Waist Execution: ${userPreferences.waistStyle || 'Default/Designer choice'}
   - Back Architecture: ${userPreferences.backDesign || 'Default/Designer choice'}

3. Upper Body Engineering (Strict Constraint):
   - Neckline: ${userPreferences.neckline || 'Default/Designer choice'}
   - Collar Detail: ${userPreferences.collarStyle || 'Default/Designer choice'}
   - Sleeve Construction: ${userPreferences.sleevesLength || 'Default/Designer choice'} with ${userPreferences.sleevesStyle || 'Default/Designer choice'} style.

4. Material & Texture Matrix:
   - Fabrics: ${userPreferences.fabricMaterial || 'Luxury Fabric'}
   - Print/Pattern: ${userPreferences.fabricPattern || 'Solid'}
   - Embellishments: ${userPreferences.fabricEmbroidery || 'None'}

5. Visual Identity & Anatomy:
   - Model Body Type: ${userPreferences.bodyType || 'Average'}
   - Exact Measurements: ${JSON.stringify(userPreferences.measurements)}
   - Model Appearance: Skin Tone: ${userPreferences.skinTone || 'Natural'}, Hair: ${userPreferences.hairStyle || 'Stylish'}, Colors: ${userPreferences.colors || 'Designer Choice'} (Hex: ${userPreferences.customColorHex || 'N/A'}).

6. Custom Vision Integration:
   - Additional Instructions: "${userPreferences.customDescription || 'None'}"

### NEGATIVE CONSTRAINTS (FORBIDDEN):
- NO V-neck if 'High Neck' or 'Round' is selected.
- NO sleeveless if 'Long Sleeves' is selected.
- NO solid colors if 'Floral' or 'Jacquard' is selected.
- NO artistic liberty that alters the technical construction of the selected neck, sleeve, or length.
${productInject}
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: prompt }
            ],
            temperature: 0.8, // Slightly higher for more creative couture designs
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content);
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
