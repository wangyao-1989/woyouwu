/**
 * A股与美股/港股相关性股票映射表
 *
 * 用于全球关联分析，展示A股标的在海外市场的对标企业
 */

interface RelatedStock {
  /** A股公司名称 */
  aStockName: string;
  /** A股股票代码 */
  aStockCode: string;
  /** 美股对标公司名称（如有） */
  usName?: string;
  /** 美股股票代码（如有） */
  usStock?: string;
  /** 港股对标公司名称（如有） */
  hkName?: string;
  /** 港股股票代码（如有） */
  hkStock?: string;
  /** 所属概念/行业 */
  concept: string;
}

const relatedStocksMap: Record<string, RelatedStock> = {
  // 新能源与汽车
  "300750": {
    aStockName: "宁德时代",
    aStockCode: "300750",
    usName: "Tesla",
    usStock: "TSLA",
    concept: "动力电池"
  },
  "002594": {
    aStockName: "比亚迪",
    aStockCode: "002594",
    usName: "Tesla",
    usStock: "TSLA",
    concept: "电动汽车"
  },
  "002460": {
    aStockName: "赣锋锂业",
    aStockCode: "002460",
    usName: "Albemarle",
    usStock: "ALB",
    concept: "锂矿资源"
  },
  "300014": {
    aStockName: "亿纬锂能",
    aStockCode: "300014",
    usName: "QuantumScape",
    usStock: "QS",
    concept: "动力电池"
  },

  // 半导体与芯片
  "688981": {
    aStockName: "中芯国际",
    aStockCode: "688981",
    usName: "Taiwan Semiconductor",
    usStock: "TSM",
    concept: "晶圆代工"
  },
  "002049": {
    aStockName: "紫光国微",
    aStockCode: "002049",
    usName: "NVIDIA",
    usStock: "NVDA",
    concept: "FPGA芯片"
  },
  "688036": {
    aStockName: "传音控股",
    aStockCode: "688036",
    usName: "Apple",
    usStock: "AAPL",
    concept: "消费电子"
  },
  "600584": {
    aStockName: "长电科技",
    aStockCode: "600584",
    usName: "ASE Technology",
    usStock: "ASX",
    concept: "半导体封测"
  },

  // 云计算与AI
  "603881": {
    aStockName: "数据港",
    aStockCode: "603881",
    usName: "Equinix",
    usStock: "EQIX",
    concept: "数据中心"
  },
  "002230": {
    aStockName: "科大讯飞",
    aStockCode: "002230",
    usName: "OpenAI",
    concept: "人工智能"
  },
  "300033": {
    aStockName: "同花顺",
    aStockCode: "300033",
    usName: "Bloomberg",
    concept: "金融科技"
  },
  "002405": {
    aStockName: "四维图新",
    aStockCode: "002405",
    usName: "Google",
    usStock: "GOOGL",
    concept: "高精地图"
  },

  // 量子计算
  "002706": {
    aStockName: "良信股份",
    aStockCode: "002706",
    usName: "Vertiv",
    usStock: "VRT",
    concept: "数据中心设备"
  },
  "600460": {
    aStockName: "士兰微",
    aStockCode: "600460",
    usName: "Intel",
    usStock: "INTC",
    concept: "功率半导体"
  },

  // 通信设备
  "000063": {
    aStockName: "中兴通讯",
    aStockCode: "000063",
    usName: "Cisco",
    usStock: "CSCO",
    concept: "通信设备"
  },
  "300454": {
    aStockName: "深信服",
    aStockCode: "300454",
    usName: "Palo Alto Networks",
    usStock: "PANW",
    concept: "网络安全"
  },

  // 医药生物
  "300015": {
    aStockName: "爱尔眼科",
    aStockCode: "300015",
    usName: "Johnson & Johnson",
    usStock: "JNJ",
    concept: "医疗服务"
  },
  "300760": {
    aStockName: "迈瑞医疗",
    aStockCode: "300760",
    usName: "Medtronic",
    usStock: "MDT",
    concept: "医疗器械"
  },
  "600276": {
    aStockName: "恒瑞医药",
    aStockCode: "600276",
    usName: "Pfizer",
    usStock: "PFE",
    concept: "创新药"
  },

  // 消费与零售
  "000858": {
    aStockName: "五粮液",
    aStockCode: "000858",
    usName: "Diageo",
    usStock: "DEO",
    concept: "白酒"
  },
  "600519": {
    aStockName: "贵州茅台",
    aStockCode: "600519",
    usName: "LVMH",
    usStock: "LVMUY",
    concept: "奢侈品"
  },

  // 工业与制造
  "000651": {
    aStockName: "格力电器",
    aStockCode: "000651",
    usName: "Carrier Global",
    usStock: "CARR",
    concept: "家电"
  },
  "002415": {
    aStockName: "海康威视",
    aStockCode: "002415",
    usName: "Ambarella",
    usStock: "AMBA",
    concept: "安防监控"
  },
};

/**
 * 根据A股股票代码查找相关性股票
 * @param stockCode A股股票代码（如 "300750"）
 * @returns 相关性股票信息，如果没有找到则返回 null
 */
export function findRelatedStocks(stockCode: string): RelatedStock | null {
  return relatedStocksMap[stockCode] || null;
}

/**
 * 获取所有相关性股票映射
 * @returns 所有相关性股票的映射表
 */
export function getAllRelatedStocks(): Record<string, RelatedStock> {
  return relatedStocksMap;
}

/**
 * 根据概念筛选相关性股票
 * @param concept 概念名称（如 "动力电池"）
 * @returns 符合概念的股票列表
 */
export function findStocksByConcept(concept: string): RelatedStock[] {
  return Object.values(relatedStocksMap).filter(
    stock => stock.concept.includes(concept)
  );
}
