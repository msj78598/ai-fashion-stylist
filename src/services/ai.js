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
أنت مصمم أزياء رئيسي (World-Class Haute Couture Master Designer) وخبير باترونات عالمي.
تصميماتك تنافس أرقى دور الأزياء في باريس وميلانو (مثل إيلي صعب، شانيل، ديور).
بناءً على مقاسات وتفضيلات المستخدمة (ووصفها الخاص إن وُجد)، ابتكر "الملف التقني" (Tech Pack Spec Sheet) الخاص بالفستان للمصنع والخياط الماهر.

يجب ألا يكون التصميم عادياً أبداً. يجب أن يكون استثنائياً، مذهلاً، ويحتوي على تفاصيل دقيقة جداً (Haute Couture Details) مع شرح هندسي دقيق لكيفية تنفيذه.

1. التحليل والمقاسات:
اشرح هندسياً وبمصطلحات الموضة الراقية كيف يناسب التصميم شكل جسمها ويبرز جماله.
استخدم المقاسات الدقيقة لوضع تعليمات صارمة (مثال: "نظراً لأن الخصر 70 سم، اعتمدي كورسيه مدمج بتصميم فرنسي مع بنسات عميقة...").

2. البدائل والكماليات الجاهزة (Noon & Shein Affiliate Focused):
العميلة تبحث عن إطلالة متكاملة يمكن شراؤها فوراً تقارب التصميم الذي ابتكرته. 
يجب عليك دائماً إنتاج 4 اقتراحات تسوق تفصيلية ومغرية جداً في مصفوفة "suggestedProducts":
1. الفستان الأقرب للتصميم (من متجر Noon)
2. الفستان الأقرب للتصميم (من متجر Shein)
3. حذاء يكمل الإطلالة (اختر Noon أو Shein)
4. حقيبة أو إكسسوار يكمل الإطلالة (اختر Noon أو Shein)

البيانات المطلوبة لكل منتج:
- "store": اكتب "Noon" أو "Shein".
- "name": الكلمة المفتاحية للبحث بدقة شديدة (مثال: "فستان سهرة دانتيل أسود").
- "reason": عبارة تسويقية جذابة تقنع العميلة لماذا هذا المنتج يكمل إطلالتها!
- "affiliateLink": رابط البحث المباشر مع التتبع:

إذا كان المتجر Noon:
https://www.noon.com/saudi-ar/search/?q=[كلمة البحث]&utm_campaign=CMPa5461f39a36enoon&utm_medium=AFF2557e74f8cb6&adjust_deeplink_js=1&utm_source=C1000264L

إذا كان المتجر Shein (صيغة كود البحث في شي إن هي pdsearch):
https://ar.shein.com/pdsearch/[كلمة البحث]?onelink=31/5huksr9tehbe&requestId=olw-5huktcz5temb&url_from=affiliate_koc_4471841330&campaign_id=925&behaviorId=campaign.baf41253-5918-49ae-b9a9-cf1d04b937f5

