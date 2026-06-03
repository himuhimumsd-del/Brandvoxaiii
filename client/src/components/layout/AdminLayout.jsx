// client/src/components/layout/AdminLayout.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  Video,
  Database,
  Coins,
  Settings,
  ArrowLeft,
  Menu,
  ChevronLeft
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Client-side safety gate: Non-admins are redirected back
  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-darkBg text-white">
        <p className="text-sm font-bold tracking-widest text-white/50 uppercase">
          Loading Admin panel privileges...
        </p>
      </div>
    );
  }

  const adminMenu = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/generations', label: 'Generations', icon: Video },
    { path: '/admin/models', label: 'AI Models CRUD', icon: Database },
    { path: '/admin/credits', label: 'Credits History', icon: Coins },
    { path: '/admin/settings', label: 'Settings Panel', icon: Settings }
  ];

  return (
    <div className="flex w-screen h-screen bg-[#07040D] text-white overflow-hidden select-none">
      {/* Collapsible Dark Purple Admin Sidebar */}
      <aside
        className={`bg-[#0F0A1E] border-r border-purple-500/10 flex flex-col justify-between py-6 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-16' : 'w-56'
        } shrink-0 z-40`}
      >
        <div className="flex flex-col space-y-6">
          {/* Header block toggle */}
          <div className="flex items-center justify-between px-4">
            {!collapsed && (
              <span className="text-[10px] font-black bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent uppercase tracking-widest">
                BrandVox Admin
              </span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-purple-300 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer mx-auto transition-colors"
            >
              {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links list */}
          <nav className="flex flex-col space-y-1 px-2">
            {adminMenu.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center w-full rounded-xl transition-all duration-150 cursor-pointer ${
                    collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 space-x-3 text-xs font-semibold'
                  } ${
                    active
                      ? 'bg-purple-600/35 text-white border-l-3 border-purple-500 shadow-premium'
                      : 'text-purple-300 hover:text-white hover:bg-white/5'
                  }`}
                  title={collapsed ? item.label : ''}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="tracking-wide truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Escape item */}
        <div className="px-2">
          <button
            onClick={() => navigate('/studio')}
            className={`flex items-center w-full rounded-xl hover:bg-white/5 transition-all cursor-pointer text-purple-300 hover:text-white ${
              collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 space-x-3 text-xs font-bold'
            }`}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Exit Admin Panel</span>}
          </button>
        </div>
      </aside>

      {/* Main Admin Contents Scroll Panel */}
      <main className="flex-grow h-screen overflow-y-auto bg-gradient-to-br from-[#07040D] to-[#0E071F] p-8">
        {children}
      </main>
    </div>
  );
}
