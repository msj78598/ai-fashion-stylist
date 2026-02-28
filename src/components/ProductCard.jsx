import React from 'react';
import { ShoppingBag, Sparkles, ExternalLink, Gift, Tag } from 'lucide-react';

const ProductCard = ({ product }) => {
    const storeKey = product.store?.toLowerCase();
    const isShein = storeKey === 'shein';
    const isAslen = storeKey === 'aslen';
    const storeName = isShein ? 'شي إن' : isAslen ? 'أسلين' : 'نون';
    const isMainDress = product.name?.includes('فستان');

    // UI Configuration based on Store and Item Type
    const storeColors = isShein
        ? { bg: 'from-gray-100 to-white', border: 'border-black/5', iconBg: 'bg-black/5 text-gray-800', button: 'bg-black text-white hover:bg-gray-800' }
        : { bg: 'from-primary-50 to-white', border: 'border-primary-100', iconBg: 'bg-primary-100 text-primary-600', button: 'btn-primary' };

    const BadgeIcon = isMainDress ? Sparkles : Gift;
    const badgeText = isMainDress ? 'الخيار الأقرب للتصميم' : 'قطعة تكمل الإطلالة';

    return (
        <div className={`glass-card overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full bg-white relative border ${storeColors.border} hover:border-gray-300 group`}>

            {/* Store Label Badge */}
            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl z-20 font-bold text-xs uppercase tracking-widest ${isShein ? 'bg-black text-white' : 'bg-primary-500 text-white shadow-md'}`}>
                {storeName}
            </div>

            {/* Visual Hero Area - No Image, Pure Typography & Icons */}
            <div className={`relative h-40 overflow-hidden shrink-0 bg-gradient-to-br ${storeColors.bg} flex flex-col items-center justify-center border-b border-gray-100`}>
                <div className={`p-5 rounded-3xl shadow-sm border border-white/50 relative overflow-hidden backdrop-blur-md ${storeColors.iconBg} mb-3`}>
                    <div className="absolute inset-0 bg-white/40 scale-0 group-hover:scale-110 transition-transform duration-500 ease-in-out"></div>
                    {isMainDress ? <Sparkles className="w-10 h-10 relative z-10" strokeWidth={1.5} /> : <Tag className="w-10 h-10 relative z-10" strokeWidth={1.5} />}
                </div>

                <div className="flex items-center gap-1 z-10 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-gray-200">
                    <BadgeIcon className={`w-3.5 h-3.5 ${isMainDress ? 'text-yellow-500' : 'text-gray-500'}`} />
                    <span className="text-[11px] font-bold text-gray-700">{badgeText}</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex flex-col justify-between flex-1 gap-4 bg-white relative">

                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>

                <div>
                    <h3 className="text-xl font-bold font-arabic text-gray-900 mb-3 leading-tight line-clamp-2">
                        {product.name}
                    </h3>

                    <div className="mt-2 p-4 bg-gray-50/80 rounded-2xl border border-gray-100/50 relative group-hover:bg-gray-50 transition-colors">
                        <div className="absolute -top-3 -right-2 text-3xl text-gray-200 font-serif leading-none select-none">"</div>
                        <p className="text-sm text-gray-700 font-arabic leading-relaxed relative z-10 italic">
                            {/* Personalized persuasive copy */}
                            {`حسب مواصفاتك المميزة، اخترنا لك هذا المنتج لتناسب ذوقك وجسمك. ${product.reason || ''}`}
                        </p>
                    </div>
                </div>

                <div className="mt-auto pt-4">
                    <a
                        href={product.affiliateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full ${storeColors.button} py-3.5 flex items-center justify-center gap-2 font-arabic shadow-md hover:shadow-lg active:scale-[0.98] transition-all relative overflow-hidden text-center rounded-xl`}
                    >
                        <ShoppingBag className="w-5 h-5 opacity-90" />
                        <span className="font-bold text-[15px]">عرض الآن</span>
                        <ExternalLink className="w-4 h-4 opacity-70 ml-1" />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
