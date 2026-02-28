import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const LandingPage = () => {
    const navigate = useNavigate();

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

                {/* Footer info */}
                <div className="mt-8 pt-6 border-t border-primary-100 flex justify-center gap-8 text-sm text-gray-500 font-arabic">
                    <span className="text-gray-600">متصل بمتاجر متعددة</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-300 mt-2"></div>
                    <span className="font-bold">تصميم مخصص 100%</span>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
