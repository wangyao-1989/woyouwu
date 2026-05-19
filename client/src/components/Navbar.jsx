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
    <nav className="bg-white border-b border-gray-100 sticky top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=WW%20logo%20lettermark%2C%20retro%20style%2C%20teal%20and%20orange%20colors%2C%20bold%20black%20outline%2C%20white%20highlight%2C%20clean%20white%20background&image_size=square" 
                alt="Wowoo" 
                className="h-8 w-auto"
              />
            </Link>
            <div className="hidden md:flex ml-10 space-x-1">
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/') 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Explore
              </Link>
              <Link 
                to="/items" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/items') 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Creations
              </Link>
              <Link 
                to="/resources" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/resources') 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                Ideas
              </Link>
              <Link 
                to="/users" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive('/users') 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
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
                  className="w-64 pl-10 pr-4 py-2 bg-gray-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {user ? (
              <>
                {/* Create button */}
                <Link 
                  to="/items/create" 
                  className="inline-flex items-center px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-all shadow-wowoo hover:shadow-wowoo-lg"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Post
                </Link>

                {/* Messages */}
                <Link to="/messages" className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile */}
                <Link to={`/profile/${user.id}`} className="flex items-center space-x-2">
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.nickname}`}
                    alt={user.nickname}
                    className="w-9 h-9 rounded-full bg-gray-200 border-2 border-transparent hover:border-gray-200 transition-all"
                  />
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all">
                  Log in
                </Link>
                <Link to="/register" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all shadow-wowoo">
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
