import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Home() {
  const { user } = useAuth();
  const [featuredUsers, setFeaturedUsers] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, postsRes] = await Promise.all([
        axios.get('/api/users/list?limit=8'),
        axios.get('/api/posts/latest?limit=5')
      ]);
      setFeaturedUsers(usersRes.data.users || []);
      setLatestPosts(postsRes.data.posts || []);
    } catch (error) {
      console.error('Failed to fetch data');
    } finally {
      setIsLoaded(true);
    }
  };

  if (user) {
    return <Navigate to={`/profile/${user.id}`} replace />;
  }

  const cards = latestPosts.map((post, idx) => ({
    id: post._id,
    type: idx % 3 === 0 ? 'CREATION' : idx % 3 === 1 ? 'IDEA' : 'STUFF',
    title: post.content?.slice(0, 64) || 'A new idea is forming...',
    author: post.author?.nickname || 'guest',
    likes: post.likesCount || 0,
    comments: post.commentsCount || 0
  }));

  return (
    <div className="min-h-screen bg-[#fcfbf7] text-stone-900">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-3xl border border-stone-200 bg-white p-8 lg:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="inline-flex px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold mb-4">EXPLORE</p>
                <h1 className="text-4xl lg:text-5xl leading-tight font-black mb-4">Open a box of inspiration.</h1>
                <p className="text-stone-600 mb-8">从真实的人那里，发现真实的创作、灵感与闲置。每次访问，都有新惊喜。</p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/register" className="px-6 h-11 rounded-full bg-amber-200 hover:bg-amber-300 inline-flex items-center font-semibold transition">I&apos;m Feeling Lucky ✨</Link>
                  <Link to="/users" className="px-6 h-11 rounded-full border border-stone-200 inline-flex items-center hover:bg-stone-50 transition">Shuffle ↻</Link>
                </div>
              </div>
              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-8 text-center">
                <div className="text-7xl">📦</div>
                <p className="mt-4 text-stone-600">Creations · Ideas · Stuff</p>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-stone-200 bg-white p-6">
            <p className="text-xs font-semibold text-green-700 bg-green-100 inline-flex rounded-full px-3 py-1 mb-5">IDEA</p>
            <h2 className="text-3xl font-black leading-tight mb-4">What if we turn memories into shareable files?</h2>
            <p className="text-stone-600 text-sm mb-8">把想法、作品和物品都变成可连接、可交换、可发现的内容网络。</p>
            <div className="flex items-center justify-between text-sm text-stone-500">
              <span>♡ 18</span>
              <span>💬 7</span>
              <span>🔖</span>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex gap-2 text-sm">
              {['All', 'Creations', 'Ideas', 'Stuff'].map((tab) => (
                <button key={tab} className={`px-4 h-9 rounded-full border ${tab === 'All' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="text-sm text-stone-500">Grid · Feed</div>
          </div>

          {isLoaded ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {cards.map((card) => (
                <Link key={card.id} to="/register" className="rounded-2xl border border-stone-200 p-4 bg-[#fefefe] hover:-translate-y-0.5 hover:shadow-sm transition">
                  <p className="text-[10px] tracking-wide font-semibold text-sky-700 bg-sky-100 inline-flex px-2 py-1 rounded-full">{card.type}</p>
                  <h3 className="mt-3 font-bold leading-snug line-clamp-3 min-h-[66px]">{card.title}</h3>
                  <p className="mt-3 text-xs text-stone-500">@{card.author}</p>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-4 text-xs text-stone-500">
                    <span>♡ {card.likes}</span>
                    <span>💬 {card.comments}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="h-28 grid place-items-center text-stone-400">Loading...</div>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-stone-200 bg-white p-6">
            <h3 className="text-xl font-black mb-1">Create / Publish</h3>
            <p className="text-stone-500 text-sm mb-5">Choose a type and publish in seconds.</p>
            <div className="grid sm:grid-cols-3 gap-3 mb-5">
              {[
                ['Creations', '分享项目、作品、文章', '🖥️'],
                ['Ideas', '记录灵感、观点、脑洞', '💡'],
                ['Stuff', '交换、借用、赠送闲置', '📦']
              ].map(([name, desc, icon]) => (
                <div key={name} className="rounded-2xl border border-stone-200 p-4 bg-stone-50">
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className="font-semibold">{name}</p>
                  <p className="text-xs text-stone-500 mt-1">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Link to="/register" className="px-5 h-10 rounded-full bg-green-600 text-white inline-flex items-center text-sm font-semibold">Publish</Link>
              <Link to="/users" className="px-5 h-10 rounded-full border border-stone-200 inline-flex items-center text-sm">Explore Creators</Link>
            </div>
          </div>

          <aside className="rounded-3xl border border-stone-200 bg-white p-6">
            <h3 className="text-xl font-black mb-4">My Space</h3>
            <div className="space-y-3">
              {featuredUsers.slice(0, 4).map((u) => (
                <Link key={u._id} to={`/profile/${u._id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50">
                  <img src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.nickname}`} alt={u.nickname} className="w-10 h-10 rounded-full bg-stone-200" />
                  <div>
                    <p className="font-semibold text-sm">{u.nickname}</p>
                    <p className="text-xs text-stone-500 line-clamp-1">{u.bio || 'Collecting ideas and sharing things.'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

export default Home;
