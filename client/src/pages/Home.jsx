import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import NewsCorner from '../components/NewsCorner';
import LiquidText from '../components/LiquidText';
import Icon from '../components/Icon';

const shareOptions = [
  { label: '闲置交换', icon: 'cube', to: '/items/create' },
  { label: '项目作品', icon: 'folder', to: '/projects/create' },
  { label: '文章故事', icon: 'file', to: '/articles/create' },
  { label: '灵感碎片', icon: 'lightbulb', to: '/inspirations/create' },
  { label: '资源分享', icon: 'doc', to: '/resources/create' },
];

function Home() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(null);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const shareDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(e.target)) {
        setShowShareDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setItemsLoading(true);
    setItemsError(null);
    axios.get('/api/items')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.items || []);
        setItems(data);
        setItemsLoading(false);
      })
      .catch(err => {
        console.error('[Home] Failed to fetch items:', err);
        setItemsError('加载物品失败：' + (err.message || '网络错误'));
        setItemsLoading(false);
      });
  }, []);

  const getTypeStyle = (type) => {
    switch (type) {
      case 'creation':
        return { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', label: '创作' };
      case 'idea':
        return { bg: 'bg-[#FFF8E1]', text: 'text-[#F57F17]', label: '灵感' };
      case 'stuff':
        return { bg: 'bg-[#FBE9E7]', text: 'text-[#D84315]', label: '好物' };
      case 'article':
        return { bg: 'bg-[#E3F2FD]', text: 'text-[#1565C0]', label: '文章' };
      case 'project':
        return { bg: 'bg-[#F3E5F5]', text: 'text-[#7B1FA2]', label: '项目' };
      case 'achievement':
        return { bg: 'bg-[#E0F2F1]', text: 'text-[#00695C]', label: '成就' };
      default:
        return { bg: 'bg-[#F5F5F5]', text: 'text-[#616161]', label: '项目' };
    }
  };

  const getFilterLabel = (filter) => {
    switch (filter) {
      case 'all': return '全部';
      case 'creation': return '创作';
      case 'idea': return '灵感';
      case 'stuff': return '好物';
      default: return filter;
    }
  };

  const filteredContent = activeFilter === 'all' 
    ? items 
    : items.filter(item => item.type === activeFilter);

  const filters = ['all', 'creation', 'idea', 'stuff'];

  return (
    <div className="min-h-screen pt-20 fade-in" style={{ backgroundColor: '#F7F5F2' }}>
      <div className="relative z-10">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-16 relative overflow-hidden">
        <LiquidText />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-3xl lg:text-6xl font-semibold text-[#222] leading-relaxed mb-0">
            <span className="liquid-text">淀于心者为种，破于世者为木</span>
          </h1>
          <p className="text-xl text-[#777] max-w-xl mx-auto mt-10 leading-relaxed">
            你的随手分享，或许正在照亮他人的夜空
          </p>
          <p className="text-base text-[#999] mb-10 max-w-md mx-auto">
            因物而见，因悟而明！
          </p>
          <div className="flex justify-center">
            <div className="relative" ref={shareDropdownRef}>
              <button
                onClick={() => setShowShareDropdown(!showShareDropdown)}
                className="btn-primary text-base"
              >
                我要分享 <Icon name="sparkles" className="w-4 h-4 ml-1" />
              </button>
              {showShareDropdown && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-44 bg-white rounded-2xl border border-[#EBE7E0] shadow-lg py-2 z-50">
                  {shareOptions.map(opt => (
                    <Link
                      key={opt.label}
                      to={opt.to}
                      onClick={() => setShowShareDropdown(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-[#555] hover:text-[#222] hover:bg-[#F7F5F2] transition-colors"
                    >
                      <Icon name={opt.icon} className="w-4 h-4 text-[#999]" />
                      <span>{opt.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[#ccc] animate-bounce">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* 资讯好望角 */}
      <NewsCorner />

      {/* Content Section */}
      <section className="px-4" style={{ paddingTop: '40px', paddingBottom: '140px' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="heading-xl mb-4">继续探索</h2>
          <p className="section-desc mb-12">发现更多来自社区的好物、创作与灵感</p>

          {/* Filter + View Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10">
            <div className="flex items-center gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`tag transition-all ${
                    activeFilter === filter
                      ? 'bg-[#222] text-white'
                      : 'bg-white text-[#777] hover:bg-[#222] hover:text-white'
                  }`}
                >
                  {getFilterLabel(filter)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-white rounded-full p-1 border border-[#EBE7E0]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#222] text-white'
                    : 'text-[#bbb] hover:text-[#555]'
                }`}
                aria-label="网格视图"
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#222] text-white'
                    : 'text-[#bbb] hover:text-[#555]'
                }`}
                aria-label="列表视图"
              >
                <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          {itemsLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#ccc] border-t-[#222] mx-auto mb-4"></div>
              <p className="text-[#999]">正在加载...</p>
            </div>
          ) : itemsError ? (
            <div className="text-center py-20">
              <p className="text-[#999] mb-4">{itemsError}</p>
              <button
                onClick={() => { setItemsLoading(true); setItemsError(null); axios.get('/api/items').then(r => { setItems(Array.isArray(r.data) ? r.data : (r.data.items || [])); setItemsLoading(false); }).catch(e => { setItemsError('重试失败'); setItemsLoading(false); }); }}
                className="btn-primary text-sm"
              >
                点击重试
              </button>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#999] mb-4">还没有人发布物品，来做第一个吧！</p>
              <Link to="/items/create" className="btn-primary text-sm inline-flex items-center gap-1">立即发布 →</Link>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map((item) => {
                const typeStyle = getTypeStyle(item.type);
                return (
                  <Link
                    key={item._id}
                    to={`/items/${item._id}`}
                    className="card overflow-hidden group"
                  >
                    {item.images && item.images[0] ? (
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          width={640}
                          height={480}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-[#F0EDE8] flex items-center justify-center">
                        <span className="text-4xl">
                          {item.type === 'idea' ? '💭' : item.type === 'creation' ? '🎨' : '📦'}
                        </span>
                      </div>
                    )}
                    <div className="p-6">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-3 ${typeStyle.bg} ${typeStyle.text}`}>
                        {typeStyle.label}
                      </span>
                      <h3 className="text-lg font-semibold text-[#222] mb-2 leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-sm text-[#999] line-clamp-2 mb-4 leading-relaxed">
                        {item.remark}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.owner?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.owner?.nickname}`}
                            alt={item.owner?.nickname}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full bg-gray-200"
                          />
                          <span className="text-sm text-[#999]">{item.owner?.nickname || item.owner?.username}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#ccc]">
                          <span className="flex items-center gap-1">
                            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {item.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {item.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContent.map((item) => {
                const typeStyle = getTypeStyle(item.type);
                return (
                  <Link
                    key={item._id}
                    to={`/items/${item._id}`}
                    className="card p-5 group flex gap-5"
                  >
                    {item.images && item.images[0] ? (
                      <div className="w-32 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          width={128}
                          height={96}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-24 rounded-2xl bg-[#F0EDE8] flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl">
                          {item.type === 'idea' ? '💭' : item.type === 'creation' ? '🎨' : '📦'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mb-2 ${typeStyle.bg} ${typeStyle.text}`}>
                        {typeStyle.label}
                      </span>
                      <h3 className="text-lg font-semibold text-[#222] mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-[#999] line-clamp-2 mb-3 leading-relaxed">
                        {item.remark}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={item.owner?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${item.owner?.nickname}`}
                            alt={item.owner?.nickname}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded-full bg-gray-200"
                          />
                          <span className="text-sm text-[#999]">{item.owner?.nickname || item.owner?.username}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#ccc]">
                          <span className="flex items-center gap-1">
                            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {item.likes?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {item.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center" style={{ padding: '180px 20px' }}>
        <h2 className="heading-xl mb-5">你的故事也值得被看见</h2>
        <p className="section-desc max-w-xl mx-auto">
          分享一件物品，以及它背后的故事。或许它会点亮另一个陌生人的世界。
        </p>
        <Link to="/items/create" className="btn-accent inline-flex mt-10">
          立即分享
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center text-[#999] text-sm" style={{ padding: '60px 0' }}>
        <p className="mb-1">&copy; 2026 我有物 · WYW</p>
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-[#555] transition-colors">
          鲁ICP备2026026388号
        </a>
      </footer>
      </div>
    </div>
  );
}

export default Home;
