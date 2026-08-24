// src/components/Navbar.jsx — Optimized Modern Navbar
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, Menu, X, FileText, LayoutDashboard, User,
  ClipboardList, Globe, Sparkles, ShieldCheck, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import i18n from '../i18n/index.js';
import Logo from './Logo';

const Navbar = () => {
  const { t }            = useTranslation();
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang]         = useState(localStorage.getItem('lang') || 'ta');

  const toggleLang = () => {
    const next = lang === 'ta' ? 'en' : 'ta';
    setLang(next);
    localStorage.setItem('lang', next);
    i18n.changeLanguage(next);
  };

  const handleLogout = () => {
    logout();
    toast.success(lang === 'ta' ? 'வெளியேறினீர்கள்!' : 'Logged out!');
    navigate('/');
  };

  const navLinks = user ? [
    {
      to: '/dashboard',
      icon: <LayoutDashboard size={15} />,
      label: lang === 'ta' ? 'டாஷ்போர்டு' : 'Dashboard',
    },
    {
      to: '/intelligence',
      icon: <Sparkles size={15} className="text-amber-400" />,
      label: lang === 'ta' ? 'AI புலனாய்வு & உரை' : 'AI Intelligence',
      badge: 'PRO',
    },
    {
      to: '/letters',
      icon: <FileText size={15} />,
      label: lang === 'ta' ? 'கடிதங்கள்' : 'Letters',
    },
    {
      to: '/profiles',
      icon: <User size={15} />,
      label: lang === 'ta' ? 'சுயவிவரங்கள்' : 'Profiles',
    },
    {
      to: '/audit',
      icon: <ClipboardList size={15} />,
      label: lang === 'ta' ? 'தணிக்கை பதிவு' : 'Audit Log',
    },
  ] : [
    {
      to: '/#pricing',
      icon: <Sparkles size={15} />,
      label: lang === 'ta' ? 'திட்டங்கள் & கட்டணம்' : 'Pricing',
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0c1222]/95 backdrop-blur-md border-b border-slate-800 shadow-lg select-none">
      
      {/* Top micro-banner for Region & Security */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-white/5 py-1 px-4 text-[11px] text-slate-400 flex items-center justify-between font-tamil">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <ShieldCheck size={13} />
            <span className="hidden sm:inline">100% பாதுகாப்பான குறியாக்கம்</span>
            <span className="sm:hidden">பாதுகாப்பானது</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">&bull;</span>
          <span className="text-slate-400 hidden md:inline">தமிழ்நாடு அதிகாரப்பூர்வ மடல் &amp; பேச்சு தயாரிப்பு தளம்</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-blue-900/60 border border-blue-500/30 text-blue-300 px-2 py-0.2 rounded-full flex items-center gap-1 font-semibold text-[10px]">
            <MapPin size={10} className="text-blue-400" />
            <span>ஈரோடு மண்டலம் (Erode Hub)</span>
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left: Brand Logo */}
          <Link to="/" className="flex items-center group transition-transform hover:opacity-95">
            <Logo size="md" />
          </Link>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/70 p-1 rounded-2xl border border-slate-800/80">
            {navLinks.map(link => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-tamil transition-all duration-200
                    ${active
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'}`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full ml-0.5 shadow-2xs">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: User profile, Language, Logout */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Language Switch */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
              title="Change Language"
            >
              <Globe size={13} className="text-blue-400" />
              <span className="font-tamil">{lang === 'ta' ? 'EN' : 'தமிழ்'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
                
                {/* User Info Capsule */}
                <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white font-tamil truncate max-w-[130px] leading-tight">
                      {user.full_name}
                    </div>
                    <div className="text-[10px] text-blue-400 font-tamil leading-tight">
                      {user.role === 'party_admin' ? 'கழக நிர்வாகி' : user.role === 'govt_official' ? 'அரசு அலுவலர்' : 'உறுப்பினர்'}
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/40 rounded-xl transition-all"
                  title={lang === 'ta' ? 'வெளியேறு' : 'Logout'}
                >
                  <LogOut size={16} />
                </button>

              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold font-tamil text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
                >
                  {lang === 'ta' ? 'உள்நுழைவு' : 'Login'}
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-xs py-1.5 px-4 shadow-sm font-tamil"
                >
                  {lang === 'ta' ? 'பதிவு செய்க' : 'Get Started'}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleLang}
              className="px-2 py-1 rounded-lg text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800"
            >
              {lang === 'ta' ? 'EN' : 'தமிழ்'}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 py-4 space-y-3 font-tamil">
          {user && (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{user.full_name}</div>
                <div className="text-[10px] text-blue-400">{user.email}</div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold
                  ${location.pathname === link.to ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-900'}`}
              >
                <span className="flex items-center gap-2.5">
                  {link.icon}
                  <span>{link.label}</span>
                </span>
                {link.badge && (
                  <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {user ? (
            <button
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              className="w-full flex items-center justify-center gap-2 bg-red-950/40 text-red-300 border border-red-800/40 py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              <LogOut size={14} />
              <span>{lang === 'ta' ? 'வெளியேறு' : 'Logout'}</span>
            </button>
          ) : (
            <div className="pt-2 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 py-2 text-center text-xs font-bold bg-slate-900 text-white rounded-xl border border-slate-800"
              >
                {lang === 'ta' ? 'உள்நுழைவு' : 'Login'}
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="flex-1 py-2 text-center text-xs font-bold bg-blue-600 text-white rounded-xl"
              >
                {lang === 'ta' ? 'பதிவு செய்க' : 'Register'}
              </Link>
            </div>
          )}
        </div>
      )}

    </header>
  );
};

export default Navbar;
