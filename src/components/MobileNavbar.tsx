import { LayoutDashboard, Wallet, ArrowRightLeft, TrendingUp, CreditCard } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

export default function MobileNavbar() {
    const navItems = [
        { icon: LayoutDashboard, label: 'Home', path: '/' },
        { icon: Wallet, label: 'Wallet', path: '/wallet' },
        { icon: ArrowRightLeft, label: 'Transact', path: '/transactions', isPrimary: true },
        { icon: CreditCard, label: 'Cards', path: '/cards' },
        { icon: TrendingUp, label: 'Analytics', path: '/forecast' },
    ];

    return (
        <nav className="fixed bottom-4 left-4 right-4 h-16 bg-white/90 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl z-50 md:hidden">
            <div className="grid grid-cols-5 h-full items-center">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(
                            "flex flex-col items-center justify-center transition-all duration-200",
                            item.isPrimary
                                ? "absolute left-1/2 -translate-x-1/2 -top-6 bg-primary text-white shadow-lg shadow-primary/30 w-14 h-14 rounded-full border-4 border-cream"
                                : "h-full text-gray-400 hover:text-gray-600",
                            !item.isPrimary && isActive && "text-primary"
                        )}
                    >
                        <item.icon size={item.isPrimary ? 24 : 22} />
                        {!item.isPrimary && (
                            <span className="text-[10px] font-medium mt-1">{item.label}</span>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
