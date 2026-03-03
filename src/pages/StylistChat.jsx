import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, Scissors, Loader2, ArrowRight, ShoppingBag, Image as ImageIcon, Printer, RefreshCcw, Plus } from 'lucide-react';
import { generateMasterTechPackImage } from '../services/ai';
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
            setLoadingText("جاري استكشاف قواعد بيانات المتاجر ومطابقة المنتجات مع الهوية الوراثية (AI DNA)...");

            // 1. Fetch matching products directly using our robust local matcher
            const products = await fetchAndScoreProducts(prefs);
            setScoredProducts(products);

            if (products.length === 0) {
                throw new Error("لم نتمكن من إيجاد تطابق في قاعدة البيانات الحالية لخياراتك. يرجى تعديل الخصائص والمحاولة مجدداً.");
            }

            const topProduct = products[0];
            const dna = topProduct.ai_dna;

            // 2. Synthesize the Result Object to feed the UI Sketch Board
            const data = {
                exact_match: [topProduct],
                marketing_copy: dna.ai_marketing_title || topProduct.title,
                tech_specs: {
                    silhouette: dna.silhouette || 'غير محدد',
                    neckline: dna.neckline || 'غير محدد',
                    sleeves: dna.sleeves || 'غير محدد',
                    waist: dna.waist || 'غير محدد',
                    fabric: dna.fabric || 'غير محدد',
                    embellishments: Array.isArray(dna.embellishments) ? dna.embellishments : (dna.embellishments ? [dna.embellishments] : []),
                    textures: Array.isArray(dna.textures) ? dna.textures : (dna.textures ? [dna.textures] : []),
                    modesty: dna.modesty || 'غير محدد',
                    price: topProduct.price || '---',
                    currency: topProduct.currency || 'ر.س'
                },
                color_alternatives: products.length > 1 ? [products[1]] : [],
                silhouette_alternatives: products.length > 2 ? [products[2]] : [],
                detail_alternatives: products.length > 3 ? [products[3]] : [],
                // Create a literal prompt for the master image based on the exact matched DNA
                image_generation_prompt: `A highly realistic, ultra-detailed fashion editorial photo of a ${dna.category}. Features: ${dna.silhouette} silhouette, ${dna.neckline} neckline, ${dna.sleeves} sleeves, made of ${dna.fabric} fabric. Details: ${(Array.isArray(dna.embellishments) ? dna.embellishments : (dna.embellishments ? [dna.embellishments] : [])).join(', ')}. Occasion: ${dna.occasion}. Elegant, luxurious lighting, worn by a high-end fashion model, studio gray background, 8k resolution, photorealistic.`
            };

            setResult(data);

            // 3. Generate Visual Master Image
            setLoadingImage(true);
            try {
                const url = await generateMasterTechPackImage(data.image_generation_prompt, prefs);
                setMasterImage(url);
            } catch (err) {
                console.error("Master image fail:", err);
            } finally {
                setLoadingImage(false);
            }

        } catch (err) {
            console.error(err);
            setError(err.message || 'عذراً، حدث خطأ أثناء إعداد الملف التقني (Tech Pack). يرجى المحاولة مرة أخرى.');
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
                                    <h3 className="text-xl font-bold font-arabic mb-4 text-primary-900 border-r-4 border-primary-600 pr-4">العنوان الترويجي المبتكر</h3>
                                    <p className="text-2xl font-bold text-primary-800 leading-relaxed text-right dir-rtl mb-6">
                                        {result.marketing_copy}
                                    </p>

                                    {/* تفاصيل السكتش التقني الجديد */}
                                    {result.tech_specs && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 font-arabic" dir="rtl">
                                            {/* الهيكل الإنشائي */}
                                            <div className="bg-white p-5 rounded-xl border border-primary-100 shadow-sm">
                                                <h4 className="text-lg font-bold text-primary-900 mb-3 flex items-center gap-2"><Scissors className="w-5 h-5" /> الهيكل الإنشائي الأساسي (Structure)</h4>
                                                <ul className="text-primary-800 space-y-2">
                                                    <li><span className="font-bold">القصة (Silhouette):</span> {result.tech_specs.silhouette}</li>
                                                    <li><span className="font-bold">الياقة (Neckline):</span> {result.tech_specs.neckline}</li>
                                                    <li><span className="font-bold">الأكمام (Sleeves):</span> {result.tech_specs.sleeves}</li>
                                                    <li><span className="font-bold">تحديد الخصر (Waist):</span> {result.tech_specs.waist}</li>
                                                </ul>
                                            </div>

                                            {/* هوية القماش والزينة ودليل الحشمة */}
                                            <div className="bg-white p-5 rounded-xl border border-primary-100 shadow-sm">
                                                <h4 className="text-lg font-bold text-primary-900 mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5" /> هوية القماش والحشمة (Aesthetics)</h4>
                                                <ul className="text-primary-800 space-y-2">
                                                    <li><span className="font-bold">القماش (Fabric):</span> {result.tech_specs.fabric}</li>
                                                    {result.tech_specs.embellishments.length > 0 && (
                                                        <li><span className="font-bold">الزينة:</span> {result.tech_specs.embellishments.join('، ')}</li>
                                                    )}
                                                    {result.tech_specs.textures.length > 0 && (
                                                        <li><span className="font-bold">الطبقات والكسرات:</span> {result.tech_specs.textures.join('، ')}</li>
                                                    )}
                                                    <li><span className="font-bold">دليل الحشمة:</span> <span className="text-green-700 bg-green-50 px-2 rounded">{result.tech_specs.modesty}</span></li>
                                                    <li><span className="font-bold">السعر التجاري:</span> <span className="font-sans font-bold">{result.tech_specs.price} {result.tech_specs.currency}</span></li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {result?.exact_match?.[0]?.discountCode && (
                                        <div className="mt-6 flex flex-wrap gap-4 items-center justify-end bg-primary-100/50 p-4 rounded-xl border border-primary-200">
                                            <span className="font-arabic font-bold text-primary-800 text-lg">كود الخصم الحصري في متجر {result.exact_match[0].storeName}:</span>
                                            <span className="bg-white text-primary-900 px-4 py-2 rounded-lg font-bold border border-primary-300 shadow-sm text-xl">{result.exact_match[0].discountCode}</span>
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
                                            <p className="font-arabic font-bold text-primary-900 text-xl">جاري رسم وتجسيد التصميم الابتكاري لكِ...</p>
                                        </div>
                                    )}

                                    {masterImage ? (
                                        <img
                                            src={masterImage}
                                            alt="Master Tech Pack Design"
                                            className="w-full h-auto object-cover opacity-0 transition-opacity duration-1000 ease-in-out hover:scale-105 transform cursor-zoom-in"
                                            onLoad={(e) => e.target.classList.remove('opacity-0')}
                                            onClick={() => window.open(masterImage, '_blank')}
                                        />
                                    ) : (
                                        !loadingImage && (
                                            <div className="text-gray-400 flex flex-col items-center p-12">
                                                <ImageIcon className="w-20 h-20 mb-4 opacity-50" />
                                                <p className="font-arabic text-lg">الصورة التوضيحية غير متوفرة</p>
                                            </div>
                                        )
                                    )}
                                </div>

                                <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100 text-center">
                                    <p className="font-arabic text-primary-800 text-sm italic">
                                        هذا التصميم تم توليده ذكياً بناءً على خياراتك، ونرشح لك القطع التالية كأقرب تنفيذ واقعي له
                                    </p>
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

                            {/* --- بداية كود عرض البلوكات الذكية --- */}

                            <div className="product-suggestions-container mt-8 space-y-8 print:hidden">

                                {/* التحقق من وجود منتج مقترح أقرب للمثالي */}
                                {result.exact_match && result.exact_match.length > 0 && (
                                    <div className="zone-exact bg-green-50 p-6 rounded-2xl border-2 border-green-500 shadow-lg">
                                        <h3 className="text-2xl font-bold font-arabic text-green-800 mb-4">✨ تصميم مقترح مستوحى من طلبك</h3>
                                        {result.exact_match.map(product => (
                                            <div key={product.product_id} className="product-card flex flex-col items-center">
                                                <p className="text-gray-700 font-arabic text-center mb-4">{product.match_reason}</p>
                                                <a href={product.final_affiliate_url || product.direct_product_url} target="_blank" rel="noopener noreferrer" className="btn-buy font-arabic bg-green-600 text-white px-8 py-3 rounded-full hover:bg-green-700 transition">
                                                    انتقلي لصفحة الشراء الآن
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* منطقة بدائل الألوان والموديلات المشابهة */}
                                {result.color_alternatives && result.color_alternatives.length > 0 && (
                                    <div className="zone-color bg-blue-50 p-6 rounded-2xl border border-blue-200">
                                        <h3 className="text-xl font-bold font-arabic text-blue-800 mb-4">🎨 خيارات متوافقة إضافية تم اختيارها لكِ بدقة</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {[...result.color_alternatives, ...result.silhouette_alternatives, ...result.detail_alternatives]
                                                .filter(Boolean)
                                                .slice(0, 3) // إظهار أفضل 3 بدائل إضافية
                                                .map(product => (
                                                    <div key={product.id || Math.random()} className="p-4 bg-white rounded-xl shadow-sm flex flex-col items-center">
                                                        {product.imageUrl && <img src={product.imageUrl} alt={product.title} className="w-full h-48 object-cover rounded-lg mb-3" />}
                                                        <p className="text-sm font-arabic font-bold text-gray-800 mb-1 text-center" dir="rtl">{product.product_id}</p>
                                                        <p className="text-xs font-arabic text-gray-500 mb-3 text-center" dir="rtl">{product.match_reason}</p>
                                                        <a href={product.final_affiliate_url} target="_blank" className="font-arabic text-sm bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold w-full text-center hover:bg-blue-200" rel="noopener noreferrer">تفاصيل الفستان</a>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* رسالة الخطأ (تظهر فقط إذا كانت كل البلوكات الأربعة فارغة) */}
                                {(!result.exact_match?.length && !result.color_alternatives?.length && !result.silhouette_alternatives?.length && !result.detail_alternatives?.length) && (
                                    <div className="bg-red-50 p-6 rounded-2xl border border-red-200 text-center">
                                        <h3 className="text-xl font-bold font-arabic text-red-800">عذراً، لم نجد تطابقاً قريباً</h3>
                                        <p className="text-gray-600 font-arabic mt-2">جربي تغيير بعض الخيارات (مثل اللون أو الياقة) لنتمكن من إيجاد الفستان المثالي لكِ.</p>
                                    </div>
                                )}

                            </div>
                            {/* --- نهاية كود عرض البلوكات الذكية --- */}
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
                    {match.discountCode && <span className="bg-green-100 text-green-800 text-sm font-bold px-3 py-1.5 rounded-full font-arabic border border-green-200">{match.discountCode}</span>}
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
