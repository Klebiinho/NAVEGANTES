import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY = "BBih25vGPXjPVAxe54lpbCZo8iHEN8_OdCTzEuLHCTPGUc6zmF5UjDqaY-IDYygcu7s88R1qrvQTLt9ghaKaVXE";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushSubscription() {
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    // On mount, check if already subscribed
    useEffect(() => {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        navigator.serviceWorker.ready.then(async (reg) => {
            const existing = await reg.pushManager.getSubscription();
            setSubscribed(!!existing);
        });
    }, []);

    const subscribe = async (): Promise<"granted" | "denied" | "unsupported"> => {
        if (!("Notification" in window)) return "unsupported";
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";

        // 1. Ask for notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return "denied";

        setLoading(true);
        try {
            const reg = await navigator.serviceWorker.ready;

            // 2. Subscribe to push with our VAPID public key
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
            });

            const json = sub.toJSON();
            const p256dh = json.keys?.p256dh ?? "";
            const auth = json.keys?.auth ?? "";

            // 3. Save subscription to Supabase
            const { error } = await supabase.from("push_subscriptions").upsert(
                {
                    endpoint: sub.endpoint,
                    p256dh,
                    auth,
                    user_agent: navigator.userAgent.slice(0, 200),
                } as any,
                { onConflict: "endpoint" }
            );

            if (!error) {
                setSubscribed(true);
                // Show a welcome notification via SW
                const swReg = reg as ServiceWorkerRegistration;
                swReg.showNotification("Magnavita Serviços Marítimos", {
                    body: "Notificações ativadas! Você receberá alertas importantes. ✅",
                    icon: "/favicon.ico",
                    badge: "/favicon.ico",
                });
            }

            return "granted";
        } catch (err) {
            console.error("Push subscription failed:", err);
            return "denied";
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        if (!("serviceWorker" in navigator)) return;
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
            // Remove from Supabase
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            await sub.unsubscribe();
            setSubscribed(false);
        }
    };

    return { subscribed, loading, subscribe, unsubscribe };
}
