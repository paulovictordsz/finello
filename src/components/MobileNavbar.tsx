import { LayoutDashboard, Wallet, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

export default function MobileNavbar() {
    const navItems = [
        { icon: LayoutDashboard, label: 'Home', path: '/' },
        { icon: Wallet, label: 'Wallet', path: '/wallet' },
        { icon: ArrowRightLeft, label: 'Transact', path: '/transactions', isPrimary: true },
        { icon: TrendingUp, label: 'Analytics', path: '/forecast' },
    ];

    return (
        <nav className="fixed bottom-4 left-4 right-4 h-16 bg-white/80 backdrop-blur-lg border border-white/20 shadow-lg rounded-2xl flex items-center justify-around z-50 md:hidden">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => clsx(
                        "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                        item.isPrimary
                            ? "bg-primary text-white shadow-lg shadow-primary/30 -mt-8 w-14 h-14"
                            : isActive
                                ? "text-primary bg-primary/10"
                                : "text-gray-400 hover:text-gray-600"
                    )}
                >
                    <item.icon size={item.isPrimary ? 24 : 20} />
                </NavLink>
            ))}
        </nav>
    );
}
