import { addMonths, format, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Transaction } from '../hooks/useTransactions';
import type { Card } from '../hooks/useCards';

export interface Invoice {
    id: string; // Generated ID (e.g., cardId-yyyy-MM)
    cardId: string;
    month: string; // yyyy-MM
    label: string; // Outubro 2025
    amount: number;
    status: 'OPEN' | 'CLOSED' | 'PAID' | 'FUTURE';
    dueDate: string;
    closingDate: string;
    transactions: Transaction[];
}

export function calculateInvoices(
    card: Card,
    transactions: Transaction[],
    monthsToProject: number = 12
): Invoice[] {
    const invoices: Invoice[] = [];
    const today = new Date();

    // Determine the current invoice month based on closing day
    // If today is before closing day, current invoice is this month.
    // If today is after closing day, current invoice is next month.
    // Actually, usually:
    // Closing Day 5. Today 2. Current invoice closes on 5th.
    // Closing Day 5. Today 6. Current invoice closed on 5th (OPEN/CLOSED depending on logic) and next one is next month.

    // Let's generate a range of months centered on today
    // e.g., 2 months back and 12 months forward
    const startMonth = addMonths(today, -2);

    for (let i = 0; i < monthsToProject + 2; i++) {
        const targetDate = addMonths(startMonth, i);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth(); // 0-indexed

        // Calculate Closing Date for this invoice month
        // Usually if due day is X, closing day is Y.
        // Let's assume the invoice month corresponds to the DUE DATE month.
        // Example: Invoice "October" has Due Date in October.
        // Closing date might be in September or October depending on the gap.

        // Let's stick to: Invoice Month = Month of Due Date.
        const dueDate = new Date(year, month, card.due_day);

        // Closing date is usually ~10 days before due date.
        // But we have explicit closing_day.
        // If closing_day < due_day, it's in the same month.
        // If closing_day > due_day, it's in the previous month.
        let closingDate: Date;
        if (card.closing_day < card.due_day) {
            closingDate = new Date(year, month, card.closing_day);
        } else {
            closingDate = new Date(year, month - 1, card.closing_day);
        }

        // Previous closing date (start of this invoice cycle)
        const prevClosingDate = addMonths(closingDate, -1); // Approximation, strictly it's the day after prev closing

        // Filter transactions
        const invoiceTransactions = transactions.filter(t => {
            if (t.card_id !== card.id) return false;
            if (t.type !== 'EXPENSE') return false; // Invoices sum expenses

            const tDate = parseISO(t.date);

            // Logic: Transaction belongs to this invoice if:
            // PrevClosingDate < tDate <= ClosingDate
            // Note: We need to handle time, so let's be careful with comparisons.
            // Let's use strict day comparison.

            // Actually, for installments, the date stored in DB is the date of the installment, right?
            // In Cards.tsx: date: date.toISOString().split('T')[0] where date = addMonths(baseDate, i)
            // So yes, the transaction date IS the installment date.

            // So we just check if the transaction date falls within the billing cycle.
            // Billing cycle: (Previous Closing Date) < Date <= (Current Closing Date)

            // However, there's a nuance:
            // If I buy on Closing Day, does it enter this invoice or next?
            // Usually Closing Day is the LAST day included.

            // Let's refine:
            // Cycle Start: Day after Previous Closing Date
            // Cycle End: Closing Date

            // But wait, we calculated closingDate based on Due Date month.

            return isAfter(tDate, prevClosingDate) && !isAfter(tDate, closingDate);
        });

        const amount = invoiceTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

        // Determine status
        let status: Invoice['status'] = 'FUTURE';
        if (isBefore(closingDate, today)) {
            status = 'CLOSED';
            // TODO: Check if paid. For now, we don't have a "Paid" flag on transactions or invoices table.
            // We can check if there is a payment transaction for this card in this month?
            // Or just leave as CLOSED for MVP.
        } else {
            status = 'OPEN';
        }

        // If amount is 0 and it's in the past/future, maybe we don't show it?
        // But for "Current" we might want to show even if 0.

        if (amount > 0 || status === 'OPEN') {
            invoices.push({
                id: `${card.id}-${format(dueDate, 'yyyy-MM')}`,
                cardId: card.id,
                month: format(dueDate, 'yyyy-MM'),
                label: format(dueDate, 'MMMM yyyy', { locale: ptBR }),
                amount,
                status,
                dueDate: format(dueDate, 'yyyy-MM-dd'),
                closingDate: format(closingDate, 'yyyy-MM-dd'),
                transactions: invoiceTransactions
            });
        }
    }

    return invoices;
}
