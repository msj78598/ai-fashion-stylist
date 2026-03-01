// src/services/affiliateMatcher.js

/**
 * بناء رابط البحث باستخدام الكلمات المفتاحية لضمان وصول المستخدم لمنتجات مشابهة
 */
function buildSearchUrl(baseUrl, keywords = []) {
    if (!keywords.length) return baseUrl;

    // تنظيف الكلمات المفتاحية وتحويلها لنص بحث
    const query = encodeURIComponent(keywords.join(' '));
    return `${baseUrl}?q=${query}`;
}

export function matchAffiliateStores(keywords = [], constraints = {}) {
    // المتاجر الثمانية المعتمدة
    const STORES = [
        {
            id: 'laura',
            name: 'لورا فاشن',
            baseUrl: 'https://mtjr.at/rY6YOtAGkB',
            domain: 'https://lora.fashion',
            discountCode: null,
        },
        {
            id: 'joyce',
            name: 'فساتين جويس',
            baseUrl: 'https://mtjr.at/Q2_9DITIA6',
            domain: 'https://joycedress.com',
            discountCode: 'F-ZLHNL',
            discountLabel: 'خصم 100 ر.س',
        },
        {
            id: 'nadsh',
            name: 'فساتين ندش',
            baseUrl: 'https://mtjr.at/5dSA-q_GkV',
            domain: 'https://nadish.sa',
            discountCode: null,
        },
        {
            id: 'shomoukh',
            name: 'فساتين شموخ',
            baseUrl: 'https://mtjr.at/cwU8lc5q5t',
            domain: 'https://shmokfash.com',
            discountCode: null,
        },
        {
            id: 'noof',
            name: 'بوتيك نوف',
            baseUrl: 'https://mtjr.at/faWBo8or-0',
            domain: 'https://nouf-dresses.com',
            discountCode: 'F-MV9TA',
        },
        {
            id: 'halwa',
            name: 'فساتين حلوه',
            baseUrl: 'https://mtjr.at/5dAVNxhXWO',
            domain: 'https://hellwa.com',
            discountCode: 'F-4NR7I',
        },
        {
            id: 'staylhaven',
            name: 'Stayl Haven',
            baseUrl: 'https://mtjr.at/fvS7XePT3o',
            domain: 'https://stylehaven-sa.com',
            discountCode: 'F-MDU4N',
        },
        {
            id: 'asleen',
            name: 'فساتين آسلين',
            baseUrl: 'https://mtjr.at/ZKAz8nr-Vm',
            domain: 'https://aslen1.com',
            discountCode: null,
        },
    ];

    if (constraints?.affiliateOnly === false) return [];

    return STORES.map(store => {
        const searchUrl = buildSearchUrl(store.baseUrl, keywords);

        return {
            id: store.id,
            store: store.id, // للتوافق مع ProductCard styling
            name: store.name,
            affiliateUrl: searchUrl,
            affiliateLink: searchUrl, // للتوافق مع ProductCard
            discountCode: store.discountCode,
            badge: store.discountCode
                ? `🎁 كود خصم: ${store.discountCode}`
                : '✨ مطابق لتصميمك',
        };
    });
}
