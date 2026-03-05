import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Scissors, Ruler, Palette, ChevronLeft } from "lucide-react";
import { generateKeywords } from "../services/keywordMapper";
import { DESIGN_CONSTRAINTS } from "../services/designConstraints";
import WireframeMannequin from "../components/WireframeMannequin";

const CATEGORIES = [
    {
        id: "silhouette",
        label: "القصّة (Silhouette)",
        icon: <Scissors className="w-5 h-5" />,
        options: ["A-Line", "كلوش", "سمكة", "منفوش (Princess)", "مستقيم (Shift)", "لف (Wrap)"],
    },
    {
        id: "neckline",
        label: "الياقة (Neckline)",
        icon: <Scissors className="w-5 h-5" />,
        options: ["قارب", "أكتاف مكشوفة", "ياقة عالية", "قصة قلب (Sweetheart)", "سبعة (V-Neck)", "ياقة مربعة", "رسن (Halter)"],
    },
    {
        id: "sleeves",
        label: "الأكمام (Sleeves)",
        icon: <Scissors className="w-5 h-5" />,
        options: ["بدون أكمام", "أكمام قصيرة", "أكمام طويلة", "ثلاثة أرباع (3/4)", "كم منفوخ (Puff)", "كم بيل (Bell)"],
    },
    {
        id: "clothingLength",
        label: "طول الزي (Length)",
        icon: <Ruler className="w-5 h-5" />,
        options: ["ماكسي (طويل)", "ميدي (متوسط)", "قصير (Mini)", "طول الشاي (Tea)", "بذيل طويل (Train)"],
    },
    {
        id: "fabricMaterial",
        label: "القماش (Fabric)",
        icon: <Sparkles className="w-5 h-5" />,
        options: ["ساتان", "شيفون", "مخمل", "كريب", "تفتا", "دانتيل", "حرير", "تل (Tulle)"],
    },
    {
        id: "fabricEmbroidery",
        label: "الزينة (Embellishments)",
        icon: <Sparkles className="w-5 h-5" />,
        options: ["شك خرز وكريستال", "تطريز دانتيل", "ريش طبيعي", "كشكشة (Ruffles)", "ترتر (Sequins)", "بدون إضافات (Minimal)"],
    },
    {
        id: "colors",
        label: "اللون (Color)",
        icon: <Palette className="w-5 h-5" />,
        options: ["أسود", "كحلي", "عنابي", "زيتي", "وردي ناعم", "موف / لافندر", "نود / بيج", "ذهبي", "فضي ميتاليك", "سكري", "أحمر", "أزرق سماوي"],
    },
    {
        id: "occasion",
        label: "المناسبة (Occasion)",
        icon: <Sparkles className="w-5 h-5" />,
        options: ["سهرة", "زفاف", "رسمي", "يومي", "خطوبة", "عشاء رسمي"],
    }
];

const AI_CATEGORIES = [
    {
        id: "bodyShape",
        label: "شكل الجسم (Body Shape)",
        icon: <Ruler className="w-5 h-5" />,
        options: ["ساعة رملية (Hourglass)", "كمثرى (Pear)", "تفاحة (Apple)", "مستطيل (Rectangle)", "مثلث مقلوب (Inverted Triangle)"]
    },
    {
        id: "proportions",
        label: "نسب القامة (Proportions)",
        icon: <Ruler className="w-5 h-5" />,
        options: ["متناسق (Balanced)", "جذع طويل وأرجل قصيرة", "جذع قصير وأرجل طويلة"]
    },
    {
        id: "undertone",
        label: "أندرتون البشرة (Skin Undertone)",
        icon: <Palette className="w-5 h-5" />,
        options: ["دافئ (Warm)", "بارد (Cool)", "محايد (Neutral)"]
    },
    {
        id: "goals",
        label: "أهداف التصميم (Goals)",
        icon: <Sparkles className="w-5 h-5" />,
        options: ["إبراز الخصر", "إخفاء منطقة البطن", "إخفاء الأرداف", "إطالة القامة", "موازنة الأكتاف", "محتشم (Modest)"]
    },
    {
        id: "occasion",
        label: "المناسبة (Occasion)",
        icon: <Sparkles className="w-5 h-5" />,
        options: ["سهرة", "زفاف", "رسمي", "يومي", "خطوبة", "عشاء رسمي"],
    }
];

