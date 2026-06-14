import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';

const markdownComponents = {
  h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-gray-900 mt-6 mb-3 pb-2 border-b border-gray-200" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-gray-900 mt-5 mb-3 pb-1.5 border-b border-gray-100" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-base font-bold text-gray-900 mt-4 mb-2 flex items-center gap-2"><span className="w-1.5 h-4 bg-indigo-500 rounded-full inline-block shrink-0"></span><span {...props} /></h3>,
  h4: ({ node, ...props }) => <h4 className="text-sm font-semibold text-gray-800 mt-3 mb-1.5" {...props} />,
  p: ({ node, ...props }) => <p className="text-gray-700 leading-relaxed mb-3" {...props} />,
  ul: ({ node, ...props }) => <ul className="my-2 space-y-1.5 list-none" {...props} />,
  ol: ({ node, ...props }) => <ol className="my-2 space-y-1.5 list-decimal list-inside text-gray-700" {...props} />,
  li: ({ node, ...props }) => <li className="text-gray-700 leading-relaxed pl-1" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
  em: ({ node, ...props }) => <em className="italic text-gray-600" {...props} />,
  code: ({ node, inline, className, children, ...props }) => {
    if (inline) return <code className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-200" {...props}>{children}</code>;
    const match = /language-(\w+)/.exec(className || '');
    return (
      <div className="my-3 rounded-xl overflow-hidden border border-slate-700">
        {match && <div className="bg-slate-800 text-slate-400 text-xs px-4 py-1.5 font-mono">{match[1]}</div>}
        <pre className="bg-slate-900 text-green-400 p-4 overflow-x-auto text-xs leading-relaxed"><code className={className} {...props}>{children}</code></pre>
      </div>
    );
  },
  pre: ({ node, ...props }) => <pre className="bg-slate-900 text-green-400 rounded-xl p-4 my-3 overflow-x-auto text-xs leading-relaxed" {...props} />,
  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-400 bg-blue-50/60 rounded-r-lg pl-4 py-2 my-3 text-gray-600 italic" {...props} />,
  a: ({ node, ...props }) => <a className="text-indigo-600 underline hover:text-indigo-800" target="_blank" rel="noopener noreferrer" {...props} />,
  hr: ({ node, ...props }) => <hr className="my-5 border-gray-200" {...props} />,
  table: ({ node, ...props }) => <div className="overflow-x-auto my-4 rounded-xl border border-gray-200 shadow-sm"><table className="w-full" {...props} /></div>,
  thead: ({ node, ...props }) => <thead className="bg-slate-50" {...props} />,
  th: ({ node, ...props }) => <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200" {...props} />,
  td: ({ node, ...props }) => <td className="px-4 py-2.5 text-sm text-gray-700 border-b border-gray-100" {...props} />,
  tr: ({ node, ...props }) => <tr className="border-b border-gray-100 last:border-b-0 hover:bg-blue-50/30 transition" {...props} />,
};

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
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {analysis.result}
                  </ReactMarkdown>
                </div>
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
