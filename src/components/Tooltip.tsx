import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';

interface TooltipProps {
    children: ReactNode;
    content: string;
    className?: string;
}

export const Tooltip = ({ children, content, className }: TooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className={clsx("relative inline-block", className)}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute z-50 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-xl -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-max max-w-[200px] text-center pointer-events-none">
                    {content}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
            )}
        </div>
    );
};
