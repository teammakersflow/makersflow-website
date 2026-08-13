"use client";

import { useEffect, useState, type FC } from "react";
import { motion } from "framer-motion";
import { IoMoon, IoMoonOutline, IoSunny, IoSunnyOutline } from "react-icons/io5";

/* --- Props --- */
export interface SwitchModeProps {
    width?: number;
    height?: number;
    darkColor?: string;
    lightColor?: string;
    knobDarkColor?: string;
    knobLightColor?: string;
    borderDarkColor?: string;
    borderLightColor?: string;
    isDark?: boolean;
    onToggle?: () => void;
    className?: string;
}

export const SwitchMode: FC<SwitchModeProps> = ({
    width = 68,
    height = 34,
    darkColor = "#0B0B0B",
    lightColor = "#FFFFFF",
    knobDarkColor = "#2A2A2E",
    knobLightColor = "#F3F2F7",
    borderDarkColor = "#4C4C50",
    borderLightColor = "#D8D6E0",
    isDark: propIsDark,
    onToggle,
    className = "",
}) => {
    const [mounted, setMounted] = useState(false);
    const [internalDark, setInternalDark] = useState<boolean>(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("makersflow_theme");
            if (stored === "dark" || stored === "light") return stored === "dark";
            return document.documentElement.classList.contains("dark");
        }
        return true;
    });

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            setInternalDark(document.documentElement.classList.contains("dark"));
        }
    }, []);

    if (!mounted) {
        return <div style={{ width, height }} className={`rounded-full border-2 border-transparent ${className}`} />;
    }

    const isDark = propIsDark !== undefined ? propIsDark : internalDark;

    const handleToggle = () => {
        if (onToggle) {
            onToggle();
        } else {
            const nextDark = !isDark;
            setInternalDark(nextDark);
            const root = document.documentElement;
            if (nextDark) {
                root.classList.add("dark");
                localStorage.setItem("makersflow_theme", "dark");
            } else {
                root.classList.remove("dark");
                localStorage.setItem("makersflow_theme", "light");
            }
        }
    };

    const iconSize = height * 0.45;

    return (
        <motion.button
            type="button"
            onClick={handleToggle}
            aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className={`relative inline-flex items-center rounded-full border-2 transition-colors cursor-pointer select-none ${className}`}
            style={{
                width,
                height,
                borderColor: isDark ? borderDarkColor : borderLightColor,
            }}
        >
            {/* TRACK */}
            <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ backgroundColor: isDark ? darkColor : lightColor }}
                transition={{ duration: 0.4 }}
            />

            {/* SLIDING KNOB */}
            <motion.div
                layout
                layoutId="switch-knob"
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="absolute rounded-full border-2 z-30 pointer-events-none"
                style={{
                    width: height - 4,
                    height: height - 4,
                    right: isDark ? 2 : undefined,
                    left: isDark ? undefined : 2,
                    backgroundColor: isDark ? knobDarkColor : knobLightColor,
                    borderColor: isDark ? borderDarkColor : borderLightColor,
                }}
            />

            {/* SUN */}
            <motion.div
                className="relative z-30 flex items-center justify-center pointer-events-none"
                style={{ width: width / 2, height }}
                animate={{ rotate: isDark ? 45 : 0 }}
                transition={{ stiffness: 20 }}
            >
                {isDark ? (
                    <IoSunnyOutline
                        color="#8A8A8F"
                        fill="#8A8A8F"
                        stroke="#8A8A8F"
                        style={{ width: iconSize, height: iconSize }}
                        className="transition-colors duration-200"
                    />
                ) : (
                    <IoSunny
                        color="#686771"
                        fill="#686771"
                        style={{ width: iconSize, height: iconSize }}
                        className="transition-colors duration-200"
                    />
                )}
            </motion.div>

            {/* MOON */}
            <motion.div
                className="relative z-30 flex items-center justify-center pointer-events-none"
                style={{ width: width / 2, height }}
                animate={{ rotate: isDark ? 0 : 15 }}
                transition={{ stiffness: 20, damping: 14 }}
            >
                {isDark ? (
                    <IoMoon
                        color="#F4F4FB"
                        fill="#F4F4FB"
                        style={{ width: iconSize, height: iconSize }}
                        className="transition-colors duration-200"
                    />
                ) : (
                    <IoMoonOutline
                        color="#ABABB4"
                        fill="#ABABB4"
                        stroke="#ABABB4"
                        style={{ width: iconSize, height: iconSize }}
                        className="transition-colors duration-200"
                    />
                )}
            </motion.div>
        </motion.button>
    );
};

