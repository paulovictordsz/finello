import useSWR from 'swr';
import { supabase } from '../lib/supabase';

export interface Transaction {
    id: string;
    user_id: string;
    account_id?: string;
    category_id?: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    amount: number;
    date: string;
    description?: string;
    from_account_id?: string;
    to_account_id?: string;
    category?: { name: string; icon?: string };
    account?: { name: string };
}

const fetcher = async () => {
    console.log('Fetching transactions...');
    // We need to specify the foreign key for the account join because there are multiple FKs to accounts
    const { data, error } = await supabase
        .from('transactions')
        .select(`
      *,
      category:categories(name, icon),
      account:accounts!account_id(name)
    `)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching transactions:', JSON.stringify(error, null, 2));
        throw error;
    }
    console.log('Transactions fetched:', data);
    return data as Transaction[];
};

export function useTransactions() {
    const { data, error, isLoading, mutate } = useSWR('transactions', fetcher);

    const createTransaction = async (transaction: any) => {
        const { error } = await supabase.from('transactions').insert([transaction]);
        if (error) throw error;
        mutate();
        // Also revalidate accounts to update balances
        // In a real app we might want to use global mutate or optimistic updates
    };

    const deleteTransaction = async (id: string) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        mutate();
    };

    const updateTransaction = async (id: string, updates: any) => {
        const { error } = await supabase.from('transactions').update(updates).eq('id', id);
        if (error) throw error;
        mutate();
    };

    return {
        transactions: data,
        isLoading,
        isError: error,
        createTransaction,
        deleteTransaction,
        updateTransaction,
    };
}
