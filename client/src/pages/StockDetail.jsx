import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// ==================== 工具函数 ====================

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

// ==================== 子Tab 2: 盯盘助手 ====================

function StockMonitorHelper({ holding }) {
  const currentPrice = holding.currentPrice ? parseFloat(holding.currentPrice) : parseFloat(holding.costPrice) || 0;
  const stockData = holding._stockData || {};
  const changePercent = stockData.changePercent ?? holding.changePercent ?? 0;
  const changeAmount = stockData.changeAmount ?? 0;
  const yesterdayClose = stockData.yesterdayClose ?? currentPrice;
  const todayOpen = stockData.todayOpen ?? currentPrice;
  const highPrice = stockData.highPrice ?? currentPrice;
  const lowPrice = stockData.lowPrice ?? currentPrice;
  const amplitude = stockData.amplitude ?? 0;
  const turnoverRate = stockData.turnoverRate ?? 0;
  const volumeRatio = stockData.volumeRatio ?? 0;

  // 模拟均线数据
  const ma5 = stockData.ma5 ?? currentPrice * (1 + (Math.random() - 0.5) * 0.1);
  const ma20 = stockData.ma20 ?? currentPrice * (1 + (Math.random() - 0.5) * 0.15);
  const ma250 = stockData.ma250 ?? currentPrice * (1 + (Math.random() - 0.5) * 0.3);
  const distFrom250 = ma250 > 0 ? ((currentPrice - ma250) / ma250) * 100 : 0;

  // 模拟盘口数据
  const buyOrders = Array.from({ length: 5 }, (_, i) => ({
    price: currentPrice * (1 - (i + 1) * 0.001),
    volume: Math.floor(Math.random() * 5000 + 500),
  }));
  const sellOrders = Array.from({ length: 5 }, (_, i) => ({
    price: currentPrice * (1 + (i + 1) * 0.001),
    volume: Math.floor(Math.random() * 5000 + 500),
  }));

  // 模拟资金流向
  const mainInflow = stockData.mainInflow ?? Math.random() * 2000 - 1000;
  const bigOrderDirection = stockData.bigOrderDirection ?? (mainInflow > 0 ? '偏多' : '偏空');

  // 模拟融资数据
  const marginBalance = stockData.marginBalance ?? Math.floor(Math.random() * 100000 + 50000);
  const marginChange = stockData.marginChange ?? Math.random() * 2000 - 1000;
  const marginDays = stockData.marginDays ?? Math.floor(Math.random() * 5 + 1);

  // 技术信号计算
  const technicalSignals = useMemo(() => {
    const signals = [];

    // 价格相对均线位置
    if (ma5 > 0) {
      const dist5 = ((currentPrice - ma5) / ma5) * 100;
      if (dist5 > 3) signals.push({ dimension: '5日均线', signal: '短期强势', strength: '强', desc: `价格高于5日线${dist5.toFixed(1)}%` });
      else if (dist5 < -3) signals.push({ dimension: '5日均线', signal: '短期弱势', strength: '弱', desc: `价格低于5日线${Math.abs(dist5).toFixed(1)}%` });
      else signals.push({ dimension: '5日均线', signal: '短期震荡', strength: '中性', desc: `价格紧贴5日线` });
    }

    if (ma20 > 0) {
      const dist20 = ((currentPrice - ma20) / ma20) * 100;
      if (dist20 > 5) signals.push({ dimension: '20日均线', signal: '中期强势', strength: '强', desc: `价格高于20日线${dist20.toFixed(1)}%` });
      else if (dist20 < -5) signals.push({ dimension: '20日均线', signal: '中期弱势', strength: '弱', desc: `价格低于20日线${Math.abs(dist20).toFixed(1)}%` });
      else if (dist20 > 0) signals.push({ dimension: '20日均线', signal: '中期偏强', strength: '中立', desc: `价格略高于20日线` });
      else signals.push({ dimension: '20日均线', signal: '中期偏弱', strength: '中立', desc: `价格略低于20日线` });
    }

    // 年线风险
    if (ma250 > 0) {
      if (distFrom250 > 20) signals.push({ dimension: '年线偏离', signal: '高位风险', strength: '风险', desc: `距年线${distFrom250.toFixed(1)}%，偏离过大` });
      else if (distFrom250 < -20) signals.push({ dimension: '年线偏离', signal: '深度超跌', strength: '风险', desc: `距年线${Math.abs(distFrom250).toFixed(1)}%，超跌严重` });
      else if (distFrom250 > 0) signals.push({ dimension: '年线偏离', signal: '年线上方', strength: '强', desc: `高于年线${distFrom250.toFixed(1)}%` });
      else signals.push({ dimension: '年线偏离', signal: '年线下方', strength: '弱', desc: `低于年线${Math.abs(distFrom250).toFixed(1)}%` });
    }

    // 振幅
    if (amplitude > 5) signals.push({ dimension: '振幅', signal: '波动剧烈', strength: '风险', desc: `振幅${amplitude.toFixed(2)}%` });
    else signals.push({ dimension: '振幅', signal: '波动正常', strength: '中性', desc: `振幅${amplitude.toFixed(2)}%` });

    // 量比
    if (volumeRatio > 2) signals.push({ dimension: '量比', signal: '放量明显', strength: '强', desc: `量比${volumeRatio.toFixed(2)}` });
    else if (volumeRatio > 1.2) signals.push({ dimension: '量比', signal: '温和放量', strength: '中立', desc: `量比${volumeRatio.toFixed(2)}` });
    else if (volumeRatio > 0.8) signals.push({ dimension: '量比', signal: '成交量平稳', strength: '中性', desc: `量比${volumeRatio.toFixed(2)}` });
    else signals.push({ dimension: '量比', signal: '缩量', strength: '弱', desc: `量比${volumeRatio.toFixed(2)}` });

    return signals;
  }, [currentPrice, ma5, ma20, ma250, distFrom250, amplitude, volumeRatio]);

  // 最强信号
  const strongestSignal = useMemo(() => {
    const strong = technicalSignals.filter(s => s.strength === '强');
    if (strong.length > 0) return strong[0];
    const risky = technicalSignals.filter(s => s.strength === '风险');
    if (risky.length > 0) return risky[0];
    return technicalSignals[0] || null;
  }, [technicalSignals]);

  return (
    <div className="space-y-4">
      {/* 股价全景 - 6列 */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          股价全景
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
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
            <p className="text-xs text-gray-500 mb-1">5日线</p>
            <p className="text-sm font-mono font-bold text-gray-900">¥{ma5.toFixed(4)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">20日线</p>
            <p className="text-sm font-mono font-bold text-gray-900">¥{ma20.toFixed(4)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">年线</p>
            <p className="text-sm font-mono font-bold text-gray-900">¥{ma250.toFixed(4)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">距年线</p>
            <p className={`text-sm font-mono font-bold ${distFrom250 >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {distFrom250 >= 0 ? '+' : ''}{distFrom250.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* 资金监测 + 融资情绪 双列 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 资金监测 */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            资金监测
          </h3>
          {/* 盘口挂单 */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">买盘</p>
              <div className="space-y-1">
                {buyOrders.map((order, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-500 font-mono">买{i + 1}</span>
                    <span className="text-red-600 font-mono">{order.price.toFixed(2)}</span>
                    <span className="text-gray-400 font-mono">{order.volume}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">卖盘</p>
              <div className="space-y-1">
                {sellOrders.map((order, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-500 font-mono">卖{i + 1}</span>
                    <span className="text-green-600 font-mono">{order.price.toFixed(2)}</span>
                    <span className="text-gray-400 font-mono">{order.volume}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <div>
              <p className="text-xs text-gray-500">主力净流入</p>
              <p className={`text-sm font-mono font-bold ${mainInflow >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {mainInflow >= 0 ? '+' : ''}{(mainInflow / 10000).toFixed(2)}万
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">大单方向</p>
              <p className={`text-sm font-mono font-bold ${bigOrderDirection === '偏多' ? 'text-red-600' : 'text-green-600'}`}>
                {bigOrderDirection}
              </p>
            </div>
          </div>
        </div>

        {/* 融资情绪 */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            融资情绪
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">融资余额</p>
              <p className="text-xl font-mono font-bold text-gray-900">{(marginBalance / 10000).toFixed(2)}<span className="text-sm font-normal text-gray-500">万</span></p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">环比变化</p>
              <p className={`text-lg font-mono font-bold ${marginChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {marginChange >= 0 ? '+' : ''}{(marginChange / 10000).toFixed(2)}万
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">连续天数</p>
              <p className={`text-lg font-mono font-bold ${marginChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {marginChange >= 0 ? '增加' : '减少'} <span className="text-gray-900">{marginDays}</span> 天
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 技术信号 */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          技术信号
        </h3>

        {/* 最强信号 */}
        {strongestSignal && (
          <div className={`rounded-lg p-3 mb-3 ${
            strongestSignal.strength === '强' ? 'bg-red-50 border border-red-200' :
            strongestSignal.strength === '风险' ? 'bg-amber-50 border border-amber-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <p className="text-xs text-gray-500 mb-1">最强信号维度</p>
            <p className={`text-sm font-bold ${
              strongestSignal.strength === '强' ? 'text-red-700' :
              strongestSignal.strength === '风险' ? 'text-amber-700' :
              'text-gray-700'
            }`}>
              {strongestSignal.dimension} · {strongestSignal.signal}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{strongestSignal.desc}</p>
          </div>
        )}

        {/* 信号列表 */}
        <div className="grid gap-2 md:grid-cols-2">
          {technicalSignals.map((signal, idx) => (
            <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
              <div>
                <span className="text-xs font-medium text-gray-700">{signal.dimension}</span>
                <span className="text-xs text-gray-400 ml-2">{signal.desc}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                signal.strength === '强' ? 'bg-red-100 text-red-700' :
                signal.strength === '弱' ? 'bg-green-100 text-green-700' :
                signal.strength === '风险' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {signal.signal}
              </span>
            </div>
          ))}
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
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(analysisModal.result) }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
