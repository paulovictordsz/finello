import { Bell, Search } from 'lucide-react';

const Dashboard = () => {
    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Good Morning, Paulo! 👋</h1>
                    <p className="text-gray-500 text-sm mt-1">Here's what's happening with your money today.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white w-64"
                        />
                    </div>
                    <button className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        PD
                    </div>
                </div>
            </header>

            {/* Content Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-40 flex items-center justify-center text-gray-400">
                    Total Balance Card
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-40 flex items-center justify-center text-gray-400">
                    Income Card
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-40 flex items-center justify-center text-gray-400">
                    Expenses Card
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96 flex items-center justify-center text-gray-400">
                Main Chart Area
            </div>
        </div>
    );
};

export default Dashboard;
