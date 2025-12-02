import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';
import { clsx } from 'clsx';

interface DateInputProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    className?: string;
    required?: boolean;
    placeholder?: string;
}

export default function DateInput({ value, onChange, className, required, placeholder = 'DD/MM/AAAA' }: DateInputProps) {
    const [displayValue, setDisplayValue] = useState('');
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Format YYYY-MM-DD to DD/MM/YYYY for display
    useEffect(() => {
        if (value) {
            const [year, month, day] = value.split('-');
            if (year && month && day) {
                setDisplayValue(`${day}/${month}/${year}`);
            }
        } else {
            setDisplayValue('');
        }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value.replace(/\D/g, ''); // Remove non-digits

        // Masking logic
        if (inputValue.length > 8) inputValue = inputValue.slice(0, 8);

        let formattedValue = '';
        if (inputValue.length > 0) {
            formattedValue = inputValue.slice(0, 2);
            if (inputValue.length > 2) {
                formattedValue += '/' + inputValue.slice(2, 4);
                if (inputValue.length > 4) {
                    formattedValue += '/' + inputValue.slice(4, 8);
                }
            }
        }

        setDisplayValue(formattedValue);

        // Validate and update parent if valid date
        if (inputValue.length === 8) {
            const day = parseInt(inputValue.slice(0, 2));
            const month = parseInt(inputValue.slice(2, 4));
            const year = parseInt(inputValue.slice(4, 8));

            if (day > 0 && day <= 31 && month > 0 && month <= 12 && year > 1900 && year < 2100) {
                // Basic validation, could be more robust
                onChange(`${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
            }
        } else if (inputValue.length === 0) {
            onChange('');
        }
    };

    const handleCalendarClick = () => {
        dateInputRef.current?.showPicker();
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={displayValue}
                onChange={handleInputChange}
                className={clsx(className, "pr-10")}
                placeholder={placeholder}
                required={required}
                maxLength={10}
            />
            <div
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-primary transition-colors"
                onClick={handleCalendarClick}
            >
                <Calendar size={20} />
            </div>
            {/* Hidden native date input for picker functionality */}
            <input
                ref={dateInputRef}
                type="date"
                value={value}
                onChange={handleDateChange}
                className="absolute opacity-0 bottom-0 left-0 w-full h-full -z-10 pointer-events-none"
                tabIndex={-1}
            />
        </div>
    );
}
