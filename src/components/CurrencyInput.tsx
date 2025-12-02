import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface CurrencyInputProps {
    value: number | string;
    onChange: (value: number) => void;
    className?: string;
    placeholder?: string;
    required?: boolean;
}

export default function CurrencyInput({ value, onChange, className, placeholder, required }: CurrencyInputProps) {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        if (value === '' || value === undefined || value === null) {
            setDisplayValue('');
            return;
        }

        // Convert number to currency string for display
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numericValue)) {
            setDisplayValue('');
            return;
        }

        setDisplayValue(formatCurrency(numericValue));
    }, [value]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Remove non-digits
        const digits = inputValue.replace(/\D/g, '');

        if (digits === '') {
            onChange(0);
            setDisplayValue('');
            return;
        }

        // Convert to float (last 2 digits are cents)
        const floatValue = parseFloat(digits) / 100;

        onChange(floatValue);
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            className={clsx(className)}
            placeholder={placeholder}
            required={required}
        />
    );
}
