// src/services/affiliateMatcher.js

const STORES = [
    {
        id: 'laura',
        name: 'لورا فاشن',
        affiliateUrl: 'https://mtjr.at/rY6YOtAGkB',
        discountCode: null,
        tags: [
            'evening dress',
            'formal dress',
            'luxury dress',
            'saudi fashion',
            'abaya',
        ],
    },
    {
        id: 'joyce',
        name: 'فساتين جويس',
        affiliateUrl: 'https://mtjr.at/Q2_9DITIA6',
        discountCode: 'F-ZLHNL',
        discountLabel: 'خصم 100 ر.س',
        tags: [
            'evening gown',
            'wedding dress',
            'maxi dress',
            'party dress',
            'luxury dress',
        ],
    },
    {
        id: 'nadsh',
        name: 'فساتين ندش',
        affiliateUrl: 'https://mtjr.at/5dSA-q_GkV',
        discountCode: null,
        tags: [
            'all occasions',
            'evening dress',
            'casual dress',
            'midi dress',
        ],
    },
    {
        id: 'shomoukh',
        name: 'فساتين شموخ',
        affiliateUrl: 'https://mtjr.at/cwU8lc5q5t',
        discountCode: null,
        tags: [
            'luxury dress',
            'formal dress',
            'evening gown',
            'saudi fashion',
        ],
    },
    {
        id: 'noof',
        name: 'بوتيك نوف',
        affiliateUrl: 'https://mtjr.at/faWBo8or-0',
        discountCode: 'F-MV9TA',
        tags: [
            'soft style',
            'evening dress',
            'feminine',
            'elegant',
        ],
    },
    {
        id: 'halwa',
        name: 'فساتين حلوه',
        affiliateUrl: 'https://mtjr.at/5dAVNxhXWO',
        discountCode: 'F-4NR7I',
        tags: [
            'casual dress',
            'soft style',
            'daily wear',
            'comfortable',
        ],
    },
    {
        id: 'staylhaven',
        name: 'Stayl Haven',
        affiliateUrl: 'https://mtjr.at/fvS7XePT3o',
        discountCode: 'F-MDU4N',
        tags: [
            'modern style',
            'trendy',
            'minimal',
            'fashion forward',
        ],
    },
    {
        id: 'asleen',
        name: 'فساتين آسلين',
        affiliateUrl: 'https://mtjr.at/ZKAz8nr-Vm',
        discountCode: null,
        tags: [
            'evening dress',
            'feminine',
            'classic',
            'soft luxury',
        ],
    },
];

/**
 * مطابقة المنتجات مع اختيارات المستخدم بدقة
 * بدون أي اقتراح أو استنتاج
 */
export function matchAffiliateStores(keywords = [], constraints = {}) {
    if (constraints?.affiliateOnly === false) return [];

    return STORES
        .map(store => {
            const score = store.tags.filter(tag =>
                keywords.includes(tag)
            ).length;

            return {
                ...store,
                score,
            };
        })
        .filter(store => store.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(store => ({
            id: store.id,
            store: store.id, // Compatibility with ProductCard styling
            name: store.name,
            affiliateUrl: store.affiliateUrl,
            affiliateLink: store.affiliateUrl, // Compatibility alias
            discountCode: store.discountCode,
            badge: store.discountCode
                ? `🎁 كود خصم: ${store.discountCode}`
                : '✨ مختار حسب ذوقك',
        }));
}
