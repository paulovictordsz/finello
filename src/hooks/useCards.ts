import useSWR from 'swr';
import { supabase } from '../lib/supabase';

export interface Card {
    id: string;
    user_id: string;
    name: string;
    limit_amount: number;
    closing_day: number;
    due_day: number;
}

const fetcher = async () => {
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('name');

    if (error) throw error;
    return data as Card[];
};

export function useCards() {
    const { data, error, isLoading, mutate } = useSWR('cards', fetcher);

    const createCard = async (card: Omit<Card, 'id'>) => {
        const { error } = await supabase.from('cards').insert([card]);
        if (error) throw error;
        mutate();
    };

    const deleteCard = async (id: string) => {
        const { error } = await supabase.from('cards').delete().eq('id', id);
        if (error) throw error;
        mutate();
    };

    const updateCard = async (id: string, updates: Partial<Omit<Card, 'id'>>) => {
        const { error } = await supabase.from('cards').update(updates).eq('id', id);
        if (error) throw error;
        mutate();
    };

    return {
        cards: data,
        isLoading,
        isError: error,
        createCard,
        deleteCard,
        updateCard,
    };
}
