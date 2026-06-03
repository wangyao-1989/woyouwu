import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Icon from './Icon';

const publishOptions = [
  { label: '闲置交换', icon: 'cube', to: '/items/create' },
  { label: '项目作品', icon: 'folder', to: '/projects/create' },
  { label: '文章故事', icon: 'file', to: '/articles/create' },
  { label: '灵感碎片', icon: 'lightbulb', to: '/inspirations/create' },
  { label: '资源分享', icon: 'doc', to: '/resources/create' },
];

const navLinks = [
  { label: '首页', to: '/' },
  { label: '闲置交换', to: '/items' },
  { label: '项目作品', to: '/projects' },
  { label: '文章故事', to: '/articles' },
  { label: '灵感碎片', to: '/inspirations' },
  { label: '资源', to: '/resources' },
  { label: '社区', to: '/users' },
];

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoFailed, setLogoFailed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPublishDropdown, setShowPublishDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const publishDropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (publishDropdownRef.current && !publishDropdownRef.current.contains(event.target)) {
        setShowPublishDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('/api/messages/unread-count');
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/items?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-[#EBE7E0]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2" style={{ letterSpacing: '0.05em' }}>
              {logoFailed ? (
                <div className="w-9 h-9 bg-[#222] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-base">悟</span>
                </div>
              ) : (
                <img 
                  src={`/uploads/logo.png?t=${Date.now()}`}
                  alt="我有物" 
                  className="w-9 h-9 object-contain"
                  onError={() => setLogoFailed(true)}
                />
              )}
              <span className="text-lg font-semibold text-[#222]">我有物 · 我有悟</span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm transition-colors duration-200 ${
                  isActive(link.to)
                    ? 'text-[#222] font-medium'
                    : 'text-[#777] hover:text-[#222]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索..."
                  className="w-48 pl-9 pr-4 py-1.5 bg-white/60 border border-[#EBE7E0] rounded-full text-sm text-[#222] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#222]/10 focus:border-[#ccc] focus:bg-white transition-all"
                />
                <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bbb]" />
              </div>
            </form>

            {user ? (
              <>
                {/* Publish Button */}
                <div className="relative hidden sm:block" ref={publishDropdownRef}>
                  <button
                    onClick={() => setShowPublishDropdown(!showPublishDropdown)}
                    className="btn-primary text-sm py-1.5 px-5"
                  >
                    <Icon name="plus" className="w-4 h-4 mr-1" />
                    分享
                  </button>

                  {showPublishDropdown && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl border border-[#EBE7E0] shadow-lg py-2 z-50">
                      {publishOptions.map(opt => (
                        <Link
                          key={opt.label}
                          to={opt.to}
                          onClick={() => setShowPublishDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#555] hover:text-[#222] hover:bg-[#F7F5F2] transition-colors"
                        >
                          <Icon name={opt.icon} className="w-4 h-4 text-[#999]" />
                          <span>{opt.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <Link to="/messages" className="relative p-2 text-[#999] hover:text-[#222] transition-colors" aria-label="通知">
                  <Icon name="bell" className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-[#B45A3C] rounded-full min-w-[18px]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-1.5 p-1 transition-colors"
                    aria-label="用户菜单"
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.nickname}`}
                      alt={user.nickname}
                      className="w-8 h-8 rounded-full bg-gray-200 border-2 border-transparent hover:border-[#ddd] transition-all"
                    />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#EBE7E0] shadow-lg py-2 z-50">
                      <div className="px-4 py-3 border-b border-[#F0EDE8]">
                        <p className="text-sm font-medium text-[#222]">{user.nickname}</p>
                        <p className="text-xs text-[#999]">@{user.username}</p>
                      </div>
                      <Link
                        to={`/profile/${user.id}`}
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2.5 text-sm text-[#555] hover:text-[#222] hover:bg-[#F7F5F2] transition-colors"
                      >
                        个人资料
                      </Link>
                      <Link
                        to="/profile/edit"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2.5 text-sm text-[#555] hover:text-[#222] hover:bg-[#F7F5F2] transition-colors"
                      >
                        简历编辑
                      </Link>
                      {user.role === 'admin' && (
                        <>
                          <Link
                            to="/admin/settings"
                            onClick={() => setShowDropdown(false)}
                            className="block px-4 py-2.5 text-sm text-[#555] hover:text-[#222] hover:bg-[#F7F5F2] transition-colors"
                          >
                            系统设置
                          </Link>
                          <Link
                            to="/admin/users"
                            onClick={() => setShowDropdown(false)}
                            className="block px-4 py-2.5 text-sm text-[#555] hover:text-[#222] hover:bg-[#F7F5F2] transition-colors"
                          >
                            用户管理
                          </Link>
                        </>
                      )}
                      <div className="border-t border-[#F0EDE8] mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2.5 text-sm text-[#B45A3C] hover:bg-[#FDF7F5] transition-colors"
                        >
                          退出登录
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm text-[#777] hover:text-[#222] transition-colors px-3 py-1.5">
                  登录
                </Link>
                <Link to="/register" className="btn-primary text-sm py-1.5 px-5">
                  注册
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-[#777] hover:text-[#222] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="菜单"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-[#EBE7E0] mt-2 pt-4">
            <div className="flex flex-col gap-2">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 text-sm rounded-xl transition-colors ${
                    isActive(link.to)
                      ? 'bg-[#222] text-white'
                      : 'text-[#555] hover:bg-[#F0EDE8]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {/* Mobile search */}
              <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }} className="md:hidden mt-2">
                <div className="relative">
                  <input
                    type="text"
                    name="search-mobile"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EBE7E0] rounded-full text-sm text-[#222] placeholder-[#bbb] focus:outline-none focus:ring-2 focus:ring-[#222]/10 focus:border-[#ccc] transition-all"
                  />
                  <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bbb]" />
                </div>
              </form>
              {user && (
                <div className="sm:hidden mt-1">
                  <Link
                    to="/items/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center btn-primary text-sm py-2.5"
                  >
                    分享
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
