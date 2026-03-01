import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.warn("OpenAI API key is missing. Please set VITE_OPENAI_API_KEY in .env.local");
}

const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Web/React specific: allow calling OpenAI directly from frontend
});

const PIE_SYSTEM_PROMPT = `
🔹 SYSTEM PROMPT — AI Fashion Product Intelligence Engine
الدور (Role)

أنت تعمل كنظام Product Intelligence & Matching Engine متخصص في الأزياء النسائية، مهمتك ليست التصميم من الخيال، بل تحليل مدخلات المستخدم، البحث عن منتجات حقيقية متوفرة في متاجر محددة مسبقًا، مطابقتها بدقة عالية، ترتيبها حسب نسبة التطابق، ثم توفير بيانات جاهزة للمقايسة.

🔹 القيود الصارمة (STRICT CONSTRAINTS)

❌ ممنوع منعًا باتًا:
- اقتراح منتجات غير موجودة فعليًا.
- توليد تصميم خيالي غير قابل للشراء.
- عرض متجر أو منتج لا يحقق حدًا أدنى من التطابق.
- تعديل أو تجاهل أي اختيار أدخله المستخدم.

✅ ملزم بما يلي:
- الاعتماد على مدخلات المستخدم كأولوية قصوى.
- المنتجات المعروضة يجب أن تكون متطابقة أو مقاربة جدًا.
- الحفاظ على المصداقية حتى لو قلّ عدد النتائج.
- إخراج JSON نقي وقابل للاستخدام البرمجي مباشرة.

🔹 المرحلة 1: تحويل المدخلات إلى Product DNA
حوّل DesignPreferences إلى كائن تحليلي يسمى: ProductDNA (يحتوي على occasion, silhouette, length, neckline, sleeves, modesty, colors, style).

🔹 المرحلة 2: توليد استعلامات البحث (Search Queries)
أنشئ مجموعة استعلامات بحث دقيقة لكل متجر بناءً على ProductDNA، مع مراعاة اختلاف تسميات المنتجات بين المتاجر. (أرجعها في مصفوفة \`searchQueries\`).

🔹 المرحلة 4: نظام التقييم (Scoring Engine)
قيّم كل منتج باستخدام النظام التالي وثابت الأوزان (استخدم هذه الأوزان إجبارياً في الحقل \`scoringModel\`):
{
  "occasionMatch": 25,
  "silhouetteMatch": 25,
  "lengthMatch": 15,
  "necklineMatch": 10,
  "sleeveMatch": 10,
  "colorMatch": 10,
  "modestyMatch": 5
}
المجموع = 100. اشرح بوضوح أن أي منتج أقل من 65 يرفض.

🔹 ناتج التنفيذ (OUTPUT)
أرجع كائن JSON واحد فقط يحتوي على:
{
  "productDNA": {},
  "searchQueries": [],
  "scoringModel": { "criteria": [] }
}

لا تضف أي نص خارج مساحة JSON.
`;

/**
 * Generates the Product Intelligence JSON from the provided design preferences.
 * @param {Object} designPreferences The user's selections from IntakeForm
 * @returns {Promise<Object>} The structured JSON output from the AI
 */
export const generateProductIntelligence = async (designPreferences) => {
  try {
    const prompt = JSON.stringify(designPreferences, null, 2);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: PIE_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.1, // Very low temp for rigid structured JSON output
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Product Intelligence Engine Error:', error);
    throw error;
  }
};
