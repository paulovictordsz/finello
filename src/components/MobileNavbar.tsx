import { LayoutDashboard, Wallet, ArrowRightLeft, TrendingUp, CreditCard } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { Fragment } from 'react';

export default function MobileNavbar() {
    const navItems = [
        { icon: LayoutDashboard, label: 'Início', path: '/' },
        { icon: Wallet, label: 'Carteira', path: '/wallet' },
        { icon: ArrowRightLeft, label: 'Transações', path: '/transactions', isPrimary: true },
        { icon: CreditCard, label: 'Cartões', path: '/cards' },
        { icon: TrendingUp, label: 'Análises', path: '/forecast' },
    ];

    return (
        <nav className="fixed bottom-4 left-4 right-4 h-16 bg-white/90 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl z-50 md:hidden">
            <div className="grid grid-cols-5 h-full items-center">
                {navItems.map((item) => (
                    <Fragment key={item.path}>
                        {item.isPrimary ? (
                            <>
                                <div className="h-full pointer-events-none" />
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => clsx(
                                        "absolute left-1/2 -translate-x-1/2 -top-6 flex flex-col items-center justify-center transition-all duration-200",
                                        "bg-primary text-white shadow-lg shadow-primary/30 w-14 h-14 rounded-full border-4 border-white/20",
                                        isActive && "ring-2 ring-primary ring-offset-2"
                                    )}
                                >
                                    <item.icon size={24} />
                                </NavLink>
                            </>
                        ) : (
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => clsx(
                                    "flex flex-col items-center justify-center transition-all duration-200 h-full text-gray-400 hover:text-gray-600",
                                    isActive && "text-primary"
                                )}
                            >
                                <item.icon size={22} />
                                <span className="text-[10px] font-medium mt-1">{item.label}</span>
                            </NavLink>
                        )}
                    </Fragment>
                ))}
            </div>
        </nav>
    );
}
