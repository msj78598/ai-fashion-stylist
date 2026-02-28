import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
    console.warn("OpenAI API key is missing. Please set VITE_OPENAI_API_KEY in .env.local");
}

const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Required since we are calling from the client side in this Vite app
});

const SYSTEM_PROMPT = `
أنت مساعد افتراضي وخبير تصميم أزياء للسيدات في الأسواق العربية.

1. تحليل البيانات:
قم بتحليل بيانات المستخدمة (المناسبة، نوع الجسم، لون البشرة، والحشمة) وقدم اقتراح تصميم واحد مثالي ومفصل يُبرز جمالها ويناسب طبيعة جسمها.
يجب أن يكون التصميم "Custom Tailoring" (تصميم حسب الطلب).

2. اقتراح منتجات متوافقة على نون:
اقترح 3 منتجات (إكسسوارات، أحذية، أو حقائب) لتكمل الإطلالة.
لكل منتج:
- name: اسم المنتج
- price: السعر المقترح
- image: رابط صورة (https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop)
- reason: لماذا هذا المنتج يكمل الإطلالة المقترحة؟
- affiliateLink: رابط (https://s.noon.com/71XqI9jKXxI/p/123)

3. تنسيق المخرجات (JSON فقط):
{
  "analysis": "شرح لسبب اختيار هذا التصميم وكيف يتناسب مع جسم ولون بشرة المستخدمة",
  "designRecommendation": {
    "title": "اسم التصميم (مثال: فستان سهرة ملكي بقصة حورية البحر)",
    "description": "وصف دقيق للتصميم وتفاصيله",
    "fabric": "القماش المقترح (مثال: حرير طبيعي بطيات)",
    "tailoringAdvice": "نصيحة دقيقة للخياط لقصة تناسب شكل جسمها"
  },
  "noonProducts": [
    {
      "name": "اسم المنتج",
      "price": "السعر",
      "image": "رابط الصورة",
      "reason": "السبب",
      "affiliateLink": "الرابط"
    }
  ]
}
`;

export const generateStylistRecommendation = async (userPreferences) => {
    try {
        const prompt = `
      البيانات الشخصية:
      طبيعة الجسم: ${userPreferences.bodyType}
      لون البشرة: ${userPreferences.skinTone}
      ستايل الشعر/الحجاب: ${userPreferences.hairStyle}
      
      المتطلبات:
      المناسبة: ${userPreferences.occasion}
      نوع الملابس: ${userPreferences.clothingType}
      الألوان المفضلة: ${userPreferences.colors}
      مستوى الحشمة: ${userPreferences.modesty}
      الميزانية: ${userPreferences.budget}
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const rawText = response.choices[0].message.content;
        if (rawText) {
            return JSON.parse(rawText);
        }
        throw new Error('No valid response from OpenAI');
    } catch (error) {
        console.error('Text Generation API Error:', error);
        throw error;
    }
};

export const generateDesignSketch = async (designDescription, preferences) => {
    try {
        const imagePrompt = `A photorealistic, highly detailed, full-body haute couture fashion illustration. 
        A beautiful fashion model with ${preferences.skinTone} skin tone, ${preferences.bodyType} body type, and ${preferences.hairStyle} wearing: ${designDescription}.
        The sketch should be a detailed tailor's reference front view, clean white background, elegant fashion magazine aesthetic, soft studio lighting.`;

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            response_format: "url",
        });

        if (response.data && response.data.length > 0) {
             return response.data[0].url; // DALL-E 3 returns a hosted URL
        }

        throw new Error('No image URL returned from OpenAI');
    } catch (error) {
        console.error('Image Generation Error:', error);
        return null;
    }
};
