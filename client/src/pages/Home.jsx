import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredUsers, setFeaturedUsers] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, postsRes] = await Promise.all([
        axios.get('/api/users/list?limit=6'),
        axios.get('/api/posts/latest?limit=6')
      ]);
      setFeaturedUsers(usersRes.data.users);
      setLatestPosts(postsRes.data.posts || []);
    } catch (error) {
      console.error('Failed to fetch data');
    } finally {
      setIsLoaded(true);
    }
  };

  if (user) {
    navigate(`/profile/${user.id}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 via-transparent to-secondary-600/10"></div>
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary-400/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            <span className="text-sm text-gray-600">欢迎来到 WYW</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 mb-6">
            在这里，<span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">分享你的一切</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            你的简介、你的技能、你的成果、你的思想、你的闲置物品
            <br />
            让世界看到独一无二的你
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-secondary-700 transition shadow-lg shadow-primary-500/25"
            >
              立即加入
            </Link>
            <Link
              to="/users"
              className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition shadow-md border border-gray-100"
            >
              探索用户
            </Link>
          </div>
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary-600">100+</div>
              <div className="text-sm text-gray-500 mt-1">活跃用户</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-secondary-600">500+</div>
              <div className="text-sm text-gray-500 mt-1">分享内容</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-green-600">300+</div>
              <div className="text-sm text-gray-500 mt-1">物品分享</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-purple-600">800+</div>
              <div className="text-sm text-gray-500 mt-1">资源共享</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">发现有趣的人</h2>
            <p className="text-gray-600">这里聚集了各种各样有趣的灵魂</p>
          </div>
          
          {isLoaded ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {featuredUsers.map((user) => (
                <Link
                  key={user._id}
                  to={`/profile/${user._id}`}
                  className="group bg-gray-50 rounded-xl p-4 hover:bg-white hover:shadow-lg transition"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.nickname}`}
                    alt={user.nickname}
                    className="w-16 h-16 rounded-full mx-auto mb-3 bg-gray-200 group-hover:scale-110 transition"
                  />
                  <h3 className="font-medium text-gray-800 text-center truncate">{user.nickname}</h3>
                  {user.bio && (
                    <p className="text-xs text-gray-500 text-center mt-1 line-clamp-2">{user.bio}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">最新动态</h2>
            <p className="text-gray-600">看看大家都在分享什么</p>
          </div>
          
          {isLoaded ? (
            <div className="space-y-4">
              {latestPosts.length > 0 ? (
                latestPosts.map((post) => (
                  <div
                    key={post._id}
                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={post.author?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author?.nickname}`}
                        alt={post.author?.nickname}
                        className="w-12 h-12 rounded-full bg-gray-200"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Link to={`/profile/${post.author?._id}`} className="font-medium text-gray-800 hover:text-primary-600">
                            {post.author?.nickname}
                          </Link>
                          <span className="text-xs text-gray-400">· {new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{post.content}</p>
                        {post.image && (
                          <img src={post.image} alt="" className="mt-4 max-w-full rounded-lg" />
                        )}
                        <div className="flex items-center gap-6 mt-4 text-sm text-gray-500">
                          <button className="hover:text-primary-600 transition">
                            <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {post.commentsCount || 0}
                          </button>
                          <button className="hover:text-red-600 transition">
                            <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {post.likesCount || 0}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500">暂无动态，成为第一个分享的人吧！</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">为什么选择 WYW？</h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">简单易用</h3>
              <p className="text-gray-600">无需复杂设置，一键发布你的内容</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">安全可靠</h3>
              <p className="text-gray-600">保护你的隐私，安全放心使用</p>
            </div>
            <div className="p-6">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">功能丰富</h3>
              <p className="text-gray-600">支持文字、图片、资源等多种分享形式</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">WYW</h3>
              <p className="text-sm">在这里，分享你的一切</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">快速链接</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/users" className="hover:text-white transition">发现用户</Link></li>
                <li><Link to="/items" className="hover:text-white transition">物品分享</Link></li>
                <li><Link to="/resources" className="hover:text-white transition">资源共享</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">帮助</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">使用指南</a></li>
                <li><a href="#" className="hover:text-white transition">常见问题</a></li>
                <li><a href="#" className="hover:text-white transition">联系我们</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">关注我们</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 WYW. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