3. تنسيق JSON فقط:
{
  "analysis": "شرح لسبب اختيار التصميم وملاءمته للجسم، بأسلوب مصمم عالمي ينصح عميلته الـ VIP.",
  "designRecommendation": {
    "title": "اسم التصميم (مثال: فستان سهرة ملكي مرصع بالكريستال)",
    "description": "وصف دقيق جداً ومرئي للحظة رؤية الفستان لتوليد صور مذهلة",
    "fabric": "نوع وتكوين القماش الفاخر (مثال: تول فرنسي مطرز يدوياً مع بطانة من الحرير الخالص)",
    "billOfMaterials": "قائمة بالمواد الدقيقة (أمتار القماش، نوع الكريستال، سحاب مخفي YKK، دعامات كورسيه ماركة كذا)",
    "tailoringInstructions": "نصائح دقيقة جداً للخياط الماهر: تفاصيل البنسات (Darts)، الكسرات، أماكن الخياطة المخفية، تقنيات الدرابيه (Draping)، حشوات الصدر، وكيفية التعامل مع القماش الفاخر المختار."
  },
  "suggestedProducts": [
    { "store": "Noon", "name": "فستان...", "reason": "...", "affiliateLink": "..." },
    { "store": "Shein", "name": "فستان...", "reason": "...", "affiliateLink": "..." },
    { "store": "...", "name": "حذاء...", "reason": "...", "affiliateLink": "..." },
    { "store": "...", "name": "حقيبة...", "reason": "...", "affiliateLink": "..." }
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
      
      المقاسات الدقيقة (إن وجدت):
      ${JSON.stringify(userPreferences.measurements)}
      
      المتطلبات الأساسية:
      المناسبة: ${userPreferences.occasion || 'سهرة'}
      الطول المفضل للإطلالة: ${userPreferences.clothingLength || 'غير محدد، اختر الأنسب'}
      القصة العامة (Silhouette): ${userPreferences.silhouette || 'نتركها لإبداعك'}
      قصة الصدر (Neckline): ${userPreferences.neckline || 'نتركها لإبداعك'}
      الأكمام (Sleeves): ${userPreferences.sleeves || 'نتركها لإبداعك'}
      تصميم الظهر (Back Design): ${userPreferences.backDesign || 'نتركها لإبداعك'}
      خامة القماش الأساسية: ${userPreferences.fabricMaterial || 'غير محدد، اختر خامة راقية'}
      التطريز والإضافات: ${userPreferences.fabricEmbroidery || 'بدون إضافات محددة'}
      الألوان: ${userPreferences.colors || 'غير محدد'}
      لون مخصص بالـ Hex (إن وجد): ${userPreferences.customColorHex || 'لا يوجد'}
      الميزانية: ${userPreferences.budget || 'غير محدد'}
      
      وصف أو إلهام خاص من العميل (Haute Couture Request):
      ${userPreferences.customDescription || 'لا يوجد وصف خاص، ابدع من خيالك كأفضل مصمم أزياء في العالم وقدم تصميم عصري جداً يواكب أحدث خطوط الموضة العالمية.'}
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

export const generateMasterTechPackImage = async (designDescription, preferences) => {
    try {
        const hasMeasurements = preferences.measurements && Object.keys(preferences.measurements).length > 0;
        const measurementText = hasMeasurements
            ? `CRITICAL REQUIREMENT: You MUST draw large, bold, highly legible numerical dimension lines directly on the CAD sketch indicating: Bust ${preferences.measurements.bust || '?'}cm, Waist ${preferences.measurements.waist || '?'}cm, Hips ${preferences.measurements.hips || '?'}cm, Length ${preferences.height || '?'}cm, Shoulder ${preferences.shoulder || '?'}cm.`
            : `Keep the CAD sketch clean without exact number annotations.`;

        const customInspiration = preferences.customDescription ? `Incorporating specific client request: "${preferences.customDescription}". ` : "";
        const lengthText = preferences.clothingLength ? `Strict Length/Cut Requirement: ${preferences.clothingLength}. ` : "";
        const silhouetteText = preferences.silhouette ? `Silhouette: ${preferences.silhouette}. ` : "";
        const necklineText = preferences.neckline ? `Neckline: ${preferences.neckline}. ` : "";
        const sleevesText = preferences.sleeves ? `Sleeves Design: ${preferences.sleeves}. ` : "";
        const backDesignText = preferences.backDesign ? `Back Design: ${preferences.backDesign}. ` : "";

        const fabricMaterialText = preferences.fabricMaterial ? `Fabric Base Material: ${preferences.fabricMaterial} (Make this texture extremely obvious). ` : "";
        const fabricEmbroideryText = preferences.fabricEmbroidery ? `Embroidery/Embellishments: ${preferences.fabricEmbroidery}. ` : "";
        const customColorText = preferences.customColorHex ? `CRITICAL COLOR REQUIREMENT: The ENTIRE dress MUST be prominently featuring this exact color HEX code: ${preferences.customColorHex}. ` : "";

        const imagePrompt = `A breathtaking, highly detailed, world-class Haute Couture 'Master Tech Pack Board' split horizontally into two distinct sections to guarantee exact design consistency.
        
        LEFT SECTION (Photorealistic Model): A stunning, editorial-quality fashion model (${preferences.skinTone} skin, ${preferences.bodyType} body, ${preferences.hairStyle}) wearing the meticulously tailored, luxurious dress. ${customColorText}Show AT LEAST TWO distinct poses/angles of the model (e.g. Front full-body view and Back view) side-by-side in this section to fully display the breathtaking design details, draping, and fabric texture.
        
        RIGHT SECTION (Technical CAD Flat): A precise, black-and-white vector blueprint of the EXACT SAME DRESS shown on the left. Show front and back CAD views with clear seam lines, darts, pleats, and construction guidelines on a pure white background. DO NOT DRAW A HUMAN MODEL IN THIS RIGHT SECTION, ONLY THE DRESS SKETCH.
        
        Dress description for all sections: ${designDescription}.
        ${customInspiration}${lengthText}${silhouetteText}${necklineText}${sleevesText}${backDesignText}${fabricMaterialText}${fabricEmbroideryText}
        ${measurementText}
        
        This composite image MUST accurately represent the exact same elite haute couture dress in both photorealistic high-fashion photography and technical blueprint formats. Make it look expensive, unique, and masterfully crafted.`;

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
