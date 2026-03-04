import { LocalNotifications } from '@capacitor/local-notifications';
import { Device } from '@capacitor/device';
import { Transaction } from '@/components/dashboard/FinancialTab';
import { differenceInDays, parseISO, isPast, isToday, addDays, startOfDay } from 'date-fns';

export const useNotifications = () => {
    const requestPermissions = async () => {
        const info = await Device.getInfo();
        if (info.platform === 'web') return;

        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
            await LocalNotifications.requestPermissions();
        }
    };

    const scheduleFinancialNotifications = async (transactions: Transaction[]) => {
        const info = await Device.getInfo();
        if (info.platform === 'web') return;

        // Cancelar notificações anteriores para evitar duplicidade
        await LocalNotifications.cancel({ notifications: (await LocalNotifications.getPending()).notifications });

        const notificationsToSchedule = [];

        for (const t of transactions) {
            if (t.status === 'Pago') continue;

            const dueDate = startOfDay(parseISO(t.data_pagamento));
            const today = startOfDay(new Date());
            const daysUntilDue = differenceInDays(dueDate, today);

            // 1. Notificação 5 dias antes
            if (daysUntilDue > 0 && daysUntilDue <= 30) { // Limite de 30 dias para não sobrecarregar
                const notificationDate = addDays(dueDate, -5);
                if (!isPast(notificationDate) || isToday(notificationDate)) {
                    notificationsToSchedule.push({
                        title: 'Pagamento Próximo - Magnavita',
                        body: `O pagamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)} (${t.cliente}) vence em 5 dias.`,
                        id: Math.floor(Math.random() * 1000000),
                        schedule: { at: new Date(notificationDate.setHours(9, 0, 0, 0)) }, // 9h da manhã
                        extra: { transactionId: t.id }
                    });
                }
            }

            // 2. Notificação no dia do vencimento
            if (daysUntilDue >= 0) {
                notificationsToSchedule.push({
                    title: 'Vencimento Hoje - Magnavita',
                    body: `Atenção: O pagamento de ${t.cliente} no valor de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)} vence hoje!`,
                    id: Math.floor(Math.random() * 1000000),
                    schedule: { at: new Date(dueDate.setHours(8, 30, 0, 0)) },
                    extra: { transactionId: t.id }
                });
            }

            // 3. Notificação de Atraso (se já passou da data e não está pago)
            if (isPast(dueDate) && !isToday(dueDate)) {
                notificationsToSchedule.push({
                    title: 'Pagamento Atrasado!',
                    body: `O pagamento de ${t.cliente} (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}) está atrasado.`,
                    id: Math.floor(Math.random() * 1000000),
                    schedule: { at: new Date(addDays(new Date(), 0).setHours(10, 0, 0, 0)) }, // Notifica hoje às 10h se estiver atrasado
                    extra: { transactionId: t.id }
                });
            }
        }

        if (notificationsToSchedule.length > 0) {
            // Limitar a 64 notificações (limite do iOS)
            const limitedNotifications = notificationsToSchedule.slice(0, 64);
            await LocalNotifications.schedule({
                notifications: limitedNotifications as any
            });
        }
    };

    return { requestPermissions, scheduleFinancialNotifications };
};
