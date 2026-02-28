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
أنت وكيل ذكي (Affiliate Fashion AI Agent) خبير في تصميم الأزياء الراقية (Haute Couture) وربطها بمنتجات حقيقية.
مهمتك الأساسية هي ابتكار "ملف تقني" (Tech Pack) وتحويل اختيارات المستخدمة إلى إطلالة متكاملة بمنتجات قابلة للشراء.

1. الالتزام الصارم بالمتطلبات (RED LINE - Zero Deviation):
- يجب أن يكون التصميم انعكاساً دقيقاً وحرفياً لكل الخيارات التي حددتها المستخدمة (نوع القماش، اللون، الأكمام، الصدر، الطول، الخ).
- أي مخالفة لخيارات المستخدمة تعتبر خطأ مهنياً فادحاً. لا تقم بـ "تحسين" ذوق العميلة أو إضافة خيارات لم تطلبها.
- التزم بـ "Design DNA" الموجود في مرجعيتك لضمان جودة الأسلوب.

2. المتاجر المعتمدة (Affiliate Sources):
يجب اختيار 5 منتجات لـ "suggestedProducts" من هذه القائمة الحصرية فقط بالروابط المخصصة:
- لورا فاشن: https://mtjr.at/rY6YOtAGkB
- فساتين جويس (كود: F-ZLHNL): https://mtjr.at/Q2_9DITIA6
- فساتين ندش: https://mtjr.at/5dSA-q_GkV
- فساتين شموخ: https://mtjr.at/cwU8lc5q5t
- بوتيك نوف (كود: F-MV9TA): https://mtjr.at/faWBo8or-0
- فساتين حلوه (كود: F-4NR7I): https://mtjr.at/5dAVNxhXWO
- Stayl Haven (كود: F-MDU4N): https://mtjr.at/fvS7XePT3o
- فساتين آسلين: https://mtjr.at/ZKAz8nr-Vm

قواعد اختيار المنتجات:
- المنتج الأول: الفستان الأقرب للتصميم (يفضل من Aslen أو Laura).
- المنتجات الأخرى: بدائل للفستان (Noon/Shein مسموح بها كبدائل عامة فقط إذا لم تتوفر في المتاجر أعلاه)، حذاء، حقيبة، إكسسوار.
- الروابط: ادمج الكلمات المفتاحية في نهاية الرابط لزيادة دقة البحث (مثال: [رابط المتجر]?q=[الكلمات]).

3. صياغة العبارات (Psychological Marketing):
- استخدم لغة VIP Stylist (أناقة، ندرة، ثقة). "هذا التصميم يجسد هيبة حضورك الملكي".

4. تنسيق JSON:
{
  "analysis": "شرح هندسي كيف يحقق التصميم متطلبات المستخدمة حرفياً وبروز الجمال.",
  "designRecommendation": {
    "title": "اسم التصميم",
    "description": "وصف دقيق جداً للمطابقة البصرية",
    "fabric": "الخامة المحددة بدقة",
    "billOfMaterials": "المواد التقنية",
    "tailoringInstructions": "تعليمات صارمة للخياط بناءً على المقاسات"
  },
  "suggestedProducts": [
    { 
      "store": "Aslen", 
      "name": "فستان...", 
      "reason": "...", 
      "affiliateLink": "...", 
      "discountCode": "كود الخصم (اختياري)"
    }
  ]
}
`;

export const generateTechPackSpecSheet = async (userPreferences) => {
    try {
        const prompt = `
      البيانات الشخصية:
      طبيعة الجسم: ${userPreferences.bodyType || 'غير محدد'}
      لون البشرة: ${userPreferences.skinTone || 'غير محدد'}
      ستايل الشعر: ${userPreferences.hairStyle || 'غير محدد'}
      
      المقاسات الدقيقة(إن وجدت):
      ${JSON.stringify(userPreferences.measurements)}
      
      المتطلبات الأساسية للتصميم:
      نوع الإطلالة أو الملابس: ${userPreferences.clothingType || 'فستان سهرة'}
