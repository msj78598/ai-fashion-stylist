import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const questions = [
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
        id: 'occasion',
        title: 'ما هي المناسبة التي تحضرين لها؟',
        subtitle: 'دعينا نحدد الطابع العام لإطلالتك',
        type: 'options',
        options: ['سهرة فخمة / زفاف', 'حفلة تخرج / ملكة', 'لقاء عمل رسمي', 'عزيمة / استقبال', 'سفر وعطلة'],
    },
    {
        id: 'clothingLength',
        title: 'ما هو طول الفستان أو الإطلالة المفضل؟',
        subtitle: 'لتحديد شكل ونسبة التصميم',
        type: 'options',
        options: ['طويل للقدم (ماكسي)', 'طويل مع ذيل (Train)', 'متوسط (ميدي - تحت الركبة)', 'قصير (ميني)'],
    },
    {
        id: 'silhouette',
        title: 'ما هي القصة العامة (Silhouette) للتصميم؟',
        subtitle: 'شكل الفستان الخارجي وكيف ينسدل على الجسم',
        type: 'options',
        options: ['قصة الأميرة / حورية البحر (Mermaid)', 'منفوش كلاسيكي (Ball Gown)', 'قصة حرف A المنسدلة (A-Line)', 'مستقيم وضيق (Sheath / Column)', 'خصر عالي (Empire Waist)'],
    },
    {
        id: 'neckline',
        title: 'كيف تفضلين قصة الصدر (الكتف والرقبة)؟',
        subtitle: 'الإطار العلوي الذي يبرز جمال التصميم',
        type: 'options',
        options: ['قصة V مفتوحة (V-Neck)', 'شكل قلب كلاسيكي (Sweetheart)', 'أكتاف مكشوفة (Off-Shoulder)', 'ياقة عالية / رقبة مغلقة (High Neck)', 'مربع أو دائري بسيط (Square/Scoop)'],
    },
    {
        id: 'sleeves',
        title: 'ما هو تصميم الأكمام المفضل؟',
        subtitle: 'اختاري الطول والشكل الذي يريحك',
        type: 'options',
        options: ['بدون أكمام (علاقي/Sleeveless)', 'أكمام طويلة ضيقة (Long Fitted)', 'أكمام منفوخة أو بف (Puff Sleeves)', 'أكمام الكاب المتدلية (Cape Sleeves)', 'أكمام متوسطة / قصيرة'],
    },
    {
        id: 'backDesign',
        title: 'ما هي تفاصيل تصميم الظهر التي تبرز الفستان؟',
        subtitle: 'اللمسة الخفية خلف التصميم',
        type: 'options',
        options: ['ظهر مفتوح أو V عميقة (Open Back)', 'ظهر مغطى بالكامل وبسيط (Covered)', 'ربطات كورسيه كلاسيكية (Corset Lace-up)', 'ظهر شفاف بالدانتيل (Illusion Back)', 'تفاصيل أزرار متسلسلة على طول الظهر'],
    },
    {
        id: 'fabricMaterial',
        title: 'ما هي خامة القماش الأساسية؟',
        subtitle: 'يمكنك اختيار أكثر من خامة لدمجها معاً',
        type: 'options',
        multiSelect: true,
        options: ['ستان حريري / ساتان', 'شيفون أو كريب (منسدل وطايح)', 'تفتا أو أورجانزا (واقف ومنفوش)', 'مخمل (قطيفة فخمة)', 'تول شفاف / مقصب'],
    },
    {
        id: 'fabricEmbroidery',
        title: 'هل تفضلين إضافة تطريز أو لمسات فنية؟',
        subtitle: 'ختاري ما يناسب ذوقك من التطريز والشك',
        type: 'options',
        multiSelect: true,
        options: ['تصميم سادة بقصة نظيفة (بدون تطريز)', 'تطريز خرز وكريستال ثقيل', 'دانتيل فرنسي كلاسيكي', 'شك يدوي خفيف وناعم', 'تطريز بخيوط السيرما (ذهبي أو فضي)'],
    },
    {
        id: 'colors',
        title: 'ما هي درجات الألوان التي تميلين إليها؟',
        subtitle: 'يمكنك اختيار التدرجات أو تحديد لونك المفضل بدقة من الخريطة',
        type: 'options',
        multiSelect: true,
        options: ['ألوان داكنة سادة (عنابي، زيتي، كحلي)', 'طيف الباستيل (سماوي، وردي، لافندر)', 'ميتاليك لامع (ذهبي، فضي، برونزي)', 'ألوان جريئة (أحمر، فوشيا، زمردي)', 'أسود ملكي', 'تحديد درجة لون مخصصة (Color Picker)'],
    },
    {
        id: 'bodyType',
        title: 'ما هي طبيعة جسمك التقريبية؟',
        subtitle: 'ليتمكن الذكاء الاصطناعي من رسم القصّة الأنسب لكِ',
        type: 'options',
        options: ['نحيف (Petite)', 'متوسط ومتناسق', 'ممتلئ أنثوي (Curvy)', 'شكل كمثرى', 'طويل القامة'],
    },
    {
        id: 'skinTone',
        title: 'ما هي درجة لون بشرتك؟',
        subtitle: 'يساعد ذلك في مطابقة ألوان الأقمشة مع بشرتك وعرض تصميم واقعي',
        type: 'options',
        options: ['بيضاء / فاتحة', 'حنطية / قمحية', 'سمراء / برونزية', 'داكنة'],
    },
    {
        id: 'hairStyle',
        title: 'ستايل الشعر أو الحجاب؟',
        subtitle: 'لتكون العارضة في الرسم مشابهة لإطلالتك',
        type: 'options',
        options: ['متحجبة (حجاب منتظم)', 'شعر طويل مفرود', 'شعر طويل مموج', 'شعر قصير', 'مرفوع (تسريحة)'],
    },
    {
        id: 'budget',
        title: 'ما هي الميزانية التقريبية لهذه الإطلالة؟',
        subtitle: 'لنطابق التصميم مع خيارات التسوق وكمية أمتار القماش',
        type: 'options',
        options: ['أقل من 300 ريال', '300 - 800 ريال', '800 - 1500 ريال', 'ميزانية مفتوحة (VIP)'],
    },
    {
        id: 'customDescription',
        title: 'مساحة الإبداع والتفاصيل الخاصة',
        subtitle: 'اكتبي هنا أي أفكار إضافية: موديل معين، قصة في بالك، أو ستايل جديد حسب الموضة العالمية تودين محاكاته',
        type: 'textarea',
        placeholder: 'مثال: أريد فستان مستوحى من الموضة الكورية بأكمام منفوشة، أو تصميم يعتمد على قصة حورية البحر مع فتحة جانبية صغيرة...'
    }
];

const IntakeForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [measurements, setMeasurements] = useState({});
    const [direction, setDirection] = useState(1); // 1 forward, -1 backward

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

        if (currentStep < questions.length - 1) {
            setDirection(1);
            setCurrentStep(curr => curr + 1);
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
            console.log('Final Data:', finalData);
            navigate('/chat', { state: { preferences: finalData } });
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(curr => curr - 1);
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
