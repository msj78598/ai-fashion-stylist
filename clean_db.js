import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load variables from .env.local
dotenv.config({ path: '.env.local' });
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error("❌ ERROR: Missing VITE_OPENAI_API_KEY in .env.local");
    process.exit(1);
}

const INPUT_FILE = './src/data/productDatabase.json';
const OUTPUT_FILE = './src/data/Clean_Fashion_DB.json';

const SYSTEM_PROMPT = `
You are an Elite Fashion Data Engineer and Master JSON Parser. Your sole objective is to ingest raw, poorly formatted fashion product data and transform it into a highly structured, atomic JSON format.

[DATA INGESTION & CLEANSING RULES]
1. Ignore junk or repetitive data.
2. ATOMIC EXTRACTION (Zero-Merging): Break down the description into isolated engineering attributes. Do not mix features.
3. THE NULL RULE: If a specific feature is NOT explicitly mentioned in the text, you MUST output null. DO NOT guess, hallucinate, or infer missing features.

OUTPUT EXACTLY THIS JSON FOR EVERY INPUT:
{
  "anatomy": {
    "category": "فستان سهرة, عباية, etc. or null",
    "silhouette": "كلوش, مستقيم, سمكة, etc. or null",
    "length": "ميدي, طويل, قصير, etc. or null"
  },
  "upper_design": {
    "neckline": "فتحة V, ياقة مربعة, دائرية, etc. or null",
    "sleeves_length": "طويلة, نصف كم, بدون, etc. or null",
    "sleeves_style": "واسعة, ضيقة, بف, كاب, etc. or null",
    "back_design": "مفتوح, مغلق, etc. or null"
  },
  "aesthetics": {
    "primary_color": "Extract EXACT color (e.g., أسود, وردي فاتح), or null",
    "pattern": "زهور ملونة, سادة, etc. or null",
    "fabric": "دانتيل, مخمل, etc. or null",
    "embellishment": "تطريز, شك, etc. or null"
  },
  "special_features": {
    "slit": "فتحة جانبية, etc. or null",
    "belt_or_waist": "حزام, كورسيه, etc. or null"
  },
  "search_tags": ["array", "of", "all", "extracted", "keywords"]
}
`;

async function processProduct(productText) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: productText }
                ],
                temperature: 0,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        if (data.error) {
            console.error("OpenAI Error:", data.error.message);
            return null;
        }
        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error("Error asking AI:", error.message);
        return null;
    }
}

async function cleanDatabase() {
    console.log("🚀 جاري قراءة الملف المعطوب...");
    const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
    const cleanDB = [];

    // Chunk size of 15 to make it fast
    const chunkSize = 15;
    for (let i = 0; i < rawData.length; i += chunkSize) {
        const chunk = rawData.slice(i, i + chunkSize);
        console.log(`\n⏳ جاري تحليل الدفعة [${i + 1} إلى ${Math.min(i + chunkSize, rawData.length)}] من ${rawData.length}`);

        const promises = chunk.map(async (item) => {
            let realDescription = item.title;
            if (item.rawAttributes && item.rawAttributes.color) {
                const parts = item.rawAttributes.color.split(' - ');
                if (parts.length > 1) {
                    realDescription = parts.slice(1).join(' ').substring(0, 500);
                }
            }

            const extractedFeatures = await processProduct(realDescription);

            let discountCode = "";
            if (item.storeName.includes('لورا')) {
                discountCode = "F-ZLHNl";
            } else if (item.storeName.includes('آسلين')) {
                discountCode = "F-MDU4N";
            }

            if (extractedFeatures) {
                return {
                    product_id: item.id,
                    productUrl: item.productUrl,
                    store_info: {
                        name: item.storeName,
                        discount_code: discountCode
                    },
                    original_price: item.price,
                    image_url: item.imageUrl,
                    ...extractedFeatures
                };
            }
            return null;
        });

        const results = await Promise.all(promises);
        results.forEach(res => {
            if (res) cleanDB.push(res);
        });
        console.log("✅ الدفعة مكتملة.");
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cleanDB, null, 2), 'utf-8');
    console.log(`\n🎉 اكتمل العمل! تم حفظ قاعدة البيانات النظيفة في: ${OUTPUT_FILE}`);
}

cleanDatabase();