المناسبة: ${userPreferences.occasion || 'سهرة'}
      الطول المفضل للإطلالة: ${userPreferences.clothingLength || 'غير محدد، اختر الأنسب'}
      القصة العامة(Silhouette): ${userPreferences.silhouette || 'نتركها لإبداعك'}
      قصة الصدر(Neckline): ${userPreferences.neckline || 'نتركها لإبداعك'}
      تصميم الياقة(Collar): ${userPreferences.collarStyle || 'بدون ياقة محددة'}
      طول الأكمام: ${userPreferences.sleevesLength || 'نتركها لإبداعك'}
      قصة الأكمام: ${userPreferences.sleevesStyle || 'نتركها لإبداعك'}
      تحديد الخصر: ${userPreferences.waistStyle || 'نتركها لإبداعك'}
      تصميم الظهر(Back Design): ${userPreferences.backDesign || 'نتركها لإبداعك'}
      
      المواد والخامات:
      خامة القماش الأساسية: ${userPreferences.fabricMaterial || 'غير محدد، اختر خامة راقية'}
      النقشة أو الطبعة(Pattern): ${userPreferences.fabricPattern || 'سادة'}
      التطريز والإضافات: ${userPreferences.fabricEmbroidery || 'بدون إضافات محددة'}
الألوان: ${userPreferences.colors || 'غير محدد'}
      لون مخصص بالـ Hex(إن وجد): ${userPreferences.customColorHex || 'لا يوجد'}
الميزانية: ${userPreferences.budget || 'غير محدد'}
      
      وصف أو إلهام خاص من العميل(Haute Couture Request):
      ${userPreferences.customDescription || 'لا يوجد وصف خاص، ابدع من خيالك كأفضل مصمم أزياء في العالم وقدم تصميم عصري جداً يواكب أحدث خطوط الموضة العالمية بناءً على نوع الإطلالة المطلوبة.'}
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

        const imagePrompt = `A breathtaking, highly detailed, world-class Haute Couture 'Master Tech Pack Board' split horizontally into two distinct sections. CRITICAL RED-LINE INSTRUCTION: The generated image MUST 100% STRICTLY MATCH every single one of the user's specific selections (color, sleeves, length, fabric, etc.) without ANY deviation or unrequested additions. The photorealistic section MUST look 100% real as if shot on an ultra-high-end camera. The overall aesthetic MUST be extremely modern, highly elegant, and luxurious.
        
        LEFT SECTION (100% Photorealistic Model): An incredibly realistic, editorial-quality human fashion portrait. A beautiful model (${skinDesc}, ${physiqueInstruction}, ${hairDesc}) wearing the meticulously tailored garment. ${customColorText} Show AT LEAST TWO distinct poses/angles of the model (e.g., Front full-body view and Back view) side-by-side.
    Lighting & Photography Style: Soft, flattering studio lighting, shot on 85mm lens, f/1.8 aperture, 8k resolution, photorealistic masterpiece.
        Texture & Elegance: The fabric draping, reflections (like satin/silk), and embellishments (like pearls/beads/feathers) MUST look 100% real, life-like, and physically plausible. The design must exude modern sophistication, neat cuts, and elite elegance.
        
        RIGHT SECTION (Technical CAD Flat): A precise, black-and-white vector blueprint of the EXACT SAME GARMENT shown on the left. Show front and back CAD views with clear seam lines, darts, pleats, and construction guidelines on a pure white background. DO NOT DRAW A HUMAN MODEL IN THIS RIGHT SECTION, ONLY THE GARMENT SKETCH.
        
        Strict Garment Specifications (DO NOT DEVIATE): ${designDescription}.
        ${clothingTypeText}${customInspiration}${lengthText}${silhouetteText}${necklineText}${collarText}${sleevesLengthText}${sleevesStyleText}${waistText}${backDesignText}${fabricMaterialText}${fabricPatternText}${fabricEmbroideryText}
        ${measurementText}
        
        This composite image MUST accurately represent the exact same elite haute couture piece in both 100% photorealistic high-fashion photography and technical blueprint formats. It must perfectly match all the provided specifications, maintaining an aura of ultra-modern, very elegant, and luxurious fashion.`;

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
