import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// استخدام المفتاح من ملف البيئة المحلي
const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });

const INPUT_FILE = path.join(process.cwd(), 'src', 'data', 'processed_fashion_data.json');
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'data', 'Master_Fashion_Intelligence.json');
const SAVE_INTERVAL = 10; // يحفظ كل 10 منتجات
const API_DELAY_MS = 2000; // تأخير زمني لتجنب حظر الـ API

// دالة تأخير لتجنب الـ Rate Limit
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startEnrichment() {
    console.log("🚀 جاري تحميل البيانات وبدء عملية الإثراء العميق...");

    // 1. قراءة البيانات الأصلية
    if (!fs.existsSync(INPUT_FILE)) {
        console.error("❌ خطأ: ملف المدخلات غير موجود!");
        return;
    }
    const rawProducts = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

    // 2. التحقق من وجود ملف مخرجات سابق للاستئناف
    let enrichedData = [];
    if (fs.existsSync(OUTPUT_FILE)) {
        enrichedData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        console.log(`🔄 تم العثور على تقدم سابق. سنبدأ من المنتج رقم: ${enrichedData.length + 1}`);
    }

    const startIndex = enrichedData.length;
    let successCount = 0;
    let errorCount = 0;

    // 3. حلقة المعالجة
    for (let i = startIndex; i < rawProducts.length; i++) {
        const product = rawProducts[i];
        console.log(`📝 جاري معالجة المنتج [${i + 1}/${rawProducts.length}]: ${product.title}`);

        // الاعتماد على أول صورة في المصفوفة كصورة رئيسية
        const mainImage = product.images && product.images.length > 0 ? product.images[0] : null;

        if (!mainImage) {
            console.log(`⚠️ تم تخطي المنتج رقم ${i + 1} لعدم وجود صورة.`);
            product.ai_dna = null;
            enrichedData.push({
                ...product,
                processed_at: new Date().toISOString()
            });
            continue;
        }

        try {
            await delay(API_DELAY_MS); // فاصل زمني لتجنب الحظر

            const response = await openai.chat.completions.create({
                model: "gpt-4o", // تم استخدام الموديل البصري الذكي للتعرف العميق
                messages: [
                    {
                        role: "system",
                        content: `أنت خبير تصميم وتفصيل أزياء سعودي. دورك هو تحويل صورة ووصف المنتج إلى 'حمض نووي' (DNA) رقمي.

قواعد الجودة:
1. التصنيف الإلزامي: يجب أن تختار category حصراً من القائمة التالية: (فستان، عباية بشت، عباية كلوش، طقم قطعتين، جلابية/قفطان). لا يُسمح بكتابة 'بدون عنوان' أو 'غير معروف'.
2. معالجة العناوين المفقودة: إذا كان العنوان الأصلي 'بدون عنوان'، قم بإنشاء عنوان تسويقي احترافي بناءً على ما تراه في الصورة وضعه في حقل ai_marketing_title. إذا لم يكن بدون عنوان، اتركه فارغاً أو اكتب نفس العنوان.
3. دقة الرؤية البصرية: إذا تعارض الوصف النصي مع الصورة، اعتمد الصورة كمرجع نهائي (خاصة في نوع القماش والزينة).
4. تصحيح المصطلحات: تأكد من الكتابة الصحيحة للمصطلحات (مثل: 'ياقة عالية' بدلاً من 'اراقة'، 'درابيه' بدلاً من 'درابية').`
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `حلل هذا المنتج واستخرج بياناته الحرفية. إذا نقصت معلومة في النص، استنتجها بدقة من الصورة:
                                الاسم: ${product.title}
                                الوصف: ${product.description}

                                المطلوب إخراج JSON بالحقول التالية فقط:
                                1. ai_marketing_title: (عنوان تسويقي احترافي في حال كان الاسم 'بدون عنوان').
                                2. category: (فستان، عباية بشت، عباية كلوش، طقم قطعتين، جلابية/قفطان).
                                3. silhouette: (A-Line، كلوش، سمكة، مستقيم، فضفاض).
                                4. neckline: (V-Neck، ياقة عالية، صينية، أكتاف مكشوفة، قصة قلب، قارب).
                                5. sleeves: (طويل، قصير، كاب، منفوخ/Puff، جرس، بدون أكمام).
                                6. waist: (مرتفع، طبيعي، ساقط، بدون تحديد/واسع).
                                7. length: (ماكسي، ميدي، قصير، ذيل طويل).
                                8. fabric: (نوع القماش المستنتج بدقة: مخمل، ساتان، شيفون، كريب، تفتا، كتان).
                                9. embellishments: [مصفوفة تحتوي على: تطريز، خرز، ريش، دانتيل، فيونكات، ترتر/شك].
                                10. textures: [مصفوفة تحتوي على: كشكشة/Ruffles، كسرات/Pleated، درابيه/Draped].
                                11. modesty: (مبطن بالكامل، شفاف الأكمام، شفاف الظهر، ساتر).
                                12. occasion: [مصفوفة للمناسبات المناسبة: زواج، خطوبة، تخرج، عشاء رسمي، يومي].
                                13. confidence_score: (نسبة التأكد من 1-100 كعدد صحيح).`
                            },
                            {
                                type: "image_url",
                                image_url: { "url": mainImage }
                            }
                        ]
                    }
                ],
                response_format: { type: "json_object" }
            });

            const analysis = JSON.parse(response.choices[0].message.content);

            // دمج البيانات الأصلية مع التحليل الجديد
            enrichedData.push({
                ...product,
                ai_dna: analysis,
                processed_at: new Date().toISOString()
            });

            successCount++;

            // 4. آلية الحفظ التلقائي (Checkpoint)
            if (enrichedData.length % SAVE_INTERVAL === 0) {
                saveProgress(enrichedData);
                console.log(`💾 تم حفظ التقدم تلقائياً (إجمالي المعالج: ${enrichedData.length})`);
            }

        } catch (error) {
            console.error(`❌ خطأ في معالجة المنتج ${i + 1}:`, error.message);
            errorCount++;
            // حفظ التقدم حتى في حالة الخطأ لضمان عدم ضياع ما سبق
            saveProgress(enrichedData);
            if (error.status === 429) {
                console.log("⏳ تم الوصول لحد الاستهلاك (Rate Limit). توقف السكريبت مؤقتاً.");
                break;
            }
        }
    }

    // 5. الحفظ النهائي والملخص
    saveProgress(enrichedData);
    printSummary(successCount, errorCount, enrichedData.length, rawProducts.length);
}

function saveProgress(data) {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
}

function printSummary(success, errors, totalProcessed, totalAll) {
    console.log("\n" + "=".repeat(40));
    console.log("🏁 ملخص عملية إثراء البيانات النهائي:");
    console.log(`- إجمالي المنتجات في الملف الأصلي: ${totalAll}`);
    console.log(`- تم معالجة (جديد): ${success}`);
    console.log(`- فشل في معالجة: ${errors}`);
    console.log(`- الرصيد الحالي في قاعدة البيانات: ${totalProcessed}`);
    console.log(`- حالة الملف: ${totalProcessed === totalAll ? "✅ مكتمل" : "⚠️ غير مكتمل - يمكن إعادة التشغيل للاستكمال"}`);
    console.log("=".repeat(40));
}

startEnrichment();
