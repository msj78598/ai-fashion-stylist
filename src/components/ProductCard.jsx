import React from 'react';
import { ShoppingBag, Sparkles, ExternalLink, Gift, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductCard = ({ product }) => {
    const storeKey = product.storeName?.toLowerCase() || product.store?.toLowerCase();
    const isMainDress = product.title?.includes('فستان') || product.name?.includes('فستان');

    const storeNames = {
        'asleen': 'فساتين آسلين',
        'laura': 'لورا فاشن',
        'joyce': 'فساتين جويس',
        'nadsh': 'فساتين ندش',
        'shomoukh': 'فساتين شموخ',
        'noof': 'بوتيك نوف',
        'halwa': 'فساتين حلوه',
        'staylhaven': 'Stayl Haven',
        'shein': 'شي إن',
        'noon': 'نون'
    };

    const storeName = storeNames[storeKey] || product.title || product.name || 'متجر غير محدد';

    // UI Configuration based on Store and Item Type
    const getStoreStyle = () => {
        if (storeKey === 'asleen' || storeKey === 'aslen' || storeKey === 'laura') {
            return {
                bg: 'from-[#f5e6d3] to-white',
                border: 'border-[#d4af37]/20',
                iconBg: 'bg-[#d4af37]/10 text-[#a67c00]',
                button: 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white hover:opacity-90',
                labelBg: 'bg-[#d4af37]'
            };
        }
        if (storeKey === 'shein') {
            return {
                bg: 'from-gray-100 to-white',
                border: 'border-black/5',
                iconBg: 'bg-black/5 text-gray-800',
                button: 'bg-black text-white hover:bg-gray-800',
                labelBg: 'bg-black'
            };
        }
        return {
            bg: 'from-primary-50 to-white',
            border: 'border-primary-100',
            iconBg: 'bg-primary-100 text-primary-600',
            button: 'btn-primary',
            labelBg: 'bg-primary-500'
        };
    };

    const style = getStoreStyle();
    const BadgeIcon = isMainDress ? Sparkles : Gift;
    const badgeText = product.badge || 'الخيار الأنسب لكِ';

    return (
        <div className={`glass-card overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full bg-white relative border ${style.border} hover:border-gray-300 group`}>

            {/* Store Label Badge */}
            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl z-20 font-bold text-xs uppercase tracking-widest text-white shadow-md ${style.labelBg}`}>
                {storeName}
            </div>

            <div className={`relative h-48 overflow-hidden shrink-0 bg-gradient-to-br ${style.bg} flex flex-col items-center justify-center border-b border-gray-100 p-0 group-hover:p-1 transition-all duration-300`}>
                {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover rounded-t-xl opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <div className={`p-5 rounded-3xl shadow-sm border border-white/50 relative overflow-hidden backdrop-blur-md ${style.iconBg} mb-3`}>
                        <div className="absolute inset-0 bg-white/40 scale-0 group-hover:scale-110 transition-transform duration-500 ease-in-out"></div>
                        {isMainDress ? <Sparkles className="w-10 h-10 relative z-10" strokeWidth={1.5} /> : <Tag className="w-10 h-10 relative z-10" strokeWidth={1.5} />}
                    </div>
                )}


                <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-10">
                    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-primary-200">
                        <BadgeIcon className="w-4 h-4 text-primary-500" />
                        <span className="text-[12px] font-bold text-primary-700 leading-none">{badgeText}</span>
                    </div>

                    {/* Discount Code Section */}
                    {product.discountCode && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-red-50 text-red-600 px-4 py-1.5 rounded-lg border border-red-200 flex items-center gap-2 shadow-sm animate-pulse"
                        >
                            <Gift className="w-4 h-4" />
                            <span className="text-[12px] font-bold font-arabic leading-none">كود الخصم: {product.discountCode}</span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex flex-col justify-between flex-1 gap-4 bg-white relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>

                <div>
                    <h3 className="text-xl font-bold font-arabic text-gray-900 mb-2 leading-tight line-clamp-2" dir="rtl">
                        {product.title || product.name}
                    </h3>

                    <div className="mt-2 p-4 bg-gray-50/80 rounded-2xl border border-gray-100/50 relative group-hover:bg-gray-50 transition-colors" dir="rtl">
                        <div className="absolute -top-3 -right-2 text-3xl text-gray-200 font-serif leading-none select-none">"</div>
                        <div className="text-sm text-gray-700 font-arabic leading-relaxed relative z-10 italic">
                            {product.matchDetails && product.matchDetails.length > 0 ? (
                                <ul className="list-disc pr-4 space-y-1">
                                    {product.matchDetails.filter(d => d.earned > 0).slice(0, 2).map((detail, idx) => (
                                        <li key={idx} className="text-xs">تطابق ممتاز في {detail.key === 'colorMatch' ? 'اللون' : detail.key === 'silhouetteMatch' ? 'القصة' : detail.key === 'fabricMatch' ? 'القماش' : detail.key === 'modestyCompliance' ? 'الحشمة' : detail.key === 'necklineMatch' ? 'ياقة الصدر' : detail.key === 'sleeveMatch' ? 'الأكمام' : 'مواصفاتك'}</li>
                                    ))}
                                    <li className="text-xs text-primary-600 font-bold mt-1">تمت التوصية بواسطة الذكاء الاصطناعي</li>
                                </ul>
                            ) : (
                                product.reason || `حسب مواصفاتك المميزة، تم اختيار هذه القطعة بعناية لتعكس سحر شخصيتك وتبرز تألقك.`
                            )}
                        </div>
                    </div>

                    {/* Visual Feature Enrichment */}
                    {product.upper_design?.neckline && product.aesthetics?.fabric && (
                        <div className="mt-3 text-[13px] text-primary-700 bg-primary-50/50 px-3 py-2 rounded-xl border border-primary-100/50 flex items-center justify-start gap-2 font-arabic">
                            <Sparkles className="w-4 h-4 text-primary-500 shrink-0" />
                            <span>يتميز بـ <span className="font-bold">{product.upper_design.neckline}</span> وقماش <span className="font-bold">{product.aesthetics.fabric}</span> فاخر</span>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-4">
                    <a
                        href={product.affiliateBaseUrl ? `${product.affiliateBaseUrl}?url=${encodeURIComponent(product.productUrl)}` : (product.productUrl || '#')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full ${style.button} py-3.5 flex items-center justify-center gap-2 font-arabic shadow-md hover:shadow-lg active:scale-[0.98] transition-all relative overflow-hidden text-center rounded-xl`}
                    >
                        <ShoppingBag className="w-5 h-5 opacity-90" />
                        <span className="font-bold text-[15px]">امتلكيها الآن</span>
                        <ExternalLink className="w-4 h-4 opacity-70 ml-1" />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
