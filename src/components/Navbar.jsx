import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaUserCircle,
  FaSignOutAlt,
  FaGlobe,
  FaChevronDown,
  FaBars,
  FaTimes,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useUser } from '../hooks/useUser';
import { getImageUrl } from '../utils/imageUrls';
import LowDataToggle from './LowDataToggle';
import SyncStatus from './SyncStatus';

const LOGO_SRC = '/logo.svg';

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'si', label: 'සිංහල', short: 'සිං' },
  { code: 'ta', label: 'தமிழ்', short: 'தம' },
];

const LanguageSelector = ({ mobile = false }) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LANGUAGES.find(l => i18n.language.startsWith(l.code)) || LANGUAGES[0];

  if (mobile) {
    return (
      <div className="space-y-1">
        <p className="px-1 text-xs font-semibold tracking-wider uppercase text-muted">Language</p>
        <div className="flex gap-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                i18n.language.startsWith(lang.code)
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                  : 'text-muted hover:bg-surface-muted'
              }`}
            >
              {lang.short}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-2 text-sm transition-colors rounded-lg text-muted hover:bg-surface-muted hover:text-deep-blue"
        aria-label="Select language"
      >
        <FaGlobe className="w-4 h-4" />
        <span className="font-medium">{current.short}</span>
        <FaChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-40 bg-surface border border-border rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center justify-between ${
                i18n.language.startsWith(lang.code)
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-text-dark hover:bg-surface-muted'
              }`}
            >
              <span>{lang.label}</span>
              <span className="text-xs opacity-50">{lang.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfileAvatar = ({ user, size = 'sm' }) => {
  const sizeClasses = size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  if (!user?.profileImage) return <FaUserCircle className={`${sizeClasses} text-muted`} />;
  return (
    <img
      src={getImageUrl(user.profileImage)}
      alt=""
      className={`object-cover ${sizeClasses} rounded-full border-2 border-border`}
      onError={e => {
        e.currentTarget.onerror = null;
        e.currentTarget.style.display = 'none';
        if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
      }}
    />
  );
};

const UserDisplayName = ({ user }) => {
  const name = user.role === 'employer' ? user.companyName || user.firstName : user.firstName;
  return <span className="font-medium text-text-dark max-w-[120px] truncate text-sm">{name}</span>;
};

const SECTION_IDS = ['home', 'who-we-are', 'explore'];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser, logoutUser } = useUser();
  const [activeSection, setActiveSection] = useState('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);

  const isDashboard = location.pathname === '/';

  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!isDashboard) return;
    const detectActive = () => {
      const trigger = window.innerHeight * 0.35;
      for (let i = SECTION_IDS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTION_IDS[i]);
        if (el && el.getBoundingClientRect().top <= trigger) {
          setActiveSection(SECTION_IDS[i]);
          return;
        }
      }
      setActiveSection(SECTION_IDS[0]);
    };
    window.addEventListener('scroll', detectActive, { passive: true });
    detectActive();
    return () => window.removeEventListener('scroll', detectActive);
  }, [isDashboard, location.pathname]);

  const scrollToSection = useCallback(
    id => {
      if (isDashboard) {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`/#${id}`);
      }
      setMobileOpen(false);
    },
    [isDashboard, navigate]
  );

  const isActive = path => {
    if (path === '/employer/dashboard') return location.pathname === '/employer/dashboard';
    if (path === '/admin/dashboard') return location.pathname === '/admin/dashboard';
    return location.pathname.startsWith(path);
  };

  const isEmployerUser = currentUser?.role === 'employer';
  const isAuthPage = ['/login', '/register', '/forgot-password', '/verify-registration'].some(p =>
    location.pathname.startsWith(p)
  );
  const isAdminSection = location.pathname.startsWith('/admin');
  const showEmployerNav = currentUser?.role === 'employer' && !isAuthPage && !isAdminSection;

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Redux still clears the local session when the backend is unreachable.
    } finally {
      navigate('/login');
    }
  };

  const navLinkClass = active =>
    `relative text-sm font-medium transition-colors py-1 ${
      active
        ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
        : 'text-muted hover:text-text-dark'
    }`;

  const sectionLinkClass = id => {
    const active = isDashboard && activeSection === id;
    return `text-sm font-medium transition-all cursor-pointer px-3 py-1.5 rounded-lg ${
      active
        ? 'text-primary bg-primary/10'
        : 'text-muted hover:text-text-dark hover:bg-surface-muted'
    }`;
  };

  const mobileNavLinkClass = active =>
    `block w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-colors ${
      active ? 'bg-primary/10 text-primary' : 'text-text-dark hover:bg-surface-muted'
    }`;

  const publicNavLinks = [
    { id: 'home', label: t('navbar.home') || 'Home' },
    { id: 'who-we-are', label: t('navbar.about') || 'About' },
    { id: 'explore', label: t('navbar.explore') || 'Explore' },
  ];

  const employerNavLinks = [
    { to: '/employer/dashboard', label: t('navbar.dashboard'), exact: true },
    { to: '/employer/my-jobs', label: t('navbar.my_jobs') },
    { to: '/employer/applications', label: t('navbar.applications') },
    { to: '/employer/analytics', label: t('navbar.analytics') },
  ];

  const adminNavLinks = [
    { to: '/admin/dashboard', label: t('navbar.dashboard'), exact: true },
    { to: '/admin/users', label: t('navbar.users') },
    { to: '/admin/jobs', label: t('navbar.jobs') },
  ];

  const getNavLinks = () => {
    if (isAdminSection && !isAuthPage) return { type: 'route', links: adminNavLinks };
    if (showEmployerNav) return { type: 'route', links: employerNavLinks };
    if (!isAuthPage) return { type: 'section', links: publicNavLinks };
    return null;
  };

  const navConfig = getNavLinks();

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-surface/95 backdrop-blur-md border-b border-border shadow-sm'
            : 'bg-white border-b border-transparent'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <img
              src={LOGO_SRC}
              alt=""
              width={36}
              height={36}
              className="object-contain transition-transform w-9 h-9 group-hover:scale-105"
              decoding="async"
            />
            <span className="text-xl font-bold tracking-tight text-deep-blue font-heading">
              JobLoom
            </span>
          </Link>

          {/* Desktop nav links */}
          {navConfig && (
            <nav className="items-center hidden gap-1 lg:flex">
              {navConfig.type === 'route'
                ? navConfig.links.map(link => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={navLinkClass(
                        link.exact ? location.pathname === link.to : isActive(link.to)
                      )}
                      style={{ margin: '0 12px' }}
                    >
                      {link.label}
                    </Link>
                  ))
                : navConfig.links.map(link => (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.id)}
                      className={sectionLinkClass(link.id)}
                    >
                      {link.label}
                    </button>
                  ))}
            </nav>
          )}

          {/* Desktop right side */}
          <div className="items-center hidden gap-1 lg:flex">
            <SyncStatus />
            <LowDataToggle />
            <LanguageSelector />

            {!isAuthPage && (
              <>
                {isEmployerUser && !isAdminSection && (
                  <>
                    <div className="w-px h-5 mx-2 bg-border" />
                    <Link
                      to="/"
                      className="px-3 py-1.5 text-sm font-medium transition-colors rounded-lg text-muted hover:text-primary hover:bg-surface-muted"
                    >
                      {t('navbar.browse_jobs') || 'Browse Jobs'}
                    </Link>
                  </>
                )}

                {currentUser?.role === 'job_seeker' && (
                  <>
                    <div className="w-px h-5 mx-2 bg-border" />
                    <Link
                      to="/my-applications"
                      className={navLinkClass(isActive('/my-applications'))}
                    >
                      {t('navbar.my_applications')}
                    </Link>
                  </>
                )}
              </>
            )}

            <div className="w-px h-5 mx-2 bg-border" />

            {currentUser ? (
              <div className="flex items-center gap-1">
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                    isActive('/profile')
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-surface-muted text-text-dark'
                  }`}
                >
                  <ProfileAvatar user={currentUser} />
                  <UserDisplayName user={currentUser} />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 transition-colors rounded-lg text-muted hover:text-error hover:bg-error/10"
                  title={t('navbar.sign_out')}
                >
                  <FaSignOutAlt className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold transition-colors text-primary hover:text-deep-blue"
                >
                  {t('navbar.sign_in')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white transition-colors shadow-sm bg-primary rounded-lg hover:bg-deep-blue"
                >
                  {t('navbar.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile right side: sync + hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <SyncStatus />
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="p-2 transition-colors rounded-lg text-text-dark hover:bg-surface-muted"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[300px] max-w-[85vw] bg-surface shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <span className="text-lg font-bold text-deep-blue font-heading">Menu</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 transition-colors rounded-lg text-muted hover:bg-surface-muted"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer body */}
          <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
            {/* User profile (if logged in) */}
            {currentUser && (
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 p-3 transition-colors rounded-xl bg-surface-muted hover:bg-primary/5"
              >
                <ProfileAvatar user={currentUser} size="lg" />
                <div className="min-w-0">
                  <UserDisplayName user={currentUser} />
                  <p className="text-xs capitalize text-muted">
                    {currentUser.role?.replace('_', ' ')}
                  </p>
                </div>
              </Link>
            )}

            {/* Navigation */}
            {navConfig && (
              <div className="space-y-1">
                <p className="px-1 text-xs font-semibold tracking-wider uppercase text-muted">
                  Navigation
                </p>
                {navConfig.type === 'route'
                  ? navConfig.links.map(link => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMobileOpen(false)}
                        className={mobileNavLinkClass(
                          link.exact ? location.pathname === link.to : isActive(link.to)
                        )}
                      >
                        {link.label}
                      </Link>
                    ))
                  : navConfig.links.map(link => (
                      <button
                        key={link.id}
                        onClick={() => scrollToSection(link.id)}
                        className={mobileNavLinkClass(isDashboard && activeSection === link.id)}
                      >
                        {link.label}
                      </button>
                    ))}
              </div>
            )}

            {/* Context links */}
            {!isAuthPage && (
              <div className="space-y-1">
                {isEmployerUser && !isAdminSection && (
                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className={mobileNavLinkClass(false)}
                  >
                    {t('navbar.browse_jobs') || 'Browse Jobs'}
                  </Link>
                )}
                {currentUser?.role === 'job_seeker' && (
                  <Link
                    to="/my-applications"
                    onClick={() => setMobileOpen(false)}
                    className={mobileNavLinkClass(isActive('/my-applications'))}
                  >
                    {t('navbar.my_applications')}
                  </Link>
                )}
              </div>
            )}

            {/* Utilities */}
            <div className="space-y-3">
              <p className="px-1 text-xs font-semibold tracking-wider uppercase text-muted">
                Settings
              </p>
              <div className="px-1">
                <LowDataToggle />
              </div>
              <div className="px-1">
                <LanguageSelector mobile />
              </div>
            </div>
          </div>

          {/* Drawer footer */}
          <div className="px-4 py-4 border-t border-border">
            {currentUser ? (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-xl text-error bg-error/5 hover:bg-error/10"
              >
                <FaSignOutAlt className="w-4 h-4" />
                {t('navbar.sign_out') || 'Sign Out'}
              </button>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full px-4 py-3 text-sm font-semibold text-center transition-colors border rounded-xl text-primary border-primary hover:bg-primary/5"
                >
                  {t('navbar.sign_in')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full px-4 py-3 text-sm font-semibold text-center text-white transition-colors shadow-sm bg-primary rounded-xl hover:bg-deep-blue"
                >
                  {t('navbar.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
