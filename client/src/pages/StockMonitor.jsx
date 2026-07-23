import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import SectorHeatmap from '../components/SectorHeatmap';

// ============== 工具函数 ==============

function formatNumber(num, decimals = 2) {
  if (isNaN(num) || num === null || num === undefined) return '-';
  return num.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ============== Markdown 组件样式 ==============

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
    if (inline) {
      return <code className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-200" {...props}>{children}</code>;
    }
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

function parseTurnoverAnalysis(analysis) {
  if (!analysis) return null;
  const result = { phase: null, volumeStatus: null, summary: '' };
  const phases = ['低位堆量·吸筹', '缩量洗盘', '真突破·主升', '高位爆量·出货', '阴跌出货·减仓', '震荡观望'];
  for (const phase of phases) {
    if (analysis.includes(phase)) { result.phase = phase; break; }
  }
  const volumeStatuses = ['地量', '缩量', '温和放量', '放量', '爆量'];
  for (const status of volumeStatuses) {
    if (analysis.includes(status)) { result.volumeStatus = status; break; }
  }
  const phaseMatch = analysis.match(/阶段标注[\s\S]*?(?=###|$)/);
  if (phaseMatch) {
    result.summary = phaseMatch[0].substring(0, 100);
  } else {
    const interpMatch = analysis.match(/换手率解读[\s\S]*?(?=###|$)/);
    if (interpMatch) result.summary = interpMatch[0].substring(0, 100);
  }
  return result;
}

function parseRiskList(analysis) {
  if (!analysis) return [];
  const risks = [];
  const riskSection = analysis.match(/重大风险清单[\s\S]*$/);
  if (riskSection) {
    const lines = riskSection[0].split('\n');
    let currentType = '', currentCondition = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('技术面破位')) currentType = '技术面破位';
      else if (trimmed.includes('基本面证伪')) currentType = '基本面证伪';
      else if (trimmed.includes('资金面恶化')) currentType = '资金面恶化';
      else if (trimmed.includes('管理层/战略风险')) currentType = '管理层/战略风险';
      else if (trimmed.startsWith('•') && currentType) currentCondition += trimmed + ' ';
      else if (
        trimmed.includes('无条件减仓') || trimmed.includes('重新评估') ||
        trimmed.includes('与主力资金反向') || trimmed.includes('信任是持仓的基础')
      ) {
        if (currentType && currentCondition) {
          risks.push({ type: currentType, condition: currentCondition.trim(), solution: trimmed.replace('|', '').trim() });
          currentCondition = '';
        }
      }
    }
  }
  return risks;
}

// 安全取数：过滤 null/undefined/NaN，保留合法值 0
function safeNum(val, fallback = 0) {
  if (val == null || Number.isNaN(val)) return fallback;
  return val;
}

function calculateMetrics(holding) {
  const shares = holding.shares || 0;
  const costPrice = parseFloat(holding.costPrice) || 0;
  const currentPrice = holding.currentPrice ? parseFloat(holding.currentPrice) : costPrice;
  const stockData = holding._stockData || holding.stockData || {};
  const costAmount = costPrice * shares;
  const marketValue = currentPrice * shares;
  const profitAmount = marketValue - costAmount;
  const profitPercent = costAmount > 0 ? (profitAmount / costAmount) * 100 : 0;
  const changeAmount = safeNum(stockData.changeAmount);
  const changePercent = safeNum(stockData.changePercent);
  const todayProfit = safeNum(changeAmount * shares);
  return {
    costPrice, currentPrice, costAmount, marketValue, profitAmount, profitPercent,
    changeAmount, changePercent, todayProfit,
    yesterdayClose: safeNum(stockData.yesterdayClose, currentPrice),
    todayOpen: safeNum(stockData.todayOpen, currentPrice),
    highPrice: safeNum(stockData.highPrice, currentPrice),
    lowPrice: safeNum(stockData.lowPrice, currentPrice),
    amplitude: safeNum(stockData.amplitude),
    turnoverRate: safeNum(stockData.turnoverRate),
    turnoverAnalysis: stockData.turnoverAnalysis || null,
    volumeRatio: safeNum(stockData.volumeRatio),
  };
}

// ============== 组件 ==============

export default function StockMonitor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('grid');
  const [sortConfig, setSortConfig] = useState(null);

  // 添加表单
  const [addForm, setAddForm] = useState({ stockCode: '', stockName: '', shares: '', costPrice: '' });
  const [adding, setAdding] = useState(false);

  // AI 分析
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisModal, setAnalysisModal] = useState(null);

  // 市场分析
  const [markets, setMarkets] = useState([]);
  const [marketTab, setMarketTab] = useState('hot');

  const fetchHoldings = useCallback(async () => {
    try {
      const res = await axios.get('/api/stocks/holdings');
      if (res.data.success) {
        setHoldings(res.data.holdings);
        if (res.data.holdings.length > 0) {
          fetchCurrentPrices(res.data.holdings);
        }
      }
    } catch (err) {
      console.error('获取持仓失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCurrentPrices = useCallback(async (holdingsList) => {
    setRefreshingPrices(true);
    try {
      const results = await Promise.all(
        holdingsList.map(async (h) => {
          try {
            const res = await axios.post('/api/stocks/price', { stockCode: h.stockCode });
            if (res.data.success && res.data.currentPrice) {
              return { id: h._id, currentPrice: res.data.currentPrice, stockData: res.data };
            }
            return null;
          } catch { return null; }
        })
      );
      setHoldings(prev => prev.map(h => {
        const update = results.find(r => r && r.id === h._id);
        return update ? { ...h, currentPrice: update.currentPrice, _stockData: update.stockData } : h;
      }));
    } catch (err) { console.error('获取股价失败:', err); }
    finally { setRefreshingPrices(false); }
  }, []);

  useEffect(() => { fetchHoldings(); }, [fetchHoldings]);

  // 获取市场数据
  useEffect(() => {
    axios.get('/api/markets').then(res => {
      if (res.data.success) setMarkets(res.data.markets);
    }).catch(() => {});
  }, []);

  const handleAdd = async () => {
    if (!addForm.stockCode.trim() || !addForm.stockName.trim()) return;
    setAdding(true);
    try {
      const res = await axios.post('/api/stocks/holdings', {
        stockCode: addForm.stockCode.trim().toUpperCase(),
        stockName: addForm.stockName.trim(),
        shares: parseInt(addForm.shares) || 0,
        costPrice: addForm.costPrice || '0.0000',
      });
      if (res.data.success) {
        setHoldings(prev => [res.data.holding, ...prev]);
        setShowAddModal(false);
        setAddForm({ stockCode: '', stockName: '', shares: '', costPrice: '' });
        try {
          const priceRes = await axios.post('/api/stocks/price', { stockCode: res.data.holding.stockCode });
          if (priceRes.data.success) {
            setHoldings(prev => prev.map(h => h._id === res.data.holding._id ? { ...h, currentPrice: priceRes.data.currentPrice, _stockData: priceRes.data } : h));
          }
        } catch {}
      }
    } catch (err) { alert(err.response?.data?.error || '添加失败'); }
    finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除该持仓吗？')) return;
    try { await axios.delete(`/api/stocks/holdings/${id}`); setHoldings(prev => prev.filter(h => h._id !== id)); }
    catch { alert('删除失败'); }
  };

  const handleRefreshPrice = useCallback(async () => {
    if (holdings.length === 0) return;
    await fetchCurrentPrices(holdings);
  }, [holdings, fetchCurrentPrices]);

  const handleAnalyze = async (holding, type) => {
    setAnalyzing(true);
    setAnalysisModal({ stockCode: holding.stockCode, stockName: holding.stockName, type, result: '', loading: true });
    try {
      const endpoint = type === 'analyze' ? '/api/stocks/analyze' : '/api/stocks/turnover-analysis';
      const res = await axios.post(endpoint, {
        stockCode: holding.stockCode, stockName: holding.stockName,
        shares: holding.shares, costPrice: holding.costPrice,
      });
      if (res.data.success) {
        setAnalysisModal({ stockCode: holding.stockCode, stockName: holding.stockName, type, result: res.data.analysis, priceData: res.data.priceData, generatedAt: res.data.generatedAt });
        // 如果是换手率分析，缓存结果
        if (type === 'turnover') {
          setHoldings(prev => prev.map(h => h._id === holding._id ? { ...h, _stockData: { ...(h._stockData || {}), turnoverAnalysis: res.data.analysis } } : h));
        }
      } else {
        setAnalysisModal(prev => ({ ...prev, result: '分析失败：' + (res.data.error || '未知错误'), loading: false }));
      }
    } catch (err) {
      setAnalysisModal(prev => ({ ...prev, result: '分析请求失败：' + (err.response?.data?.error || err.message || '网络错误'), loading: false }));
    } finally { setAnalyzing(false); }
  };

  // ============== 总览 ==============
  const summary = holdings.reduce((acc, h) => {
    const m = calculateMetrics(h);
    return {
      totalCost: acc.totalCost + m.costAmount,
      currentValue: acc.currentValue + m.marketValue,
      totalProfit: acc.totalProfit + m.profitAmount,
      totalTodayProfit: acc.totalTodayProfit + m.todayProfit,
      stocksCount: acc.stocksCount + 1,
    };
  }, { totalCost: 0, currentValue: 0, totalProfit: 0, totalTodayProfit: 0, stocksCount: 0 });

  const totalProfitPercent = summary.totalCost > 0 ? (summary.totalProfit / summary.totalCost) * 100 : 0;

  // ============== 排序 ==============
  const sortedHoldings = useMemo(() => {
    if (!sortConfig) return holdings;
    return [...holdings].sort((a, b) => {
      const ma = calculateMetrics(a), mb = calculateMetrics(b);
      let va, vb;
      switch (sortConfig.field) {
        case 'stockCode': va = a.stockCode; vb = b.stockCode; break;
        case 'stockName': va = a.stockName; vb = b.stockName; break;
        case 'shares': va = a.shares; vb = b.shares; break;
        case 'costPrice': va = ma.costPrice; vb = mb.costPrice; break;
        case 'currentPrice': va = ma.currentPrice; vb = mb.currentPrice; break;
        case 'marketValue': va = ma.marketValue; vb = mb.marketValue; break;
        case 'profitAmount': va = ma.profitAmount; vb = mb.profitAmount; break;
        case 'profitPercent': va = ma.profitPercent; vb = mb.profitPercent; break;
        case 'changePercent': va = ma.changePercent; vb = mb.changePercent; break;
        case 'changeAmount': va = ma.changeAmount; vb = mb.changeAmount; break;
        case 'todayProfit': va = ma.todayProfit; vb = mb.todayProfit; break;
        case 'amplitude': va = ma.amplitude; vb = mb.amplitude; break;
        case 'turnoverRate': va = ma.turnoverRate; vb = mb.turnoverRate; break;
        default: return 0;
      }
      if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
      if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [holdings, sortConfig]);

  const handleSort = (field) => {
    setSortConfig(prev => prev?.field === field
      ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      : { field, direction: 'desc' }
    );
  };

  // ============== 渲染 ==============
  return (
    <div className="pt-16 min-h-[calc(100vh-var(--navbar-height,64px))]">
      {/* ════════ 操作栏 ════════ */}
      <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-2">
            {holdings.length > 0 && (
              <button onClick={handleRefreshPrice} disabled={refreshingPrices}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2 transition">
                <svg className={`w-4 h-4 ${refreshingPrices ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                一键刷新
              </button>
            )}
              {/* 上传截图 - 预留 */}
              <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                上传截图
              </button>
              <button onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 flex items-center gap-2 transition shadow-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加持仓
              </button>
            </div>
          </div>
        </div>

      {/* ════════ 数据来源提示 ════════ */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-blue-700">
          数据来自东方财富/腾讯财经，仅供参考，不构成投资建议
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        ) : holdings.length === 0 && !showAddModal ? (
          /* ════════ 空状态 ════════ */
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2 text-gray-800">欢迎使用智能股票管家</h2>
              <p className="text-gray-500 mb-8">上传持仓截图或手动添加股票，AI 将自动为您识别并分析</p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-purple-700 flex items-center gap-2 transition shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  上传截图
                </button>
                <button onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  手动添加
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ════════ 总览卡片 ════════ */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <p className="text-sm font-medium text-gray-500 pb-2">持仓数量</p>
                <div className="text-2xl font-bold text-gray-900">{summary.stocksCount}</div>
                <p className="text-xs text-gray-400 mt-1">只股票</p>
              </div>
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <p className="text-sm font-medium text-gray-500 pb-2">持仓成本</p>
                <div className="text-2xl font-bold text-gray-900">¥{summary.totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-gray-400 mt-1">总成本</p>
              </div>
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <p className="text-sm font-medium text-gray-500 pb-2">持仓市值</p>
                <div className="text-2xl font-bold text-gray-900">¥{summary.currentValue.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-gray-400 mt-1">当前市值</p>
              </div>
              <div className={`bg-white rounded-xl border shadow-sm p-4 ${summary.totalProfit >= 0 ? 'border-red-200 bg-red-50/15' : 'border-green-200 bg-green-50/15'}`}>
                <p className="text-sm font-medium text-gray-500 pb-2">持仓收益</p>
                <div className="flex items-center gap-2">
                  <div className={`text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {summary.totalProfit >= 0 ? '+' : ''}¥{summary.totalProfit.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`flex items-center ${totalProfitPercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {totalProfitPercent >= 0
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />}
                    </svg>
                    <span className="text-sm font-medium ml-1">{totalProfitPercent >= 0 ? '+' : ''}{totalProfitPercent.toFixed(2)}%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">{summary.totalProfit >= 0 ? '盈利' : '亏损'}</p>
              </div>
            </div>

            {/* ════════ 板块热力图 ════════ */}
          <SectorHeatmap />

          {/* ════════ Tab 切换 ════════ */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
              <button onClick={() => setActiveTab('grid')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                持仓概览 ({holdings.length})
              </button>
              <button onClick={() => setActiveTab('table')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                持仓看板
              </button>
            </div>

            {/* ════════ 持仓概览 Grid ════════ */}
            {activeTab === 'grid' && (
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">持仓概览 ({holdings.length})</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...holdings].sort((a, b) => {
                    const ma = calculateMetrics(a);
                    const mb = calculateMetrics(b);
                    return mb.profitAmount - ma.profitAmount;
                  }).map(holding => {
                    const m = calculateMetrics(holding);
                    const isIncomplete = !holding.shares || holding.shares === 0 || !holding.costPrice || holding.costPrice === "0";
                    const stockData = holding._stockData || {};

                    return (
                      <div key={holding._id}
                        onClick={() => navigate(`/stock-detail/${holding._id}`)}
                        className={`bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer ${m.profitAmount >= 0 ? 'border-red-200 bg-red-50/20' : 'border-green-200 bg-green-50/20'}`}
                        style={{ borderLeftWidth: '5px', borderLeftColor: m.profitAmount >= 0 ? '#ef4444' : '#22c55e' }}
                      >
                        <div className="p-4">
                          {/* 标题行 */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-gray-900">{holding.stockName}</h3>
                                <span className="text-sm text-gray-400 font-mono">{holding.stockCode}</span>
                              </div>
                              {isIncomplete && (
                                <div className="flex items-center gap-1 text-amber-600 text-xs mt-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                  <span>信息不完整，请补充</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(holding._id); }}
                                className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500 transition"
                                title="删除">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* 持仓信息 */}
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">持仓数量</span>
                              <span className="font-medium font-mono">{holding.shares.toLocaleString()} 股</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">成本价</span>
                              <span className="font-medium font-mono">¥{parseFloat(holding.costPrice).toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">当前价</span>
                              <span className="font-medium font-mono">¥{m.currentPrice.toFixed(4)}</span>
                            </div>

                            {/* 盈亏 */}
                            <div className="pt-3 border-t">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">盈亏</span>
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold font-mono ${m.profitAmount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {m.profitAmount >= 0 ? '+' : ''}¥{m.profitAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.profitPercent >= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      {m.profitPercent >= 0
                                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />}
                                    </svg>
                                    {m.profitPercent >= 0 ? '+' : ''}{m.profitPercent.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 涨跌幅 */}
                            {stockData.changePercent !== undefined && stockData.changePercent !== 0 && (
                              <div className="pt-3 border-t">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">今日涨跌</span>
                                  <span className={`font-medium font-mono ${stockData.changePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* 换手率 */}
                            {stockData.turnoverRate !== undefined && stockData.turnoverRate !== null && (
                              <div className="pt-3 border-t">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-500">换手率</span>
                                  <span className={`font-medium font-mono ${stockData.turnoverRate >= 5 ? 'text-red-600' : stockData.turnoverRate >= 3 ? 'text-amber-600' : 'text-green-600'}`}>
                                    {stockData.turnoverRate.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* AI 分析按钮 */}
                            <div className="pt-3 border-t flex gap-2">
                              <button onClick={(e) => { e.stopPropagation(); handleAnalyze(holding, 'analyze'); }} disabled={analyzing}
                                className="flex-1 py-2 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition flex items-center justify-center gap-1"
                                style={{
                                  background: m.profitAmount >= 0
                                    ? 'linear-gradient(135deg, #ef4444, #f97316)'
                                    : 'linear-gradient(135deg, #22c55e, #14b8a6)',
                                }}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                AI 分析
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleAnalyze(holding, 'turnover'); }} disabled={analyzing}
                                className={`py-2 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition flex items-center justify-center gap-1 ${stockData.turnoverRate ? 'flex-1' : 'w-8'}`}
                                style={{
                                  background: m.profitAmount >= 0
                                    ? 'linear-gradient(135deg, #ef4444, #f97316)'
                                    : 'linear-gradient(135deg, #22c55e, #14b8a6)',
                                }}
                                title="换手率分析">
                                {stockData.turnoverRate ? (
                                  <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>换手分析</>
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════════ 持仓看板 Table ════════ */}
            {activeTab === 'table' && (
              <div className="bg-white rounded-xl border shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-bold text-gray-900">持仓明细看板</h3>
                </div>
                <div>
                  {/* 汇总信息 */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-slate-50 rounded-b-xl">
                    <div>
                      <p className="text-xs text-gray-500">总成本</p>
                      <p className="text-lg font-semibold font-mono">¥{formatNumber(summary.totalCost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">总市值</p>
                      <p className="text-lg font-semibold font-mono">¥{formatNumber(summary.currentValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">总盈亏</p>
                      <p className={`text-lg font-bold font-mono ${summary.totalProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {summary.totalProfit >= 0 ? '+' : ''}¥{formatNumber(summary.totalProfit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">盈亏比例</p>
                      <p className={`text-lg font-bold font-mono ${totalProfitPercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {totalProfitPercent >= 0 ? '+' : ''}{formatNumber(totalProfitPercent)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">今日盈亏</p>
                      <p className={`text-lg font-bold font-mono ${summary.totalTodayProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {summary.totalTodayProfit >= 0 ? '+' : ''}¥{formatNumber(summary.totalTodayProfit)}
                      </p>
                    </div>
                  </div>

                  {/* 表格 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          {[
                            { field: 'stockCode', label: '代码' },
                            { field: 'stockName', label: '名称' },
                            { field: 'shares', label: '持仓' },
                            { field: 'costPrice', label: '成本价' },
                            { field: 'currentPrice', label: '当前价' },
                            { field: 'changePercent', label: '涨跌幅' },
                            { field: 'changeAmount', label: '涨跌额' },
                            { field: 'marketValue', label: '市值' },
                            { field: 'profitAmount', label: '盈亏' },
                            { field: 'profitPercent', label: '盈亏%' },
                            { field: 'todayProfit', label: '今日盈亏' },
                            { field: 'amplitude', label: '振幅' },
                            { field: 'turnoverRate', label: '换手率' },
                          ].map(col => (
                            <th key={col.field}
                              onClick={() => handleSort(col.field)}
                              className="text-right py-2 px-2 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-900 select-none">
                              {col.label}
                              {sortConfig?.field === col.field
                                ? (sortConfig.direction === 'asc'
                                  ? <svg className="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                  : <svg className="w-3 h-3 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>)
                                : <svg className="w-3 h-3 ml-1 inline opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedHoldings.map(holding => {
                          const m = calculateMetrics(holding);
                          const stockData = holding._stockData || {};
                          return (
                            <tr key={holding._id}
                              className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                              <td className="py-2 px-2"><span className="font-mono text-xs font-medium">{holding.stockCode}</span></td>
                              <td className="py-2 px-2"><span className="font-medium text-xs">{holding.stockName}</span></td>
                              <td className="py-2 px-2 text-right"><span className="font-mono text-xs">{formatNumber(holding.shares, 0)}</span></td>
                              <td className="py-2 px-2 text-right"><span className="font-mono text-xs">{formatNumber(m.costPrice, 4)}</span></td>
                              <td className="py-2 px-2 text-right">
                                <span className={`font-mono text-xs font-medium ${m.changePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {formatNumber(m.currentPrice, 4)}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right">
                                <span className={`font-mono text-xs font-bold ${m.changePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {m.changePercent >= 0 ? '+' : ''}{formatNumber(m.changePercent, 2)}%
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right">
                                <span className={`font-mono text-xs ${m.changeAmount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {m.changeAmount >= 0 ? '+' : ''}{formatNumber(m.changeAmount, 4)}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right"><span className="font-mono text-xs">¥{formatNumber(m.marketValue)}</span></td>
                              <td className="py-2 px-2 text-right">
                                <span className={`font-mono text-xs font-bold ${m.profitAmount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {m.profitAmount >= 0 ? '+' : ''}¥{formatNumber(m.profitAmount)}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right">
                                <span className={`font-mono text-xs font-bold ${m.profitPercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {m.profitPercent >= 0 ? '+' : ''}{formatNumber(m.profitPercent)}%
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right">
                                <span className={`font-mono text-xs font-bold ${m.todayProfit >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {m.todayProfit >= 0 ? '+' : ''}¥{formatNumber(m.todayProfit)}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right"><span className="font-mono text-xs">{formatNumber(m.amplitude, 2)}%</span></td>
                              <td className="py-2 px-2 text-right">
                                <span className={`font-mono text-xs font-bold ${m.turnoverRate >= 5 ? 'text-red-600' : m.turnoverRate >= 3 ? 'text-amber-600' : 'text-green-600'}`}>
                                  {formatNumber(m.turnoverRate, 2)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ════════ 市场分析 ════════ */}
            {markets.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">市场分析</h2>
                  <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                    <button onClick={() => setMarketTab('hot')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${marketTab === 'hot' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}>
                      热门板块 ({markets.filter(m => m.marketType === 'hot').length})
                    </button>
                    <button onClick={() => setMarketTab('potential')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${marketTab === 'potential' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}>
                      潜力市场 ({markets.filter(m => m.marketType === 'potential').length})
                    </button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {markets
                    .filter(m => marketTab === 'all' || m.marketType === marketTab)
                    .slice(0, 3)
                    .map(market => (
                      <div key={market._id}
                        onClick={() => navigate(`/market-detail/${market._id}`)}
                        className="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                        style={{ borderLeftWidth: '4px', borderLeftColor: market.marketType === 'hot' ? '#ef4444' : '#8b5cf6' }}
                      >
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${market.marketType === 'hot' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
                              {market.marketType === 'hot' ? '热门' : '潜力'}
                            </span>
                            <h3 className="font-bold text-gray-900">{market.name}</h3>
                          </div>
                          {(market.tags || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {market.tags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-gray-500">{tag}</span>
                              ))}
                              {market.tags.length > 3 && <span className="text-xs text-gray-400">+{market.tags.length - 3}</span>}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{market.description}</p>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>潜力评分</span><span>{market.potentialScore}/100</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" style={{ width: `${market.potentialScore}%` }} />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>关注度</span><span>{market.attentionScore}/100</span>
                              </div>
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-amber-400 to-red-500 rounded-full" style={{ width: `${market.attentionScore}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="text-center mt-4">
                  <button onClick={() => navigate('/market-list')}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
                    查看全部市场 →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ════════ 添加持仓弹窗 ════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">添加新持仓</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">股票代码 *</label>
                <input type="text" value={addForm.stockCode}
                  onChange={e => setAddForm({ ...addForm, stockCode: e.target.value.toUpperCase() })}
                  placeholder="例如: 600519" maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">股票名称 *</label>
                <input type="text" value={addForm.stockName}
                  onChange={e => setAddForm({ ...addForm, stockName: e.target.value })}
                  placeholder="例如: 贵州茅台"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">持仓数量</label>
                  <input type="number" value={addForm.shares}
                    onChange={e => setAddForm({ ...addForm, shares: e.target.value })}
                    placeholder="0" min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">成本价 (元)</label>
                  <input type="number" step="0.0001" value={addForm.costPrice}
                    onChange={e => setAddForm({ ...addForm, costPrice: e.target.value })}
                    placeholder="0.0000" min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  <p className="text-xs text-gray-400 mt-1">支持小数点后4位</p>
                </div>
              </div>
              <button onClick={handleAdd} disabled={adding}
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {adding ? '添加中...' : '添加持仓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ AI 分析结果弹窗 ════════ */}
      {analysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !analyzing && setAnalysisModal(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 rounded-t-2xl ${
              analysisModal.type === 'analyze'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600'
            }`}>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  {analysisModal.type === 'analyze' ? 'AI 个股分析' : 'AI 换手率分析'}
                </h3>
                <p className="text-sm text-white/80 mt-0.5">
                  {analysisModal.stockName} ({analysisModal.stockCode})
                  {analysisModal.generatedAt && <span className="ml-2 text-white/60">· {new Date(analysisModal.generatedAt).toLocaleTimeString('zh-CN')}</span>}
                </p>
              </div>
              <button onClick={() => setAnalysisModal(null)}
                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-6 flex-1">
              {analysisModal.loading ? (
                <div className="flex flex-col items-center py-16">
                  <div className="w-16 h-16 relative mb-4">
                    <div className="w-16 h-16 border-4 border-indigo-200 rounded-full"></div>
                    <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-600 font-medium">AI 正在分析中，请稍候...</p>
                  <p className="text-xs text-gray-400 mt-1">正在调用 DeepSeek 大模型，通常需要 5-15 秒</p>
                </div>
              ) : (
                <div className="analysis-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {analysisModal.result}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t bg-gray-50/50 rounded-b-2xl flex items-center justify-between">
              <span className="text-xs text-gray-400">内容由 AI 生成，仅供参考，不构成投资建议</span>
              <button onClick={() => setAnalysisModal(null)}
                className="px-4 py-1.5 text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
