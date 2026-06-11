import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TABS = [
  { key: 'all', label: '全部市场' },
  { key: 'hot', label: '热门板块' },
  { key: 'potential', label: '潜力市场' },
];

export default function MarketList() {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
      const res = await axios.get('/api/markets');
      if (res.data.success) {
        setMarkets(res.data.markets || []);
      }
    } catch (err) {
      console.error('获取市场列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMarkets = markets
    .filter(m => activeTab === 'all' ? true : m.type === activeTab)
    .sort((a, b) => (b.potentialScore || 0) - (a.potentialScore || 0));

  return (
    <div className="pt-16 min-h-[calc(100vh-var(--navbar-height,64px))]">
      {/* 返回按钮 */}
      <div className="max-w-7xl mx-auto px-4 pt-3 pb-1">
        <div className="flex items-center justify-end">
          <button onClick={() => navigate('/stock-monitor')}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">
            ← 返回股票管家
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60">
                ({markets.filter(m => tab.key === 'all' ? true : m.type === tab.key).length})
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">暂无市场数据</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMarkets.map(market => (
              <div
                key={market._id || market.id}
                onClick={() => navigate(`/market-detail/${market._id || market.id}`)}
                className="bg-white rounded-xl border shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: market.type === 'hot' ? '#ef4444' : '#a855f7',
                }}
              >
                <div className="p-4">
                  {/* 名称 + 标签 */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{market.name}</h3>
                    {market.tag && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        market.type === 'hot'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {market.tag}
                      </span>
                    )}
                  </div>

                  {/* 描述 - 2行截断 */}
                  {market.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{market.description}</p>
                  )}

                  {/* 潜力评分进度条 */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">潜力评分</span>
                        <span className="text-xs font-mono font-bold text-gray-700">
                          {(market.potentialScore || 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                          style={{ width: `${Math.min((market.potentialScore || 0), 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 关注度进度条 */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">关注度</span>
                        <span className="text-xs font-mono font-bold text-gray-700">
                          {(market.attention || market.attentionScore || 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                          style={{ width: `${Math.min((market.attention || market.attentionScore || 0), 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
