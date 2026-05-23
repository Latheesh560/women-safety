import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Home,
  Navigation,
  AlertTriangle,
  FileText,
  ShieldAlert,
  MessageSquare,
  Settings,
  ChevronLeft,
} from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/home', icon: Home },
  { name: 'Safe Routes', path: '/safe-routes', icon: Navigation },
  { name: 'Report Incident', path: '/incident-report', icon: AlertTriangle },
  { name: 'My Reports', path: '/my-reports', icon: FileText },
  { name: 'SOS Center', path: '/sos-center', icon: ShieldAlert, highlight: true },
  { name: 'Community', path: '/community', icon: MessageSquare },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = ({ collapsed, onToggle, mobileOpen, onCloseMobile }) => {
  const location = useLocation();

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-white/45 backdrop-blur-lg border-r border-pink-100/40 shadow-[4px_0_24px_rgba(0,0,0,0.015)] transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      <div className="flex items-center h-16 px-4 border-b border-pink-100/40">
        <Link to="/home" className="flex items-center gap-2.5 group min-w-0" onClick={onCloseMobile}>
          <img 
            src="/logo.jpg" 
            alt="SheShield Logo" 
            className="w-9 h-9 rounded-xl object-cover border border-pink-100/50 shadow-sm" 
          />
          {!collapsed && (
            <span className="text-lg font-bold text-slate-800 tracking-tight truncate">
              SheShield
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.08 + navItems.indexOf(item) * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
            <Link
              to={item.path}
              onClick={onCloseMobile}
              className={`relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                item.highlight
                  ? active
                    ? 'bg-danger/10 text-danger border border-danger/25 shadow-sm shadow-danger/5'
                    : 'text-slate-500 hover:text-danger hover:bg-danger/5 border border-transparent hover:border-danger/10'
                  : active
                    ? 'bg-[#FFF0F2] text-primary-dark border border-primary/20 shadow-sm shadow-primary/5'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50 border border-transparent'
              }`}
            >
              {/* Sleek left-side border indicator */}
              {active && (
                <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${
                  item.highlight ? 'bg-danger' : 'bg-primary-dark'
                }`} />
              )}
              
              <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                active 
                  ? item.highlight ? 'text-danger' : 'text-primary-dark' 
                  : 'text-slate-400 group-hover:text-slate-600'
              } ${item.highlight && !active ? 'group-hover:animate-pulse' : ''}`} />
              
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-pink-100/40">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/40 transition-all"
        >
          <ChevronLeft
            className={`w-5 h-5 transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
          {!collapsed && <span className="ml-2 text-xs font-semibold">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
