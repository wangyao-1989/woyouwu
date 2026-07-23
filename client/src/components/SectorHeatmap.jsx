import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// ============== 工具函数 ==============

// 根据涨跌幅返回背景色（红涨绿跌灰平，深浅代表幅度）
function getBgColor(changePercent) {
  if (changePercent == null) return '#e5e7eb';
  const pct = Math.abs(changePercent);
  if (pct === 0) return '#d1d5db';
  if (changePercent > 0) {
    if (pct >= 5) return '#dc2626';
    if (pct >= 3) return '#ef4444';
    if (pct >= 1) return '#f87171';
    return '#fca5a5';
  } else {
    if (pct >= 5) return '#16a34a';
    if (pct >= 3) return '#22c55e';
    if (pct >= 1) return '#4ade80';
    return '#86efac';
  }
}

// 格式化资金
function formatFund(num) {
  if (num == null) return '-';
  const abs = Math.abs(num);
  const sign = num >= 0 ? '' : '-';
  if (abs >= 1e8) return sign + (abs / 1e8).toFixed(2) + '亿';
  if (abs >= 1e4) return sign + (abs / 1e4).toFixed(1) + '万';
  return sign + abs.toFixed(0);
}

// ============== 资金流曲线图 (SVG Sparkline) ==============

function FundFlowChart({ data, width = 300, height = 60 }) {
  if (!data || data.length < 2) return null;

  const values = data.map(d => d.netInflow);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;

  // 生成SVG路径
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - minVal) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + p).join(' ');

  // 填充区域路径
  const fillD = pathD + ` L${width},${height} L0,${height} Z`;

  const isPositive = values[values.length - 1] > values[0];
  const lineColor = isPositive ? '#ef4444' : '#22c55e';
  const fillColor = isPositive ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)';

  return (
    <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={fillD} fill={fillColor} />
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="1.5" />
    </svg>
  );
}

// ============== 组件 ==============

