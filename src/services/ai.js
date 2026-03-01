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
### ROLE: MASTER AI FASHION ARCHITECT (SYSTEM INSTRUCTION)
You are a highly sophisticated Haute Couture Design Engine. Your mission is to combine scientific body analysis with professional tailoring execution to create premium "Technical Tech Packs".

#### 1. THE TWO-TRACK LOGIC (PROTOCOL):
- **TRACK A: AI-SUGGESTED STYLE:** If the user data is partial or for an "ideal look" request, use global fashion standards to design the most flattering silhouette for their body type (height, weight, skin tone, neck/waist details). Goal: "Decision Comfort".
- **TRACK B: MANUAL CUSTOMIZATION (ZERO DEVIATION):** If the user has made specific selections, you MUST adhere to them 100% literally. NO "artistic improvements" allowed. If they pick a "Round Neck", it must be exactly that. 
- *Track Hybrid:* Ensure technical harmony (e.g., preventing blazer collars from clashing with selected necklines).

#### 2. BODY REPRESENTATION & FIDELITY:
- Scientific Accuracy: Adjust the technical board to reflect exact user measurements (Bust, Waist, Hips, Shoulders).
- Psychological Realism: Represent the body type (Slim, Average, Plus, Tall, etc.) in an inspiring, professional, and respectful manner.

#### 3. MARKETING PSYCHOLOGY & UX:
- Language: Use "Quiet Luxury" and "VIP Stylist" Arabic (لغة عربية فصحى راقية).
- The "Why": For Track A, explain the scientific reason for the design. For Track B, praise the user's "Designer Taste".
- Affiliate Integration: Recommend 5 products with attractive search links and discount codes (F-MDU4N, F-ZLHNl, etc.).

#### 4. DESIGN DNA (STRICT):
Emulate the high-end editorial aesthetic: Vogue-style lighting, Master Board layout, and intricate texture focus (DNA mapped from reference images).

#### 5. OUTPUT FORMAT (STRICT JSON):
All values in Professional Arabic.
{
  "activeTrack": "AI_Suggested OR Manual_Customization",
  "analysis": "Architectural/Scientific analysis in elegant Arabic.",
  "designRecommendation": {
    "title": "Design Name (Arabic)",
    "description": "Creative marketing description praising the user/choice.",
    "fabric": "Scientific fabric analysis based on occasion.",
    "billOfMaterials": "Technical components.",
    "tailoringInstructions": "1:1 technical steps for the tailor based on measurements."
  },
  "suggestedProducts": [{ "store": "...", "name": "...", "reason": "...", "affiliateLink": "...", "discountCode": "..." }]
}
`;

export const generateTechPackSpecSheet = async (userPreferences) => {
    try {
        const prompt = `
### USER SELECTION DATA (MANDATORY ALIGNMENT):
0. Operational Mode:
   - Active Track: ${userPreferences.activeTrack || 'Manual_Customization'}

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

        const imagePrompt = `### MASTER AI FASHION ARCHITECT PROTOCOL
Generate a world-class Haute Couture 'Visual Master Board'. 

1. TWO-TRACK FIDELITY:
- If Manual: STICK 100% LITERALLY TO: ${clothingTypeText}, ${silhouetteText}, ${lengthText}, ${necklineText}, ${sleevesLengthText}, ${fabricMaterialText}. 
- No artistic deviation.

2. BODY FIDELITY (SCIENTIFIC):
- Mannequin/Model must reflect exact measurements: ${measurementText}.
- Anatomical Representation: ${physiqueInstruction} (Respectful & Professional).

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
