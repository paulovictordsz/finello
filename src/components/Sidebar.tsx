import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Wallet,
    PieChart,
    CreditCard,
    ArrowLeftRight,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Wallet, label: 'Wallet', path: '/wallet' },
        { icon: PieChart, label: 'Analytics', path: '/analytics' },
        { icon: CreditCard, label: 'Cards', path: '/cards' },
        { icon: ArrowLeftRight, label: 'Transactions', path: '/transactions' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <motion.aside
            initial={{ width: 240 }}
            animate={{ width: isCollapsed ? 80 : 240 }}
            className="h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-50 flex flex-col transition-all duration-300 shadow-sm"
        >
            <div className="p-6 flex items-center justify-between h-20">
                {!isCollapsed && (
                    <img src="/Logo_Horizontal.svg" alt="Finello" className="h-8" />
                )}
                {isCollapsed && (
                    <img src="/Ico.svg" alt="Finello" className="h-8 mx-auto" />
                )}

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-8 bg-white border border-gray-100 rounded-full p-1 shadow-sm hover:bg-gray-50 text-gray-500"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-200",
                            isActive
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "text-gray-500 hover:bg-gray-50 hover:text-primary"
                        )}
                    >
                        <item.icon size={20} />
                        {!isCollapsed && (
                            <span className="font-medium text-sm whitespace-nowrap overflow-hidden">
                                {item.label}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-50">
                <button className={clsx(
                    "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors duration-200",
                    isCollapsed && "justify-center"
                )}>
                    <LogOut size={20} />
                    {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
