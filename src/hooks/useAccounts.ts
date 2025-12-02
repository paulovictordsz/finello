import useSWR from 'swr';
import { supabase } from '../lib/supabase';

export interface Account {
    id: string;
    name: string;
    type: 'CHECKING' | 'SAVINGS' | 'CASH' | 'OTHER';
    initial_balance: number;
    created_at: string;
}

const fetcher = async () => {
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('name');

    if (error) throw error;
    return data as Account[];
};

export function useAccounts() {
    const { data, error, isLoading, mutate } = useSWR('accounts', fetcher);

    const createAccount = async (account: Omit<Account, 'id' | 'created_at'>) => {
        const { error } = await supabase.from('accounts').insert([account]);
        if (error) throw error;
        mutate();
    };

    const deleteAccount = async (id: string) => {
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (error) throw error;
        mutate();
    };

    return {
        accounts: data,
        isLoading,
        isError: error,
        createAccount,
        deleteAccount,
    };
}
