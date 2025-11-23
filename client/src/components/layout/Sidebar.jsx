import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, selectUser, selectIsAdmin, selectIsManager } from '../../store/slices/authSlice';
import { LayoutDashboard, CheckSquare, Bell, Settings, LogOut, Users, Clock } from 'lucide-react';
import logo from '../../assets/logo.png';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const isManager = useAppSelector(selectIsManager);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/tasks', label: 'My tasks', icon: CheckSquare },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ];

  // Show Users link for both admin and manager
  if (isAdmin || isManager) {
    navItems.push({ path: '/admin/users', label: 'Users', icon: Users });
  }

  // Show Notification Settings for both admin and manager
  if (isAdmin || isManager) {
    navItems.push({ path: '/admin/notification-settings', label: 'Notification Settings', icon: Clock });
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src={logo} alt="TaskFlow" className="w-10 h-10 object-contain" />
          <span className="text-xl font-bold text-gray-900">TaskFlow</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all relative ${
                active
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full"></div>
              )}
              <Icon size={20} className={active ? 'text-primary-500' : 'text-gray-500'} strokeWidth={active ? 2.5 : 2} />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200 space-y-1">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Settings size={20} className="text-gray-500" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <LogOut size={20} className="text-gray-500" />
          <span>Log out</span>
        </button>
        <div className="px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-brown-dark font-semibold text-sm" style={{ backgroundColor: '#FCD34D' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

