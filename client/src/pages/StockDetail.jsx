import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';

// ==================== 工具函数 ====================

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

// ==================== 子Tab 1: 持仓信息 ====================

function HoldingInfo({ holding, onDelete, onRefreshPrice, onAnalyze, onEdit }) {
  const shares = holding.shares || 0;
  const costPrice = parseFloat(holding.costPrice) || 0;
  const currentPrice = holding.currentPrice ? parseFloat(holding.currentPrice) : costPrice;
  const costAmount = costPrice * shares;
  const marketValue = currentPrice * shares;
  const profitAmount = marketValue - costAmount;
  const profitPercent = costAmount > 0 ? (profitAmount / costAmount) * 100 : 0;
  const changePercent = holding._stockData?.changePercent ?? holding.changePercent ?? 0;
  const changeAmount = holding._stockData?.changeAmount ?? holding.changeAmount ?? 0;

  return (
    <div className="space-y-4">
      {/* 股票基本信息 */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{holding.stockName}</h2>
          <span className="text-sm text-gray-400 font-mono">{holding.stockCode}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">持仓数量</p>
            <p className="text-lg font-mono font-bold text-gray-900">{shares.toLocaleString()} 股</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">成本价</p>
            <p className="text-lg font-mono font-bold text-gray-900">¥{costPrice.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">当前价</p>
            <p className={`text-lg font-mono font-bold ${changePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              ¥{currentPrice.toFixed(4)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">盈亏</p>
            <div>
              <p className={`text-lg font-mono font-bold ${profitAmount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {profitAmount >= 0 ? '+' : ''}¥{Math.abs(profitAmount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className={`text-xs font-mono ${profitPercent >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onRefreshPrice}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新价格
          </button>
          <button
            onClick={onAnalyze}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-700 flex items-center gap-2 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI 分析
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            编辑
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== 子Tab 2: 盯盘助手（技术指标） ====================

function StockMonitorHelper({ holding }) {
  const currentPrice = holding.currentPrice ? parseFloat(holding.currentPrice) : parseFloat(holding.costPrice) || 0;
  const stockData = holding._stockData || {};
  const changePercent = stockData.changePercent ?? holding.changePercent ?? 0;
  const turnoverRate = stockData.turnoverRate ?? 0;
  const volumeRatio = stockData.volumeRatio ?? 0;
  const stockCode = holding.stockCode || '';

  const [indicators, setIndicators] = useState(null);
  const [loadingIndicators, setLoadingIndicators] = useState(false);

  // 获取技术指标
  useEffect(() => {
    if (!stockCode) return;
    let cancelled = false;
    setLoadingIndicators(true);
    axios.post('/api/stocks/indicator', { stockCode })
      .then(res => {
        if (!cancelled && res.data.success) setIndicators(res.data.indicators);
      })
      .catch(err => console.error('获取技术指标失败:', err))
      .finally(() => { if (!cancelled) setLoadingIndicators(false); });
    return () => { cancelled = true; };
  }, [stockCode]);

  if (loadingIndicators && !indicators) {
    return <div className="py-12 text-center text-gray-400">加载技术指标中...</div>;
  }

  // 指标卡片组件
  const IndicatorCard = ({ title, icon, value, unit, signal, signalColor, explain }) => (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-900">{icon} {title}</h3>
        {signal && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            signalColor === 'green' ? 'bg-green-100 text-green-700' :
            signalColor === 'red' ? 'bg-red-100 text-red-700' :
            signalColor === 'amber' ? 'bg-amber-100 text-amber-700' :
            'bg-blue-100 text-blue-700'
          }`}>{signal}</span>
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-mono font-bold text-gray-900">{value}</span>
        {unit && <span className="text-xs text-gray-400">{unit}</span>}
      </div>
      {explain && (
        <p className="text-xs text-gray-500 leading-relaxed bg-slate-50 rounded-lg p-2.5 mt-2">
          {explain}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 价格概览 - 3列 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">现价</p>
          <p className={`text-sm font-mono font-bold ${changePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            ¥{currentPrice.toFixed(4)}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">涨跌幅</p>
          <p className={`text-sm font-mono font-bold ${changePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">换手率</p>
          <p className={`text-sm font-mono font-bold ${turnoverRate >= 5 ? 'text-red-600' : turnoverRate >= 3 ? 'text-amber-600' : 'text-gray-900'}`}>
            {turnoverRate.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* 指标卡片网格 */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* 成交量 */}
        <IndicatorCard
          title="成交量"
          icon="📊"
          value={indicators?.volume?.show || '加载中...'}
          signal={indicators?.volRatio?.value > 2 ? '放量' : indicators?.volRatio?.value > 1.2 ? '温和' : '正常'}
          signalColor={indicators?.volRatio?.value > 2 ? 'red' : indicators?.volRatio?.value > 1.2 ? 'amber' : 'green'}
          explain={indicators?.volume?.explain}
        />

        {/* 量比 */}
        <IndicatorCard
          title="量比"
          icon="⚖️"
          value={indicators?.volRatio?.show || '--'}
          unit={indicators?.volRatio?.value > 0 ? `(=今日成交÷5日均量)` : ''}
          signal={indicators?.volRatio?.value > 2 ? '活跃' : indicators?.volRatio?.value < 0.5 ? '冷清' : ''}
          signalColor={indicators?.volRatio?.value > 2 ? 'red' : 'blue'}
          explain={indicators?.volRatio?.explain}
        />

        {/* MACD */}
        <IndicatorCard
          title="MACD"
          icon="📈"
          value={indicators?.macd?.dif || '--'}
          signal={indicators?.macd?.signal || ''}
          signalColor={indicators?.macd?.signal === '金叉' ? 'red' : 'green'}
          explain={indicators?.macd ? `DIFF ${indicators.macd.dif} / DEA ${indicators.macd.dea} / MACD ${indicators.macd.macd}。${indicators.macd.explain || ''}` : '加载中...'}
        />

        {/* KDJ */}
        <IndicatorCard
          title="KDJ"
          icon="〽️"
          value={indicators?.kdj?.j || '--'}
          unit="K/D/J"
          signal={indicators?.kdj?.signal || ''}
          signalColor={
            indicators?.kdj?.signal === '金叉' ? 'red' :
            indicators?.kdj?.signal === '超买' ? 'amber' :
            'green'
          }
          explain={indicators?.kdj ? `K ${indicators.kdj.k} / D ${indicators.kdj.d} / J ${indicators.kdj.j}。${indicators.kdj.explain || ''}` : '加载中...'}
        />

        {/* 资金流向 */}
        <IndicatorCard
          title="资金博弈"
          icon="💰"
          value={indicators?.fundFlow?.show || '--'}
          signal={indicators?.fundFlow?.mainNet > 0 ? '主力流入' : indicators?.fundFlow?.mainNet < 0 ? '主力流出' : ''}
          signalColor={indicators?.fundFlow?.mainNet > 0 ? 'red' : 'green'}
          explain={indicators?.fundFlow?.explain}
        />

        {/* 买卖力道 */}
        <IndicatorCard
          title="买卖力道"
          icon="⚔️"
          value={indicators?.buySellForce?.show || '--'}
          signal={indicators?.buySellForce?.buyRatio > 1.1 ? '买强' : indicators?.buySellForce?.buyRatio < 0.9 ? '卖强' : '均衡'}
          signalColor={indicators?.buySellForce?.buyRatio > 1.1 ? 'red' : indicators?.buySellForce?.buyRatio < 0.9 ? 'green' : 'blue'}
          explain={indicators?.buySellForce?.explain}
        />
      </div>

      {/* 指标说明 */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
        <p className="text-xs text-blue-800 font-medium mb-1">💡 指标速懂</p>
        <div className="space-y-1 text-xs text-blue-700">
          <p><strong>成交量+量比</strong>：看人气和资金活跃度。放量=大资金在动作，缩量=没人玩。</p>
          <p><strong>MACD</strong>：看中期趋势。金叉=上涨信号，死叉=下跌信号，零轴上方=多头趋势。</p>
          <p><strong>KDJ</strong>：看短期超买超卖。J值&gt;100风险高，J值&lt;0机会大。</p>
          <p><strong>资金博弈</strong>：看主力动向。主力净流入=机构在买，主力净流出=机构在跑。</p>
          <p><strong>买卖力道</strong>：看盘口多空力量。买盘&gt;卖盘=有人撑着，卖盘&gt;买盘=抛压重。</p>
        </div>
      </div>
    </div>
  );
}

// ==================== 子Tab 3: 加仓计算器 ====================

function PositionCalculator({ holding }) {
  const shares = holding.shares || 0;
  const costPrice = parseFloat(holding.costPrice) || 0;
  const currentPrice = holding.currentPrice ? parseFloat(holding.currentPrice) : costPrice;
  const stockCode = holding.stockCode || '';

  const [addShares, setAddShares] = useState('');
  const [addPrice, setAddPrice] = useState(currentPrice.toFixed(4));

  // 是否为沪市（60开头）
  const isShanghai = stockCode.startsWith('6');

  const price = parseFloat(addPrice) || 0;
  const addQty = parseInt(addShares) || 0;
  const addAmount = price * addQty;

  // 手续费计算
  const commission = Math.max(addAmount * 0.0003, 5); // 佣金最低5元
  const transferFee = isShanghai ? addAmount * 0.00001 : 0; // 过户费（沪市）
  const stampDuty = 0; // 印花税免
  const totalFee = commission + transferFee + stampDuty;

  // 新成本价
  const totalShares = shares + addQty;
  const totalCost = costPrice * shares + addAmount + totalFee;
  const newCostPrice = totalShares > 0 ? totalCost / totalShares : costPrice;
  const costChange = newCostPrice - costPrice;
  const costChangePercent = costPrice > 0 ? (costChange / costPrice) * 100 : 0;

  const handlePriceQuick = (percent) => {
    const np = currentPrice * (1 + percent / 100);
    setAddPrice(np.toFixed(4));
  };

  const handleSharesQuick = (ratio) => {
    const ns = Math.floor(shares * ratio);
    setAddShares(String(ns));
  };

  return (
    <div className="space-y-4">
      {/* 输入区 */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-4">加仓计算器</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {/* 价格输入 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">加仓价格</label>
            <input
              type="number"
              step="0.0001"
              value={addPrice}
              onChange={e => setAddPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.0000"
            />
            <div className="flex gap-1 mt-2">
              {[
                { label: '-5%跌', pct: -5 },
                { label: '-2%跌', pct: -2 },
                { label: '现价', pct: 0 },
                { label: '+2%涨', pct: 2 },
              ].map(btn => (
                <button
                  key={btn.label}
                  onClick={() => handlePriceQuick(btn.pct)}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    Math.abs((price - currentPrice * (1 + btn.pct / 100))) < 0.0001
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* 数量输入 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">加仓股数</label>
            <input
              type="number"
              value={addShares}
              onChange={e => setAddShares(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
              min="0"
            />
            <div className="flex gap-1 mt-2">
              {[
                { label: '1/4仓', ratio: 0.25 },
                { label: '半仓', ratio: 0.5 },
                { label: '等量', ratio: 1 },
                { label: '双倍', ratio: 2 },
              ].map(btn => (
                <button
                  key={btn.label}
                  onClick={() => handleSharesQuick(btn.ratio)}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    addQty === Math.floor(shares * btn.ratio) && addQty > 0
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 计算结果 */}
      {addQty > 0 && price > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-4">计算结果</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">新成本价</p>
              <p className="text-lg font-mono font-bold text-gray-900">¥{newCostPrice.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">成本变化</p>
              <p className={`text-lg font-mono font-bold ${costChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {costChange >= 0 ? '+' : ''}¥{Math.abs(costChange).toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">变化比例</p>
              <p className={`text-lg font-mono font-bold ${costChangePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {costChangePercent >= 0 ? '+' : ''}{costChangePercent.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">总持仓</p>
              <p className="text-lg font-mono font-bold text-gray-900">{totalShares.toLocaleString()} 股</p>
            </div>
          </div>

          {/* 手续费明细 */}
          <div className="border-t pt-4">
            <h4 className="text-xs font-bold text-gray-700 mb-2">手续费明细</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-500">项目</th>
                    <th className="text-right py-2 font-medium text-gray-500">费率</th>
                    <th className="text-right py-2 font-medium text-gray-500">金额</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-700">佣金</td>
                    <td className="py-2 text-right font-mono text-gray-500">0.03%（最低5元）</td>
                    <td className="py-2 text-right font-mono font-medium text-gray-900">¥{commission.toFixed(2)}</td>
                  </tr>
                  {isShanghai && (
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-700">过户费（沪市）</td>
                      <td className="py-2 text-right font-mono text-gray-500">0.001%</td>
                      <td className="py-2 text-right font-mono font-medium text-gray-900">¥{transferFee.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-700">印花税</td>
                    <td className="py-2 text-right font-mono text-gray-500">免</td>
                    <td className="py-2 text-right font-mono font-medium text-gray-900">¥0.00</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium text-gray-900">合计</td>
                    <td></td>
                    <td className="py-2 text-right font-mono font-bold text-gray-900">¥{totalFee.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 子Tab 4: AI圆桌讨论 ====================

function PositionIncreaseDiscussion({ holdingId }) {
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDiscussion = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.post(`/api/stocks/holdings/${holdingId}/position-discussion`);
      if (res.data.success) {
        setDiscussion(res.data.discussion || res.data);
      } else {
        setDiscussion({ error: res.data.error || '讨论发起失败' });
      }
    } catch (err) {
      setDiscussion({ error: err.response?.data?.error || err.message || '网络错误' });
    } finally {
      setLoading(false);
    }
  }, [holdingId]);

  useEffect(() => {
    fetchDiscussion();
  }, [fetchDiscussion]);

  if (loading) {
    return (
      <div className="flex flex-col items-center py-16">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">AI 圆桌讨论进行中...</p>
        <p className="text-xs text-gray-400 mt-1">三位 AI 专家正在为您分析</p>
      </div>
    );
  }

  if (discussion?.error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium">{discussion.error}</p>
        <button
          onClick={fetchDiscussion}
          className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition"
        >
          重新发起讨论
        </button>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">点击下方按钮发起 AI 圆桌讨论</p>
        <button
          onClick={fetchDiscussion}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-indigo-700 transition shadow-sm"
        >
          发起 AI 圆桌讨论
        </button>
      </div>
    );
  }

  const roles = discussion.roles || discussion.experts || [];
  const vote = discussion.vote || discussion.votes || { agree: 0, oppose: 0, neutral: 0 };
  const decision = discussion.decision || discussion.finalDecision || {};
  const suggestion = discussion.suggestion || discussion.finalSuggestion || {};

  const stanceColors = {
    '建议加仓': 'text-red-600 bg-red-50',
    '加仓': 'text-red-600 bg-red-50',
    '不建议加仓': 'text-green-600 bg-green-50',
    '不加仓': 'text-green-600 bg-green-50',
    '观望': 'text-amber-600 bg-amber-50',
    '继续观望': 'text-amber-600 bg-amber-50',
  };

  return (
    <div className="space-y-4">
      {/* 三位 AI 角色 */}
      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((role, idx) => {
          const stanceClass = stanceColors[role.stance] || 'text-gray-600 bg-gray-50';
          return (
            <div key={idx} className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {role.name ? role.name.charAt(0) : String.fromCharCode(65 + idx)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{role.name || `AI专家${idx + 1}`}</p>
                    <p className="text-xs text-gray-400">{role.role || role.perspective || ''}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stanceClass}`}>
                  {role.stance || '观望'}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                {role.opinion || role.view || ''}
              </p>
              {role.confidence !== undefined && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-400">置信度</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${role.confidence}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-mono font-bold text-gray-700">{role.confidence}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 投票统计 */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">投票统计</h3>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{vote.agree || 0}</p>
            <p className="text-xs text-gray-500 mt-1">同意加仓</p>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{vote.oppose || 0}</p>
            <p className="text-xs text-gray-500 mt-1">反对加仓</p>
          </div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{vote.neutral || 0}</p>
            <p className="text-xs text-gray-500 mt-1">中立/观望</p>
          </div>
        </div>
      </div>

      {/* 最终决策 */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">最终决策</h3>
        <div className="flex items-center gap-4 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
            (decision.verdict || decision.decision || '').includes('建议加仓') ? 'bg-red-100 text-red-700' :
            (decision.verdict || decision.decision || '').includes('不建议') ? 'bg-green-100 text-green-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {decision.verdict || decision.decision || '观望'}
          </span>
          {decision.confidence !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">信心指数</span>
              <div className="w-20 bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${decision.confidence}%` }}
                ></div>
              </div>
              <span className="text-xs font-mono font-bold">{decision.confidence}%</span>
            </div>
          )}
        </div>

        {/* 最终建议详情 */}
        <div className="grid gap-3 md:grid-cols-2">
          {suggestion.position && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">建议仓位</p>
              <p className="text-sm font-bold text-gray-900">{suggestion.position}</p>
            </div>
          )}
          {suggestion.entryTiming && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">入场时机</p>
              <p className="text-sm font-bold text-gray-900">{suggestion.entryTiming}</p>
            </div>
          )}
          {suggestion.stopLoss && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">止损位</p>
              <p className="text-sm font-bold text-red-600 font-mono">{suggestion.stopLoss}</p>
            </div>
          )}
          {suggestion.targetPrice && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">目标价</p>
              <p className="text-sm font-bold text-green-600 font-mono">{suggestion.targetPrice}</p>
            </div>
          )}
        </div>

        {suggestion.riskWarning && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700 font-medium">⚠️ 风险提示</p>
            <p className="text-xs text-amber-600 mt-1">{suggestion.riskWarning}</p>
          </div>
        )}
      </div>

      {/* 重新发起 */}
      <div className="text-center">
        <button
          onClick={fetchDiscussion}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
        >
          重新发起讨论
        </button>
      </div>
    </div>
  );
}

// ==================== 主组件 ====================

export default function StockDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [holding, setHolding] = useState(null);
  const [loading, setLoading] = useState(true);

  // 编辑弹窗
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ stockName: '', stockCode: '', shares: '', costPrice: '' });
  const [saving, setSaving] = useState(false);

  // AI分析
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisModal, setAnalysisModal] = useState(null);
  const [refreshingPrice, setRefreshingPrice] = useState(false);

  const fetchHolding = useCallback(async () => {
    try {
      const res = await axios.get('/api/stocks/holdings');
      if (res.data.success) {
        const found = res.data.holdings.find(h => h._id === id);
        if (found) {
          setHolding(found);
          // 尝试获取实时价格
          fetchCurrentPrice(found);
        }
      }
    } catch (err) {
      console.error('获取持仓失败:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchCurrentPrice = async (h) => {
    try {
      const res = await axios.post('/api/stocks/price', { stockCode: h.stockCode });
      if (res.data.success && res.data.currentPrice) {
        setHolding(prev => prev ? {
          ...prev,
          currentPrice: res.data.currentPrice,
          _stockData: res.data,
        } : prev);
      }
    } catch {}
  };

  useEffect(() => {
    fetchHolding();
  }, [fetchHolding]);

  const handleRefreshPrice = async () => {
    if (!holding) return;
    setRefreshingPrice(true);
    try {
      const res = await axios.post('/api/stocks/price', { stockCode: holding.stockCode });
      if (res.data.success && res.data.currentPrice) {
        setHolding(prev => prev ? {
          ...prev,
          currentPrice: res.data.currentPrice,
          _stockData: res.data,
        } : prev);
      }
    } catch (err) {
      alert('刷新价格失败');
    } finally {
      setRefreshingPrice(false);
    }
  };

  const handleAnalyze = async () => {
    if (!holding) return;
    setAnalyzing(true);
    setAnalysisModal({ loading: true, result: '' });
    try {
      const res = await axios.post('/api/stocks/analyze', {
        stockCode: holding.stockCode,
        stockName: holding.stockName,
        shares: holding.shares,
        costPrice: holding.costPrice,
      });
      if (res.data.success) {
        setAnalysisModal({ loading: false, result: res.data.analysis || '' });
      } else {
        setAnalysisModal({ loading: false, result: '分析失败：' + (res.data.error || '未知错误') });
      }
    } catch (err) {
      setAnalysisModal({
        loading: false,
        result: '分析请求失败：' + (err.response?.data?.error || err.message || '网络错误'),
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEdit = () => {
    if (!holding) return;
    setEditForm({
      stockName: holding.stockName || '',
      stockCode: holding.stockCode || '',
      shares: String(holding.shares || ''),
      costPrice: String(holding.costPrice || ''),
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.stockName.trim() || !editForm.stockCode.trim()) return;
    setSaving(true);
    try {
      const res = await axios.put(`/api/stocks/holdings/${id}`, {
        stockName: editForm.stockName.trim(),
        stockCode: editForm.stockCode.trim().toUpperCase(),
        shares: parseInt(editForm.shares) || 0,
        costPrice: editForm.costPrice || '0.0000',
      });
      if (res.data.success) {
        setHolding(prev => prev ? {
          ...prev,
          ...res.data.holding,
        } : prev);
        setShowEditModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除该持仓吗？此操作不可撤销。')) return;
    try {
      await axios.delete(`/api/stocks/holdings/${id}`);
      navigate('/stock-monitor', { replace: true });
    } catch {
      alert('删除失败');
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

  if (!holding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">持仓数据不存在</p>
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{holding.stockName} · {holding.stockCode}</p>
          <button
            onClick={() => navigate('/stock-monitor')}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            ← 返回股票管家
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* 1. 持仓信息 */}
        <div id="holding-info">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            持仓信息
          </h2>
          <HoldingInfo
            holding={holding}
            onDelete={handleDelete}
            onRefreshPrice={handleRefreshPrice}
            onAnalyze={handleAnalyze}
            onEdit={handleEdit}
          />
        </div>

        <hr className="border-gray-200" />

        {/* 2. 盯盘助手 */}
        <div id="monitor-helper">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            盯盘助手
          </h2>
          <StockMonitorHelper holding={holding} />
        </div>

        <hr className="border-gray-200" />

        {/* 3. 加仓计算器 */}
        <div id="position-calculator">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            加仓计算器
          </h2>
          <PositionCalculator holding={holding} />
        </div>

        <hr className="border-gray-200" />

        {/* 4. AI圆桌讨论 */}
        <div id="ai-discussion">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            AI圆桌讨论
          </h2>
          <PositionIncreaseDiscussion holdingId={id} />
        </div>
      </main>

      {/* 编辑弹窗 */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">编辑持仓</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">股票代码</label>
                <input
                  type="text"
                  value={editForm.stockCode}
                  onChange={e => setEditForm({ ...editForm, stockCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">股票名称</label>
                <input
                  type="text"
                  value={editForm.stockName}
                  onChange={e => setEditForm({ ...editForm, stockName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">持仓数量</label>
                  <input
                    type="number"
                    value={editForm.shares}
                    onChange={e => setEditForm({ ...editForm, shares: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">成本价</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editForm.costPrice}
                    onChange={e => setEditForm({ ...editForm, costPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
              >
                {saving ? '保存中...' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI 分析结果弹窗 */}
      {analysisModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => !analyzing && setAnalysisModal(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-3 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                AI 个股分析
              </h3>
              <button
                onClick={() => setAnalysisModal(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {analysisModal.loading ? (
              <div className="flex flex-col items-center py-16">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">AI 正在分析中，请稍候...</p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {analysisModal.result}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
