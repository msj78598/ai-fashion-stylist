import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Scissors, Loader2, ArrowRight, ShoppingBag, Image as ImageIcon, Printer, RefreshCcw, Plus } from 'lucide-react';
import { generateTechPackSpecSheet, generateMasterTechPackImage } from '../services/ai';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';

const StylistChat = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const [masterImage, setMasterImage] = useState(null);
    const [loadingImage, setLoadingImage] = useState(false);

    const [tweakInput, setTweakInput] = useState("");
    const [activePreferences, setActivePreferences] = useState(location.state?.preferences || null);

    const fetchTechPack = async (prefs) => {
        setLoading(true);
        setError(null);
        try {
            // 1. Generate Spec Sheet (Text/JSON)
            const data = await generateTechPackSpecSheet(prefs);
            setResult(data);

            // 2. Generate Master Tech Pack Image
            if (data.designRecommendation) {
                setLoadingImage(true);
                const desc = data.designRecommendation.description + ' made of ' + data.designRecommendation.fabric;

                try {
                    const url = await generateMasterTechPackImage(desc, prefs);
                    setMasterImage(url);
                } catch (err) {
                    console.error("Master image fail:", err);
                } finally {
                    setLoadingImage(false);
                }
            }

        } catch (err) {
            setError('عذراً، حدث خطأ أثناء إعداد الملف التقني (Tech Pack). يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!activePreferences) {
            navigate('/intake');
            return;
        }

        // Initial fetch on mount
        fetchTechPack(activePreferences);
    }, []); // Only run once on mount

    const handleRegenerateWithTweaks = () => {
        if (!tweakInput.trim()) return;

        // Append tweak to customDescription or overwrite it
        const newDesc = activePreferences.customDescription
            ? activePreferences.customDescription + " \nتعديل إضافي: " + tweakInput
            : tweakInput;

        const updatedPrefs = { ...activePreferences, customDescription: newDesc };
        setActivePreferences(updatedPrefs);
        fetchTechPack(updatedPrefs);
        setTweakInput(""); // Clear input box after triggered
    };

    const handlePrint = () => {
        document.body.classList.add('print-mode');
        setTimeout(() => {
            window.print();
            document.body.classList.remove('print-mode');
        }, 100);
    };

    const handleStartNew = () => {
        navigate('/intake'); // Form will load saved measurements from localStorage automatically
    };

    const handleModify = () => {
        navigate('/intake', { state: { editMode: true, preferences: activePreferences } });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#fdf8f6] via-[#f2e8e5] to-[#eaddd7] flex flex-col items-center justify-center p-6">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="w-24 h-24 rounded-full border-t-4 border-l-4 border-primary-600 mb-8"
                />
                <h2 className="text-2xl font-bold font-arabic text-primary-900 mb-3 animate-pulse">جاري بناء الملف التقني (Tech Pack)...</h2>
                <p className="text-primary-700 font-arabic text-center max-w-md">
                    يتم الآن رسم لوحة المهندسة المعمارية للفستان (Master Board) بكل الزوايا، وتجهيز القياسات للخياط.
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#fdf8f6]">
                <div className="glass-card p-8 text-center">
                    <p className="text-red-500 font-arabic text-xl mb-6">{error}</p>
                    <button onClick={handleStartNew} className="btn-primary">العودة وإعادة المحاولة</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdf8f6] pb-24 print:bg-white print:pb-0">
            {/* Header (Hidden in Print) */}
            <div className="print:hidden bg-white/80 backdrop-blur-md border-b border-primary-100 shadow-sm sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
                <button onClick={handleStartNew} className="text-primary-600 hover:bg-primary-50 p-2 rounded-full transition-colors flex items-center gap-2 font-arabic">
                    <ArrowRight className="w-5 h-5" />
                    البداية
                </button>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary-500" />
                    <h1 className="text-xl font-bold font-arabic text-primary-900">الملف التقني للخياطة (Tech Pack)</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 print:pt-0 print:px-0">

                {/* Actions Bar (Hidden in Print) */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
                    <div className="flex items-center gap-3">
                        <button onClick={handleModify} className="btn-secondary flex items-center gap-2 bg-white border border-primary-200 shadow-sm hover:shadow-md transition-all px-4 py-2 rounded-lg font-arabic text-primary-700">
                            <RefreshCcw className="w-4 h-4" />
                            تعديل الخيارات (إعادة إنتاج)
                        </button>
                        <button onClick={handleStartNew} className="btn-secondary flex items-center gap-2 bg-white border border-primary-200 shadow-sm hover:shadow-md transition-all px-4 py-2 rounded-lg font-arabic text-primary-700">
                            <Plus className="w-4 h-4" />
                            عملية جديدة لشخص آخر
                        </button>
                    </div>

                    <button onClick={handlePrint} className="btn-primary flex items-center gap-2 shadow-sm hover:shadow-md transition-all px-6 py-2 rounded-lg font-arabic">
                        <Printer className="w-5 h-5" />
                        طباعة للخياط (A4)
                    </button>
                </div>

                <div className="flex flex-col gap-10 print:block">

                    {/* Tech Pack Area (Main Content) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full print:block print:w-full"
                    >
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-200 print:shadow-none print:border-none print:p-0">

                            {/* Tech Pack Header */}
                            <div className="mb-8 border-b-2 border-gray-800 pb-4 text-center">
                                <h1 className="text-3xl font-bold font-arabic text-gray-900 tracking-wide uppercase">{result?.designRecommendation?.title || 'Tech Pack Specification'}</h1>
                                <p className="text-gray-500 mt-2 font-arabic text-lg">Detailed blueprint for custom tailoring construction</p>
                            </div>

                            {/* Section 1: Visual Master Board */}
                            <div className="mb-10">
                                <h3 className="text-xl font-bold font-arabic mb-4 text-gray-800 border-l-4 border-gray-800 pl-3">لوحة التصميم الشاملة (Visual Master Board)</h3>
                                <div className="rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-300 relative w-full flex items-center justify-center print:border-solid print:border-black min-h-[400px]">
                                    {loadingImage && !masterImage && (
                                        <div className="absolute flex flex-col items-center z-10">
                                            <Loader2 className="w-10 h-10 text-gray-800 animate-spin mb-3" />
                                            <p className="font-arabic text-sm font-bold text-gray-600">جاري رسم المخطط المعماري للفستان...</p>
                                        </div>
                                    )}
                                    {masterImage ? (
                                        <>
                                            <img src={masterImage} alt="Master Tech Pack Image" className="w-full object-contain max-h-[1000px] print:max-h-[600px] z-0 relative" />

                                            {/* CSS Overlay Measurements to guarantee visibility for Tailor */}
                                            {activePreferences.measurements && Object.keys(activePreferences.measurements).length > 0 && (
                                                <div className="absolute inset-0 pointer-events-none flex rtl:flex-row-reverse">
                                                    {/* Left side is usually photorealistic, Right side is CAD. Let's place physical specs over the CAD area (right half via flex) */}
                                                    <div className="w-1/2 hidden md:block"></div> {/* Spacer for Photo Side */}
                                                    <div className="w-full md:w-1/2 relative p-4 lg:p-10 flex flex-col justify-between">
                                                        <div className="bg-white/90 backdrop-blur-sm border-2 border-gray-800 p-3 rounded shadow-xl mt-4 md:mt-20 ml-auto max-w-fit transform md:-rotate-2 print:border-black print:bg-white print:shadow-none">
                                                            <h4 className="text-xs font-bold font-arabic text-gray-500 uppercase tracking-widest mb-1 border-b border-gray-300 pb-1">KEY MEASUREMENTS</h4>
                                                            <div className="flex flex-col gap-1 text-sm font-bold text-gray-900 font-mono" dir="ltr">
                                                                {activePreferences.measurements.bust && <div><span className="text-gray-500">Bust:</span> {activePreferences.measurements.bust} <span className="text-xs">cm</span></div>}
                                                                {activePreferences.measurements.waist && <div><span className="text-gray-500">Waist:</span> {activePreferences.measurements.waist} <span className="text-xs">cm</span></div>}
                                                                {activePreferences.measurements.hips && <div><span className="text-gray-500">Hips:</span> {activePreferences.measurements.hips} <span className="text-xs">cm</span></div>}
                                                                {activePreferences.measurements.shoulder && <div><span className="text-gray-500">Shoulder:</span> {activePreferences.measurements.shoulder} <span className="text-xs">cm</span></div>}
                                                                {activePreferences.height && <div><span className="text-gray-500">Length/Height:</span> {activePreferences.height} <span className="text-xs">cm</span></div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (!loadingImage && (
                                        <div className="text-gray-400 flex flex-col items-center p-10 z-10"><ImageIcon className="w-12 h-12 mb-2 opacity-50" />تعذر توليد الصورة</div>
                                    ))}
                                </div>
                            </div>

                            {/* Section 2: Precise Measurements */}
                            <div className="mb-10 print:break-inside-avoid">
                                <h3 className="text-xl font-bold font-arabic mb-4 text-gray-800 border-l-4 border-gray-800 pl-3">المقاسات الدقيقة (Points of Measure)</h3>
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 print:bg-transparent print:border-black">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" dir="ltr">
                                        {activePreferences.measurements && Object.keys(activePreferences.measurements).length > 0 ? (
                                            Object.entries(activePreferences.measurements).map(([key, value]) => (
                                                <div key={key} className="bg-white p-3 rounded shadow-sm border border-gray-100 flex flex-col items-center print:border-black">
                                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{key}</span>
                                                    <span className="text-lg font-bold text-gray-900">{value} cm</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full text-right text-orange-500 font-arabic" dir="rtl">
                                                لا توجد قياسات رقمية دقيقة مدخلة. يُفضل أخذ القياسات الفعلية قبل القص.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Bill of Materials & Tailoring Instructions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:break-inside-avoid">
                                <div>
                                    <h3 className="text-xl font-bold font-arabic mb-4 text-gray-800 border-l-4 border-gray-800 pl-3">المواد (Bill of Materials)</h3>
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-full print:bg-transparent print:border-black">
                                        <p className="text-gray-800 font-arabic leading-relaxed">
                                            <span className="font-bold underline mb-2 block">القماش (Fabric):</span>
                                            {result?.designRecommendation?.fabric}
                                        </p>
                                        <hr className="my-4 border-gray-300 print:border-black" />
                                        <p className="text-gray-800 font-arabic leading-relaxed">
                                            <span className="font-bold underline mb-2 block">المكونات الاضافية:</span>
                                            {result?.designRecommendation?.billOfMaterials || 'تحدد بواسطة الخياط حسب المخطط.'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold font-arabic mb-4 text-gray-800 border-l-4 border-gray-800 pl-3">تعليمات الخياطة (Instructions)</h3>
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-full print:bg-transparent print:border-black">
                                        <p className="text-gray-800 font-arabic leading-relaxed whitespace-pre-wrap">
                                            {result?.designRecommendation?.tailoringInstructions}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 text-center print:block">
                                <p className="text-2xl font-arabic text-gray-700 leading-relaxed italic border-t pt-8 print:border-black">
                                    "{result?.analysis}"
                                </p>
                            </div>

                            {/* Fast Regeneration / Tweak Area */}
                            <div className="mt-12 bg-primary-50 p-6 rounded-2xl border border-primary-100 print:hidden flex flex-col items-center">
                                <h4 className="text-xl font-bold font-arabic text-primary-900 mb-3">هل ترغبين بتعديل وتطوير هذا التصميم؟</h4>
                                <p className="text-primary-700 font-arabic text-sm mb-4 text-center max-w-lg">اكتبي ما تودين تغييره (مثلاً: أريد الأكمام أطول ومزمومة، أضيفي فتحة من الجانب، اجعل التطريز أخف) وسيقوم المصمم بابتكار نسخة جديدة ومحسنة فوراً.</p>
                                <textarea
                                    value={tweakInput}
                                    onChange={(e) => setTweakInput(e.target.value)}
                                    placeholder="اكتبي تعديلاتك الدقيقة هنا..."
                                    className="w-full text-right p-4 rounded-xl border border-primary-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 bg-white font-arabic text-lg resize-none min-h-[120px] shadow-inner mb-4 outline-none transition-all"
                                    dir="rtl"
                                />
                                <button
                                    onClick={handleRegenerateWithTweaks}
                                    disabled={!tweakInput.trim()}
                                    className={`btn-primary flex items-center gap-2 font-arabic text-lg px-8 py-3 shadow-md hover:shadow-lg transition-all ${!tweakInput.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Sparkles className="w-5 h-5" />
                                    توليد وتحديث التصميم
                                </button>
                            </div>

                        </div>
                    </motion.div>

                    {/* Affiliate Store Column - Now Horizontal & Prominent */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="w-full print:hidden"
                    >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-gradient-to-l from-primary-900 to-gray-900 p-6 rounded-2xl shadow-lg border border-primary-800">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
                                    <ShoppingBag className="w-8 h-8 text-primary-200" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold font-arabic text-white mb-1">تسوّقي هذه الإطلالة جاهزة</h2>
                                    <p className="text-primary-200 font-arabic text-sm">أقرب الخيارات المتوفرة حالياً في المتاجر الكبرى المطابقة لتصميمك</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            {((result?.suggestedProducts) || (result?.noonProducts) || []).map((product, index) => (
                                <motion.div key={index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + (index * 0.1) }} className="h-full">
                                    <ProductCard product={product} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default StylistChat;
