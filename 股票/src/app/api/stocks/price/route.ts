import { NextRequest, NextResponse } from "next/server";
import { holdingManager } from "@/storage/database/holdingManager";

// 从新浪财经获取实时股价
async function fetchSinaPrice(stockCode: string): Promise<string | null> {
  try {
    // 新浪财经接口格式：http://hq.sinajs.cn/list=sh601318 或 sz000001
    // 6开头的代码用 sh，0或3开头的用 sz，5开头的ETF用 sh，1开头的ETF用 sz
    let prefix = '';
    if (stockCode.startsWith('6') || stockCode.startsWith('5')) {
      prefix = 'sh';
    } else if (stockCode.startsWith('0') || stockCode.startsWith('3') ||
               stockCode.startsWith('1') || stockCode.startsWith('8') || stockCode.startsWith('9')) {
      prefix = 'sz';
    } else {
      prefix = 'sh'; // 默认
    }

    const code = `${prefix}${stockCode}`;
    const url = `http://hq.sinajs.cn/list=${code}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': 'http://finance.sina.com.cn',
      },
    });

    if (!response.ok) {
      return null;
    }

    const text = await response.text();

    // 解析新浪财经数据格式
    // 示例：var hq_str_sh601318="中国平安,68.53,68.54,68.19,68.27,68.33,68.41,68.42, ..."
    const match = text.match(/"([^"]+)"/);
    if (match) {
      const parts = match[1].split(',');
      if (parts.length > 3) {
        const price = parseFloat(parts[3]); // 当前价在索引3
        if (!isNaN(price) && price > 0 && price < 10000) {
          return price.toFixed(4);
        }
      }
    }

    return null;
  } catch (error) {
    console.error("新浪财经接口失败:", error);
    return null;
  }
}

// 从腾讯财经获取实时股价和详细数据
async function fetchTencentPrice(stockCode: string): Promise<any | null> {
  try {
    // 腾讯财经接口格式：http://qt.gtimg.cn/q=sh601318 或 sz000001
    let prefix = '';
    if (stockCode.startsWith('6') || stockCode.startsWith('5')) {
      prefix = 'sh';
    } else if (stockCode.startsWith('0') || stockCode.startsWith('3') ||
               stockCode.startsWith('1') || stockCode.startsWith('8') || stockCode.startsWith('9')) {
      prefix = 'sz';
    } else {
      prefix = 'sh'; // 默认
    }

    const code = `${prefix}${stockCode}`;
    const url = `http://qt.gtimg.cn/q=${code}`;

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const text = await response.text();

    // 解析腾讯财经数据格式
    // 示例：v_sh601318="1~中国平安~601318~67.64~68.19~68.25~574684~..."
    const match = text.match(/"([^"]+)"/);
    if (match) {
      const parts = match[1].split('~');
      if (parts.length >= 47) {
        const currentPrice = parseFloat(parts[3]);
        const yesterdayClose = parseFloat(parts[4]);
        const todayOpen = parseFloat(parts[5]);
        const volume = parseFloat(parts[6]); // 成交量（手）
        const amount = parseFloat(parts[37]); // 成交额（万元）
        const changeAmount = parseFloat(parts[31]);
        const changePercent = parseFloat(parts[32]);
        const highPrice = parseFloat(parts[41]); // 最高价
        const lowPrice = parseFloat(parts[42]); // 最低价
        const amplitude = parseFloat(parts[43]); // 振幅
        const totalMarketCap = parseFloat(parts[44]); // 总市值（亿）
        const circulateMarketCap = parseFloat(parts[45]); // 流通市值（亿）
        const pb = parseFloat(parts[46]); // 市净率
        const pe = parseFloat(parts[39]); // 市盈率

        // 计算换手率：换手率 = 成交额(万元) / 流通市值(亿元) / 100
        const turnoverRate = (circulateMarketCap > 0 && amount > 0)
          ? (amount / circulateMarketCap / 100)
          : 0;

        if (!isNaN(currentPrice) && currentPrice > 0 && currentPrice < 10000) {
          return {
            currentPrice: currentPrice.toFixed(4),
            yesterdayClose: isNaN(yesterdayClose) ? currentPrice : yesterdayClose,
            todayOpen: isNaN(todayOpen) ? currentPrice : todayOpen,
            highPrice: isNaN(highPrice) ? currentPrice : highPrice,
            lowPrice: isNaN(lowPrice) ? currentPrice : lowPrice,
            volume: isNaN(volume) ? 0 : volume, // 成交量（手）
            amount: isNaN(amount) ? 0 : amount, // 成交额（万元）
            changeAmount: isNaN(changeAmount) ? 0 : changeAmount, // 涨跌额
            changePercent: isNaN(changePercent) ? 0 : changePercent, // 涨跌幅
            amplitude: isNaN(amplitude) ? 0 : amplitude, // 振幅
            turnoverRate: isNaN(turnoverRate) ? 0 : turnoverRate, // 计算得到的换手率
            totalMarketCap: isNaN(totalMarketCap) ? 0 : totalMarketCap, // 总市值（亿）
            circulateMarketCap: isNaN(circulateMarketCap) ? 0 : circulateMarketCap, // 流通市值（亿）
            pe: isNaN(pe) ? 0 : pe, // 市盈率
            pb: isNaN(pb) ? 0 : pb, // 市净率
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("腾讯财经接口失败:", error);
    return null;
  }
}

// 从东方财富获取实时股价和详细数据
async function fetchEastMoneyPrice(stockCode: string): Promise<any | null> {
  try {
    // 东方财富 API
    // 6开头、5开头（沪市ETF）用 1.代码
    // 0、3、1开头（深市ETF）用 0.代码
    let marketId = '1'; // 默认沪市
    if (stockCode.startsWith('0') || stockCode.startsWith('3') ||
        stockCode.startsWith('1') || stockCode.startsWith('8') || stockCode.startsWith('9')) {
      marketId = '0'; // 深市
    }

    // 获取更多字段：价格、涨跌、成交量、市值、估值等
    // 使用 HTTP 而不是 HTTPS 避免连接问题
    const url = `http://push2.eastmoney.com/api/qt/stock/get?secid=${marketId}.${stockCode}&fields=f43,f44,f45,f46,f47,f48,f50,f51,f52,f60,f107,f108,f116,f117,f124,f128,f162,f163,f164`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://quote.eastmoney.com',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.data && data.data.f43) {
      // 判断是否为 ETF
      // ETF 代码：15、16、17、18、19 开头（深市）或 51、56、58、59 开头（沪市）
      const isEtf = stockCode.startsWith('15') || stockCode.startsWith('16') ||
                    stockCode.startsWith('17') || stockCode.startsWith('18') || stockCode.startsWith('19') ||
                    stockCode.startsWith('51') || stockCode.startsWith('56') ||
                    stockCode.startsWith('58') || stockCode.startsWith('59');

      // ETF 价格需要除以 1000，普通股票除以 100
      const divisor = isEtf ? 1000 : 100;
      const price = data.data.f43 / divisor;

      if (!isNaN(price) && price > 0 && price < 10000) {
        // 返回完整数据
        return {
          currentPrice: price.toFixed(4),
          yesterdayClose: data.data.f60 / divisor,
          todayOpen: data.data.f46 / divisor,
          highPrice: data.data.f44 / divisor,
          lowPrice: data.data.f45 / divisor,
          volume: data.data.f47, // 成交量（手）
          amount: data.data.f48, // 成交额
          volumeRatio: data.data.f50 / 1000, // 量比
          changeAmount: data.data.f51 / divisor, // 涨跌额
          changePercent: data.data.f52 / 100, // 涨跌幅
          amplitude: data.data.f107 / 100, // 振幅
          turnoverRate: data.data.f108 / 100, // 换手率
          totalMarketCap: data.data.f116, // 总市值
          circulateMarketCap: data.data.f117, // 流通市值
          pe: data.data.f124 / 100, // 市盈率
          pb: data.data.f128 / 100, // 市净率
        };
      }
    }

    return null;
  } catch (error) {
    console.error("东方财富接口失败:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { stockCode, stockName } = await request.json();

    if (!stockCode) {
      return NextResponse.json(
        { error: "股票代码不能为空" },
        { status: 400 }
      );
    }

    let stockData: any = null;
    let currentPrice: string | null = null;
    const startTime = Date.now();

    // 【优化】并行请求三个接口，取最快成功的那个
    console.log(`并行获取 ${stockCode} 的股价...`);
    
    const results = await Promise.allSettled([
      // 东方财富（数据最全，优先）
      fetchEastMoneyPrice(stockCode).then(data => ({ source: 'eastmoney', data })),
      // 腾讯财经（数据较全）
      fetchTencentPrice(stockCode).then(data => ({ source: 'tencent', data })),
      // 新浪财经（只有当前价，最快）
      fetchSinaPrice(stockCode).then(price => ({ source: 'sina', data: price ? { currentPrice: price } : null })),
    ]);

    // 按优先级选择结果：东方财富 > 腾讯 > 新浪
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.data) {
        stockData = result.value.data;
        console.log(`使用 ${result.value.source} 的数据`);
        break;
      }
    }

    if (stockData) {
      currentPrice = stockData.currentPrice;
    }

    // 更新持仓的 currentPrice
    if (currentPrice) {
      const holding = await holdingManager.getHoldingByCode(stockCode);
      if (holding) {
        await holdingManager.updateHolding(holding.id, {
          currentPrice,
        });
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`获取 ${stockCode} 股价总耗时: ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      stockCode,
      stockName,
      currentPrice,
      ...stockData, // 返回所有维度数据
      timestamp: new Date().toISOString(),
      source: currentPrice ? '直接接口' : null,
    });
  } catch (error) {
    console.error("获取股价失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取股价失败",
      },
      { status: 500 }
    );
  }
}
