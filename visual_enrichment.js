import fs from 'fs';
import OpenAI from 'openai'; // أو استخدام fetch لـ Gemini
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });

async function enrichDatabase() {
    const db = JSON.parse(fs.readFileSync('./src/data/Clean_Fashion_DB.json', 'utf-8'));
    console.log("🚀 بدء عملية الإثراء البصري للمنتجات الناقصة...");

    for (let item of db) {
        // نتدخل فقط إذا كانت البيانات الجوهرية null
        if (item.upper_design.neckline === null || item.anatomy.silhouette === null) {
            console.log(`👁️ جاري تحليل صورة المنتج: ${item.product_id}`);

            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o-mini", // نموذج بصري سريع ورخيص
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Analyze this fashion item image and return ONLY a JSON object with these keys: neckline, sleeves_style, silhouette, fabric. Use Arabic values like (فتحة V, كلوش, شيفون)." },
                                { type: "image_url", image_url: { "url": item.image_url } },
                            ],
                        },
                    ],
                    response_format: { type: "json_object" }
                });

                const visualData = JSON.parse(response.choices[0].message.content);

                // تحديث البيانات الناقصة بالبيانات المستخرجة بصرياً
                item.upper_design.neckline = item.upper_design.neckline || visualData.neckline;
                item.upper_design.sleeves_style = item.upper_design.sleeves_style || visualData.sleeves_style;
                item.anatomy.silhouette = item.anatomy.silhouette || visualData.silhouette;
                item.aesthetics.fabric = item.aesthetics.fabric || visualData.fabric;

                console.log(`✅ تم إكمال بيانات: ${item.product_id}`);
            } catch (error) {
                console.error(`❌ فشل تحليل المنتج ${item.product_id}:`, error.message);
            }
        }
    }

    fs.writeFileSync('./src/data/Clean_Fashion_DB.json', JSON.stringify(db, null, 2));
    console.log("🎉 اكتمل إثراء قاعدة البيانات! المتاجر الصامتة أصبحت الآن تتحدث.");
}

enrichDatabase();
