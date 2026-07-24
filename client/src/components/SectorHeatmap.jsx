import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// 连续颜色渐变：-5%深绿 → 0%浅灰 → +5%深红
function heatColor(pct) {
  if (pct == null) return { bg: '#f1f5f9', text: '#94a3b8' };
  const t = Math.min(Math.abs(pct) / 5, 1);
  if (pct > 0) {
    const r = Math.round(252 - t * 22);
    const g = Math.round(165 - t * 127);
    const b = Math.round(165 - t * 127);
    return { bg: `rgb(${r},${g},${b})`, text: t > 0.45 ? '#fff' : '#991b1b' };
  }
  if (pct < 0) {
    const r = Math.round(134 - t * 112);
    const g = Math.round(239 - t * 76);
    const b = Math.round(172 - t * 98);
    return { bg: `rgb(${r},${g},${b})`, text: t > 0.45 ? '#fff' : '#14532d' };
  }
  return { bg: '#e2e8f0', text: '#64748b' };
}

function fmtFund(n) {
  if (n == null) return '-';
  const a = Math.abs(n), s = n >= 0 ? '' : '-';
  if (a >= 1e8) return s + (a / 1e8).toFixed(2) + '亿';
  if (a >= 1e4) return s + (a / 1e4).toFixed(1) + '万';
  return s + a.toFixed(0);
}

// 趋势箭头
function TrendArrow({ pct, pct5d }) {
  if (pct5d == null) return null;
  const dir = pct5d > 0 ? '↑' : pct5d < 0 ? '↓' : '→';
  const sameDir = (pct > 0 && pct5d > 0) || (pct < 0 && pct5d < 0);
  const color = pct5d > 0 ? '#ef4444' : pct5d < 0 ? '#22c55e' : '#94a3b8';
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold ml-1"
      style={{ color }}>
      {dir}{Math.abs(pct5d).toFixed(1)}%
      {sameDir && <span className="text-[8px]">持续</span>}
    </span>
  );
}

