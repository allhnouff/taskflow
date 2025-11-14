import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell';

const Navbar = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 relative z-40">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link
            to="/tasks/create"
            className="flex items-center gap-2 px-4 py-2 text-brown-dark rounded-lg transition-colors font-medium shadow-sm"
            style={{ backgroundColor: '#FCD34D' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FACC15'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FCD34D'}
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New task</span>
          </Link>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};

export default Navbar;

