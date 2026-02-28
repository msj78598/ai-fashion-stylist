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

1. الالتزام الصارم بالمتطلبات (Red Line - Zero Deviation):
- يجب أن يكون التصميم انعكاساً دقيقاً وحرفياً لكل الخيارات التي حددتها المستخدمة في استمارة البيانات (نوع القماش، اللون، طول الأكمام، قصة الصدر، الخ).
- أي مخالفة لخيارات المستخدمة تعتبر خطأ مهنياً؛ إبداعك يجب أن يكون "داخل إطار" هذه المتطلبات وليس خارجها.
- اشرح هندسياً وبمصطلحات الموضة الراقية كيف يحقق التصميم هذه المتطلبات حرفياً ويبرز جمال الجسم بناءً عليها.
- استخدم المقاسات الدقيقة لوضع تعليمات صارمة (مثال: "نظراً لأن الخصر 70 سم، اعتمدي كورسيه مدمج بتصميم فرنسي مع بنسات عميقة...").

2. البدائل والكماليات (Strict Order & Psychological Marketing):
العميلة تبحث عن إطلالة متكاملة تضاهي التصميم المبتكر. يجب إنتاج 5 اقتراحات تسوق تفصيلية ومغرية جداً في "suggestedProducts" بالترتيب التالي حرفياً:
1. متجر Aslen: الفستان الأقرب للتصميم (يجب أن يكون المنتج الأول). استخدم الرابط المدمج بالكلمات المفتاحية: https://mtjr.at/ZKAz8nr-Vm?q=[الكلمات المفتاحية]
2. متجر Shein: البديل الثاني للفستان. الرابط: https://ar.shein.com/pdsearch/[الكلمات المفتاحية]?onelink=31/5huksr9tehbe&requestId=olw-5huktcz5temb&url_from=affiliate_koc_4471841330&campaign_id=925&behaviorId=campaign.baf41253-5918-49ae-b9a9-cf1d04b937f5
3. متجر Noon: البديل الثالث للفستان. الرابط: https://www.noon.com/saudi-ar/search/?q=[الكلمات المفتاحية]&utm_campaign=CMPa5461f39a36enoon&utm_medium=AFF2557e74f8cb6&adjust_deeplink_js=1&utm_source=C1000264L
4. حذاء يكمل الإطلالة (Noon أو Shein). استخدم رابط المتجر المناسب مع الكلمات المفتاحية.
5. كماليات/إكسسوارات (عطر، حقيبة، مجوهرات) تناسب وصف الفستان (Noon أو Shein). استخدم رابط المتجر المناسب مع الكلمات المفتاحية.

قواعد صياغة العبارات (Psychological Stylist):
- لا تكتب عبارات مباشرة. استخدم لغة مستشار شخصي VIP تخاطب ذوق ومكانة العميلة.
- "هذا التنسيق تم اختياره ليناغم هيبة حضورك ويبرز ملامح أنوثتك الطاغية بذكاء".

الاستعلام والروابط (قواعد صارمة):
- "store": "Aslen", "Shein", "Noon".
- "name": كلمات مفتاحية دقيقة جداً مستخلصة من وصف الـ Tech Pack (مثل: "فستان جاكار مخمل كحلي").
- "affiliateLink": يجب دمج الكلمات المفتاحية المستخلصة من التصميم داخل الرابط:
* Aslen: https://mtjr.at/ZKAz8nr-Vm?q=[الكلمات المفتاحية]
* Shein: https://ar.shein.com/pdsearch/[الكلمات المفتاحية]?... (أكمل الرابط أعلاه)
* Noon: https://www.noon.com/saudi-ar/search/?q=[الكلمات المفتاحية]&... (أكمل الرابط أعلاه)

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
      
      المتطلبات الأساسية للتصميم:
      نوع الإطلالة أو الملابس: ${userPreferences.clothingType || 'فستان سهرة'}
      المناسبة: ${userPreferences.occasion || 'سهرة'}
      الطول المفضل للإطلالة: ${userPreferences.clothingLength || 'غير محدد، اختر الأنسب'}
      القصة العامة (Silhouette): ${userPreferences.silhouette || 'نتركها لإبداعك'}
      قصة الصدر (Neckline): ${userPreferences.neckline || 'نتركها لإبداعك'}
      تصميم الياقة (Collar): ${userPreferences.collarStyle || 'بدون ياقة محددة'}
      طول الأكمام: ${userPreferences.sleevesLength || 'نتركها لإبداعك'}
      قصة الأكمام: ${userPreferences.sleevesStyle || 'نتركها لإبداعك'}
      تحديد الخصر: ${userPreferences.waistStyle || 'نتركها لإبداعك'}
      تصميم الظهر (Back Design): ${userPreferences.backDesign || 'نتركها لإبداعك'}
      
      المواد والخامات:
      خامة القماش الأساسية: ${userPreferences.fabricMaterial || 'غير محدد، اختر خامة راقية'}
      النقشة أو الطبعة (Pattern): ${userPreferences.fabricPattern || 'سادة'}
      التطريز والإضافات: ${userPreferences.fabricEmbroidery || 'بدون إضافات محددة'}
      الألوان: ${userPreferences.colors || 'غير محدد'}
      لون مخصص بالـ Hex (إن وجد): ${userPreferences.customColorHex || 'لا يوجد'}
      الميزانية: ${userPreferences.budget || 'غير محدد'}
      
      وصف أو إلهام خاص من العميل (Haute Couture Request):
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

