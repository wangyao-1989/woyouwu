import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CATEGORY_LABELS = {
  tech: '技术',
  design: '设计',
  creative: '创意',
  literature: '文学',
  life: '生活',
  career: '职场',
  science: '科学',
  art: '艺术',
  custom: '定制',
};

const CATEGORY_COLORS = {
  tech: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  design: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  creative: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  literature: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  life: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  career: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  science: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  art: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  custom: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

function NewsCorner() {
  const { user } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [myCategories, setMyCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [customKeywords, setCustomKeywords] = useState([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [hasPreference, setHasPreference] = useState(false);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}小时前`;
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${month}月${day}日`;
  };

  useEffect(() => {
    fetchNews();
  }, [user]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      if (user) {
        const res = await axios.get('/api/news/my');
        setNews(res.data.news || []);
        setMyCategories(res.data.categories || []);
        setCustomKeywords(res.data.customKeywords || []);
        setHasPreference(res.data.hasPreference || false);
      } else {
        const res = await axios.get('/api/news/hot');
        setNews(res.data.news || []);
        setMyCategories([]);
        setCustomKeywords([]);
        setHasPreference(false);
      }
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const openPreferenceModal = async () => {
    setShowPrefModal(true);
    try {
      const res = await axios.get('/api/news/preferences');
      setAllCategories(res.data.allCategories || []);
    } catch {
      setAllCategories(
        Object.keys(CATEGORY_LABELS)
          .filter(k => k !== 'custom')
          .map(key => ({ value: key, label: CATEGORY_LABELS[key] }))
      );
    }
  };

  const toggleCategory = (value) => {
    setMyCategories(prev =>
      prev.includes(value)
        ? prev.filter(c => c !== value)
        : [...prev, value]
    );
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (!kw) return;
    if (kw.length > 30) return;
    if (customKeywords.length >= 10) return;
    if (customKeywords.includes(kw)) return;
    setCustomKeywords(prev => [...prev, kw]);
    setKeywordInput('');
  };

  const removeKeyword = (index) => {
    setCustomKeywords(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const res = await axios.put('/api/news/preferences', {
        categories: myCategories,
        customKeywords,
      });
      setMyCategories(res.data.categories || []);
      setCustomKeywords(res.data.customKeywords || []);
      setHasPreference((res.data.categories || []).length > 0 || (res.data.customKeywords || []).length > 0);
      setShowPrefModal(false);
      await fetchNews();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (catValue) => {
    const updatedCategories = myCategories.filter(c => c !== catValue);
    setMyCategories(updatedCategories);
    setSaving(true);
    try {
      const res = await axios.put('/api/news/preferences', {
        categories: updatedCategories,
        customKeywords,
      });
      setMyCategories(res.data.categories || []);
      setCustomKeywords(res.data.customKeywords || []);
      setHasPreference((res.data.categories || []).length > 0 || (res.data.customKeywords || []).length > 0);
      await fetchNews();
    } catch {
      setMyCategories(prev => [...prev, catValue]);
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomKeyword = async (index) => {
    const updatedKeywords = customKeywords.filter((_, i) => i !== index);
    setCustomKeywords(updatedKeywords);
    setSaving(true);
    try {
      const res = await axios.put('/api/news/preferences', {
        categories: myCategories,
        customKeywords: updatedKeywords,
      });
      setMyCategories(res.data.categories || []);
      setCustomKeywords(res.data.customKeywords || []);
      setHasPreference((res.data.categories || []).length > 0 || (res.data.customKeywords || []).length > 0);
      await fetchNews();
    } catch {
      setCustomKeywords(prev => {
        const restored = [...prev];
        restored.splice(index, 0, customKeywords[index]);
        return restored;
      });
    } finally {
      setSaving(false);
    }
  };

  const headerSection = (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900 wowoo-heading">
          资讯好望角
        </h2>
        <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          🤖 AI 每日精选
        </span>
      </div>
      {user ? (
        <button
          onClick={openPreferenceModal}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-500 bg-primary-50 rounded-xl hover:bg-primary-100 transition-all"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          定制我的资讯
        </button>
      ) : (
        <Link
          to="/login"
          className="text-sm text-gray-400 hover:text-primary-500 transition"
        >
          登录后定制专属资讯 →
        </Link>
      )}
    </div>
  );

  const preferenceBar = user && hasPreference && (
    <div className="mb-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400 flex-shrink-0">当前偏好：</span>
        {myCategories.map(cat => {
          const cs = CATEGORY_COLORS[cat] || CATEGORY_COLORS.life;
          return (
            <span
              key={`cat-${cat}`}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer transition-all ${cs.bg} ${cs.text} border ${cs.border} hover:opacity-70`}
              onClick={() => deleteCategory(cat)}
              title="点击删除此偏好"
            >
              {CATEGORY_LABELS[cat] || cat}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          );
        })}
        {customKeywords.map((kw, index) => (
          <span
            key={`kw-${index}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer bg-orange-50 text-orange-700 border border-orange-200 hover:opacity-70 transition-all"
            onClick={() => deleteCustomKeyword(index)}
            title="点击删除此关键词"
          >
            {kw}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        ))}
        <button
          onClick={openPreferenceModal}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 bg-white rounded-full border border-gray-200 hover:text-primary-500 hover:border-primary-200 transition-all"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
          添加
        </button>
        {saving && (
          <span className="text-xs text-gray-400 ml-1 animate-pulse">更新中...</span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          {headerSection}
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </section>
    );
  }

  const hasNews = news && news.length > 0;

  return (
    <section className="px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        {headerSection}
        {preferenceBar}

        {hasNews ? (
          <div className="bg-white rounded-2xl card-ring overflow-hidden">
            {news.slice(0, 10).map((item, index) => {
              const colorStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.life;
              const isExpanded = expandedDetail === (item._id || index);

              return (
                <div
                  key={item._id || index}
                  className={`transition-all duration-300 ${index > 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <button
                    onClick={() => setExpandedDetail(isExpanded ? null : (item._id || index))}
                    className="w-full text-left px-5 py-3.5 hover:bg-gray-50/60 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-gray-300 font-mono min-w-[1.25rem] pt-0.5">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full flex-shrink-0 mt-0.5 ${colorStyle.bg} ${colorStyle.text}`}>
                        {CATEGORY_LABELS[item.category] || '综合'}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`text-sm leading-relaxed transition-colors ${isExpanded ? 'text-primary-600 font-medium' : 'text-gray-800 group-hover:text-primary-500'}`}>
                          {item.summary || item.title}
                        </span>
                      </span>
                      <span className="text-xs text-gray-300 flex-shrink-0 mt-0.5 whitespace-nowrap">
                        AI生成 · {formatTime(item.publishDate)}
                      </span>
                      <svg
                        className={`w-4 h-4 flex-shrink-0 mt-1 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary-500' : 'text-gray-300 group-hover:text-gray-400'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && item.detail && (
                    <div className="px-5 pb-5">
                      <div className="ml-11 bg-gradient-to-br from-gray-50 to-primary-50/30 rounded-xl p-5 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-base font-bold text-gray-900">{item.title}</h4>
                          <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">AI生成 · {formatTime(item.publishDate)}</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                          {item.detail}
                        </p>
                        {item.relatedKeywords && item.relatedKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-gray-200/60">
                            {item.relatedKeywords.map((kw, ki) => (
                              <span key={ki} className="text-[11px] text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-primary-50/30 via-amber-50/20 to-teal-50/30 rounded-2xl border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-4">📡</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无最新资讯</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              当前未能获取到最新资讯数据，请稍后再来查看。
              {!user && '登录后还可以定制你感兴趣的分类和关键词，获取专属个性化推荐。'}
            </p>
            {!user && (
              <Link
                to="/login"
                className="inline-block mt-4 px-6 py-2 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition"
              >
                登录探索更多 →
              </Link>
            )}
          </div>
        )}
      </div>

      {showPrefModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPrefModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 z-10 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">定制我的资讯</h3>
              <button
                onClick={() => setShowPrefModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition"
              >
                <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              选择你感兴趣的分类，AI 将每天为你推送相关的最新资讯。
            </p>

            <div className="mb-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">预设分类</h4>
              <div className="flex flex-wrap gap-2">
                {allCategories.map(cat => {
                  const selected = myCategories.includes(cat.value);
                  const colorStyle = CATEGORY_COLORS[cat.value] || CATEGORY_COLORS.life;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                        selected
                          ? `${colorStyle.bg} ${colorStyle.text} border-2 ${colorStyle.border}`
                          : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                自定义关键词
                <span className="text-xs text-gray-400 ml-1">（AI 将按你的关键词收集资讯）</span>
              </h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {customKeywords.map((kw, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium bg-orange-50 text-orange-700 border border-orange-200 rounded-xl"
                  >
                    {kw}
                    <button
                      onClick={() => removeKeyword(index)}
                      className="text-orange-400 hover:text-orange-600"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  placeholder="例如：贵州茅台、人工智能、新能源..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200 transition"
                  maxLength={30}
                />
                <button
                  onClick={addKeyword}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition"
                >
                  添加
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">支持股票名称、行业、技术名词等，最多 10 个关键词</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPrefModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                取消
              </button>
              <button
                onClick={savePreferences}
                disabled={saving}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存偏好'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default NewsCorner;
