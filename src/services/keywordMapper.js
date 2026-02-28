// src/services/keywordMapper.js

export function generateKeywords(preferences) {
    const keywords = [];

    const map = {
        occasion: {
            'سهرة': 'evening dress',
            'زفاف': 'wedding dress',
            'رسمي': 'formal dress',
            'يومي': 'casual dress',
        },
        length: {
            'قصير': 'mini dress',
            'متوسط': 'midi dress',
            'طويل': 'maxi dress',
        },
        sleeves: {
            'بدون أكمام': 'sleeveless',
            'قصيرة': 'short sleeves',
            'طويلة': 'long sleeves',
        },
        fabric: {
            'ساتان': 'satin',
            'شيفون': 'chiffon',
            'مخمل': 'velvet',
            'كريب': 'crepe',
        },
        style: {
            'ناعم': 'soft style',
            'كلاسيك': 'classic dress',
            'فخم': 'luxury dress',
            'جريء': 'bold dress',
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
