import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const LandingPage = () => {
    const navigate = useNavigate();
    const [result, setResult] = useState(null);

    // Mock product data
    useEffect(() => {
        const mockResult = {
            suggestedProducts: [
                {
                    name: 'فستان سهره أسود فاخر',
                    reason: 'يتماشى مع ذوقك الفخم ويبرز قوامك بأناقة',
                    affiliateLink: 'https://www.noon.com/product/123',
                    store: 'noon',
                },
                {
                    name: 'حذاء كعب عالي من Shein',
                    reason: 'يكمل الإطلالة ويضيف لمسة من الرقي',
                    affiliateLink: 'https://ar.shein.com/product/456',
                    store: 'shein',
                },
                {
                    name: 'حقيبة يد Aslen مميزة',
                    reason: 'تصميم عصري يناسب أسلوبك الفريد',
                    affiliateLink: 'https://mtjr.at/ZKAz8nr-Vm',
                    store: 'aslen',
                },
            ],
        };
        setResult(mockResult);
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#fdf8f6] via-[#f2e8e5] to-[#eaddd7]">
            {/* Decorative Blob */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute top-0 left-0 w-72 h-72 bg-[#e0cec7] rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

            <div className="glass-card max-w-lg w-full p-10 text-center relative z-10 border border-white/40 shadow-2xl">
                <div className="mx-auto bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Sparkles className="w-10 h-10 text-primary-600" />
                </div>

                <h1 className="text-4xl font-bold font-arabic text-primary-900 mb-4 leading-tight">
                    خبيرتكِ الشخصية <br /> <span className="text-primary-600">للأزياء الذكية</span>
                </h1>

                <p className="text-gray-600 mb-10 text-lg leading-relaxed font-arabic">
                    تجربة راقية وحصرية ترصد ملامح ذوقكِ لتصمم لكِ إطلالة تواكب أحدث خطوط الموضة. نحن لا نبيع الملابس، بل نمنحكِ "راحة القرار".
                </p>

                {/* Call to Action */}
                <button
                    onClick={() => navigate('/intake')}
                    className="w-full btn-primary py-4 text-xl flex items-center justify-center gap-3 group"
                >
                    <span>ابدئي تجربتكِ الآن</span>
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                </button>

                {/* Persuasive intro for product suggestions */}
                <p className="text-center text-lg font-arabic text-primary-800 mt-6 mb-4">
                    حسب مواصفاتك المميزة، اخترنا لك مجموعة من المنتجات التي تناسب ذوقك وجسمك.
                </p>

                {/* Product suggestions grid – expanded layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {((result?.suggestedProducts) || (result?.noonProducts) || []).map((product, index) => (
                        <motion.div key={index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + (index * 0.1) }} className="h-full">
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </div>

                {/* Footer info */}
                <div className="mt-8 pt-6 border-t border-primary-100 flex justify-center gap-8 text-sm text-gray-500 font-arabic">
                    <a href="https://www.noon.com" target="_blank" rel="noopener noreferrer" className="hover:underline">متصل بمتاجر متعددة</a>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-300 mt-2"></div>
                    <span className="font-bold">تصميم مخصص 100%</span>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
