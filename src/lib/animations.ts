import { Variants, Transition } from "framer-motion";

// Apple-style spring-like bezier for incredibly fluid, snappy motion
const appleEase = [0.16, 1, 0.3, 1] as const;
const appleEaseOut = [0.32, 0.72, 0, 1] as const;

// Default transition preset
export const transition: Transition = {
    duration: 0.6,
    ease: appleEase,
};

export const transitionFast: Transition = {
    duration: 0.4,
    ease: appleEase,
};

export const transitionSlow: Transition = {
    duration: 0.8,
    ease: appleEaseOut,
};

// Viewport config — optimized for all screens (amount instead of rigid pixels)
export const viewport = {
    once: false,
    amount: 0.1, // Triggers earlier, much better for mobile
    margin: "0px",
};

export const viewportEager = {
    once: false,
    amount: 0.05,
};

// ─── Variant Factories ──────────────────────────────────────────────────────

export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 50 }, // Increased distance for more noticeable reveal
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: appleEase },
    },
};

export const fadeUpSubtle: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: appleEase },
    },
};

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.8, ease: appleEase },
    },
};

export const widthGrow: Variants = {
    hidden: { width: 0, opacity: 0 },
    visible: {
        width: "6rem", // equivalent to w-24
        opacity: 1,
        transition: { duration: 0.8, ease: appleEaseOut },
    },
};

// Reduced horizontal slide distances to avoid jumping on mobile
export const slideLeft: Variants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.6, ease: appleEaseOut },
    },
};

export const slideRight: Variants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.8, ease: appleEaseOut },
    },
};

export const slideUpLg: Variants = {
    hidden: { opacity: 0, y: 80 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
    }
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.6, ease: appleEase },
    },
};

export const scaleInSubtle: Variants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: appleEase },
    },
};

// Faster staggers but with a more dramatic initial drop
export const staggerContainer = (staggerChildren = 0.12, delayChildren = 0): Variants => ({
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren, // slightly larger gap for cascading effect
            delayChildren,
        },
    },
});

export const cardItem: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.92 }, // More drop and scale down
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.7, ease: appleEase },
    },
};
