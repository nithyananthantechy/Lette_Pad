import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, Menu, X, FileText, LayoutDashboard, User,
  ClipboardList, Globe, Sparkles, ShieldCheck, MapPin,
  Building2, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import i18n from '../i18n/index.js';
import Logo from './Logo';

const Navbar = () => {
  const { t }                         = useTranslation();
  const { user, logout, refreshUser } = useAuth();
  const location                      = useLocation();
  const navigate                      = useNavigate();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [lang, setLang]               = useState(localStorage.getItem('lang') || 'ta');

  useEffect(() => {
    if (refreshUser) refreshUser();
  }, []);

  const toggleLang = () => {
    const next = lang === 'ta' ? 'en' : 'ta';
    setLang(next);
    localStorage.setItem('lang', next);
    i18n.changeLanguage(next);
    toast.success(next === 'ta' ? 'தமிழ் மொழி தேர்ந்தெடுக்கப்பட்டது' : 'English language selected');
  };

  const handleLogout = () => {
    logout();
    toast.success(lang === 'ta' ? 'வெற்றிகரமாக வெளியேறியது' : 'Logged out successfully');
    navigate('/');
  };

  const handleNavClick = (e, to) => {
    if (to.includes('#')) {
      const hash = to.substring(to.indexOf('#') + 1);
      if (location.pathname === '/') {
        e.preventDefault();
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.history.pushState(null, '', `/#${hash}`);
        }
      } else {
        navigate(`/#${hash}`);
      }
    }
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
    ...(user?.role === 'super_admin' ? [{
      to: '/admin',
      icon: <span className="text-amber-400 text-xs">👑</span>,
      label: lang === 'ta' ? 'முதன்மை நிர்வாகம்' : 'Admin Panel',
      badge: 'ADMIN',
    }] : []),
  ] : [
    {
      to: '/#features',
      icon: <Sparkles size={14} />,
      label: lang === 'ta' ? 'அம்சங்கள்' : 'Features',
    },
    {
      to: '/#parties',
      icon: <Building2 size={14} />,
      label: lang === 'ta' ? 'கட்சிகள்' : 'Parties',
    },
    {
      to: '/#pricing',
      icon: <Award size={14} />,
      label: lang === 'ta' ? 'கட்டணம்' : 'Pricing',
    },
    {
      to: '/#security',
      icon: <ShieldCheck size={14} />,
      label: lang === 'ta' ? 'பாதுகாப்பு' : 'Security',
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0c1222]/95 backdrop-blur-md border-b border-slate-800 shadow-md select-none w-full">
      
      {/* Top micro-banner for Region & Security */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-white/5 py-1 px-3 sm:px-6 lg:px-8 text-[11px] text-slate-400 flex items-center justify-between font-tamil w-full overflow-x-hidden">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <ShieldCheck size={13} />
            <span className="hidden sm:inline">100% பாதுகாப்பான தரவு குறியாக்கம்</span>
            <span className="sm:hidden">பாதுகாப்பானது</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">&bull;</span>
          <span className="text-slate-400 hidden xl:inline">அரசியல் கட்சிகள் &amp; மக்கள் பிரதிநிதிகளுக்கான AI மடல் தளம்</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-blue-900/60 border border-blue-500/30 text-blue-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold text-[10px]">
            <MapPin size={10} className="text-blue-400" />
            <span>ஈரோடு மண்டலம் (Erode Hub)</span>
          </span>
        </div>
      </div>

      {/* Main Navbar — Ultra Sleek Edge to Edge Layout */}
      <div className="w-full px-3 sm:px-4 lg:px-6 max-w-full">
        <div className="flex items-center justify-between h-15 gap-2 sm:gap-3">

          {/* FAR LEFT: Brand Logo */}
          <Link to="/" className="flex items-center group transition-transform hover:opacity-95 flex-shrink-0">
            <Logo size="md" />
          </Link>

          {/* CENTER: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 flex-shrink">
            {navLinks.map(link => {
              const isHash = link.to.includes('#');
              const active = !isHash && location.pathname === link.to;
              const linkClasses = `flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-semibold font-tamil transition-all duration-200 whitespace-nowrap
                ${active
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'}`;

              return isHash ? (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={(e) => handleNavClick(e, link.to)}
                  className={linkClasses}
                >
                  {link.icon}
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full ml-0.5 shadow-2xs">
                      {link.badge}
                    </span>
                  )}
                </a>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className={linkClasses}
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

          {/* FAR RIGHT: User Profile Capsule, Language & Logout */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            
            {/* Language Switch */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex-shrink-0"
              title="Change Language"
            >
              <Globe size={13} className="text-blue-400" />
              <span className="font-tamil">{lang === 'ta' ? 'EN' : 'தமிழ்'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800 flex-shrink-0">
                
                {/* User Info Capsule — Links to /settings */}
                <Link
                  to="/settings"
                  className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-xl transition-all group max-w-[180px]"
                  title={lang === 'ta' ? 'கணக்கு அமைப்புகள் (Settings)' : 'Account Settings'}
                >
                  <div className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="text-left overflow-hidden">
                    <div className="text-xs font-bold text-white group-hover:text-blue-300 font-tamil truncate leading-tight transition-colors max-w-[100px] xl:max-w-[120px]">
                      {user.full_name}
                    </div>
                    <div className="text-[10px] text-blue-400 font-tamil truncate leading-tight">
                      {user.role === 'super_admin' ? '👑 முதன்மை நிர்வாகி' : user.role === 'party_admin' ? 'நிர்வாகி' : user.role === 'govt_official' ? 'அரசு அலுவலர்' : 'உறுப்பினர்'}
                    </div>
                  </div>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/40 rounded-xl transition-all flex-shrink-0"
                  title={lang === 'ta' ? 'வெளியேறு' : 'Logout'}
                >
                  <LogOut size={16} />
                </button>

              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold font-tamil text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
                >
                  {lang === 'ta' ? 'உள்நுழைவு' : 'Login'}
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-xs py-1.5 px-3.5 shadow-sm font-tamil"
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
            {navLinks.map(link => {
              const isHash = link.to.includes('#');
              const active = !isHash && location.pathname === link.to;
              const linkClasses = `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold
                ${active ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-900'}`;

              return isHash ? (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={(e) => { setMenuOpen(false); handleNavClick(e, link.to); }}
                  className={linkClasses}
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
                </a>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={linkClasses}
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
              );
            })}
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
