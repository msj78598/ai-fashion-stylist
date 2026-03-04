import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Tag, Image as ImageIcon, CheckCircle, ExternalLink } from 'lucide-react';
import productDatabase from '../data/Master_Fashion_Intelligence.json';

const DebugGallery = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        // نأخذ فقط المنتجات التي اكتملت معالجتها ولها ai_dna
        const validProducts = productDatabase.filter(p => p.ai_dna !== null && p.ai_dna !== undefined);
        // نعرض أول 20 منتج للاختبار السريع (Performance test)
        setProducts(validProducts.slice(0, 20));
    }, []);

    if (products.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="text-center font-arabic">
                    <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
                    <p className="text-xl text-primary-900">جاري تحميل بيانات الاختبار...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdf8f6] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold font-arabic text-primary-900 mb-4 tracking-wide">
                        مختبر جودة البيانات (Data Integrity Lab)
                    </h1>
                    <p className="text-primary-700 font-arabic text-lg max-w-2xl mx-auto">
                        معاينة حية لأول 20 فستان تمت دراسته عبر الذكاء الاصطناعي لفحص تطابق الوصف التقني مع الصورة الحقيقية.
                    </p>
                    <div className="mt-4 flex justify-center gap-4">
                        <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-arabic font-bold text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            إجمالي قاعدة البيانات المكتملة: {productDatabase.filter(p => p.ai_dna).length} منتج
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {products.map((product, index) => {
                        const dna = product.ai_dna;
                        // استخراج رابط الصورة الصحيح (غالباً أول رابط في المصفوفة)
                        const coverImage = product.images && product.images.length > 0 ? product.images[0] : null;

                        // تصحيح رابط المتجر المباشر
                        const affiliateLink = product.productUrl;

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-3xl overflow-hidden shadow-xl border border-primary-100 flex flex-col hover:shadow-2xl transition-shadow"
                                dir="rtl"
                            >
                                {/* قسم الصورة */}
                                <div className="h-80 w-full bg-gray-100 relative group overflow-hidden">
                                    {coverImage ? (
                                        <img
                                            src={coverImage}
                                            alt={dna.ai_marketing_title || product.title}
                                            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x600?text=الصورة+غير+متاحة'; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                            <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                                            <span className="font-arabic">بدون صورة</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-primary-200 shadow-sm">
                                        <span className="font-arabic font-bold text-primary-900 text-sm">{product.store || 'المتجر غير محدد'}</span>
                                    </div>
                                </div>

                                {/* قسم البيانات (الـ DNA) */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="mb-4">
                                        <p className="text-xs text-primary-500 font-bold tracking-widest uppercase mb-1">
                                            Product #{index + 1}
                                        </p>
                                        <h3 className="text-xl font-bold font-arabic text-primary-900 leading-snug line-clamp-2">
                                            {dna.ai_marketing_title || product.title || 'تصميم بدون عنوان تسويقي'}
                                        </h3>
                                    </div>

                                    {/* الهيكل التقني */}
                                    <div className="bg-primary-50 rounded-2xl p-4 mb-6 flex-1 text-sm border border-primary-100/50">
                                        <h4 className="font-bold text-primary-800 font-arabic mb-3 border-b border-primary-200 pb-2 flex items-center gap-2">
                                            <Tag className="w-4 h-4" />
                                            الهيكل التقني (AI DNA)
                                        </h4>
                                        <ul className="space-y-2 font-arabic text-primary-800">
                                            <li className="flex justify-between border-b border-primary-100/30 pb-1">
                                                <span className="font-bold">الصدر والرقبة (Neckline):</span>
                                                <span className="text-left" dir="ltr">{dna.neckline}</span>
                                            </li>
                                            <li className="flex justify-between border-b border-primary-100/30 pb-1">
                                                <span className="font-bold">الأكمام (Sleeves):</span>
                                                <span className="text-left" dir="ltr">{dna.sleeves}</span>
                                            </li>
                                            <li className="flex justify-between pb-1">
                                                <span className="font-bold">القماش (Fabric):</span>
                                                <span className="text-left" dir="ltr">{dna.fabric}</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* الأزرار */}
                                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
                                        <span className="font-sans font-black text-xl text-primary-900">
                                            {product.price || 'السعر غير متوفر'} {product.currency || 'SAR'}
                                        </span>
                                        <a
                                            href={affiliateLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-primary-900 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-arabic font-bold transition-colors flex items-center gap-2 shadow-md"
                                        >
                                            اطلبيه الآن
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DebugGallery;
