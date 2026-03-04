import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [canInstall, setCanInstall] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        const ua = navigator.userAgent;

        // Detect iOS (iPhone, iPad, iPod — including iPad with desktop UA on iOS 13+)
        const ios =
            /iPhone|iPad|iPod/i.test(ua) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        setIsIOS(ios);

        // Detect any mobile
        const mobile = ios || /Android|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        setIsMobile(mobile);

        // Detect if already running as installed PWA (standalone mode)
        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
        setIsInstalled(standalone);

        // Register service worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(() => {
                // SW registration failed silently
            });
        }

        // Capture the install prompt (Android/Chrome only — never fires on iOS)
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setCanInstall(true);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
            setIsInstalled(true);
            setCanInstall(false);
        }
        setDeferredPrompt(null);
    };

    return { canInstall, isInstalled, isMobile, isIOS, installApp };
}
