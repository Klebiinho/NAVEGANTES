import { useState, useEffect } from "react";
import { Download, Bell, BellOff, X, CheckCircle, Share, Loader2 } from "lucide-react";
import { usePWA } from "@/hooks/use-pwa";
import { usePushSubscription } from "@/hooks/use-push-subscription";

export function MobilePWABanner() {
    const { canInstall, isInstalled, isMobile, isIOS, installApp } = usePWA();
    const { subscribed, loading, subscribe } = usePushSubscription();
    const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
    const [dismissed, setDismissed] = useState(false);
    const [installing, setInstalling] = useState(false);

    useEffect(() => {
        if ("Notification" in window) {
            setNotifPermission(Notification.permission);
        }
    }, [subscribed]); // Refresh when subscription state changes

    const handleSubscribe = async () => {
        const result = await subscribe();
        setNotifPermission(result === "granted" ? "granted" : result === "denied" ? "denied" : "default");
    };

    const handleInstall = async () => {
        setInstalling(true);
        await installApp();
        setInstalling(false);
    };

    // Don't show if: not mobile, already installed as PWA, or dismissed
    if (!isMobile || isInstalled || dismissed) return null;

    // On iOS: show install instructions (no beforeinstallprompt) + notification info
    // On Android: show install button (if prompt available) + notification button
    const showAndroidInstall = !isIOS && canInstall;
    const showIOSInstall = isIOS; // always show iOS instructions when not installed
    // Notifications on iOS Safari only work when app is installed as PWA (standalone).
    // Since we already hide the banner when isInstalled=true, we only reach here on iOS
    // when NOT standalone — so we skip the notification option on iOS (prompt install first).
    const showNotif = !isIOS && "Notification" in window && notifPermission === "default";

    const hasAnything = showAndroidInstall || showIOSInstall || showNotif;
    if (!hasAnything) return null;

    return (
        <div className="w-full max-w-md mx-auto mb-4 animate-in slide-in-from-top-2 duration-300">
            <div className="relative rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 shadow-xl shadow-blue-900/20 overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow">
                            <img src="/favicon.ico" alt="Logo" className="w-5 h-5 object-contain" />
                        </div>
                        <span className="text-sm font-semibold text-white">Magnavita</span>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-slate-400 hover:text-white transition-colors rounded-lg p-1"
                        aria-label="Fechar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-4 pb-4 flex flex-col gap-3">

                    {/* Android: native install button */}
                    {showAndroidInstall && (
                        <button
                            onClick={handleInstall}
                            disabled={installing}
                            className="flex items-center gap-3 w-full rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-4 py-3 transition-all duration-200 group disabled:opacity-60"
                        >
                            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
                                <Download className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-white">
                                    {installing ? "Instalando..." : "Instalar aplicativo"}
                                </p>
                                <p className="text-xs text-blue-200">Adicionar à tela inicial</p>
                            </div>
                        </button>
                    )}

                    {/* iOS: manual install instructions */}
                    {showIOSInstall && (
                        <div className="rounded-xl bg-blue-900/30 border border-blue-700/40 px-4 py-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Download className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                <p className="text-sm font-semibold text-white">Instalar aplicativo</p>
                            </div>
                            <p className="text-xs text-slate-300 mb-3">
                                Adicione à tela inicial para usar como app e receber notificações:
                            </p>
                            <ol className="flex flex-col gap-2">
                                <li className="flex items-center gap-2 text-xs text-slate-300">
                                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                                    <span>Toque em <Share className="inline w-3.5 h-3.5 text-blue-400" /> <strong className="text-white">Compartilhar</strong> na barra do Safari</span>
                                </li>
                                <li className="flex items-center gap-2 text-xs text-slate-300">
                                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                                    <span>Role para baixo e toque em <strong className="text-white">Adicionar à Tela de Início</strong></span>
                                </li>
                                <li className="flex items-center gap-2 text-xs text-slate-300">
                                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                                    <span>Toque em <strong className="text-white">Adicionar</strong> no canto superior direito</span>
                                </li>
                            </ol>
                            <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-900/20 border border-amber-700/30 px-3 py-2">
                                <Bell className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-200">
                                    Após instalar, abra o app pela tela inicial para ativar notificações (iOS 16.4+)
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Android: notification button */}
                    {showNotif && !subscribed && (
                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="flex items-center gap-3 w-full rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 hover:border-slate-600 px-4 py-3 transition-all duration-200 group disabled:opacity-60"
                        >
                            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
                                {loading ? <Loader2 className="w-5 h-5 text-amber-400 animate-spin" /> : <Bell className="w-5 h-5 text-amber-400" />}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-white">
                                    {loading ? "Processando..." : "Ativar notificações"}
                                </p>
                                <p className="text-xs text-slate-400">Receba alertas importantes</p>
                            </div>
                        </button>
                    )}

                    {/* Notification already granted / subscribed */}
                    {(notifPermission === "granted" || subscribed) && (
                        <div className="flex items-center gap-3 w-full rounded-xl bg-green-900/20 border border-green-700/30 px-4 py-3">
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <p className="text-sm text-green-300 font-medium">Notificações ativadas</p>
                        </div>
                    )}

                    {/* Notification denied */}
                    {notifPermission === "denied" && (
                        <div className="flex items-center gap-3 w-full rounded-xl bg-red-900/20 border border-red-700/30 px-4 py-3">
                            <BellOff className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <div>
                                <p className="text-sm text-red-300 font-medium">Notificações bloqueadas</p>
                                <p className="text-xs text-slate-400">Habilite nas configurações do navegador</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            </div>
        </div>
    );
}
