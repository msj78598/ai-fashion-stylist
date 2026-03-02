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
You are a High-End Fashion Engineering & Matching Agent. Your primary function is to act as an absolute bridge between user inputs and the specific product database. 
You possess ZERO creative liberty to alter, merge, or ignore user selections. You must strictly enforce mutual exclusivity (e.g., a dress cannot be both 'V-Neck' and 'High Neck' simultaneously).

[USER JOURNEY: DUAL-TRACK EXECUTION LOGIC]
Based on the user's entry point, execute ONE of the following tracks with absolute precision:

>>> TRACK 1: AI-DRIVEN STYLIST (AUTO-SUGGESTION)
TRIGGER: User inputs physical metrics (Height, Weight, Body Type, Skin Tone, Hair) and selects the Occasion.
EXECUTION: 
- Apply global haute couture styling rules to determine the most flattering Silhouette, Neckline, and Color for the user's specific body metrics.
- Query the database (via logic) to find the closest exact existing product that matches these generated ideal specifications.

>>> TRACK 2: MANUAL CUSTOMIZATION (100% STRICT ADHERENCE)
TRIGGER: User manually selects step-by-step features.
EXECUTION:
- Treat every selected attribute as a HARD BOOLEAN FILTER (MUST INCLUDE).
- If the user selects 'V-Neck', immediately filter out any product with 'High Neck', 'Square', or 'Off-Shoulder'.
- DO NOT hallucinate features that were not explicitly selected.

[VISUAL GENERATION & AVATAR SCALING (FOR CAD ENGINE)]
- The generated fashion image and technical blueprint must match the matched product EXACTLY.
- The 3D model/avatar must be proportionally scaled to the user's exact input measurements (Bust, Waist, Hips). 

[UI/UX & PSYCHOLOGICAL MARKETING OUTPUT RULES]
When outputting the final result to the frontend, format the response to enforce specific psychological triggers:
1. PERSUASIVE COPYWRITING (In Professional Arabic - لغة عربية فصحى راقية): 
   - For Track 1: Explain *why* this design perfectly complements their specific body type (e.g., "The V-neck creates an elongated, elegant profile...").
   - For Track 2: Validate their excellent taste and confirm that their exact vision has been realized.

[OUTPUT FORMAT (STRICT JSON)]
All text values MUST be in Professional Arabic.
{
  "activeTrack": "AI_Suggested OR Manual_Customization",
  "analysis": "Architectural/Scientific analysis in elegant Arabic, applying the psychological marketing rules above.",
  "designRecommendation": {
    "title": "Design Name (Arabic)",
    "description": "Creative marketing description praising the user/choice as per the rules.",
    "fabric": "Scientific fabric analysis based on occasion.",
    "billOfMaterials": "Technical components.",
    "tailoringInstructions": "1:1 technical steps for the tailor based on measurements."
  }
}
`;

export const generateTechPackSpecSheet = async (userPreferences, topProduct = null) => {
    try {
        const productInject = topProduct ? `
### CRITICAL REAL-WORLD INJECTION (MANDATORY):
A REAL product has already been sourced that PERFECTLY matches the user's constraints. You MUST write your entire design, marketing text, fabric choices, and descriptions to mathematically and visually match this exact product without letting the user know you found it. Make them believe YOUR expert design happens to perfectly match this item.

**REAL PRODUCT DETAILS YOU MUST DESCRIBE AS YOUR OWN DESIGN:**
- Final Recommended Title: ${topProduct.title}
- Found At: ${topProduct.storeName}
- Visual Details / Colors / Cuts (from snippet): ${topProduct.rawAttributes?.color || ''}

*Rule: If the real product is a "Chiffon Green Maxi with V-Neck", your written technical spec sheet must specify Chiffon, Green, Maxi, and V-Neck, regardless of the user's minor deviations, because this is the only purchasable item available.*
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

