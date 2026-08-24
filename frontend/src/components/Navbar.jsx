// src/components/Navbar.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, FileText, LayoutDashboard, User, ClipboardList, Globe, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import i18n from '../i18n/index.js';

const Navbar = () => {
  const { t }          = useTranslation();
  const { user, logout } = useAuth();
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
    { to: '/dashboard',    icon: <LayoutDashboard size={16} />, label: t('nav.dashboard') },
    { to: '/intelligence', icon: <Sparkles size={16} className="text-amber-400 animate-pulse" />, label: lang === 'ta' ? 'AI புலனாய்வு & உரை' : 'AI Intelligence & Speech', highlight: true },
    { to: '/letters',      icon: <FileText size={16} />,        label: t('nav.letters') },
    { to: '/profiles',     icon: <User size={16} />,            label: t('nav.profiles') },
    { to: '/audit',        icon: <ClipboardList size={16} />,   label: t('nav.audit') },
  ] : [
    { to: '/#pricing', icon: <Sparkles size={16} />, label: lang === 'ta' ? 'கட்டணம் (Pricing)' : 'Pricing' }
  ];

  return (
    <nav className="bg-[#1a1a2e] text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="text-2xl">🏛️</div>
            <div>
              <div className="font-bold text-lg leading-none">AI Letter Pad</div>
              <div className="text-xs text-blue-300 font-tamil leading-none mt-0.5">தமிழ்நாடு &bull; ஈரோடு</div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-tamil transition-all duration-200
                  ${link.highlight
                    ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 text-sky-200 border border-blue-400/30 hover:bg-blue-600/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
              >
                {link.icon} {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                         text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Globe size={16} />
              <span className="font-tamil">{lang === 'ta' ? 'EN' : 'தமிழ்'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-semibold font-tamil">{user.full_name}</div>
                  <div className="text-xs text-blue-300">{user.role.replace('_', ' ')}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40
                             text-red-300 hover:text-red-100 px-4 py-2 rounded-lg
                             text-sm transition-all duration-200"
                >
                  <LogOut size={15} />
                  <span className="font-tamil">{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white font-tamil transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link to="/register"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white
                             text-sm rounded-lg font-tamil transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#16213e] px-4 py-4 space-y-2">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300
                         hover:text-white hover:bg-white/10 transition-all font-tamil"
            >
              {link.icon} {link.label}
            </Link>
          ))}
          <div className="border-t border-white/10 pt-3 flex items-center justify-between">
            <button onClick={toggleLang} className="flex items-center gap-2 text-gray-400 text-sm font-tamil">
              <Globe size={15} /> {lang === 'ta' ? 'Switch to English' : 'தமிழிற்கு மாற்று'}
            </button>
            {user && (
              <button onClick={handleLogout} className="text-red-400 text-sm flex items-center gap-2 font-tamil">
                <LogOut size={14} /> {t('nav.logout')}
              </button>
            )}
          </div>
          {!user && (
            <div className="flex gap-3 pt-2">
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-3 border border-white/20 rounded-lg text-sm text-gray-300 font-tamil">
                {t('nav.login')}
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-3 bg-blue-600 rounded-lg text-sm text-white font-tamil">
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
