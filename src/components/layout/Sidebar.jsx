/**
 * Sidebar Component
 * Navigation sidebar with role-based menu items - Tailwind only
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { MODULES } from '../../constants/constants';
import {
  LayoutDashboard,
  Users,
  Shield,
  HelpCircle,
  ClipboardList,
  User,
  LogOut,
  GraduationCap,
  BookOpen,
  UsersRound,
  Layers
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout, isExaminee, isStaff, canRead } = useAuth();

  const staffMenuItems = [
    {
      path: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      visible: true
    },
    {
      path: '/users',
      icon: Users,
      label: 'Users',
      visible: canRead(MODULES.USERS)
    },
    {
      path: '/examinees',
      icon: GraduationCap,
      label: 'Examinees',
      visible: canRead(MODULES.USERS)
    },
    {
      path: '/groups',
      icon: UsersRound,
      label: 'Groups',
      visible: canRead(MODULES.USERS)
    },
    {
      path: '/allocations',
      icon: ClipboardList,
      label: 'Allocations',
      visible: canRead(MODULES.QUIZZES) // Allocations related to tests
    },
    {
      path: '/roles',
      icon: Shield,
      label: 'Roles',
      visible: canRead(MODULES.ROLES)
    },
    {
      path: '/tests',
      icon: BookOpen,
      label: 'Quizzes',
      visible: canRead(MODULES.QUIZZES)
    },
    {
      path: '/series',
      icon: Layers,
      label: 'Series',
      visible: canRead(MODULES.QUIZZES)
    },
    // {
    //   path: '/questions',
    //   icon: HelpCircle,
    //   label: 'Questions',
    //   visible: canRead(MODULES.QUIZZES)
    // },
  ];

  const examineeMenuItems = [
    { path: '/examinee', icon: LayoutDashboard, label: 'Dashboard', visible: true },
    { path: '/examinee/tests', icon: BookOpen, label: 'Available Quizzes', visible: true },
    { path: '/examinee/series', icon: Layers, label: 'Series', visible: true },
    { path: '/examinee/history', icon: ClipboardList, label: 'My Attempts', visible: true },
  ];

  const menuItems = isExaminee() && !isStaff() ? examineeMenuItems : staffMenuItems.filter(item => item.visible);
  const profilePath = isExaminee() && !isStaff() ? '/examinee/profile' : '/profile';

  const handleLogout = () => {
    logout();
  };

  const baseItemClasses = 'flex items-center gap-3 px-4 py-3 mx-3 rounded-xl text-sm font-medium transition-all duration-200';
  const inactiveClasses = `${baseItemClasses} text-gray-400 hover:text-white hover:bg-white/5`;
  const activeClasses = `${baseItemClasses} text-white bg-gradient-to-r from-blue-500/20 to-violet-500/20 border border-white/10`;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          QuizApp
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const IconComp = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/' || item.path === '/examinee'}
                  className={({ isActive }) => isActive ? activeClasses : inactiveClasses}
                >
                  <IconComp className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        <NavLink
          to={profilePath}
          className={({ isActive }) => isActive ? activeClasses : inactiveClasses}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className={`${baseItemClasses} w-full text-left mt-1 text-red-400 hover:text-red-300 hover:bg-red-500/10`}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>

        {/* User Info */}
        {user && (
          <div className="mt-4 p-3 rounded-xl bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
