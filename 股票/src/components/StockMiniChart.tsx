import React from "react";

interface StockMiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function StockMiniChart({
  data,
  width = 100,
  height = 40,
  color,
}: StockMiniChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // 生成SVG路径
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  // 根据涨跌决定颜色
  const lineColor = color || (data[data.length - 1] > data[0] ? "#ef4444" : "#22c55e");
  const areaColor = color ? `${color}20` : (data[data.length - 1] > data[0] ? "#ef444420" : "#22c55e20");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {/* 填充区域 */}
      <path
        d={`${pathD} L ${width},${height} L 0,${height} Z`}
        fill={areaColor}
        stroke="none"
      />
      {/* 折线 */}
      <path
        d={pathD}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 模拟生成走势数据（实际应用中应从API获取）
export function generateTrendData(startPrice: number, changePercent: number, days = 30): number[] {
  const data: number[] = [startPrice];
  const dailyChange = (changePercent / 100) / days;

  for (let i = 1; i < days; i++) {
    const volatility = (Math.random() - 0.5) * 0.02; // 2%的波动
    const trend = dailyChange;
    const newValue = data[i - 1] * (1 + trend + volatility);
    data.push(newValue);
  }

  return data;
}