export default function SectorHeatmap() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drill, setDrill] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [viewType, setViewType] = useState('industry'); // industry | concept
  const [rotation, setRotation] = useState(null);

  const fetchData = useCallback(async (type) => {
    setLoading(true); setError(null); setDrill(null);
    try {
      const r = await axios.get(`/api/stocks/board-heatmap-enhanced?type=${type}`);
      if (r.data.success) {
        setCats(r.data.categories || []);
        setRotation(r.data.rotationSummary || null);
      } else {
        setError(r.data.error || '获取失败');
      }
    } catch (e) { setError('请求失败：' + e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData('industry'); }, [fetchData]);

  const switchView = (type) => {
    setViewType(type);
    fetchData(type);
  };

  const sorted = [...cats].sort((a, b) => (b.avgChangePercent || 0) - (a.avgChangePercent || 0));
  const totalRise = cats.reduce((s, c) => s + (c.totalRiseCount || 0), 0);
  const totalFall = cats.reduce((s, c) => s + (c.totalFallCount || 0), 0);
  const sumInflow = cats.reduce((s, c) => s + (c.totalMainInflow || 0), 0);

  const CatCard = ({ cat, index }) => {
    const c = heatColor(cat.avgChangePercent);
    const isHover = hoverIdx === index;
    const isDrill = drill && drill.name === cat.name;
    const pct = cat.avgChangePercent || 0;
    const pct5d = cat.avgChange5d;

    return (
      <div className="relative group cursor-pointer" style={{ breakInside: 'avoid', marginBottom: 8 }}
        onMouseEnter={() => setHoverIdx(index)}
        onMouseLeave={() => setHoverIdx(null)}
        onClick={() => cat.sectors?.length > 0 && setDrill(drill?.name === cat.name ? null : cat)}>

        <div className="rounded-2xl p-4 transition-all duration-300 border-2 overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${c.bg} 0%, ${c.bg}dd 100%)`,
            borderColor: isDrill ? 'rgba(255,255,255,0.6)' : isHover ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
            boxShadow: isHover
              ? `0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)`
              : `0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.1)`,
            transform: isHover ? 'translateY(-2px)' : 'translateY(0)',
          }}>
          {/* 高光条纹 */}
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* 板块名称 + 趋势箭头 */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center flex-wrap gap-1">
              <span className="text-sm font-bold tracking-wide" style={{ color: c.text }}>{cat.name}</span>
              <TrendArrow pct={pct} pct5d={pct5d} />
            </div>
            {cat.sectors?.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0"
                style={{ background: 'rgba(255,255,255,0.15)', color: c.text }}>
                {cat.sectorCount}个
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isDrill ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'} />
                </svg>
              </div>
            )}
          </div>

          {/* 涨跌幅大数字 */}
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-2xl font-black font-mono tracking-tight" style={{ color: c.text }}>
              {pct > 0 ? '+' : ''}{pct.toFixed(2)}%
            </span>
            {cat.avgFlowDays > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono"
                style={{ background: 'rgba(255,255,255,0.2)', color: c.text }}>
                🔥{cat.avgFlowDays}日
              </span>
            )}
          </div>

          {/* 主力资金 */}
          <div className="flex items-center gap-2 text-[11px] font-mono font-medium" style={{ color: c.text, opacity: 0.8 }}>
            <span>{cat.totalMainInflow >= 0 ? '📈' : '📉'}</span>
            <span>{fmtFund(cat.totalMainInflow)}</span>
          </div>

          {/* 领涨龙头 */}
          {cat.topSector && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px]" style={{ color: c.text, opacity: 0.7 }}>
              <span className="opacity-60">领涨</span>
              <span className="font-medium">{cat.topSector.name}</span>
              <span className="font-mono font-bold">{(cat.topSector.changePercent || 0) > 0 ? '+' : ''}{cat.topSector.changePercent?.toFixed(1)}%</span>
            </div>
          )}

          {/* 涨跌家数进度条 */}
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden flex" style={{ background: 'rgba(0,0,0,0.15)' }}>
              {cat.totalRiseCount + cat.totalFallCount > 0 && (
                <>
                  <div className="h-full bg-red-400/60 rounded-l-full transition-all duration-500"
                    style={{ width: `${(cat.totalRiseCount / (cat.totalRiseCount + cat.totalFallCount)) * 100}%` }} />
                  <div className="h-full bg-green-400/60 rounded-r-full transition-all duration-500"
                    style={{ width: `${(cat.totalFallCount / (cat.totalRiseCount + cat.totalFallCount)) * 100}%` }} />
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: c.text, opacity: 0.7 }}>
              <span>{cat.totalRiseCount}↑</span>
              <span>{cat.totalFallCount}↓</span>
            </div>
          </div>

          {/* 展开的细分板块 */}
          {isDrill && cat.sectors && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
                {cat.sectors.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).map(s => {
                  const sc = heatColor(s.changePercent);
                  return (
                    <div key={s.code} className="rounded-xl px-2.5 py-2 transition-all hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${sc.bg}cc, ${sc.bg})`,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                      }}>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold truncate" style={{ color: sc.text }}>{s.name}</span>
                        {s.flowDays > 0 && (
                          <span className="text-[8px] px-1 rounded" style={{ background: 'rgba(255,255,255,0.2)', color: sc.text }}>
                            {s.flowDays}日
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[11px] font-bold font-mono" style={{ color: sc.text }}>
                          {(s.changePercent || 0) > 0 ? '+' : ''}{(s.changePercent || 0).toFixed(2)}%
                        </span>
                        {s.change5d != null && (
                          <span className="text-[9px] font-mono" style={{ color: sc.text, opacity: 0.6 }}>
                            {(s.change5d || 0) > 0 ? '+' : ''}{(s.change5d || 0).toFixed(1)}% 5日
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] font-mono mt-0.5" style={{ color: sc.text, opacity: 0.7 }}>
                        {fmtFund(s.mainInflow)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* === 头部看板 === */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900">板块热力图</h3>
            {/* 行业/概念切换 */}
            <div className="flex rounded-lg bg-gray-100 p-0.5">
              <button onClick={() => switchView('industry')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${viewType === 'industry' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                行业板块
              </button>
              <button onClick={() => switchView('concept')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${viewType === 'concept' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                概念板块
              </button>
            </div>
          </div>
          <button onClick={() => fetchData(viewType)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition">
            ↻ 刷新
          </button>
        </div>

        {/* 轮动总结条 */}
        {rotation && (
          <div className="mb-3 px-4 py-2.5 rounded-xl flex items-center gap-3 flex-wrap"
            style={{
              background: rotation.strength === '强势' ? 'linear-gradient(135deg, #fef2f2, #fff7ed)'
                : rotation.strength === '温和' ? 'linear-gradient(135deg, #f8fafc, #f1f5f9)'
                : 'linear-gradient(135deg, #f0fdf4, #f8fafc)',
              border: '1px solid #e2e8f0',
            }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800">📊 轮动总结</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                rotation.strength === '强势' ? 'bg-red-100 text-red-700'
                : rotation.strength === '温和' ? 'bg-amber-100 text-amber-700'
                : 'bg-green-100 text-green-700'
              }`}>
                {rotation.summary}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="font-medium text-gray-700">强势:</span>
                {rotation.topSectors?.join('、')}
              </span>
              <span className="text-gray-300">|</span>
              <span className="flex items-center gap-1">
                <span className="font-medium text-gray-700">弱势:</span>
                {rotation.weakSectors?.join('、')}
              </span>
            </div>
          </div>
        )}

        {/* 概览统计 */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 mb-0.5">板块总数</div>
            <div className="text-lg font-bold text-gray-900">{cats.length}<span className="text-xs font-normal text-gray-400 ml-1">个</span></div>
          </div>
          <div className="bg-red-50 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 mb-0.5">上涨家数</div>
            <div className="text-lg font-bold text-red-600">{totalRise}<span className="text-xs font-normal text-red-400 ml-1">家</span></div>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <div className="text-[10px] text-gray-400 mb-0.5">下跌家数</div>
            <div className="text-lg font-bold text-green-600">{totalFall}<span className="text-xs font-normal text-green-400 ml-1">家</span></div>
          </div>
          <div className={`rounded-xl p-3 ${sumInflow >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className="text-[10px] text-gray-400 mb-0.5">主力净流入</div>
            <div className={`text-lg font-bold ${sumInflow >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {sumInflow >= 0 ? '+' : ''}{fmtFund(sumInflow)}
            </div>
          </div>
        </div>
      </div>

      {/* === 图例 === */}
      <div className="px-5 py-2.5 flex items-center gap-2 border-b border-gray-100">
        <span className="text-[10px] text-gray-400">跌</span>
        <div className="h-3 rounded-full overflow-hidden flex shadow-inner" style={{ width: 140 }}>
          {Array.from({ length: 30 }).map((_, i) => {
            const p = (i / 29) * 10 - 5;
            const hc = heatColor(p);
            return <div key={i} className="flex-1 h-full" style={{ background: hc.bg }} />;
          })}
        </div>
        <span className="text-[10px] text-gray-400">涨</span>
        {drill && (
          <button onClick={() => setDrill(null)} className="ml-auto text-[10px] text-blue-500 hover:text-blue-700 font-medium">
            ← 返回全景
          </button>
        )}
        {!drill && (
          <span className="ml-auto text-[10px] text-gray-400">
            🔥N日 = 连续主力流入 · 点击板块展开细分
          </span>
        )}
      </div>

      {/* === 加载/错误 === */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500" />
        </div>
      )}
      {error && (
        <div className="text-center py-10 text-red-500 text-sm">{error}</div>
      )}

      {/* === 热力图网格 === */}
      {!loading && !error && (
        <div className="p-4">
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-2"
            style={{ columnFill: 'balance' }}>
            {sorted.map((cat, i) => (
              <CatCard key={cat.name} cat={cat} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* === 底部提示 === */}
      <div className="px-5 py-2 border-t border-gray-100 text-[10px] text-gray-400 text-center">
        数据来自东方财富公开行情接口，仅供参考，不构成投资建议
      </div>
    </div>
  );
}