const IntakeForm = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Default answers object
    const [answers, setAnswers] = useState({
        clothingType: "فستان", // Default base type for now
        activeTrack: "المسار اليدوي (Manual Customization)" // Defaulting to manual for architect feel
    });

    const [measurements, setMeasurements] = useState({});

    useEffect(() => {
        if (location.state?.editMode && location.state?.preferences) {
            const prefs = location.state.preferences;
            setMeasurements(prefs.measurements || {});
            const pastAnswers = { ...prefs };
            delete pastAnswers.measurements;
            setAnswers(pastAnswers);
        } else {
            const savedMeasurements = localStorage.getItem("userMeasurements");
            if (savedMeasurements) {
                try {
                    setMeasurements(JSON.parse(savedMeasurements));
                } catch (e) {
                    console.error("Could not parse saved measurements");
                }
            }
        }
    }, [location.state]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSelect = (categoryId, option) => {
        setAnswers(prev => ({
            ...prev,
            [categoryId]: prev[categoryId] === option ? "" : option
        }));
    };

    const handleNext = () => {
        setIsGenerating(true);

        localStorage.setItem("userMeasurements", JSON.stringify(measurements));

        const processedAnswers = { ...answers };

        // Ensure required fields mapping to AI DNA are clean strings
        Object.keys(processedAnswers).forEach((key) => {
            if (Array.isArray(processedAnswers[key])) {
                processedAnswers[key] = processedAnswers[key].join(" ومع ");
            }
        });

        const finalData = { ...processedAnswers, measurements };

        const payload = {
            preferences: finalData,
            keywords: generateKeywords(processedAnswers),
            constraints: DESIGN_CONSTRAINTS,
            strictMode: answers.activeTrack === "المسار اليدوي (Manual Customization)"
        };

        // Add a premium "Sumissura-style" delay to simulate processing before the jump
        setTimeout(() => {
            navigate("/chat", { state: payload });
        }, 2200);
    };

    const isManualTrack = answers.activeTrack === "المسار اليدوي (Manual Customization)";

    // Calculate if they have selected at least the core basics to proceed
    const isReady = isManualTrack
        ? (answers.silhouette && answers.fabricMaterial && answers.colors)
        : (answers.bodyShape && answers.proportions && answers.goals);

    // Helper to render color swatches
    const getHexForColor = (colorName) => {
        const hexMap = {
            "أسود": "#1a1a1a",
            "كحلي": "#1b263b",
            "عنابي": "#5e1a24",
            "زيتي": "#4a5d23",
            "وردي ناعم": "#ffb6c1",
            "موف / لافندر": "#e6e6fa",
            "نود / بيج": "#e6c2a5",
            "ذهبي": "#d4af37",
            "فضي ميتاليك": "#c0c0c0",
            "سكري": "#f5f5dc",
            "أحمر": "#c41e3a",
            "أزرق سماوي": "#87ceeb",
        };
        return hexMap[colorName] || "#e5e7eb";
    };

    return (
        <div className="h-screen bg-[#fcfcfc] font-arabic flex flex-col lg:flex-row overflow-hidden" dir="rtl">

            {/* --- RIGHT PANEL (Controls) / Sidebar in RTL --- */}
            <div className="w-full lg:w-[400px] xl:w-[450px] bg-white border-l border-gray-100 flex flex-col h-full shadow-lg z-20">
                {/* Header built into the sidebar */}
                <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-10 shadow-sm flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-full transition-colors">
                        <ChevronLeft className="w-5 h-5 transform rotate-180" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">تصميم جديد (Bespoke)</h1>
                        <p className="text-gray-500 text-xs mt-1">اختاري تفاصيل فستانك بدقة عالية</p>
                    </div>
                </div>

                {/* Controls Area */}
                <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar space-y-10">

                    {/* Track Toggle */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-2 flex relative mb-8">
                        <div
                            className={`absolute top-2 bottom-2 w-[calc(50%-8px)] bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-300 ease-out z-0 
                            ${!isManualTrack ? 'translate-x-full left-auto right-2' : 'left-2'}`}
                        ></div>

                        <button
                            onClick={() => setAnswers({ ...answers, activeTrack: "المسار اليدوي (Manual Customization)" })}
                            className={`flex-[1] py-3 text-sm font-bold z-10 transition-colors rounded-xl flex items-center justify-center gap-2 ${isManualTrack ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Scissors className="w-4 h-4" />
                            تصميم يدوي
                        </button>
                        <button
                            onClick={() => setAnswers({ ...answers, activeTrack: "المسار العلمي (AI-Suggested Style)" })}
                            className={`flex-[1] py-3 text-sm font-bold z-10 transition-colors rounded-xl flex items-center justify-center gap-2 ${!isManualTrack ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Sparkles className="w-4 h-4" />
                            اقتراح علمي (AI)
                        </button>
                    </div>

                    {/* Dynamic Header Note based on track */}
                    {!isReady && (
                        <div className={`border rounded-xl p-4 flex items-start gap-3 text-sm mb-6 ${isManualTrack ? 'bg-orange-50/70 border-orange-100 text-orange-800' : 'bg-blue-50/70 border-blue-100 text-blue-800'}`}>
                            <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isManualTrack ? 'text-orange-500' : 'text-blue-500'}`} />
                            <p>{isManualTrack ? 'يجب اختيار (القصّة، القماش، واللون) على الأقل لبناء التصميم الأساسي.' : 'أدخلي بياناتك الجسدية (الشكل، النسب، الهدف) ليقوم الذكاء الاصطناعي ببناء التصميم العلمي المثالي لك.'}</p>
                        </div>
                    )}

                    {(isManualTrack ? CATEGORIES : AI_CATEGORIES).map((category) => (
                        <div key={category.id} className="border-b border-gray-50 pb-8 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2 mb-5">
                                <div className={!isManualTrack ? 'text-blue-400' : 'text-gray-400'}>{category.icon}</div>
                                <h3 className="font-bold text-gray-800 text-lg uppercase tracking-wider text-sm">{category.label}</h3>
                                {answers[category.id] && (
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md mr-auto ${isManualTrack ? 'text-primary-500 bg-primary-50' : 'text-blue-500 bg-blue-50'}`}>تم الاختيار</span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {category.options.map((opt) => {
                                    const isSelected = answers[category.id] === opt;
                                    const isColor = category.id === 'colors';

                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => handleSelect(category.id, opt)}
                                            className={`
                                                relative overflow-hidden transition-all duration-300 border rounded-xl flex items-center justify-center
                                                ${isColor ? 'w-14 h-14 rounded-full' : 'px-4 py-3'}
                                                ${isSelected
                                                    ? (isManualTrack ? 'bg-gray-900 border-gray-900 text-white shadow-md transform scale-105' : 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-105')
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                                                }
                                            `}
                                            title={isColor ? opt : undefined}
                                        >
                                            {isColor ? (
                                                <div className={`w-8 h-8 rounded-full border border-white/20 shadow-inner ${isSelected ? 'scale-110' : ''}`} style={{ backgroundColor: getHexForColor(opt) }}></div>
                                            ) : (
                                                <span className="text-sm font-medium z-10">{opt}</span>
                                            )}

                                            {isSelected && !isColor && (
                                                <div className={`absolute inset-0 z-0 ${isManualTrack ? 'bg-gray-900' : 'bg-blue-600'}`}></div>
                                            )}
                                            {isSelected && !isColor && (
                                                <span className="relative z-10 text-white font-bold">{opt}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Custom Notes Section */}
                    <div className="pt-6 border-t border-gray-100">
                        <h3 className="font-bold text-gray-800 text-sm uppercase mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-gray-400" />
                            ملاحظات خاصة للخياط
                        </h3>
                        <textarea
                            value={answers.customDescription || ""}
                            onChange={(e) => setAnswers({ ...answers, customDescription: e.target.value })}
                            placeholder="مثال: إضافة حزام خصر جلدي، أو جعل الأكمام أطول من المعتاد..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none h-28 transition-all hover:bg-white"
                        />
                    </div>

                    {/* Measurements Section */}
                    <div className="pt-6 border-t border-gray-100 pb-20">
                        <h3 className="font-bold text-gray-800 text-sm uppercase mb-4 flex items-center gap-2">
                            <Ruler className="w-4 h-4 text-gray-400" />
                            القياسات (اختياري)
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {['height', 'weight', 'bust', 'waist'].map(m => (
                                <div key={m} className="relative">
                                    <input
                                        type="number"
                                        placeholder={m === 'height' ? 'الطول (سم)' : m === 'weight' ? 'الوزن (كج)' : m === 'bust' ? 'الصدر (سم)' : 'الخصر (سم)'}
                                        value={measurements[m] || ''}
                                        onChange={(e) => setMeasurements({ ...measurements, [m]: e.target.value })}
                                        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm w-full focus:ring-2 focus:ring-gray-900 outline-none transition-all placeholder-gray-400"
                                        dir="ltr"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- LEFT PANEL (Live Preview Canvas) / Main visual area in RTL --- */}
            <div className="hidden lg:flex flex-1 bg-[#f3f4f6] relative flex-col items-center justify-center p-8 overflow-hidden">

                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-gray-200 to-transparent blur-3xl"></div>
                    <div className="absolute bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-gray-300 to-transparent blur-3xl"></div>
                </div>

                {/* Floating summary of creation */}
                <div className="absolute top-10 left-10 bg-white/80 backdrop-blur-md px-6 py-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white max-w-sm z-20">
                    <h2 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">Current Build</h2>
                    <p className="text-xl font-bold text-gray-800 leading-snug font-arabic">
                        {isManualTrack ? (
                            <>
                                {answers.clothingType} {answers.silhouette || '...'}
                                <br />
                                <span className="text-gray-500 font-normal text-lg">{answers.neckline ? `بياقة ${answers.neckline}` : ''} {answers.fabricMaterial ? `من الـ ${answers.fabricMaterial}` : ''}</span>
                            </>
                        ) : (
                            <>
                                تصميم علمي مخصص
                                <br />
                                <span className="text-blue-500 font-normal text-lg">{answers.bodyShape ? `لجسم ${answers.bodyShape}` : 'الذكاء الاصطناعي يحلل بياناتك...'}</span>
                            </>
                        )}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {Object.entries(answers).filter(([k, v]) => v && k !== 'clothingType' && k !== 'customDescription' && k !== 'activeTrack' && k !== 'silhouette' && k !== 'neckline' && k !== 'fabricMaterial' && k !== 'bodyShape').map(([k, v]) => (
                            <span key={k} className="text-xs font-bold text-gray-500 border border-gray-200 px-2 py-1 rounded-md">{v}</span>
                        ))}
                    </div>
                </div>

                {/* The Mannequin / Canvas Anchor */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 w-[400px] h-[600px] flex items-center justify-center"
                >
                    {/* Placeholder tailored silhouette / Mannequin shadow */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-200 to-gray-100 rounded-full blur-3xl opacity-50 transform scale-y-125 scale-x-50"></div>

                    {isManualTrack ? (
                        <WireframeMannequin answers={answers} />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center p-10 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl z-20">
                            <Sparkles className="w-16 h-16 text-blue-500 mb-6 animate-pulse" />
                            <h3 className="text-2xl font-bold text-gray-900 font-arabic mb-3">الخوارزمية العلمية قيد الاستعداد</h3>
                            <p className="text-gray-600 font-arabic leading-relaxed">
                                سيقوم الذكاء الاصطناعي بتحليل شكل جسمك ونسب التوازن لاختيار أفضل قصة، وياقة، وتفاصيل دقيقة تبرز جمالك حسب منهجية تصميم الأزياء الاحترافية.
                            </p>
                        </div>
                    )}
                </motion.div>

                {/* Sticky Action Footer */}
                <div className="absolute bottom-10 right-0 w-full flex justify-center z-30 px-10">
                    <div className="bg-white p-3 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-6 max-w-2xl w-full justify-between backdrop-blur-xl bg-white/90">
                        <div className="flex flex-col px-4 text-right flex-1">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">الذكاء الاصطناعي جاهز</span>
                            <span className="text-gray-900 font-bold font-arabic">{isReady ? 'اكتملت البيانات الأساسية لإنشاء التصميم' : 'يرجى إكمال الاختيارات الأساسية'}</span>
                        </div>

                        <button
                            onClick={handleNext}
                            disabled={!isReady || isGenerating}
                            className={`px-10 py-4 rounded-xl font-bold font-arabic text-lg flex items-center gap-3 transition-all duration-300 transform
                                ${(!isReady || isGenerating)
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed hidden sm:flex'
                                    : 'bg-black text-white hover:bg-gray-900 hover:scale-[1.02] shadow-[0_10px_20px_rgb(0,0,0,0.15)] flex'
                                }
                            `}
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>جاري المعالجة...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                    <span>تجسيد السكتش والبحث</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Fixed Action Button */}
            <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-50 rounded-t-3xl shadow-[0_-10px_30px_rgb(0,0,0,0.1)]">
                <button
                    onClick={handleNext}
                    disabled={!isReady || isGenerating}
                    className={`w-full py-4 rounded-xl font-bold font-arabic text-lg flex items-center justify-center gap-3 transition-all
                        ${(!isReady || isGenerating)
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-black text-white shadow-lg shadow-black/20'
                        }
                    `}
                >
                    {isGenerating ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>جاري المعالجة...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5 text-yellow-400" />
                            <span>توليد وعرض المنتجات</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default IntakeForm;