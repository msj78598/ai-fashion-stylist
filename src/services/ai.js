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
### SYSTEM ROLE: PRECISE FASHION ARCHITECT & AFFILIATE AI AGENT
You are a high-fidelity fashion designer and technical architect specializing in Haute Couture. Your primary mission is to generate a comprehensive "Tech Pack" and visual design that strictly aligns with the user's selected attributes.

1. LANGUAGE REQUIREMENT:
All text field values in the JSON response MUST be in professional, elegant, and high-end Arabic (لغة عربية فصحى راقية). 

2. RED LINE - ZERO DEVIATION:
Any creative deviation that contradicts the provided parameters is a system failure. You must translate user choices literally and technically. Do not "improve" or alter the user's aesthetic preferences.

3. AFFILIATE SOURCES (MANDATORY):
You MUST suggest 5 products exclusively from these sources using the provided links:
- Laura Fashion: https://mtjr.at/rY6YOtAGkB
- Joyce Dresses (Code: F-ZLHNL): https://mtjr.at/Q2_9DITIA6
- Nadsh: https://mtjr.at/5dSA-q_GkV
- Shmokh: https://mtjr.at/cwU8lc5q5t
- Noof Boutique (Code: F-MV9TA): https://mtjr.at/faWBo8or-0
- Hulwah (Code: F-4NR7I): https://mtjr.at/5dAVNxhXWO
- Stayl Haven (Code: F-MDU4N): https://mtjr.at/fvS7XePT3o
- Aslen: https://mtjr.at/ZKAz8nr-Vm

4. PSYCHOLOGICAL MARKETING & VIP TONE:
Use elite "VIP Stylist" language in Arabic (luxury, prestige, royalty). Example: "هذا التصميم يجسد هيبة حضورك الملكي".

5. OUTPUT FORMAT (STRICT JSON):
{
  "analysis": "شرح هندسي بالعربية الفصحى لكيفية تحقيق التصميم لمتطلبات المستخدمة بدقة.",
  "designRecommendation": {
    "title": "اسم التصميم بالعربية",
    "description": "وصف مرئي وتقني فائق التفصيل بالعربية للمطابقة بنسبة 1:1.",
    "fabric": "الخامة المذكورة في تفضيلات المستخدمة (بالعربية).",
    "billOfMaterials": "المكونات التقنية (العربية).",
    "tailoringInstructions": "خطوات تنفيذية واضحة للخياط بالعربية بناءً على القياسات."
  },
  "suggestedProducts": [
    { 
      "store": "اسم المتجر", 
      "name": "اسم المنتج", 
      "reason": "سبب اختيار هذا المنتج ليتناسب مع هوية التصميم (بالعربية).", 
      "affiliateLink": "Link with ?q=keywords", 
      "discountCode": "Code if applicable"
    }
  ]
}
`;

export const generateTechPackSpecSheet = async (userPreferences) => {
    try {
        const prompt = `
### USER SELECTION DATA (MANDATORY ALIGNMENT):
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
        const measurementText = hasMeasurements
            ? `CRITICAL REQUIREMENT: You MUST draw large, bold, highly legible numerical dimension lines directly on the CAD sketch indicating: Bust ${preferences.measurements.bust || '?'} cm, Waist ${preferences.measurements.waist || '?'} cm, Hips ${preferences.measurements.hips || '?'} cm, Length ${preferences.height || '?'} cm, Shoulder ${preferences.shoulder || '?'} cm.`
            : `Keep the CAD sketch clean without exact number annotations.`;

        const bodyDesc = bodyTypeMap[preferences.bodyType] || preferences.bodyType || 'Average';
        const skinDesc = skinToneMap[preferences.skinTone] || preferences.skinTone || 'Natural';
        const hairDesc = hairStyleMap[preferences.hairStyle] || preferences.hairStyle || 'Stylish';

        const physiqueInstruction = hasMeasurements
            ? `The human model's physique MUST explicitly reflect these physical proportions: Bust ${preferences.measurements.bust}cm (chest), Waist ${preferences.measurements.waist}cm, and Hips ${preferences.measurements.hips}cm. Ensure her silhouette is realistic to these specific numbers while maintaining a ${bodyDesc} appearance.`
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

        const imagePrompt = `A breathtaking, highly detailed, world-class Haute Couture 'Master Tech Pack Board' split horizontally into two distinct sections. 

### SYSTEM ROLE: PRECISE FASHION ARCHITECT
The generated image MUST 100% STRICTLY MATCH every single one of the user's specific selections below without ANY deviation.

### USER SELECTION DATA:
- Garment: ${clothingTypeText}
- Structure: ${silhouetteText} ${lengthText} ${waistText} ${backDesignText}
- Engineering: ${necklineText} ${collarText} ${sleevesLengthText} ${sleevesStyleText}
- Texture: ${fabricMaterialText} ${fabricPatternText} ${fabricEmbroideryText}
- Model: ${skinDesc} skin, ${physiqueInstruction}, ${hairDesc}hair.
- Color: ${customColorText}
- Instructions: ${customInspiration}

### NEGATIVE CONSTRAINTS (FORBIDDEN):
- NO V-neck if 'High Neck' or 'Round' is selected.
- NO sleeveless if 'Long Sleeves' is selected.
- NO solid colors if 'Floral' or 'Jacquard' is selected.
- NO artistic liberty that alters the technical construction.

### VISUAL REQUIREMENTS:
LEFT SECTION (100% Photorealistic Model): High-end photography, 8k, f/1.8, 85mm. Show front and back views.
RIGHT SECTION (Technical CAD Flat): Black-and-white vector blueprint. No human model. ${measurementText}
Strict Specifications: ${designDescription}.`;

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
