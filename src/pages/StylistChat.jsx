import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Scissors, Loader2, ArrowRight, ShoppingBag, Image as ImageIcon, Printer, RefreshCcw, Plus } from 'lucide-react';
import { generateTechPackSpecSheet, generateMasterTechPackImage } from '../services/ai';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';
import { matchAffiliateStores } from '../services/affiliateMatcher';
import { generateProductIntelligence } from '../services/productIntelligence';
import { fetchAndScoreProducts } from '../services/productApi';

const StylistChat = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [scoredProducts, setScoredProducts] = useState([]);
    const [error, setError] = useState(null);

    const [masterImage, setMasterImage] = useState(null);
    const [loadingImage, setLoadingImage] = useState(false);

    const [tweakInput, setTweakInput] = useState("");
    const [activePreferences, setActivePreferences] = useState(location.state?.preferences || null);

    const [loadingText, setLoadingText] = useState("جاري بناء الملف التقني (Tech Pack)...");

    const fetchTechPack = async (prefs) => {
        setLoading(true);
        setError(null);
        try {
            // STEP 1: Generate Product Intelligence & Fetch Real Products FIRST
            setLoadingText("جاري تحليل المدخلات للبحث عن منتج حقيقي يطابق مواصفاتك...");
            let finalScoredProducts = [];
            let topProduct = null;
            let topProductDesc = "";
            let intelligenceObj = null;

            try {
                intelligenceObj = await generateProductIntelligence(prefs);
                console.log("PIE Output:", intelligenceObj);

                setLoadingText("جاري استكشاف قواعد بيانات المتاجر ومطابقة المنتجات...");
                const products = await fetchAndScoreProducts(intelligenceObj.searchQueries, intelligenceObj);
                finalScoredProducts = products;
                setScoredProducts(products);

                if (products.length > 0) {
                    topProduct = products[0];
                    topProductDesc = `The design must closely resemble this real product: ${topProduct.title}. Color: ${topProduct.rawAttributes?.color || prefs.colors}. Material: ${topProduct.rawAttributes?.material || prefs.fabricMaterial}. DO NOT add elements not present in this description.`;
                }
            } catch (err) {
                console.error("PIE/Scoring fail:", err);
            }

            // STEP 2: Generate Spec Sheet (Text/JSON), Passing the Top Product to Force Alignment
            setLoadingText("يتم الآن رسم لوحة المهندسة المعمارية للفستان (Master Board)...");
            const data = await generateTechPackSpecSheet(prefs, topProduct);

            if (!data || (!data.marketing_copy && !data.top_matches)) {
                console.error("Malformed AI response:", data);
                throw new Error("لم نتمكن من استلام تفاصيل التصميم بشكل كامل من الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.");
            }

            setResult(data);

            // STEP 3: Generate Master Tech Pack Image (Based on text model's prompt)
            if (data.image_generation_prompt) {
                setLoadingImage(true);
                try {
                    const url = await generateMasterTechPackImage(data.image_generation_prompt, prefs);
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
                <h2 className="text-2xl font-bold font-arabic text-primary-900 mb-3 animate-pulse">{loadingText}</h2>
                <p className="text-primary-700 font-arabic text-center max-w-md">
                    نقوم بالاعتماد على خوارزمياتنا لضمان دقة التنفيذ وموازنة طلبك مع قواعد التصميم والموضة.
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
                            <div className="mb-10 text-center relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-primary-600 rounded-full"></div>
                                <h1 className="text-4xl font-bold font-arabic text-primary-900 tracking-wide pt-6 mb-3">{result?.exact_match?.[0]?.product_id || 'مواصفات التصميم التقني'}</h1>
                                <p className="text-primary-600 font-arabic text-lg tracking-widest opacity-80 uppercase mb-4">Elite Haute Couture Specification</p>

                                <div className="flex justify-center mb-2">
                                    <div className={`
                                        px-4 py-1.5 rounded-full text-sm font-arabic font-bold flex items-center gap-2 shadow-sm
                                        ${activePreferences?.activeTrack?.includes('AI-Suggested')
                                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                            : 'bg-primary-100 text-primary-700 border border-primary-200'}
                                    `}>
                                        <Sparkles className="w-4 h-4" />
                                        <span>
                                            {activePreferences?.activeTrack?.includes('AI-Suggested')
                                                ? 'تم التوليد بواسطة: المسار الآلي (AI-Suggested Style)'
                                                : 'تم التوليد بواسطة: المسار اليدوي (Manual Customization)'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 0: Design Overview / Marketing Copy */}
                            {result?.marketing_copy && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-12 bg-gradient-to-br from-primary-50/50 to-white p-8 rounded-3xl border border-primary-100/50 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Sparkles className="w-12 h-12 text-primary-600" />
                                    </div>
                                    <h3 className="text-xl font-bold font-arabic mb-4 text-primary-900 border-r-4 border-primary-600 pr-4">رؤية المصمم (Stylist Vision)</h3>
                                    <p className="text-xl font-arabic text-primary-900 leading-relaxed text-right dir-rtl italic">
                                        "{result?.marketing_copy}"
                                    </p>

                                    {result?.exact_match?.[0]?.discount_code && (
                                        <div className="mt-6 flex flex-wrap gap-4 items-center justify-end bg-primary-100/50 p-4 rounded-xl border border-primary-200">
                                            <span className="font-arabic font-bold text-primary-800 text-lg">كود الخصم الحصري:</span>
                                            <span className="bg-white text-primary-900 px-4 py-2 rounded-lg font-bold border border-primary-300 shadow-sm text-xl">{result.exact_match[0].discount_code}</span>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Section 1: Visual Master Board */}
                            <div className="mb-12">
                                <h3 className="text-xl font-bold font-arabic mb-4 text-primary-900 border-r-4 border-primary-600 pr-4">لوحة التصميم الشاملة (Visual Master Board)</h3>
                                <div className="rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-primary-200 relative w-full flex items-center justify-center print:border-solid print:border-black min-h-[450px] shadow-inner">
                                    {loadingImage && !masterImage && (
                                        <div className="absolute flex flex-col items-center z-10 p-10 bg-white/60 backdrop-blur-md rounded-2xl shadow-xl">
                                            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                                            <p className="font-arabic text-lg font-bold text-primary-800">جاري رسم المخطط المعماري للفستان...</p>
                                            <p className="font-arabic text-sm text-primary-600 mt-2 opacity-70">نقوم الآن بتحويل أفكارك إلى لوحة فنية</p>
                                        </div>
                                    )}
                                    {masterImage ? (
                                        <>
                                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl z-20 text-sm font-arabic border border-white/20 shadow-lg">
                                                {scoredProducts.length > 0 ? 'تصور تصميم مبني على أقرب منتج مطابق لطلبك' : 'تصور مبدئي للتصميم'}
                                            </div>
                                            <img src={masterImage} alt="Master Tech Pack Image" className="w-full object-contain max-h-[1000px] print:max-h-[600px] z-0 relative" />
                                        </>
                                    ) : (!loadingImage && (
                                        <div className="text-gray-300 flex flex-col items-center p-10 z-10 anim-pulse"><ImageIcon className="w-16 h-16 mb-4 opacity-30" />تعذر توليد لوحة التصميم</div>
                                    ))}
                                </div>
                            </div>

                            {/* Section 2: Precise Measurements */}
                            <div className="mb-12 print:break-inside-avoid">
                                <h3 className="text-xl font-bold font-arabic mb-4 text-primary-900 border-r-4 border-primary-600 pr-4">تفاصيل القياسات الدقيقة (Points of Measure)</h3>
                                <div className="bg-white p-6 rounded-2xl border-2 border-primary-50 print:bg-transparent print:border-black shadow-sm">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" dir="ltr">
                                        {activePreferences.measurements && Object.keys(activePreferences.measurements).length > 0 ? (
                                            Object.entries(activePreferences.measurements).map(([key, value]) => (
                                                <div key={key} className="bg-primary-50/30 p-4 rounded-xl border border-primary-100 flex flex-col items-center transition-all hover:bg-primary-50 print:border-black">
                                                    <span className="text-xs text-primary-500 font-bold uppercase tracking-wider mb-2">{key === 'bust' ? 'Bust' : key === 'waist' ? 'Waist' : key === 'hips' ? 'Hips' : key === 'shoulder' ? 'Shoulder' : key}</span>
                                                    <span className="text-xl font-black text-primary-900">{value} cm</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full text-right text-orange-500 font-arabic bg-orange-50 p-4 rounded-xl border border-orange-100" dir="rtl">
                                                لا توجد قياسات رقمية دقيقة مدخلة. يُفضل أخذ القياسات الفعلية قبل القص لضمان الدقة بنسبة 1:1.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Purchase CTA directly linking to Exact Match */}
                            {result?.exact_match?.[0]?.final_affiliate_url && (
                                <div className="mt-4 mb-12 text-center relative p-8 bg-gradient-to-l from-primary-900 to-gray-900 rounded-[3rem] overflow-hidden shadow-2xl print:hidden flex flex-col items-center">
                                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
                                    <ShoppingBag className="w-12 h-12 text-white/50 mb-4" />
                                    <h3 className="text-2xl font-bold font-arabic text-white mb-2 leading-snug">التصميم الذي طلبتِه تماماً (تطابق 100%)</h3>
                                    <p className="text-primary-200 font-arabic text-sm mb-6 max-w-lg">{result.exact_match[0].match_reason}</p>
                                    <a
                                        href={result.exact_match[0].final_affiliate_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-white text-primary-900 hover:bg-primary-50 px-10 py-4 rounded-full font-bold font-arabic text-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all transform hover:scale-105"
                                    >
                                        انتقلي لصفحة الشراء الآن
                                    </a>
                                </div>
                            )}

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

                            {/* Smart Zoning Architecture: Tiered Cross-Selling */}
                            <div className="mt-12 space-y-12 print:hidden">
                                {/* Zone 2: Color Variations */}
                                {result?.color_alternatives?.length > 0 && (
                                    <div className="bg-white p-8 rounded-3xl border border-primary-100 shadow-lg">
                                        <h3 className="text-2xl font-bold font-arabic mb-6 text-primary-900 border-r-4 border-primary-600 pr-4">نفس تصميمك المفضل.. ولكن بألوان أخرى ساحرة</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {result.color_alternatives.map((match, index) => (
                                                <AlternativeCard key={index} match={match} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Zone 3: Silhouette Variations */}
                                {result?.silhouette_alternatives?.length > 0 && (
                                    <div className="bg-white p-8 rounded-3xl border border-primary-100 shadow-lg">
                                        <h3 className="text-2xl font-bold font-arabic mb-6 text-primary-900 border-r-4 border-primary-600 pr-4">بنفس لونك المفضل.. مع اختلاف بسيط في قصة الفستان</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {result.silhouette_alternatives.map((match, index) => (
                                                <AlternativeCard key={index} match={match} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Zone 4: Detail Variations */}
                                {result?.detail_alternatives?.length > 0 && (
                                    <div className="bg-white p-8 rounded-3xl border border-primary-100 shadow-lg">
                                        <h3 className="text-2xl font-bold font-arabic mb-6 text-primary-900 border-r-4 border-primary-600 pr-4">تصاميم قريبة جداً لطلبك.. بلمسة مختلفة على الأكتاف والياقة</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {result.detail_alternatives.map((match, index) => (
                                                <AlternativeCard key={index} match={match} />
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 bg-gradient-to-l from-primary-900 to-gray-900 p-6 rounded-2xl shadow-lg border border-primary-800">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
                                    <ShoppingBag className="w-8 h-8 text-primary-200" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold font-arabic text-white mb-1">تسوّقي هذه الإطلالة جاهزة</h2>
                                </div>
                            </div>
                        </div>

                        {scoredProducts.length > 0 && (
                            <div className="mb-8 p-4 bg-white/50 backdrop-blur-sm border border-primary-200 rounded-xl text-center shadow-sm" dir="rtl">
                                <p className="font-arabic text-primary-900 text-lg">
                                    هذه أقرب المنتجات المتوفرة حاليًا والمطابقة لطلبك بنسبة <span className="font-bold text-green-700">{Math.floor(scoredProducts[0].matchScore)}%</span> أو أعلى، مرتبة من الأعلى تطابقًا.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                            {scoredProducts.length > 0 ? (
                                scoredProducts.map((product, index) => (
                                    <motion.div key={product.id || index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + (index * 0.1) }} className="h-full">
                                        <ProductCard product={product} />
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full py-10 px-6 text-center bg-white rounded-2xl border border-gray-200 shadow-sm" dir="rtl">
                                    <p className="font-arabic text-gray-800 font-bold text-lg mb-2">تعذر العثور على تطابق دقيق</p>
                                    <p className="font-arabic text-gray-600 text-sm">
                                        التزاماً بالشفافية والقيود الصارمة، لم نعثر على منتج حقيقي في المتاجر المعتمدة يحقق نسبة تطابق <span className="text-primary-600 font-bold">65%</span> أو أعلى لمواصفات تصميمك.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

// Reusable card component for the alternative zones
const AlternativeCard = ({ match }) => {
    return (
        <div className="bg-gradient-to-br from-primary-50/50 to-white p-6 rounded-2xl border border-primary-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden">
            <div className="mb-6 z-10">
                <div className="flex justify-end items-center mb-4">
                    {match.discount_code && <span className="bg-green-100 text-green-800 text-sm font-bold px-3 py-1.5 rounded-full font-arabic border border-green-200">{match.discount_code}</span>}
                </div>
                <h4 className="font-bold text-primary-900 text-lg mb-2 font-arabic" dir="rtl">{match.product_id}</h4>
                <p className="font-arabic text-primary-700 text-base leading-relaxed" dir="rtl">{match.match_reason}</p>
            </div>
            {match.final_affiliate_url && (
                <a
                    href={match.final_affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-primary-100 hover:bg-primary-600 hover:text-white text-primary-800 font-arabic text-center py-3 rounded-xl transition-colors shadow-sm font-bold text-lg z-10"
                >
                    رؤية هذه النسخة
                </a>
            )}
        </div>
    );
};

export default StylistChat;
