import productDatabase from '../data/Master_Fashion_Intelligence.json';

const AFFILIATE_STORES = [
    { title: "لورا فاشن", baseUrl: 'https://mtjr.at/rY6YOtAGkB' },
    { title: "فساتين جويس", baseUrl: 'https://mtjr.at/Q2_9DITIA6' },
    { title: "فساتين ندش", baseUrl: 'https://mtjr.at/5dSA-q_GkV' },
    { title: "فساتين شموخ", baseUrl: 'https://mtjr.at/cwU8lc5q5t' },
    { title: "بوتيك نوف", baseUrl: 'https://mtjr.at/faWBo8or-0' },
    { title: "فساتين حلوه", baseUrl: 'https://mtjr.at/5dAVNxhXWO' },
    { title: "Stayl Haven", baseUrl: 'https://mtjr.at/fvS7XePT3o' },
    { title: "فساتين آسلين", baseUrl: 'https://mtjr.at/ZKAz8nr-Vm' }
];

export async function fetchAndScoreProducts(prefs) {
    console.log("👗 Starting Local AI DNA Product Matcher...");

    // 1. استبعاد أي منتج لا يحتوي على ai_dna (منتج فارغ الملامح)
    const validProducts = productDatabase.filter(p => p.ai_dna !== null && p.ai_dna !== undefined);
    console.log(`✅ Found ${validProducts.length} fully processed products with AI DNA.`);

    // 2. خوارزمية المطابقة المباشرة (Matching Algorithm)
    const scoredProducts = validProducts.map(p => {
        let score = 0;
        let matchReasons = [];
        const dna = p.ai_dna;

        // النوع (Category) - 25 نقطة
        if (prefs.clothingType && dna.category === prefs.clothingType) {
            score += 25;
            matchReasons.push("النوع");
        }

        // المناسبة (Occasion) - مصفوفة - 20 نقطة
        const occasionArray = Array.isArray(dna.occasion) ? dna.occasion : [dna.occasion];
        if (prefs.occasion && occasionArray.includes(prefs.occasion)) {
            score += 20;
            matchReasons.push("المناسبة");
        }

        // القصة (Silhouette) - 15 نقطة
        if (prefs.silhouette && dna.silhouette === prefs.silhouette) {
            score += 15;
            matchReasons.push("القصة");
        }

        // الطول (Length) - 10 نقاط
        if (prefs.clothingLength && dna.length === prefs.clothingLength) {
            score += 10;
            matchReasons.push("الطول");
        }

        // الياقة (Neckline) - 10 نقاط
        if (prefs.neckline && dna.neckline === prefs.neckline) {
            score += 10;
            matchReasons.push("الياقة");
        }

        // الأكمام (Sleeves) - 10 نقاط
        if (prefs.sleeves && dna.sleeves === prefs.sleeves) {
            score += 10;
            matchReasons.push("الأكمام");
        }

        // القماش (Fabric) - 10 نقاط
        if (prefs.fabricMaterial && dna.fabric === prefs.fabricMaterial) {
            score += 10;
            matchReasons.push("القماش");
        }

        // --- التحديث الجديد: بروتوكول المطابقة المرن (Gradual Match) ---
        // إذا كان هناك تطابق في "النوع" و "المناسبة"، نعتبره مرشحاً قوياً حتى لو لم تتطابق التفاصيل الدقيقة مثل الياقة
        if (matchReasons.includes("النوع") && matchReasons.includes("المناسبة")) {
            score += 30; // Bonus for core match
        } else if (matchReasons.includes("المناسبة")) {
            score += 10; // Fallback: At least fits the occasion
        } else if (matchReasons.includes("النوع")) {
            score += 5; // Fallback: At least it's the right clothing type
        }

        // ضبط الروابط وأسماء المتاجر للتسويق بالعمولة (Affiliates)
        const urlDomain = (p.productUrl || "").toLowerCase();
        let storeTitle = p.store || "متجر غير محدد";
        let affiliateBase = null;

        if (urlDomain.includes("lora") || storeTitle.includes("لورا")) {
            storeTitle = "لورا فاشن";
            affiliateBase = "https://mtjr.at/rY6YOtAGkB";
        }
        else if (urlDomain.includes("aslen") || urlDomain.includes("asleen") || storeTitle.includes("آسلين")) {
            storeTitle = "فساتين آسلين";
            affiliateBase = "https://mtjr.at/ZKAz8nr-Vm";
        }
        else if (urlDomain.includes("noof") || storeTitle.includes("نوف")) {
            storeTitle = "بوتيك نوف";
            affiliateBase = "https://mtjr.at/faWBo8or-0";
        }
        else if (urlDomain.includes("stayl") || urlDomain.includes("haven")) {
            storeTitle = "Stayl Haven";
            affiliateBase = "https://mtjr.at/fvS7XePT3o";
        } else {
            const foundStore = AFFILIATE_STORES.find(s => s.title === storeTitle || storeTitle.includes(s.title));
            if (foundStore) affiliateBase = foundStore.baseUrl;
        }

        return {
            ...p,
            matchScore: score,
            match_reason: matchReasons.length > 0 ? `يتطابق في: ${matchReasons.join('، ')} (بنسبة ${score}%)` : "لا يوجد تطابق مباشر",
            product_id: dna.ai_marketing_title || p.title || "تصميم راقٍ",
            storeName: storeTitle,
            direct_product_url: p.productUrl,
            final_affiliate_url: affiliateBase ? p.productUrl // In real app, you'd wrap it in an affiliate deep link. For now we just pass direct.
                : p.productUrl,
            imageUrl: p.images && p.images.length > 0 ? p.images[0] : null
        };
    });
    const topScorers = scoredProducts.filter(p => p.matchScore > 0);
    const finalSelection = topScorers.length > 0 ? topScorers : validProducts.slice(0, 5).map(p => ({ ...p, match_reason: "اخترنا لكِ هذه التشكيلة الفاخرة كبدائل مقترحة مميزة.", matchScore: 1 }));

    console.log(`🏆 Top Match Score: ${finalSelection[0]?.matchScore || 0}`);
    return finalSelection; // نُعيد النتائج المتدرجة
}