export const generateMasterTechPackImage = async (designDescription, preferences) => {
    try {
        const hasMeasurements = preferences.measurements && Object.keys(preferences.measurements).length > 0;
        const measurementText = hasMeasurements
            ? `CRITICAL REQUIREMENT: You MUST draw large, bold, highly legible numerical dimension lines directly on the CAD sketch indicating: Bust ${preferences.measurements.bust || '?'}cm, Waist ${preferences.measurements.waist || '?'}cm, Hips ${preferences.measurements.hips || '?'}cm, Length ${preferences.height || '?'}cm, Shoulder ${preferences.shoulder || '?'}cm.`
            : `Keep the CAD sketch clean without exact number annotations.`;

        const customInspiration = preferences.customDescription ? `Incorporating specific client request: "${preferences.customDescription}". ` : "";
        const clothingTypeText = preferences.clothingType ? `Garment Type: ${preferences.clothingType}. ` : "Garment Type: Haute Couture Dress. ";
        const lengthText = preferences.clothingLength ? `Strict Length/Cut Requirement: ${preferences.clothingLength}. ` : "";
        const silhouetteText = preferences.silhouette ? `Silhouette: ${preferences.silhouette}. ` : "";
        const necklineText = preferences.neckline ? `Neckline: ${preferences.neckline}. ` : "";
        const collarText = preferences.collarStyle ? `Collar: ${preferences.collarStyle}. ` : "";
        const sleevesLengthText = preferences.sleevesLength ? `Sleeves Length: ${preferences.sleevesLength}. ` : "";
        const sleevesStyleText = preferences.sleevesStyle ? `Sleeves Style: ${preferences.sleevesStyle}. ` : "";
        const waistText = preferences.waistStyle ? `Waist: ${preferences.waistStyle}. ` : "";
        const backDesignText = preferences.backDesign ? `Back Design: ${preferences.backDesign}. ` : "";

        const fabricMaterialText = preferences.fabricMaterial ? `Fabric Base Material: ${preferences.fabricMaterial} (Make this texture extremely obvious). ` : "";
        const fabricPatternText = preferences.fabricPattern ? `Fabric Pattern: ${preferences.fabricPattern}. ` : "";
        const fabricEmbroideryText = preferences.fabricEmbroidery ? `Embroidery/Embellishments: ${preferences.fabricEmbroidery}. ` : "";
        const customColorText = preferences.customColorHex ? `CRITICAL COLOR REQUIREMENT: The ENTIRE garment MUST be prominently featuring this exact color HEX code: ${preferences.customColorHex}. ` : "";

        const imagePrompt = `A breathtaking, highly detailed, world-class Haute Couture 'Master Tech Pack Board' split horizontally into two distinct sections. CRITICAL RED-LINE INSTRUCTION: The generated image MUST 100% STRICTLY MATCH every single one of the user's specific selections (color, sleeves, length, fabric, etc.) without ANY deviation or unrequested additions. The photorealistic section MUST look 100% real as if shot on an ultra-high-end camera. The overall aesthetic MUST be extremely modern, highly elegant, and luxurious.
        
        LEFT SECTION (100% Photorealistic Model): An incredibly realistic, editorial-quality human fashion portrait. A beautiful model (${preferences.skinTone} skin, ${preferences.bodyType} body, ${preferences.hairStyle}) wearing the meticulously tailored garment. ${customColorText}Show AT LEAST TWO distinct poses/angles of the model (e.g. Front full-body view and Back view) side-by-side. 
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
