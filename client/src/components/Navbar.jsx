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

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoFailed, setLogoFailed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPublishDropdown, setShowPublishDropdown] = useState(false);
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
    <nav className="glass sticky top-0 left-0 right-0 z-50 border-b border-[#E8E0D5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              {logoFailed ? (
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">悟</span>
                </div>
              ) : (
                <img 
                  src={`/uploads/logo.png?t=${Date.now()}`}
                  alt="我有物" 
                  className="w-10 h-10 object-contain"
                  onError={() => setLogoFailed(true)}
                />
              )}
              <span className="text-xl font-kai text-[#4A3728] text-center leading-tight">我有物<br/>我有悟</span>
            </Link>
            <div className="hidden md:flex ml-10 space-x-1">
              <Link 
                to="/" 
                className={`tag-capsule transition-all duration-300 ${
                  isActive('/') 
                    ? 'bg-[#4A3728] text-white' 
                    : 'text-[#8B7355] hover:text-[#4A3728] hover:bg-white border border-[#E8E0D5]'
                }`}
              >
                首页
              </Link>
              <Link 
                to="/items" 
                className={`tag-capsule transition-all duration-300 ${
                  isActive('/items') 
                    ? 'bg-[#4A3728] text-white' 
                    : 'text-[#8B7355] hover:text-[#4A3728] hover:bg-white border border-[#E8E0D5]'
                }`}
              >
                闲置交换
              </Link>
              <Link 
                to="/projects" 
                className={`tag-capsule transition-all duration-300 ${
                  isActive('/projects') 
                    ? 'bg-[#4A3728] text-white' 
                    : 'text-[#8B7355] hover:text-[#4A3728] hover:bg-white border border-[#E8E0D5]'
                }`}
              >
                项目作品
              </Link>
              <Link 
                to="/articles" 
                className={`tag-capsule transition-all duration-300 ${
                  isActive('/articles') 
                    ? 'bg-[#4A3728] text-white' 
                    : 'text-[#8B7355] hover:text-[#4A3728] hover:bg-white border border-[#E8E0D5]'
                }`}
              >
                文章故事
              </Link>
              <Link 
                to="/inspirations" 
                className={`tag-capsule transition-all duration-300 ${
                  isActive('/inspirations') 
                    ? 'bg-[#4A3728] text-white' 
                    : 'text-[#8B7355] hover:text-[#4A3728] hover:bg-white border border-[#E8E0D5]'
                }`}
              >
                灵感碎片
              </Link>
              <Link 
                to="/resources" 
                className={`tag-capsule transition-all duration-300 ${
                  isActive('/resources') 
                    ? 'bg-[#4A3728] text-white' 
                    : 'text-[#8B7355] hover:text-[#4A3728] hover:bg-white border border-[#E8E0D5]'
                }`}
              >
                资源
              </Link>
              <Link 
                to="/users" 
                className={`tag-capsule transition-all duration-300 ${
                  isActive('/users') 
                    ? 'bg-[#4A3728] text-white' 
                    : 'text-[#8B7355] hover:text-[#4A3728] hover:bg-white border border-[#E8E0D5]'
                }`}
              >
                社区
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <form onSubmit={handleSearch} className="hidden sm:block">
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索创作、灵感、用户..."
                  className="w-64 pl-10 pr-4 py-2 bg-white/60 border border-[#E8E0D5] rounded-btn text-sm text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] focus:bg-white/90 transition-all"
                />
                <Icon name="search" className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </form>

            {user ? (
              <>
                <div className="relative" ref={publishDropdownRef}>
                  <button
                    onClick={() => setShowPublishDropdown(!showPublishDropdown)}
                    className="btn-primary text-sm py-2 px-5 flex items-center active:scale-95"
                  >
                    <Icon name="plus" className="w-5 h-5 mr-1" />
                    发布
                    <svg aria-hidden="true" className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showPublishDropdown && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-card border border-[#E8E0D5] shadow-card py-2 z-50">
                      {publishOptions.map(opt => (
                        <Link
                          key={opt.label}
                          to={opt.to}
                          onClick={() => setShowPublishDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#4A3728] hover:bg-[#F5F0E8] active:scale-98 transition-colors"
                        >
                          <Icon name={opt.icon} className="w-5 h-5 text-[#8B7355]" />
                          <span>{opt.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <Link to="/messages" className="relative p-2 text-[#8B7355] hover:text-[#4A3728] hover:bg-white/70 rounded-btn active:scale-95 transition-all" aria-label="通知">
                  <Icon name="bell" className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 p-1 rounded-btn hover:bg-white/70 active:scale-95 transition-all"
                    aria-label="用户菜单"
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.nickname}`}
                      alt={user.nickname}
                      className="w-9 h-9 rounded-full bg-gray-200 border-2 border-transparent hover:border-gray-200 transition-all"
                    />
                    <svg aria-hidden="true" className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-card border border-[#E8E0D5] shadow-card py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.nickname}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                      <Link
                        to={`/profile/${user.id}`}
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      >
                        个人资料
                      </Link>
                      <Link
                        to="/profile/edit"
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      >
                        简历编辑
                      </Link>
                      {user.role === 'admin' && (
                        <>
                          <Link
                            to="/admin/settings"
                            onClick={() => setShowDropdown(false)}
                            className="block px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 active:bg-purple-100 transition-colors"
                          >
                            系统设置
                          </Link>
                          <Link
                            to="/admin/users"
                            onClick={() => setShowDropdown(false)}
                            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                          >
                            用户管理
                          </Link>
                        </>
                      )}
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                        >
                          退出登录
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[#8B7355] hover:text-[#4A3728] tag-capsule transition-all border border-[#E8E0D5] hover:bg-white">
                  登录
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-5">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;