export const generateMasterTechPackImage = async (designDescription, preferences) => {
    try {
        const hasMeasurements = preferences.measurements && Object.keys(preferences.measurements).length > 0;
        const measurementText = `Keep the CAD sketch clean and professional as a technical blueprint without numerical text annotations, as they are already provided in the table.`;

        const bodyDesc = bodyTypeMap[preferences.bodyType] || preferences.bodyType || 'Average';
        const skinDesc = skinToneMap[preferences.skinTone] || preferences.skinTone || 'Natural';
        const hairDesc = hairStyleMap[preferences.hairStyle] || preferences.hairStyle || 'Stylish';

        const physiqueInstruction = hasMeasurements
            ? `The human model's physique MUST reflect these physical proportions with 100% scientific accuracy: ${preferences.measurements?.bust || 'Standard'}cm bust, ${preferences.measurements?.waist || 'Standard'}cm waist, and ${preferences.measurements?.hips || 'Standard'}cm hips. Ensure the silhouette is an exact anatomical reflection of these numbers (e.g., specific waist-to-hip ratio).`
            : `The human model must have a ${bodyDesc} body type.`;

        const customInspiration = preferences.customDescription ? `Incorporating specific client request: "${preferences.customDescription}". ` : "";
        const clothingTypeText = preferences.clothingType ? `Garment Type: ${preferences.clothingType}.` : "Garment Type: Haute Couture Dress. ";
        const lengthText = preferences.clothingLength ? `Strict Length / Cut Requirement: ${preferences.clothingLength}.` : "";
        const silhouetteText = preferences.silhouette ? `Silhouette: ${preferences.silhouette}.` : "";
        const necklineText = preferences.neckline ? `Neckline: ${preferences.neckline}.` : "";
        const collarText = preferences.collarStyle ? `Collar: ${preferences.collarStyle}.` : "";
        const sleevesLengthText = preferences.sleevesLength ? `Sleeves Length: ${preferences.sleevesLength}.` : "";
        const sleevesStyleText = preferences.sleevesStyle ? `Sleeves Style: ${preferences.sleevesStyle}.` : "";
        const waistText = preferences.waistStyle ? `Waist: ${preferences.waistStyle}.` : "";
        const backDesignText = preferences.backDesign ? `Back Design: ${preferences.backDesign}.` : "";

        const fabricMaterialText = preferences.fabricMaterial ? `Fabric Base Material: ${preferences.fabricMaterial} (Make this texture extremely obvious).` : "";
        const fabricPatternText = preferences.fabricPattern ? `Fabric Pattern: ${preferences.fabricPattern}.` : "";
        const fabricEmbroideryText = preferences.fabricEmbroidery ? `Embroidery / Embellishments: ${preferences.fabricEmbroidery}.` : "";
        const customColorText = preferences.customColorHex ? `CRITICAL COLOR REQUIREMENT: The ENTIRE garment MUST be prominently featuring this exact color HEX code: ${preferences.customColorHex}.` : "";

        const imagePrompt = `### MASTER AI FASHION ARCHITECT PROTOCOL
Generate a world-class Haute Couture 'Visual Master Board'. 

1. THE TWO-TRACK PROTOCOL (CRITICAL! READ CAREFULLY):
${preferences.activeTrack?.includes('AI-Suggested')
                ? `> YOU ARE IN TRACK A (AI-SUGGESTED SCIENCE): 
    - Base your design on fashion science to flatter the user's specific measurements: ${preferences.measurements?.bust || 'Standard'}cm Bust, ${preferences.measurements?.waist || 'Standard'}cm Waist, ${preferences.measurements?.hips || 'Standard'}cm Hips.
    - If they are curvy, emphasize the waist. If they are slender, add structure. 
    - You have creative freedom to override minor user selections to create the MOST PERFECT, flattering dress for this specific body type.`
                : `> YOU ARE IN TRACK B (STRICT MANUAL EXECUTION):
    - STICK 100% LITERALLY TO EVERY SELECTION: ${clothingTypeText} ${silhouetteText} ${lengthText} ${necklineText} ${sleevesLengthText} ${fabricMaterialText}
    - ZERO artistic deviation. If they chose "Round Neck", it MUST be round. If "No Sleeves", it MUST be sleeveless.`
            }

2. THE GOLDEN RULE (100% CAD ALIGNMENT): 
- The garment worn by the photorealistic model on the LEFT and the CAD blueprint on the RIGHT MUST BE EXACTLY IDENTICAL in every single detail, cut, proportion, and embellishment. It must be unmistakably the same dress.

3. ANATOMICAL FIDELITY (SCIENTIFIC):
- The mannequin/model must be an exact anatomical reflection of the provided measurements: ${preferences.measurements.bust}cm bust, ${preferences.measurements.waist}cm waist, ${preferences.measurements.hips}cm hips.
- ${physiqueInstruction}


3. DESIGN DNA (OUT-PRINT STYLE):
- Photography: Vogue-style High-Fashion Editorial, Soft Side-Lighting, 85mm. 
- Atmosphere: Minimal Luxury Showroom.
- Composition: LEFT (Photorealistic front/back views) | RIGHT (Clean Black & White Vector CAD Blueprint - NO HUMAN MODEL).

4. SPECIFICATIONS:
- Colors: ${customColorText}
- Skin/Hair: ${skinDesc}, ${hairDesc}
- Technical Guidelines: ${designDescription}.

### NEGATIVE CONSTRAINTS:
- NO V-neck if High Neck/Round is selected.
- NO sleeveless if sleeves are expected.
- No human on CAD side.
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
