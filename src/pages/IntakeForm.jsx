import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { generateKeywords } from '../services/keywordMapper';
import { DESIGN_CONSTRAINTS } from '../services/designConstraints';
import { getFilteredQuestions } from '../services/dynamicInventory';

const STATIC_QUESTIONS = [
    {
        id: 'activeTrack',
        title: 'اختر مسار التصميم الابتكاري',
        subtitle: 'حدد كيف ترغب في بناء إطلالتك اليوم مع مهندس الأزياء الأول',
        type: 'options',
        options: [
            'المسار الآلي (AI-Suggested Style): اصنع لي الإطلالة المثالية بناءً على قياساتي المكتملة.',
            'المسار اليدوي (Manual Customization): الالتزام الحرفي الكامل باختياراتي وتعديلاتي الخاصة.'
        ],
    },
    {
        id: 'preciseMeasurements',
        title: 'القياسات الدقيقة (تُحفظ تلقائياً)',
        subtitle: 'أدخلي قياساتك مرة واحدة وسنحتفظ بها لجلساتك القادمة',
        type: 'inputs',
        fields: [
            { name: 'height', label: 'الطول الكلي (سم)', placeholder: 'مثال: 165' },
            { name: 'weight', label: 'الوزن (كجم)', placeholder: 'مثال: 60' },
            { name: 'bust', label: 'محيط الصدر (سم)', placeholder: 'مثال: 90' },
            { name: 'waist', label: 'محيط الخصر (سم)', placeholder: 'مثال: 70' },
            { name: 'hips', label: 'محيط الحوض (سم)', placeholder: 'مثال: 95' },
            { name: 'shoulder', label: 'عرض الأكتاف (سم)', placeholder: 'من الكتف للكتف' },
            { name: 'sleeve', label: 'طول الذراع (سم)', placeholder: 'من الكتف للرسغ' }
        ]
    },
    {
        id: 'clothingType',
        title: 'ما هو نوع الإطلالة أو الملابس التي تبحثين عنها؟',
        subtitle: 'المرحلة الأولى لتحديد التصميم العام',
        type: 'options',
        options: ['فستان سهرة / زفاف (Gown/Dress)', 'عباية (Abaya)', 'جلابية / قفطان (Kaftan)', 'بدلة نسائية رسمية (Suit/Tuxedo)', 'طقم قطعتين (Two-Piece Set)', 'جمبسوت (Jumpsuit)'],
    },
    {
        id: 'occasion',
        title: 'ما هي المناسبة التي تحضرين لها؟',
        subtitle: 'دعينا نحدد الطابع العام لإطلالتك',
        type: 'options',
        options: ['سهرة فخمة / زفاف', 'حفلة تخرج / ملكة', 'لقاء عمل رسمي', 'عزيمة / استقبال', 'لبس يومي / كاجوال أنيق', 'سفر وعطلة'],
    },
    {
        id: 'silhouette',
        title: 'القـوام والقصّـة (Silhouette)',
        subtitle: 'شكل القصّة وكيفية انسدال القطعة على الجسم',
        type: 'options',
        options: ['منفوش ملكي', 'كلوش واسع', 'مستقيم "Straight"', 'قصة سمكة "Mermaid"', 'قصة A-Line'],
    },
    {
        id: 'clothingLength',
        title: 'طـول الإطـلالـة',
        subtitle: 'المستوى الذي يصل إليه التصميم',
        type: 'options',
        options: ['طويل ملامس للأرض', 'طويل مع ذيل "Train"', 'ميدي يغطي الركبة', 'قصير'],
    },
    {
        id: 'neckline',
        title: 'ياقـة وقصّـة الصـدر (Neckline)',
        subtitle: 'تفاصيل الجزء العلوي للإطلالة',
        type: 'options',
        options: [
            'فتحة V عميقة', 'ياقة قلب "Sweetheart"', 'ياقة مربعة', 'ياقة قارب واسعة',
            'ياقة عالية دائرية "High Neck"', 'ياقة قميص', 'ياقة بليزر رسمية "Lapel"',
            'ياقة كشكش', 'ياقة مطرزة بالخرز', 'ياقة فرو أو ريش'
        ],
    },
    {
        id: 'sleeves',
        title: 'مواصفـات الأكمـام (Sleeves)',
        subtitle: 'شكل وطول الأكمام',
        type: 'options',
        options: [
            'أكمام مستقيمة', 'أكمام واسعة كلوش', 'أكمام مطرزة', 'أكمام شفافة',
            'نصف كم', 'كم فرنسي', 'أكمام منفوخة "Puff"',
            'أكمام الكاب المتدلية', 'أكمام بفتحات جانبية', 'أكمام بكشكشة "Ruffles"',
            'بدون أكمام (كتف مكشوف)'
        ],
    },
    {
        id: 'fabricMaterial',
        title: 'خامـات الأقمشـة (Fabric)',
        subtitle: 'نوع النسيج الذي يبرز أناقة التصميم',
        type: 'options',
        multiSelect: true,
        options: ['ساتان ملكي', 'تفتا واقفه', 'مخمل', 'شيفون ناعم', 'كريب', 'تول شفاف'],
    },
    {
        id: 'fabricEmbroidery',
        title: 'الزينـة والتطريـز (Embroidery & Details)',
        subtitle: 'اللمسات الفنية والزخارف',
        type: 'options',
        multiSelect: true,
        options: [
            'خرز يدوي', 'كريستال', 'شك كامل', 'خيوط ذهبية/فضية',
            'دانتيل', 'جكار منقوش', 'أورجانزا مشغولة',
            'ريش طبيعي', 'شراشيب', 'أزرار متسلسلة', 'أحزمة مدمجة',
            'تصميم نظيف بدون إضافات'
        ],
    },
    {
        id: 'colors',
        title: 'تدرجـات الألـوان (Colors)',
        subtitle: 'المجموعة اللونية التي تعكس شخصيتك',
        type: 'options',
        multiSelect: true,
        options: [
            'أسود', 'كحلي', 'عنابي', 'زيتي',
            'وردي', 'لافندر', 'موف', 'سماوي', 'مشمشي',
            'ذهبي', 'فضي', 'لؤلؤي',
            'بيج', 'نود', 'بني', 'ترابي',
            'أحمر', 'فوشيا', 'تيفاني',
            'تحديد درجة لون مخصصة (Color Picker)'
        ],
    },
    {
        id: 'budget',
        title: 'الميزانيـة التقريبيـة',
        subtitle: 'لتخصيص أفضل القطع المتاحة',
        type: 'options',
        options: ['أقل من 300 ريال', '300 - 800 ريال', '800 - 1500 ريال', 'ميزانية مفتوحة (VIP)'],
    },
    {
        id: 'customDescription',
        title: 'مساحة الإبداع والتفاصيل الخاصة',
        subtitle: 'اكتبي هنا أي أفكار إضافية تودين إضافتها للتصميم الأساسي...',
        type: 'textarea',
        placeholder: 'مثال: أريد فستان مستوحى من حقبة الخمسينات ولكن بلمسة عصرية...'
    }
];

const IntakeForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [questions, setQuestions] = useState(STATIC_QUESTIONS);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [measurements, setMeasurements] = useState({});
    const [direction, setDirection] = useState(1); // 1 forward, -1 backward

    // Load Filtered Dynamic Questions on Mount
    useEffect(() => {
        console.log("👗 Applying Smart Intake constraints against DB...");
        const dynamicQuestions = getFilteredQuestions(STATIC_QUESTIONS);
        setQuestions(dynamicQuestions);
    }, []);

    const currentQ = questions[currentStep];

    // Load from localStorage or Navigation State (if modifying)
    useEffect(() => {
        // If coming back to modify options
        if (location.state?.editMode && location.state?.preferences) {
            const prefs = location.state.preferences;
            setMeasurements(prefs.measurements || {});
            const pastAnswers = { ...prefs };
            delete pastAnswers.measurements;

            // Ensure any previously saved string for multiSelect is converted to an array, if applicable
            if (typeof pastAnswers.fabricType === 'string') {
                pastAnswers.fabricType = [pastAnswers.fabricType];
            }

            setAnswers(pastAnswers);
        } else {
            // Otherwise, load casually cached measurements
            const savedMeasurements = localStorage.getItem('userMeasurements');
            if (savedMeasurements) {
                try {
                    setMeasurements(JSON.parse(savedMeasurements));
                } catch (e) {
                    console.error("Could not parse saved measurements");
                }
            }
        }
    }, [location.state]);

    const handleSelect = (option) => {
        if (currentQ.multiSelect) {
            const currentSelections = Array.isArray(answers[currentQ.id]) ? answers[currentQ.id] : [];
            const isSelected = currentSelections.includes(option);

            let newSelections;
            if (isSelected) {
                newSelections = currentSelections.filter(i => i !== option);
            } else {
                newSelections = [...currentSelections, option];
            }
            setAnswers({ ...answers, [currentQ.id]: newSelections });
        } else {
            setAnswers({ ...answers, [currentQ.id]: option });
        }
    };

    const handleInputChange = (e) => {
        setMeasurements({ ...measurements, [e.target.name]: e.target.value });
        setAnswers({ ...answers, [currentQ.id]: 'provided' });
    };

    const handleNext = () => {
        if (currentQ.id === 'preciseMeasurements' && !answers['preciseMeasurements']) {
            setAnswers({ ...answers, preciseMeasurements: 'skipped' });
        }

        let nextStep = currentStep + 1;

        // 1. AI-Suggested Track Skip Logic
        // If they pick Track A: Skip manual design details (after Occasion, jump to Colors)
        if (currentQ.id === 'occasion' && answers['activeTrack']?.includes('AI-Suggested')) {
            const colorsIndex = questions.findIndex(q => q.id === 'colors');
            if (colorsIndex !== -1) nextStep = colorsIndex;
        }

        if (nextStep < questions.length) {
            setDirection(1);
            setCurrentStep(nextStep);
        } else {
            // Save measurements to localStorage for future sessions
            localStorage.setItem('userMeasurements', JSON.stringify(measurements));

            // Convert array selections to strings for AI prompt
            const processedAnswers = { ...answers };
            Object.keys(processedAnswers).forEach(key => {
                if (Array.isArray(processedAnswers[key])) {
                    processedAnswers[key] = processedAnswers[key].join(' ومع ');
                }
            });

            const finalData = { ...processedAnswers, measurements };

            // Enrich payload with keywords and constraints
            const payload = {
                preferences: finalData,
                keywords: generateKeywords(processedAnswers),
                constraints: DESIGN_CONSTRAINTS
            };

            console.log('Final Payload:', payload);
            navigate('/chat', { state: payload });
        }
    };

    const handleBack = () => {
        let prevStep = currentStep - 1;

        // 1. AI-Suggested Track Back Skip
        // If we are at Colors and chose AI-Suggested, go back to Occasion
        if (currentQ.id === 'colors' && answers['activeTrack']?.includes('AI-Suggested')) {
            const occasionIndex = questions.findIndex(q => q.id === 'occasion');
            if (occasionIndex !== -1) prevStep = occasionIndex;
        }

        if (prevStep >= 0) {
            setDirection(-1);
            setCurrentStep(prevStep);
        } else {
            navigate('/');
        }
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? -100 : 100, // App is RTL, so +x is left, -x is right. Wait, RTL: x > 0 means move right (backwards logic)
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 100 : -100,
            opacity: 0
        })
    };

    // For optional inputs step, they can click next without filling
    const isNextDisabled = currentQ.type === 'options' &&
        (currentQ.multiSelect
            ? (!Array.isArray(answers[currentQ.id]) || answers[currentQ.id].length === 0)
            : !answers[currentQ.id]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#fdf8f6] via-[#f2e8e5] to-[#eaddd7] overflow-hidden relative">
            <div className="absolute top-10 left-10 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>

            <div className="glass-card max-w-2xl w-full p-8 shadow-2xl min-h-[500px] flex flex-col relative z-10 border border-white/50">

                {/* Progress Bar */}
                <div className="w-full bg-primary-100 h-1.5 rounded-full mb-8 overflow-hidden">
                    <motion.div
                        className="h-full bg-primary-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <button onClick={handleBack} className="absolute top-8 right-8 text-primary-600 hover:text-primary-800 transition-colors">
                    <ChevronRight className="w-6 h-6" /> {/* RTL: Right chevron is Back */}
                </button>

                <div className="flex-1 flex flex-col justify-center relative">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={currentStep}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                            className="w-full"
                        >
                            <h2 className="text-3xl font-bold font-arabic text-primary-900 mb-2">{currentQ.title}</h2>
                            <p className="text-gray-500 font-arabic mb-8 text-lg">{currentQ.subtitle}</p>

                            {currentQ.type === 'options' ? (
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {currentQ.options.map((option) => {
                                            const isSelected = currentQ.multiSelect
                                                ? (Array.isArray(answers[currentQ.id]) && answers[currentQ.id].includes(option))
                                                : answers[currentQ.id] === option;

                                            return (
                                                <button
                                                    key={option}
                                                    onClick={() => handleSelect(option)}
                                                    className={`
                                                        text-right font-arabic p-4 rounded-xl border-2 transition-all duration-200
                                                        ${isSelected
                                                            ? 'border-primary-600 bg-primary-50 text-primary-900 shadow-md'
                                                            : 'border-primary-100 bg-white/50 hover:border-primary-300 text-gray-700 hover:bg-white'}
                                                    `}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-lg">{option}</span>
                                                        {isSelected && (
                                                            <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white">
                                                                <Check className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {currentQ.id === 'colors' && Array.isArray(answers.colors) && answers.colors.includes('تحديد درجة لون مخصصة (Color Picker)') && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-white/80 rounded-xl border border-primary-300 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
                                            <span className="font-arabic text-primary-900 text-lg font-bold">اختاري درجتك اللونية المفضلة بدقة:</span>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={answers.customColorHex || '#d946ef'}
                                                    onChange={(e) => setAnswers({ ...answers, customColorHex: e.target.value })}
                                                    className="w-16 h-16 cursor-pointer border-0 bg-transparent rounded-lg p-0 m-0"
                                                />
                                                <span className="text-lg font-mono text-gray-700 bg-white px-3 py-1 rounded-md border shadow-inner uppercase">{answers.customColorHex || '#d946ef'}</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            ) : currentQ.type === 'textarea' ? (
                                <div className="w-full h-full flex flex-col">
                                    <textarea
                                        name={currentQ.id}
                                        placeholder={currentQ.placeholder}
                                        value={answers[currentQ.id] || ''}
                                        onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
                                        className="w-full h-48 p-4 rounded-xl border-2 border-primary-100 focus:border-primary-500 focus:ring-0 bg-white/80 font-arabic text-right text-lg outline-none transition-all resize-none shadow-inner"
                                        dir="rtl"
                                    />
                                    <p className="text-sm font-arabic text-primary-600 mt-2 text-right">
                                        هذه الخطوة اختيارية، يمكنك الضغط على "التالي" لمعرفة اقتراح الذكاء الاصطناعي لكِ.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {currentQ.fields.map((field) => (
                                        <div key={field.name} className="flex flex-col">
                                            <label className="font-arabic text-primary-800 mb-2 font-semibold">
                                                {field.label}
                                            </label>
                                            <input
                                                type="number"
                                                name={field.name}
                                                placeholder={field.placeholder}
                                                value={measurements[field.name] || ''}
                                                onChange={handleInputChange}
                                                className="p-3 rounded-xl border-2 border-primary-100 focus:border-primary-500 focus:ring-0 bg-white/80 font-arabic text-left text-lg outline-none transition-all"
                                                dir="ltr"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="mt-8 flex justify-end border-t border-primary-100 pt-6">
                    <button
                        onClick={handleNext}
                        disabled={isNextDisabled}
                        className={`
                btn-primary px-8 py-3 flex items-center gap-2 font-arabic text-lg
                ${isNextDisabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
                    >
                        <span>
                            {currentStep === questions.length - 1 ? 'تحليل الإطلالة' :
                                (currentQ.type === 'inputs' && Object.keys(measurements).length === 0 ? 'تخطي' : 'التالي')}
                        </span>
                        <ChevronLeft className="w-5 h-5" /> {/* RTL: Left chevron is Next */}
                    </button>
                </div>
            </div >
        </div >
    );
};

export default IntakeForm;
