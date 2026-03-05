const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'src', 'data', 'Master_Fashion_Intelligence.json');
const outputPath = path.join(__dirname, 'src', 'data', 'Clean_Fashion_Database.json');

// 1. قراءة قاعدة البيانات الحالية
const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

console.log(`📊 إجمالي المنتجات الحالي: ${rawData.length}`);

// 2. تصفية المنتجات المكتملة فقط وتصحيح العيوب
const cleanData = rawData
    .filter(item => item.ai_dna !== null && item.ai_dna !== undefined) // استبعاد أي منتج لم يعالجه الذكاء الاصطناعي
    .map(item => {
        // تصحيح العنوان: الأولوية للعنوان التسويقي الذكي
        const correctTitle = item.ai_dna.ai_marketing_title || item.title;

        // تصحيح الرابط: إذا كان الرابط هو الصفحة الرئيسية، نبحث عن الرابط الدقيق
        let correctUrl = item.productUrl;
        if (correctUrl === "https://salla.sa/lora-fashion" || correctUrl.endsWith('/')) {
            correctUrl = item.domain_category || item.productUrl;
        }

        return {
            ...item,
            title: correctTitle === "بدون عنوان" ? "تصميم أزياء فاخر" : correctTitle,
            productUrl: correctUrl,
            // التأكد من جودة مسميات الـ DNA
            ai_dna: {
                ...item.ai_dna,
                neckline: item.ai_dna.neckline?.replace("اراقة", "ياقة") || "غير محدد"
            }
        };
    });

// 3. حفظ النسخة الجديدة "النقّية"
fs.writeFileSync(outputPath, JSON.stringify(cleanData, null, 2));

console.log(`✅ تم بنجاح! قاعدة البيانات الجديدة جاهزة.`);
console.log(`✨ المنتجات المعتمدة والجودة العالية: ${cleanData.length} قطعة.`);