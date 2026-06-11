import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function renderMarkdown(text) {
  if (!text) return '';
  let html = text;
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-gray-900 mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-gray-900 mt-5 mb-3">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mt-5 mb-3">$1</h1>');
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 text-gray-700">$1</li>');
  html = html.replace(/^\d+\.\s(.+)$/gm, '<li class="ml-4 text-gray-700">$1</li>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
  html = html.replace(/\n\n/g, '</p><p class="text-gray-700 leading-relaxed mb-2">');
  html = html.replace(/\n/g, '<br/>');
  html = '<p class="text-gray-700 leading-relaxed mb-2">' + html + '</p>';
  return html;
}

export default function MarketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [chainFilter, setChainFilter] = useState('all');

  useEffect(() => {
    fetchMarket();
  }, [id]);

  const fetchMarket = async () => {
    try {
      const res = await axios.get(`/api/markets/${id}`);
      if (res.data.success) {
        setMarket(res.data.market || res.data);
      }
    } catch (err) {
      console.error('获取市场详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const enterprises = useMemo(() => {
    if (!market?.enterprises) return [];
    return market.enterprises;
  }, [market]);

  const chainPositions = useMemo(() => {
    const positions = new Set();
    enterprises.forEach(e => {
      if (e.chainPosition) positions.add(e.chainPosition);
    });
    return ['all', ...Array.from(positions)];
  }, [enterprises]);

  const filteredEnterprises = useMemo(() => {
    if (chainFilter === 'all') return enterprises;
    return enterprises.filter(e => e.chainPosition === chainFilter);
  }, [enterprises, chainFilter]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalysis({ loading: true, result: '' });
    try {
      const res = await axios.post(`/api/markets/${id}/analyze`);
      if (res.data.success) {
        setAnalysis({ loading: false, result: res.data.analysis || res.data.result || '' });
      } else {
        setAnalysis({ loading: false, result: '分析失败：' + (res.data.error || '未知错误') });
      }
    } catch (err) {
      setAnalysis({
        loading: false,
        result: '分析请求失败：' + (err.response?.data?.error || err.message || '网络错误'),
      });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">市场数据不存在</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-[calc(100vh-var(--navbar-height,64px))]">
      {/* 返回按钮 */}
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-1">
        <div className="flex items-center justify-end">
          <button onClick={() => navigate('/market-list')}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
            ← 返回市场列表
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* 市场概览卡 */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-1.5 h-12 rounded-full mt-1"
              style={{ backgroundColor: market.type === 'hot' ? '#ef4444' : '#a855f7' }}
            ></div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-gray-900">{market.name}</h2>
                {market.tag && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      market.type === 'hot'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {market.tag}
                  </span>
                )}
              </div>
              {market.description && (
                <p className="text-sm text-gray-500">{market.description}</p>
              )}
            </div>
          </div>

          {/* 双进度条 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">潜力评分</span>
                <span className="text-sm font-mono font-bold text-gray-900">
                  {(market.potentialScore || 0).toFixed(1)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                  style={{ width: `${Math.min((market.potentialScore || 0), 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">关注度</span>
                <span className="text-sm font-mono font-bold text-gray-900">
                  {(market.attention || market.attentionScore || 0).toFixed(1)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                  style={{
                    width: `${Math.min((market.attention || market.attentionScore || 0), 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 企业网格 */}
        {enterprises.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              产业链企业 ({filteredEnterprises.length})
            </h3>

            {/* 产业链位置筛选 */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {chainPositions.map(pos => (
                <button
                  key={pos}
                  onClick={() => setChainFilter(pos)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    chainFilter === pos
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  {pos === 'all' ? '全部' : pos}
                </button>
              ))}
            </div>

            {/* 3列卡片网格 */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredEnterprises.map((enterprise, idx) => (
                <div
                  key={enterprise._id || idx}
                  className="border border-gray-100 rounded-lg p-3 hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-900">{enterprise.name}</span>
                    {enterprise.code && (
                      <span className="text-xs text-gray-400 font-mono">{enterprise.code}</span>
                    )}
                  </div>
                  {enterprise.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{enterprise.description}</p>
                  )}
                  {enterprise.chainPosition && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
                      {enterprise.chainPosition}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 深度分析卡 */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">深度分析</h3>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2 transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              AI 分析
            </button>
          </div>

          {analysis && (
            <div className="border-t pt-4">
              {analysis.loading ? (
                <div className="flex flex-col items-center py-12">
                  <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-gray-500 text-sm">AI 正在分析中，请稍候...</p>
                </div>
              ) : (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(analysis.result) }}
                />
              )}
            </div>
          )}

          {!analysis && (
            <div className="text-center py-8 text-gray-400 text-sm">
              点击"AI 分析"按钮获取深度市场分析
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
