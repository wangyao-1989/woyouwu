import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// 用户画像存储 key
const PROFILE_KEY = 'woyouwu-scraper-profile';

export default function ScraperTool() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('keyword');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState('');

  // 用户画像
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || { role: '', interests: '' }; }
    catch { return { role: '', interests: '' }; }
  });
  const [showProfile, setShowProfile] = useState(false);

  const saveProfile = (p) => {
    setProfile(p);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  };

  // 结果
  const [result, setResult] = useState(null);
  const [customNotes, setCustomNotes] = useState('');

  // 已保存
  const [viewSaved, setViewSaved] = useState(false);
  const [savedList, setSavedList] = useState([]);
  const [savedDetail, setSavedDetail] = useState(null);

  const token = localStorage.getItem('token');

  const loadSavedList = async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/scraper/saved', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedList(res.data.list || []);
    } catch (e) {}
  };

  useEffect(() => {
    if (viewSaved) loadSavedList();
  }, [viewSaved]);

  // ====== 提交 ======
  const handleSubmit = async () => {
    if (!inputValue.trim()) {
      setError(mode === 'url' ? '请输入网址' : '请输入你想了解的主题');
      return;
    }
    if (mode === 'url' && !/^https?:\/\/.+/.test(inputValue.trim())) {
      setError('请输入以 http:// 或 https:// 开头的网址');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);
    setViewSaved(false);
    setCustomNotes('');

    if (mode === 'url') {
      setLoadingStep('正在爬取网页内容...');
    } else if (mode === 'briefing') {
      setLoadingStep('正在搜索新闻 + 社交讨论...');
    } else {
      setLoadingStep('正在分析你的问题...');
    }

    try {
      let payload, endpoint;
      if (mode === 'url') {
        endpoint = '/api/scraper/fetch-url';
        payload = { url: inputValue.trim() };
      } else if (mode === 'briefing') {
        endpoint = '/api/scraper/briefing';
        payload = { topic: inputValue.trim() };
        setTimeout(() => setLoadingStep('正在筛选最重要的新闻...'), 3000);
        setTimeout(() => setLoadingStep('正在爬取详情 + 生成简报...'), 10000);
      } else {
        endpoint = '/api/scraper/search-keyword';
        // 构建上下文描述
        let context = inputValue.trim();
        if (profile.role) {
          context = `[用户身份：${profile.role}，关注领域：${profile.interests || '通用'}] ${context}`;
        }
        payload = { keyword: context };
      }

      if (mode === 'keyword') {
        setTimeout(() => setLoadingStep('正在多源搜索（百度 + Bing）...'), 2000);
        setTimeout(() => setLoadingStep('正在筛选最有价值的信息源...'), 8000);
        setTimeout(() => setLoadingStep('正在爬取网页并综合分析...'), 16000);
      }

      const res = await axios.post(endpoint, payload);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => { setResult(null); setCustomNotes(''); setError(''); };
  const handleContinueScrape = () => { setResult(null); setCustomNotes(''); setError(''); };

  // ====== 保存 ======
  const handleSave = async () => {
    if (!token) { setError('请先登录后再保存'); return; }
    setLoading(true); setError('');
    try {
      await axios.post('/api/scraper/save', {
        type: result.type || mode,
        source: result.source,
        title: result.source,
        rawContent: result.rawContent,
        report: result.report || '',
        aiSummary: result.aiSummary || '',
        refinedTerms: result.refined?.terms || [],
        customNotes,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setResult(null); setCustomNotes(''); setViewSaved(true);
    } catch (err) {
      setError(err.response?.data?.message || '保存失败');
    } finally { setLoading(false); }
  };

  const handleViewDetail = async (id) => {
    if (!token) return;
    try {
      const res = await axios.get(`/api/scraper/saved/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedDetail(res.data.item);
    } catch (e) { setError('加载详情失败'); }
  };

  const handleDelete = async (id) => {
    if (!token) return;
    try {
      await axios.delete(`/api/scraper/saved/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadSavedList();
      if (savedDetail?._id === id) setSavedDetail(null);
    } catch (e) { setError('删除失败'); }
  };

  const handleUpdateNotes = async () => {
    if (!token || !savedDetail) return;
    try {
      const res = await axios.put(`/api/scraper/saved/${savedDetail._id}`, {
        customNotes: savedDetail.customNotes,
        title: savedDetail.title,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSavedDetail(res.data.item);
      loadSavedList();
    } catch (e) { setError('更新失败'); }
  };

  // 将 Markdown 报告渲染为 HTML（简单版，只处理标题、列表、加粗、引用、链接）
  const renderMarkdown = (md) => {
    if (!md) return '';
    return md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-gray-800 mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-gray-800 mt-5 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mt-5 mb-3">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\[来源(\d+)\]/g, '<span class="text-xs bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-medium">来源$1</span>')
      .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="flex gap-2 mt-1"><span class="text-amber-500 font-medium flex-shrink-0">$1.</span><span>$2</span></div>')
      .replace(/^-\s+(.+)$/gm, '<div class="flex gap-2 mt-1 ml-2"><span class="text-gray-400 flex-shrink-0">•</span><span>$1</span></div>')
      .replace(/^>\s+(.+)$/gm, '<div class="border-l-3 border-amber-300 pl-3 py-1 my-2 text-gray-500 text-sm italic">$1</div>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-amber-600 hover:text-amber-800 underline">$1</a>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };

  // ====== 渲染 ======
  return (
    <div className="min-h-screen pt-20 px-4 pb-20 bg-[#F5F0E8]">
      <div className="max-w-3xl mx-auto">
        {/* 顶部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-2xl hover:opacity-70" title="返回首页">←</button>
            <h1 className="text-2xl font-bold text-gray-800">🔬 果果研究助手</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setViewSaved(false); setResult(null); setSavedDetail(null); setError(''); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!viewSaved ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >新建研究</button>
            <button
              onClick={async () => { setViewSaved(true); setResult(null); setSavedDetail(null); await loadSavedList(); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewSaved ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >已保存 ({savedList.length})</button>
          </div>
        </div>

        {/* 错误 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <span>⚠️</span><span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ====== 输入区 ====== */}
        {!result && !viewSaved && !loading && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setMode('keyword'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${mode === 'keyword' ? 'bg-amber-50 text-amber-800 border-2 border-amber-300' : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'}`}
              >🔬 AI 研究</button>
              <button
                onClick={() => { setMode('briefing'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${mode === 'briefing' ? 'bg-amber-50 text-amber-800 border-2 border-amber-300' : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'}`}
              >📋 行业简报</button>
              <button
                onClick={() => { setMode('url'); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${mode === 'url' ? 'bg-amber-50 text-amber-800 border-2 border-amber-300' : 'bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100'}`}
              >🔗 爬取网址</button>
            </div>

            {/* 用户画像（仅关键词模式） */}
            {mode !== 'url' && (
              <div className="mb-4">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="text-xs text-gray-400 hover:text-amber-600 flex items-center gap-1 mb-2"
                >
                  👤 {profile.role ? `身份：${profile.role}` : '设置你的身份（让AI更懂你）'} {showProfile ? '▲' : '▼'}
                </button>
                {showProfile && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      value={profile.role || ''}
                      onChange={(e) => saveProfile({ ...profile, role: e.target.value })}
                      placeholder="你的岗位/角色，如：产品经理"
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-100 outline-none text-sm text-gray-700"
                    />
                    <input
                      type="text"
                      value={profile.interests || ''}
                      onChange={(e) => saveProfile({ ...profile, interests: e.target.value })}
                      placeholder="关注领域，如：AI 产品、新能源汽车"
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-100 outline-none text-sm text-gray-700"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                {mode === 'url' ? '输入网页地址' : mode === 'briefing' ? '输入行业或主题，生成每日简报' : '告诉果果你想了解什么'}
              </label>
              <input
                type={mode === 'url' ? 'url' : 'text'}
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder={
                  mode === 'url'
                    ? '例如 https://example.com...'
                    : mode === 'briefing'
                      ? '如：汽车行业、AI 芯片、新能源政策...'
                      : profile.role
                        ? `作为${profile.role}，你想了解什么？如：新能源汽车2026趋势...`
                        : '直接说你想了解的主题，AI 会帮你提炼搜索方向...'
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-gray-700 transition-all"
              />
              <p className="mt-2 text-xs text-gray-400">
                {mode === 'url'
                  ? '直接爬取该网页的文字内容（自动过滤导航、广告）'
                  : mode === 'briefing'
                    ? '新闻搜索（百度+Bing）+ 社交讨论（知乎）→ 三层简报（事实/推测/舆情）'
                    : 'AI 提炼搜索方向 → 多源搜索（百度+Bing）→ 筛选最佳信息 → 综合分析报告'}
              </p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
            >{mode === 'url' ? '🕷️ 开始爬取' : mode === 'briefing' ? '📋 生成简报' : '🔬 开始研究'}</button>
          </div>
        )}

        {/* ====== 加载中 ====== */}
        {loading && (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-amber-100 text-center">
            <div className="animate-bounce mb-4 text-5xl">🔬</div>
            <p className="text-gray-600 text-lg mb-2">果果正在研究中...</p>
            <p className="text-gray-400 text-sm">{loadingStep}</p>
            <div className="mt-6 flex justify-center gap-1">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}

        {/* ====== 结果展示 ====== */}
        {result && !loading && (
          <div className="space-y-4">
            {/* 来源 + 提炼词 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <span>{result.type === 'url' ? '🔗 爬取网址' : result.type === 'briefing' ? '📋 行业简报' : '🔬 研究主题'}</span>
              </div>
              <p className="text-gray-800 font-medium break-all mb-2">{result.source}</p>
              {result.refined?.terms?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="text-xs text-gray-400">AI 提炼：</span>
                  {result.refined.terms.map((t, i) => (
                    <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
              {result.refined?.suggestions && (
                <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2">{result.refined.suggestions}</p>
              )}
            </div>

            {/* AI 综合报告 — 核心展示 */}
            {result.report && (
              <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-2xl p-6 shadow-sm border border-indigo-100">
                <h3 className="text-sm font-semibold text-indigo-700 mb-4 flex items-center gap-2">
                  🤖 AI 综合分析报告
                  <span className="text-[10px] bg-indigo-200 text-indigo-600 px-1.5 py-0.5 rounded">研究报告</span>
                </h3>
                <div
                  className="text-sm text-gray-700 leading-relaxed prose-like"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(result.report) }}
                />
              </div>
            )}

            {/* URL 模式的 AI 摘要 */}
            {result.aiSummary && !result.report && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 shadow-sm border border-indigo-100">
                <h3 className="text-sm font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                  🤖 AI 理解摘要
                  <span className="text-[10px] bg-indigo-200 text-indigo-600 px-1.5 py-0.5 rounded">AI生成</span>
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.aiSummary}</p>
              </div>
            )}

            {/* 搜索结果（可折叠） */}
            {result.searchResults?.length > 0 && (
              <details className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100" open>
                <summary className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-amber-600">
                  📋 搜索结果参考（{result.searchResults.length}条，选中 {result.selectedUrls?.length || 0} 条）
                </summary>
                <div className="mt-3 space-y-1">
                  {result.searchResults.map((r, i) => {
                    const isSelected = result.selectedUrls?.some(s => s.url === r.url);
                    return (
                      <a key={i} href={r.url} target="_blank" rel="noreferrer"
                        className={`block text-xs hover:underline truncate py-0.5 ${isSelected ? 'text-amber-600 font-medium' : 'text-blue-500'}`}>
                        {isSelected ? '✅' : '  '} [{r.source?.toUpperCase?.() || '?'}] {r.title}
                      </a>
                    );
                  })}
                </div>
              </details>
            )}

            {/* 原始内容（可折叠） */}
            {result.rawContent && (
              <details className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
                <summary className="text-sm font-semibold text-gray-500 cursor-pointer hover:text-amber-600">
                  📄 原始爬取内容（{result.rawContent.length} 字符）
                </summary>
                <div className="mt-3 p-4 bg-gray-50 rounded-xl max-h-[50vh] overflow-y-auto">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                    {result.rawContent.substring(0, 15000)}
                    {result.rawContent.length > 15000 && '\n\n...（内容过长已截断）'}
                  </pre>
                </div>
              </details>
            )}

            {/* 个人笔记 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">✏️ 个人笔记</h3>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="写下你的想法、补充内容或备忘..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm text-gray-700 resize-none transition-all"
              />
            </div>

            {/* 操作 */}
            <div className="flex gap-3">
              <button onClick={handleRetry} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-medium transition-colors">
                🔄 不满意，重新研究
              </button>
              <button onClick={handleContinueScrape} className="flex-1 py-3 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-medium transition-colors">
                🔬 继续研究
              </button>
              {token && (
                <button onClick={handleSave} disabled={loading} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors">
                  💾 保存
                </button>
              )}
            </div>
            {!token && <p className="text-center text-xs text-gray-400">登录后可保存研究内容</p>}
          </div>
        )}

        {/* ====== 已保存列表 ====== */}
        {viewSaved && !result && !loading && (
          <div className="space-y-4">
            {savedDetail ? (
              <div className="space-y-4">
                <button onClick={() => setSavedDetail(null)} className="text-sm text-amber-600 hover:text-amber-800 flex items-center gap-1">← 返回列表</button>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      value={savedDetail.title || ''}
                      onChange={(e) => setSavedDetail(prev => ({ ...prev, title: e.target.value }))}
                      className="text-lg font-semibold text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:border-amber-400 outline-none flex-1 mr-4"
                    />
                    <div className="flex gap-1">
                      <button onClick={handleUpdateNotes} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg hover:bg-amber-200">保存修改</button>
                      <button onClick={() => handleDelete(savedDetail._id)} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg hover:bg-red-100">删除</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3 text-xs">
                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{savedDetail.type === 'url' ? '🔗 网址' : '🔬 研究'}</span>
                    <span className="text-gray-400">{savedDetail.source}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-400">{new Date(savedDetail.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                </div>

                {savedDetail.report && (
                  <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-2xl p-6 shadow-sm border border-indigo-100">
                    <h3 className="text-sm font-semibold text-indigo-700 mb-4 flex items-center gap-2">
                      🤖 AI 综合分析报告
                      <span className="text-[10px] bg-indigo-200 text-indigo-600 px-1.5 py-0.5 rounded">研究报告</span>
                    </h3>
                    <div
                      className="text-sm text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(savedDetail.report) }}
                    />
                  </div>
                )}

                {savedDetail.aiSummary && !savedDetail.report && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 shadow-sm border border-indigo-100">
                    <h3 className="text-sm font-semibold text-indigo-700 mb-3 flex items-center gap-2">
                      🤖 AI 理解摘要
                      <span className="text-[10px] bg-indigo-200 text-indigo-600 px-1.5 py-0.5 rounded">AI生成</span>
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{savedDetail.aiSummary}</p>
                  </div>
                )}

                {savedDetail.rawContent && (
                  <details className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
                    <summary className="text-sm font-semibold text-gray-500 cursor-pointer hover:text-amber-600">📄 原始爬取内容</summary>
                    <div className="mt-3 p-4 bg-gray-50 rounded-xl max-h-80 overflow-y-auto">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans">
                        {savedDetail.rawContent?.substring(0, 10000)}
                        {savedDetail.rawContent?.length > 10000 && '\n\n...（内容已截断）'}
                      </pre>
                    </div>
                  </details>
                )}

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">✏️ 个人笔记</h3>
                  <textarea
                    value={savedDetail.customNotes || ''}
                    onChange={(e) => setSavedDetail(prev => ({ ...prev, customNotes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-sm text-gray-700 resize-none transition-all"
                  />
                </div>
              </div>
            ) : (
              <>
                {savedList.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 shadow-sm border border-amber-100 text-center">
                    <p className="text-5xl mb-4">📭</p>
                    <p className="text-gray-500">还没有保存的研究内容</p>
                    <button onClick={() => { setViewSaved(false); setError(''); }} className="mt-4 text-amber-600 hover:text-amber-800 text-sm font-medium">去研究 →</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedList.map(item => (
                      <div key={item._id} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 hover:border-amber-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleViewDetail(item._id)}>
                            <div className="flex items-center gap-2 mb-1">
                              <span>{item.type === 'url' ? '🔗' : '🔬'}</span>
                              <span className="text-sm font-medium text-gray-800 truncate">{item.title || item.source}</span>
                            </div>
                            <p className="text-xs text-gray-400 truncate ml-6">{item.source}</p>
                            {item.report && (
                              <p className="text-xs text-gray-500 mt-1 ml-6 line-clamp-2">{item.report.substring(0, 120)}</p>
                            )}
                          </div>
                          <button onClick={() => handleDelete(item._id)} className="text-gray-300 hover:text-red-500 text-lg ml-3 flex-shrink-0">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 底部说明 */}
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <p className="text-xs text-gray-300">
          🔬 果果研究助手 — DeepSeek AI 驱动 · 多源搜索（百度+Bing）+ 社交讨论（知乎） · AI 研究 / 行业简报 / 网页爬取
        </p>
      </div>
    </div>
  );
}
