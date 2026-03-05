import productDatabase from "../data/Clean_Fashion_DB.enriched.json";

const AFFILIATE_STORES = [
    { title: "لورا فاشن", baseUrl: "https://mtjr.at/rY6YOtAGkB" },
    { title: "فساتين جويس", baseUrl: "https://mtjr.at/Q2_9DITIA6" },
    { title: "فساتين ندش", baseUrl: "https://mtjr.at/5dSA-q_GkV" },
    { title: "فساتين شموخ", baseUrl: "https://mtjr.at/cwU8lc5q5t" },
    { title: "بوتيك نوف", baseUrl: "https://mtjr.at/faWBo8or-0" },
    { title: "فساتين حلوه", baseUrl: "https://mtjr.at/5dAVNxhXWO" },
    { title: "Stayl Haven", baseUrl: "https://mtjr.at/fvS7XePT3o" },
    { title: "فساتين آسلين", baseUrl: "https://mtjr.at/ZKAz8nr-Vm" },
];

// Helpers
function safeArray(v) {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
}

function includesLoose(hay, needle) {
    if (!hay || !needle) return false;
    return String(hay).includes(String(needle));
}

function pickImage(p) {
    return (
        p.image_url ||
        (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null) ||
        (Array.isArray(p.imageUrl) && p.imageUrl.length > 0 ? p.imageUrl[0] : null) ||
        null
    );
}

function detectStoreAndAffiliate(product) {
    const url = String(product.productUrl || product.productURL || product.url || "").toLowerCase();
    let storeTitle = product.storeName || product.store || product.store_info?.name || "متجر غير محدد";
    let affiliateBase = null;

    if (url.includes("lora") || String(storeTitle).includes("لورا")) {
        storeTitle = "لورا فاشن";
        affiliateBase = "https://mtjr.at/rY6YOtAGkB";
    } else if (url.includes("aslen") || url.includes("asleen") || String(storeTitle).includes("آسلين")) {
        storeTitle = "فساتين آسلين";
        affiliateBase = "https://mtjr.at/ZKAz8nr-Vm";
    } else if (url.includes("noof") || String(storeTitle).includes("نوف")) {
        storeTitle = "بوتيك نوف";
        affiliateBase = "https://mtjr.at/faWBo8or-0";
    } else if (url.includes("stayl") || url.includes("haven")) {
        storeTitle = "Stayl Haven";
        affiliateBase = "https://mtjr.at/fvS7XePT3o";
    } else {
        const found = AFFILIATE_STORES.find((s) => s.title === storeTitle || String(storeTitle).includes(s.title));
        if (found) affiliateBase = found.baseUrl;
    }

    // ملاحظة: ما نقدر نولد deep link حقيقي بدون نظام تتبع/باراميترات.
    // فحالياً نخلي direct url كما هو، ونرفق affiliateBase للتوسع لاحقاً.
    return { storeTitle, affiliateBase };
}

export async function fetchAndScoreProducts(prefs) {
    console.log("👗 Starting Local AI DNA Product Matcher...");

    // 1) فلترة المنتجات اللي فيها ai_dna فقط
    const validProducts = productDatabase.filter((p) => p && p.ai_dna);
    console.log(`✅ Found ${validProducts.length} fully processed products with AI DNA.`);

    // fallback لو ما عندك كفاية
    const basePool = validProducts.length > 0 ? validProducts : productDatabase.slice(0, 50);

    // 2) Scoring
    const scoredProducts = basePool.map((p) => {
        let score = 0;
        const matchReasons = [];
        const dna = p.ai_dna || {};

        // النوع (Category) - 25
        if (prefs?.clothingType && dna.category && includesLoose(dna.category, prefs.clothingType)) {
            score += 25;
            matchReasons.push("النوع");
        }

        // المناسبة (Occasion) - 20
        const occasionArray = safeArray(dna.occasion);
        if (prefs?.occasion && occasionArray.some((occ) => occ && includesLoose(occ, prefs.occasion))) {
            score += 20;
            matchReasons.push("المناسبة");
        }

        // القصة (Silhouette) - 15
        if (prefs?.silhouette && dna.silhouette && includesLoose(dna.silhouette, prefs.silhouette)) {
            score += 15;
            matchReasons.push("القصة");
        }

        // الطول (Length) - 10
        if (prefs?.clothingLength && dna.length && includesLoose(dna.length, prefs.clothingLength)) {
            score += 10;
            matchReasons.push("الطول");
        }

        // الياقة (Neckline) - 10
        if (prefs?.neckline && dna.neckline && includesLoose(dna.neckline, prefs.neckline)) {
            score += 10;
            matchReasons.push("الياقة");
        }

        // الأكمام (Sleeves) - 10
        if (prefs?.sleeves && dna.sleeves && includesLoose(dna.sleeves, prefs.sleeves)) {
            score += 10;
            matchReasons.push("الأكمام");
        }

        // القماش (Fabric) - 10
        if (prefs?.fabricMaterial && dna.fabric && includesLoose(dna.fabric, prefs.fabricMaterial)) {
            score += 10;
            matchReasons.push("القماش");
        }

        // Gradual Match Bonuses
        if (matchReasons.includes("النوع") && matchReasons.includes("المناسبة")) {
            score += 30;
        } else if (matchReasons.includes("المناسبة")) {
            score += 10;
        } else if (matchReasons.includes("النوع")) {
            score += 5;
        }

        const { storeTitle, affiliateBase } = detectStoreAndAffiliate(p);

        const directUrl = p.productUrl || p.productURL || p.url || null;

        return {
            ...p,

            // Fields for UI
            matchScore: score,
            match_reason:
                matchReasons.length > 0
                    ? `يتطابق في: ${matchReasons.join("، ")} (بنسبة ${score}%)`
                    : "لا يوجد تطابق مباشر",

            productTitle: dna.ai_marketing_title || p.ai_marketing_title || p.title || p.name || "تصميم راقٍ",
            storeName: storeTitle,

            direct_product_url: directUrl,
            affiliate_base_url: affiliateBase,
            final_affiliate_url: directUrl, // حالياً نفس الرابط المباشر إلى أن تضيف نظام deep-link tracking

            imageUrl: pickImage(p),
        };
    });

    // 3) selection
    const topScorers = scoredProducts
        .filter((p) => (p.matchScore || 0) > 0)
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    const finalSelection =
        topScorers.length > 0
            ? topScorers.slice(0, 24) // حد أقصى للعرض
            : basePool.slice(0, 8).map((p) => ({
                ...p,
                match_reason: "اخترنا لكِ هذه التشكيلة الفاخرة كبدائل مقترحة مميزة.",
                matchScore: 1,
                productTitle: p.ai_dna?.ai_marketing_title || p.ai_marketing_title || p.title || p.name || "تصميم راقٍ",
                imageUrl: pickImage(p),
            }));

    console.log(`🏆 Top Match Score: ${finalSelection[0]?.matchScore || 0}`);
    return finalSelection;
}