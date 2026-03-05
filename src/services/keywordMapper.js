// src/services/keywordMapper.js

export function generateKeywords(preferences) {
    const keywords = [];

    const map = {
        occasion: {
            'سهرة': 'evening gown',
            'زفاف': 'bridal dress',
            'رسمي': 'formal evening dress',
            'يومي': 'casual maxi dress',
            'خطوبة': 'engagement gown',
            'عشاء رسمي': 'formal dinner dress',
            'تخرج': 'prom dress',
            'استقبال': 'reception dress'
        },
        silhouette: {
            'A-Line': 'A-line dress',
            'كلوش': 'flared maxi dress',
            'سمكة': 'mermaid gown',
            'منفوش': 'ballgown',
            'مستقيم': 'column dress',
            'لف': 'wrap dress',
            'توليب': 'tulip skirt dress'
        },
        clothingLength: {
            'ماكسي': 'maxi',
            'ميدي': 'midi',
            'قصير': 'mini',
            'طول الشاي': 'tea length',
            'بذيل طويل': 'sweep train',
            'تحت الركبة': 'knee length'
        },
        neckline: {
            'قارب': 'boat neck',
            'أكتاف مكشوفة': 'off-the-shoulder',
            'ياقة عالية': 'high neck',
            'قصة قلب': 'sweetheart neck',
            'سبعة': 'v-neck',
            'ياقة مربعة': 'square neck',
            'رسن': 'halter neck',
            'غير متماثل': 'asymmetric neckline'
        },
        sleeves: {
            'بدون أكمام': 'sleeveless',
            'أكمام قصيرة': 'short sleeve',
            'أكمام طويلة': 'long sleeve',
            'قصيرة': 'short sleeve',
            'طويلة': 'long sleeve',
            'ثلاثة أرباع': '3/4 sleeve',
            'كم منفوخ': 'puff sleeve',
            'كم بيل': 'bell sleeve',
            'فراشة': 'flutter sleeve'
        },
        fabricMaterial: {
            'ساتان': 'satin',
            'شيفون': 'chiffon',
            'مخمل': 'velvet',
            'كريب': 'crepe',
            'تفتا': 'taffeta',
            'دانتيل': 'lace',
            'حرير': 'silk',
            'تل': 'tulle',
            'أورجانزا': 'organza',
            'جاكار': 'jacquard'
        },
        fabricEmbroidery: {
            'شك خرز وكريستال': 'crystal embellished beaded',
            'تطريز دانتيل': 'lace applique',
            'ريش طبيعي': 'feather trim',
            'كشكشة': 'ruffles',
            'ترتر': 'sequins',
            'بدون إضافات': 'solid minimalist',
            'لؤلؤ': 'pearl embellished',
            'ورود نافرة': '3D floral applique'
        },
        colors: {
            'أسود': 'black',
            'كحلي': 'navy blue',
            'عنابي': 'burgundy',
            'زيتي': 'olive green',
            'وردي ناعم': 'blush pink',
            'موف': 'mauve',
            'لافندر': 'lavender',
            'نود': 'nude',
            'بيج': 'beige',
            'ذهبي': 'gold',
            'فضي': 'silver',
            'سكري': 'off-white',
            'أحمر': 'red',
            'أزرق سماوي': 'light blue',
            'أخضر زمردي': 'emerald green',
            'خمري': 'wine red'
        },
        style: {
            'ناعم': 'elegant',
            'كلاسيك': 'classic timeless',
            'فخم': 'luxury designer',
            'جريء': 'bold statement',
            'محتشم': 'modest'
        },
    };

    Object.entries(map).forEach(([key, values]) => {
        const userValue = preferences[key];
        if (!userValue) return;

        const findMatch = (val) => {
            const matchKey = Object.keys(values).find(k => val.includes(k));
            return matchKey ? values[matchKey] : null;
        };

        if (Array.isArray(userValue)) {
            userValue.forEach(v => {
                const match = findMatch(v);
                if (match) keywords.push(match);
            });
        } else {
            const match = findMatch(userValue);
            if (match) keywords.push(match);
        }
    });

    return [...new Set(keywords)];
}