export default function SectorHeatmap() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCat, setExpandedCat] = useState(null);
  const [fundFlowMap, setFundFlowMap] = useState({}); // { categoryName: { flowData, loading } }
  const flowCacheRef = useRef({}); // 缓存已获取的数据

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/stocks/board-heatmap');
      if (res.data.success) {
        setCategories(res.data.categories);
      } else {
        setError(res.data.error || '获取数据失败');
      }
    } catch (err) {
      setError('请求失败：' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 展开大类时，获取该大类第一个子板块的资金流数据
  useEffect(() => {
    if (!expandedCat) return;
    if (flowCacheRef.current[expandedCat]) return; // 已缓存

    const cat = categories.find(c => c.name === expandedCat);
    if (!cat || cat.sectors.length === 0) return;

    // 取涨跌幅绝对值最大的子板块作为代表
    const topSector = cat.sectors.reduce((a, b) =>
      Math.abs(a.changePercent) > Math.abs(b.changePercent) ? a : b
    );

    setFundFlowMap(prev => ({ ...prev, [expandedCat]: { loading: true } }));

    axios.get(`/api/stocks/board-fund-flow/${topSector.code}`)
      .then(res => {
        if (res.data.success) {
          flowCacheRef.current[expandedCat] = res.data;
          setFundFlowMap(prev => ({
            ...prev,
            [expandedCat]: { flowData: res.data.flowData, name: res.data.name, loading: false },
          }));
        } else {
          setFundFlowMap(prev => ({ ...prev, [expandedCat]: { loading: false, error: true } }));
        }
      })
      .catch(() => {
        setFundFlowMap(prev => ({ ...prev, [expandedCat]: { loading: false, error: true } }));
      });
  }, [expandedCat, categories]);

  // 切换展开/折叠
  const toggleCategory = (catName) => {
    setExpandedCat(prev => prev === catName ? null : catName);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* 头部 */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900">板块热力图</h3>
          <span className="text-xs text-gray-400">({categories.length}个大类)</span>
        </div>
        <button
          onClick={fetchData}
          className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-slate-100 transition"
          title="刷新"
        >
          ↻ 刷新
        </button>
      </div>

      {/* 图例 */}
      <div className="px-5 py-2 flex items-center gap-2 text-xs text-gray-400">
        <span>跌</span>
        <div className="flex h-4 rounded overflow-hidden">
          <div className="w-5 h-full" style={{ background: '#16a34a' }} />
          <div className="w-5 h-full" style={{ background: '#22c55e' }} />
          <div className="w-5 h-full" style={{ background: '#4ade80' }} />
          <div className="w-5 h-full" style={{ background: '#86efac' }} />
          <div className="w-5 h-full" style={{ background: '#d1d5db' }} />
          <div className="w-5 h-full" style={{ background: '#fca5a5' }} />
          <div className="w-5 h-full" style={{ background: '#f87171' }} />
          <div className="w-5 h-full" style={{ background: '#ef4444' }} />
          <div className="w-5 h-full" style={{ background: '#dc2626' }} />
        </div>
        <span>涨</span>
        <span className="ml-auto text-gray-400">点击大类查看细分板块</span>
      </div>

      {/* 加载/错误 */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500" />
        </div>
      )}
      {error && (
        <div className="text-center py-10 text-red-500 text-sm">{error}</div>
      )}

      {/* 大类热力图 */}
      {!loading && !error && (
        <div className="p-4">
          <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {categories.map((cat) => {
              const bgColor = getBgColor(cat.avgChangePercent);
              const isLight = Math.abs(cat.avgChangePercent || 0) < 3;
              const textColor = isLight ? '#374151' : '#ffffff';
              const isExpanded = expandedCat === cat.name;

              return (
                <div key={cat.name}>
                  {/* 大类卡片 */}
                  <div
                    onClick={() => toggleCategory(cat.name)}
                    className={`rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-150 border-2 ${
                      isExpanded ? 'border-blue-400 shadow-md scale-[1.02]' : 'border-transparent hover:shadow-md hover:scale-[1.02]'
                    }`}
                    style={{ background: bgColor, minHeight: '90px' }}
                    title={`${cat.name}\n平均涨跌: ${cat.avgChangePercent > 0 ? '+' : ''}${cat.avgChangePercent.toFixed(2)}%\n主力净流入: ${formatFund(cat.totalMainInflow)}\n${cat.sectorCount}个细分板块`}
                  >
                    {/* 大类名称 */}
                    <div className="text-sm font-semibold truncate" style={{ color: textColor, opacity: 0.95 }}>
                      {cat.name}
                      {isExpanded && <span className="ml-1 text-xs opacity-70">▲</span>}
                    </div>

                    {/* 涨跌幅 */}
                    <div>
                      <div className="text-lg font-bold font-mono" style={{ color: textColor }}>
                        {cat.avgChangePercent > 0 ? '+' : ''}{cat.avgChangePercent.toFixed(2)}%
                      </div>
                    </div>

                    {/* 资金流向 */}
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: textColor, opacity: 0.75 }}>
                      {cat.totalMainInflow >= 0 ? '流入' : '流出'} {formatFund(cat.totalMainInflow)}
                    </div>

                    {/* 涨跌家数 + 子板块数 */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-[10px]" style={{ color: textColor, opacity: 0.6 }}>
                        涨{cat.totalRiseCount} 跌{cat.totalFallCount}
                      </div>
                      <div className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{
                        color: textColor,
                        background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.2)',
                      }}>
                        {cat.sectorCount}个
                      </div>
                    </div>
                  </div>

                  {/* 展开的细分板块 */}
                  {isExpanded && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-xs text-gray-500 mb-2 font-medium">
                        {cat.name} · 细分板块 ({cat.sectors.length}个)
                      </div>

                      {/* 资金流曲线图 */}
                      {fundFlowMap[cat.name]?.loading && (
                        <div className="mb-3 flex items-center justify-center h-16 bg-white rounded-lg">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500" />
                        </div>
                      )}
                      {fundFlowMap[cat.name]?.flowData && (
                        <div className="mb-3 bg-white rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-400">
                              {fundFlowMap[cat.name].name} · 主力资金流分时
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatFund(fundFlowMap[cat.name].flowData[fundFlowMap[cat.name].flowData.length - 1]?.netInflow)}
                            </span>
                          </div>
                          <FundFlowChart data={fundFlowMap[cat.name].flowData} />
                        </div>
                      )}

                      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                        {cat.sectors.map((s) => {
                          const subBg = getBgColor(s.changePercent);
                          const subLight = Math.abs(s.changePercent || 0) < 3;
                          const subText = subLight ? '#374151' : '#ffffff';
                          return (
                            <div
                              key={s.code}
                              className="rounded-lg p-2 flex flex-col gap-0.5 transition-transform hover:scale-105"
                              style={{ background: subBg }}
                              title={`${s.name}\n涨跌: ${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}%\n主力净流入: ${formatFund(s.mainInflow)}\n涨${s.riseCount}家 跌${s.fallCount}家`}
                            >
                              <div className="text-[10px] font-medium truncate" style={{ color: subText, opacity: 0.9 }}>
                                {s.name}
                              </div>
                              <div className="text-xs font-bold font-mono" style={{ color: subText }}>
                                {s.changePercent > 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                              </div>
                              <div className="text-[9px] font-mono truncate" style={{ color: subText, opacity: 0.7 }}>
                                {s.mainInflow >= 0 ? '流入' : '流出'}{formatFund(s.mainInflow)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}