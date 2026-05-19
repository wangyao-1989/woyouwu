import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

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
    <nav className="bg-white border-3 border-[#2d2d2d] sticky top-0 left-0 right-0 z-50" style={{ borderRadius: '0 0 20px 20px', boxShadow: '0 4px 0px rgba(45,45,45,0.8), 0 8px 0px rgba(45,45,45,0.1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <img 
                src={require('../assets/logo.svg').default} 
                alt="Wowoo" 
                className="h-10 w-auto transition-transform group-hover:rotate-3"
              />
              <span className="wowoo-heading text-3xl font-bold text-[#2d2d2d] sketch-text">Wowoo</span>
            </Link>
            <div className="hidden md:flex ml-10 space-x-2">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all hand-button ${
                  isActive('/') 
                    ? 'bg-primary-300 text-[#2d2d2d]' 
                    : 'bg-white text-[#2d2d2d] hover:bg-primary-100'
                }`}
                style={{ borderWidth: '2px' }}
              >
                Explore
              </Link>
              <Link 
                to="/items" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all hand-button ${
                  isActive('/items') 
                    ? 'bg-primary-300 text-[#2d2d2d]' 
                    : 'bg-white text-[#2d2d2d] hover:bg-primary-100'
                }`}
                style={{ borderWidth: '2px' }}
              >
                Creations
              </Link>
              <Link 
                to="/resources" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all hand-button ${
                  isActive('/resources') 
                    ? 'bg-primary-300 text-[#2d2d2d]' 
                    : 'bg-white text-[#2d2d2d] hover:bg-primary-100'
                }`}
                style={{ borderWidth: '2px' }}
              >
                Ideas
              </Link>
              <Link 
                to="/users" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all hand-button ${
                  isActive('/users') 
                    ? 'bg-primary-300 text-[#2d2d2d]' 
                    : 'bg-white text-[#2d2d2d] hover:bg-primary-100'
                }`}
                style={{ borderWidth: '2px' }}
              >
                Stuff
              </Link>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden sm:block">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search creations, ideas, people..."
                  className="w-64 pl-10 pr-4 py-2 bg-[#f5f3ed] border-2 border-[#2d2d2d] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all"
                  style={{ boxShadow: '2px 2px 0px rgba(45,45,45,0.8)' }}
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-[#8b7355]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {user ? (
              <>
                {/* Create button */}
                <Link 
                  to="/items/create" 
                  className="inline-flex items-center px-5 py-2.5 bg-primary-400 text-[#2d2d2d] text-sm font-bold rounded-xl hover:bg-primary-300 transition-all hand-button"
                  style={{ borderWidth: '2px' }}
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post
                </Link>

                {/* Messages */}
                <Link to="/messages" className="relative p-2 text-[#2d2d2d] hover:text-primary-500 hover:bg-primary-50 rounded-xl transition-all" style={{ border: '2px solid transparent', borderColor: 'transparent' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full border-2 border-[#2d2d2d]" style={{ boxShadow: '1px 1px 0px rgba(45,45,45,0.8)' }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile */}
                <Link to={`/profile/${user.id}`} className="flex items-center space-x-2 p-1 rounded-xl hover:bg-primary-50 transition-all">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.nickname}`}
                    alt={user.nickname}
                    className="w-10 h-10 rounded-full bg-[#f5f3ed] border-3 border-[#2d2d2d] hover:border-primary-400 transition-all"
                    style={{ boxShadow: '2px 2px 0px rgba(45,45,45,0.8)' }}
                  />
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-[#2d2d2d] hover:text-primary-600 font-medium rounded-xl hover:bg-primary-50 transition-all hand-button" style={{ borderWidth: '2px', backgroundColor: 'transparent' }}>
                  Log in
                </Link>
                <Link to="/register" className="px-5 py-2.5 bg-[#2d2d2d] text-white font-bold rounded-xl hover:bg-[#4a4a4a] transition-all hand-button" style={{ borderWidth: '2px' }}>
                  Sign up
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