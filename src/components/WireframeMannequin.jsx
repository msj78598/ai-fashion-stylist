import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WireframeMannequin = ({ answers }) => {
    // Base mannequin opacity
    const baseColor = "#e5e7eb"; // gray-200
    const highlightColor = "#111827"; // gray-900 (ink)

    // Check what is selected to highlight parts
    const hasNeckline = !!answers.neckline;
    const hasSleeves = !!answers.sleeves;
    const hasSilhouette = !!answers.silhouette;
    const hasLength = !!answers.clothingLength;

    return (
        <div className="relative w-[300px] h-[550px] mx-auto flex justify-center items-center">
            <svg viewBox="0 0 400 800" className="w-full h-full drop-shadow-2xl">
                {/* Background Grid Pattern for Blueprint Feel */}
                <defs>
                    <pattern id="blueprintGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1" />
                    </pattern>

                    {/* Glow effect for highlighted paths */}
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <rect width="100%" height="100%" fill="url(#blueprintGrid)" className="opacity-50" />

                {/* --- BASE MANNEQUIN FORM --- */}
                <g transform="scale(0.65) translate(100, 50)">
                    {/* Head / Neck */}
                    <path d="M 180 100 C 180 60, 220 60, 220 100 C 220 140, 205 150, 205 160 L 195 160 C 195 150, 180 140, 180 100 Z"
                        fill="none" stroke={baseColor} strokeWidth="2" />

                    {/* Shoulders & Torso */}
                    <path d="M 195 160 C 160 165, 130 180, 120 200 L 130 350 C 150 360, 170 370, 200 370 C 230 370, 250 360, 270 350 L 280 200 C 270 180, 240 165, 205 160"
                        fill="none" stroke={baseColor} strokeWidth="2" />

                    {/* Arms Base */}
                    <path d="M 120 200 C 100 240, 95 350, 90 400" fill="none" stroke={baseColor} strokeWidth="2" strokeDasharray="5,5" />
                    <path d="M 280 200 C 300 240, 305 350, 310 400" fill="none" stroke={baseColor} strokeWidth="2" strokeDasharray="5,5" />

                    {/* Hips & Legs Base */}
                    <path d="M 130 350 C 100 450, 100 700, 100 750" fill="none" stroke={baseColor} strokeWidth="2" strokeDasharray="5,5" />
                    <path d="M 270 350 C 300 450, 300 700, 300 750" fill="none" stroke={baseColor} strokeWidth="2" strokeDasharray="5,5" />

                    <AnimatePresence>
                        {/* --- DYNAMIC OVERLAYS BASED ON SELECTIONS --- */}

                        {/* NECKLINE */}
                        {hasNeckline && (
                            <motion.path
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1, ease: "easeInOut" }}
                                d={
                                    answers.neckline.includes('سبعة') || answers.neckline.includes('V')
                                        ? "M 160 170 L 200 250 L 240 170" // V-Neck
                                        : answers.neckline.includes('قارب')
                                            ? "M 140 180 C 200 200, 260 180, 260 180" // Boat neck
                                            : answers.neckline.includes('ياقة عالية')
                                                ? "M 185 140 L 215 140 L 210 160 L 190 160 Z" // High neck
                                                : answers.neckline.includes('أكتاف مكشوفة')
                                                    ? "M 110 200 C 200 220, 290 200, 290 200" // Off shoulder
                                                    : "M 170 180 C 200 210, 230 180, 230 180" // Default/Sweetheart
                                }
                                fill="none" stroke={highlightColor} strokeWidth="4" strokeLinecap="round" filter="url(#glow)"
                            />
                        )}

                        {/* SLEEVES */}
                        {hasSleeves && !answers.sleeves.includes('بدون') && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8 }}
                            >
                                <motion.path
                                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }}
                                    d={
                                        answers.sleeves.includes('طويلة')
                                            ? "M 120 200 C 90 280, 80 380, 80 420 M 280 200 C 310 280, 320 380, 320 420"
                                            : answers.sleeves.includes('قصيرة')
                                                ? "M 120 200 C 100 230, 95 260, 100 280 M 280 200 C 300 230, 305 260, 300 280"
                                                : answers.sleeves.includes('منفوخ')
                                                    ? "M 120 200 C 80 220, 80 280, 110 280 M 280 200 C 320 220, 320 280, 290 280"
                                                    : "M 120 200 C 95 250, 90 300, 90 320 M 280 200 C 305 250, 310 300, 310 320" // 3/4 sleeves default
                                    }
                                    fill="none" stroke={highlightColor} strokeWidth="3" strokeLinecap="round"
                                />
                            </motion.g>
                        )}

                        {/* SILHOUETTE & LENGTH (Merged for fluid skirt drawing) */}
                        {(hasSilhouette || hasLength) && (
                            <motion.path
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                d={
                                    answers.silhouette?.includes('سمكة') // Mermaid
                                        ? "M 130 350 C 150 450, 160 550, 100 750 M 270 350 C 250 450, 240 550, 300 750"
                                        : answers.silhouette?.includes('منفوش') // Ballgown
                                            ? "M 130 350 C 50 450, 20 650, 20 750 M 270 350 C 350 450, 380 650, 380 750"
                                            : answers.silhouette?.includes('مستقيم') || answers.clothingLength?.includes('قصير')
                                                ? "M 130 350 L 130 550 M 270 350 L 270 550" // Shift / Short
                                                : "M 130 350 C 100 500, 80 650, 60 750 M 270 350 C 300 500, 320 650, 340 750" // A-Line Default
                                }
                                fill="none" stroke={highlightColor} strokeWidth="4" strokeLinecap="round" filter="url(#glow)"
                            />
                        )}

                        {/* WAIST TIE / WRAP (If Wrap silhouette) */}
                        {answers.silhouette?.includes('لف') && (
                            <motion.path
                                initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                                d="M 130 330 L 270 360 M 270 330 L 130 360 L 110 400"
                                fill="none" stroke={highlightColor} strokeWidth="3"
                            />
                        )}
                    </AnimatePresence>

                    {/* Interactive Scanning Line (Always running if something is selected) */}
                    {(hasSilhouette || hasNeckline) && (
                        <motion.line
                            x1="0" y1="100" x2="400" y2="100"
                            stroke="#10b981" strokeWidth="1" strokeOpacity="0.5"
                            animate={{ y1: [100, 750, 100], y2: [100, 750, 100] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        />
                    )}
                </g>
            </svg>
        </div>
    );
};

export default WireframeMannequin;
