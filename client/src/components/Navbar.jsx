import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
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
    if (!searchQuery.trim()) return;
    navigate(`/items?search=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <Link to="/" className="text-2xl font-black tracking-tight text-stone-900">Wowoo</Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {[
              { to: '/users', label: 'Explore' },
              { to: '/items', label: 'Creations' },
              { to: '/resources', label: 'Ideas' },
              { to: '/items', label: 'Stuff' }
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="px-3 py-1.5 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSearch} className="hidden sm:block flex-1 max-w-xl">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creations, ideas, items..."
              className="w-full h-10 pl-10 pr-4 rounded-full border border-stone-200 bg-stone-50/80 text-sm outline-none focus:ring-2 focus:ring-amber-200"
            />
            <span className="absolute left-3 top-2.5 text-stone-400">⌕</span>
          </div>
        </form>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/items/create" className="hidden sm:inline-flex items-center px-4 h-10 rounded-full bg-amber-200 hover:bg-amber-300 text-stone-900 text-sm font-semibold transition">
                + Post
              </Link>
              <Link to="/messages" className="relative h-10 w-10 rounded-full border border-stone-200 grid place-items-center text-stone-600 hover:text-stone-900 bg-white">
                ✉
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-xs grid place-items-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link to={`/profile/${user.id}`} className="h-10 w-10 rounded-full bg-stone-200 overflow-hidden">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.nickname}`}
                  alt={user.nickname}
                  className="w-full h-full object-cover"
                />
              </Link>
              <button onClick={handleLogout} className="text-sm text-stone-600 hover:text-red-600 px-2">退出</button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 text-sm text-stone-600 hover:text-stone-900">登录</Link>
              <Link to="/register" className="px-4 h-10 rounded-full bg-amber-200 hover:bg-amber-300 text-sm font-semibold text-stone-900 inline-flex items-center">注册</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
