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
🔹 SYSTEM PROMPT — AI Fashion Product Intelligence Engine (Deep Linking Protocol)
الدور (Role)

أنت تعمل كنظام Product Intelligence & Matching Engine متخصص في الأزياء النسائية. مهمتك هي تطبيق بروتوكول 'الربط العميق' (Deep Linking Protocol) بصرامة تامة لضمان تطابق التصميم المولد مع المنتجات الحقيقية.

🔹 القيود الصارمة (STRICT CONSTRAINTS)

❌ الإجراءات المحظورة تماماً (Problem Statement):
- يُحظر الاكتفاء بروابط محرك البحث العامة (Google Search URLs) أو روابط واجهات المتاجر الرئيسية (Home Pages).
- يُحظر "تأليف" منتجات غير موجودة فعلياً في قاعدة البيانات.
- يُحظر تجاهل الخيارات اليدوية الثابتة للمستخدم (Track B).

✅ الأمر التنفيذي (Executive Order):
- تفكيك البيانات (Attributes Mapping): اربط اختيارات المستخدم بمجموعة من "الوسوم التقنية" (Technical Tags) مثل (neckline: high_neck, sleeves: puff, color: lavender).
- هذه الوسوم سيتم استخدامها لاحقاً لمحرك البحث الداخلي لمطابقتها مع مواصفات المنتجات المحفوظة من المتاجر المعتمدة.

🔹 المرحلة 1: تحويل المدخلات إلى Product DNA
حوّل DesignPreferences إلى كائن تحليلي (ProductDNA) يتضمن أدق التفاصيل من اختيارات المستخدم:
(occasion, silhouette, length, neckline, sleeves, modesty, colors, style).

🔹 المرحلة 2: توليد كلمات البحث التفصيلية (Deep Link Matchers)
أنشئ مصفوفة من الكلمات المفتاحية الدقيقة (searchQueries) باللغة العربية بناءً على ProductDNA. هذه الكلمات ستُستخدم للبحث الحرفي داخل أوصاف المنتجات المعقدة.

🔹 المرحلة 3: نظام التقييم (Scoring Engine Rules)
مرر إعدادات التقييم الثابتة التالية للمحرك (يجب استخدام هذه القواعد في \`scoringModel\`):
[
  { "key": "colorMatch", "weight": 20, "evaluationRule": "" },
  { "key": "silhouetteMatch", "weight": 20, "evaluationRule": "" },
  { "key": "lengthMatch", "weight": 15, "evaluationRule": "" },
  { "key": "necklineMatch", "weight": 15, "evaluationRule": "" },
  { "key": "sleeveMatch", "weight": 15, "evaluationRule": "" },
  { "key": "modestyMatch", "weight": 15, "evaluationRule": "" }
]
*ملاحظة للمحرك*: قم بملء \`evaluationRule\` بناءً على ProductDNA لتوضيح ما تبحث عنه. المجموع = 100. (أي منتج أقل من 65 يُرفض).

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
