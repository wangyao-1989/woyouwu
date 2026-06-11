"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Building2, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { StockMiniChart, generateTrendData } from "@/components/StockMiniChart";

interface StockData {
  currentPrice: string;
  yesterdayClose: string;
  todayOpen: string;
  highPrice: string;
  lowPrice: string;
  changeAmount: string;
  changePercent: string;
  volume: number;
  amount: number;
  amplitude: string;
  turnoverRate: string;
  totalMarketCap: number;
  circulateMarketCap: number;
  pe: number;
  pb: number;
  trendData?: number[];
  turnoverAnalysis?: string; // 换手率分析
}

interface MarketCompany {
  id: string;
  marketId: string;
  stockCode: string;
  stockName: string;
  link: string;
  description?: string;
  marketCap?: number;
  createdAt: string;
  updatedAt: string;
  stockData?: StockData;
}

interface PotentialMarket {
  id: string;
  name: string;
  description: string;
  attentionScore: number;
  potentialScore: number;
  marketType?: string; // 市场类型：potential 或 hot
  icon?: string;
  tags: string[];
  analysis?: { content?: string; generatedAt?: string }; // LLM 深度分析
  createdAt: string;
  updatedAt: string;
  companies: MarketCompany[];
}

// 产业链环节的中文映射
const linkMapping: Record<string, string> = {
  'raw_material': '原料供应',
  'raw_processing': '原料加工',
  'production': '生产制造',
  'design': '研发设计',
  'sales': '销售渠道',
  'service': '配套服务',
  'chip': '芯片设计',
  'equipment': '设备制造',
  'software': '软件开发',
  'integration': '系统集成',
  'testing': '检测认证',
  'packaging': '封装测试',
  'material': '材料研发',
  'component': '零部件供应',
  'assembly': '组装制造',
  'distribution': '分销渠道',
  'retail': '零售终端',
};

// 产业链环节的颜色映射
const linkColorMapping: Record<string, string> = {
  'raw_material': 'bg-amber-50 text-amber-700 border-amber-200',
  'raw_processing': 'bg-orange-50 text-orange-700 border-orange-200',
  'production': 'bg-blue-50 text-blue-700 border-blue-200',
  'design': 'bg-purple-50 text-purple-700 border-purple-200',
  'sales': 'bg-green-50 text-green-700 border-green-200',
  'service': 'bg-slate-50 text-slate-700 border-slate-200',
  'chip': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'equipment': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'software': 'bg-pink-50 text-pink-700 border-pink-200',
  'integration': 'bg-teal-50 text-teal-700 border-teal-200',
  'testing': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'packaging': 'bg-lime-50 text-lime-700 border-lime-200',
  'material': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'component': 'bg-red-50 text-red-700 border-red-200',
  'assembly': 'bg-violet-50 text-violet-700 border-violet-200',
  'distribution': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  'retail': 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [market, setMarket] = useState<PotentialMarket | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLink, setSelectedLink] = useState<string>("all");
  const [analysis, setAnalysis] = useState<string>("");
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [analysisExists, setAnalysisExists] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<string>("");
  const [generatingEnhancedAnalysis, setGeneratingEnhancedAnalysis] = useState(false);
  const [showEnhancedAnalysis, setShowEnhancedAnalysis] = useState(false);
  const [seriousAnalysis, setSeriousAnalysis] = useState<string>("");
  const [generatingSeriousAnalysis, setGeneratingSeriousAnalysis] = useState(false);
  const [showSeriousAnalysis, setShowSeriousAnalysis] = useState(false);
  const [analysisType, setAnalysisType] = useState<"basic" | "enhanced" | "serious">("basic");
  const [refreshingStocks, setRefreshingStocks] = useState(false);

  useEffect(() => {
    fetchMarket();
    fetchAnalysis();
  }, [id]);

  const fetchMarket = async () => {
    try {
      console.log("[fetchMarket] 开始获取市场详情");
      const response = await fetch(`/api/markets/${id}?includeCompanies=true`);
      const data = await response.json();

      console.log("[fetchMarket] 获取到市场数据:", data);

      if (data.success) {
        setMarket(data.market);
        console.log("[fetchMarket] 设置市场数据，企业数量:", data.market.companies?.length || 0);

        // 获取企业股价
        if (data.market.companies && data.market.companies.length > 0) {
          console.log("[fetchMarket] 开始获取股价");
          fetchStockPrices(data.market.companies);
        } else {
          console.log("[fetchMarket] 没有企业，不获取股价");
        }
      } else {
        toast.error("获取潜力市场详情失败");
        router.push("/");
      }
    } catch (error) {
      console.error("[fetchMarket] 获取潜力市场详情失败:", error);
      toast.error("获取潜力市场详情失败");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchStockPrices = async (companies: MarketCompany[]) => {
    try {
      setLoadingPrices(true);
      const stockCodes = companies.map(c => c.stockCode);
      console.log("[fetchStockPrices] 开始获取股价，股票代码:", stockCodes);

      // 批量获取股价
      const pricePromises = stockCodes.map(code =>
        fetch('/api/stocks/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stockCode: code, stockName: '' })
        })
          .then(res => {
            console.log(`[fetchStockPrices] ${code} HTTP状态:`, res.status);
            return res.json();
          })
          .then(data => {
            console.log(`[fetchStockPrices] ${code} 返回数据:`, data);
            return { code, data };
          })
          .catch(error => {
            console.error(`[fetchStockPrices] ${code} 获取股价失败:`, error);
            return { code, data: null };
          })
      );

      const results = await Promise.all(pricePromises);
      console.log("[fetchStockPrices] 所有股价结果:", results);

      // 批量获取换手率分析
      const turnoverAnalysisPromises = results
        .filter(r => r.data && r.data.success && parseFloat(r.data.turnoverRate) > 0)
        .map(r =>
          fetch('/api/stocks/turnover-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stockCode: r.code,
              stockName: companies.find(c => c.stockCode === r.code)?.stockName || '',
              turnoverRate: r.data.turnoverRate,
              currentPrice: r.data.currentPrice,
              changePercent: r.data.changePercent,
              volume: r.data.volume,
              amount: r.data.amount,
            }),
          })
            .then(res => res.json())
            .then(data => ({ code: r.code, analysis: data.analysis }))
            .catch(error => ({ code: r.code, analysis: null }))
        );

      const turnoverResults = await Promise.all(turnoverAnalysisPromises);
      console.log("[fetchStockPrices] 所有换手率分析结果:", turnoverResults);

      // 更新市场数据中的股价信息
      setMarket(prev => {
        if (!prev) {
          console.log("[fetchStockPrices] prev 为空");
          return null;
        }
        console.log("[fetchStockPrices] 开始更新公司列表，当前公司数:", prev.companies.length);

        const updatedCompanies = prev.companies.map(company => {
          const result = results.find(r => r.code === company.stockCode);
          const turnoverResult = turnoverResults.find(tr => tr.code === company.stockCode);
          console.log(`[fetchStockPrices] 处理公司 ${company.stockName} (${company.stockCode}):`, result);

          if (result?.data && result.data.success) {
            console.log(`[fetchStockPrices] ${company.stockName} 有有效股价数据`);
            // 生成走势数据（模拟）
            const currentPrice = parseFloat(result.data.currentPrice);
            const changePercent = parseFloat(result.data.changePercent);
            const trendData = generateTrendData(currentPrice * (1 - changePercent / 100), changePercent);

            return {
              ...company,
              stockData: {
                ...result.data,
                trendData,
                turnoverAnalysis: turnoverResult?.analysis || null,
              }
            };
          } else {
            console.log(`[fetchStockPrices] ${company.stockName} 无有效股价数据`);
          }
          return company;
        });

        console.log("[fetchStockPrices] 更新后的公司列表，有股价的公司数:",
          updatedCompanies.filter(c => c.stockData).length);

        const newMarket = { ...prev, companies: updatedCompanies };
        console.log("[fetchStockPrices] 返回新市场对象");
        return newMarket;
      });
    } catch (error) {
      console.error("[fetchStockPrices] 获取股价失败:", error);
    } finally {
      setLoadingPrices(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`/api/markets/${id}/analysis`);
      const data = await response.json();
      if (data.exists && data.content) {
        setAnalysis(data.content);
        setAnalysisExists(true);
      }
    } catch (error) {
      console.error("获取分析内容失败:", error);
    }
  };

  const generateAnalysis = async () => {
    try {
      setGeneratingAnalysis(true);
      setAnalysis("");

      const response = await fetch(`/api/markets/${id}/analysis`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("生成分析失败");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          setAnalysis(prev => prev + text);
        }
      }

      setAnalysisExists(true);
      toast.success("分析生成成功");
    } catch (error) {
      console.error("生成分析失败:", error);
      toast.error("生成分析失败");
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const generateEnhancedAnalysis = async () => {
    try {
      setGeneratingEnhancedAnalysis(true);
      setEnhancedAnalysis("");
      setShowEnhancedAnalysis(true);

      const response = await fetch(`/api/markets/${id}/enhanced-analysis`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("生成增强分析失败");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          setEnhancedAnalysis(prev => prev + text);
        }
      }

      toast.success("增强分析生成成功");
    } catch (error) {
      console.error("生成增强分析失败:", error);
      toast.error("生成增强分析失败");
    } finally {
      setGeneratingEnhancedAnalysis(false);
    }
  };

  const generateSeriousAnalysis = async () => {
    try {
      setGeneratingSeriousAnalysis(true);
      setSeriousAnalysis("");
      setShowSeriousAnalysis(true);

      const response = await fetch(`/api/markets/${id}/serious-analysis`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("生成严肃版分析失败");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          setSeriousAnalysis(prev => prev + text);
        }
      }

      toast.success("严肃版分析生成成功");
    } catch (error) {
      console.error("生成严肃版分析失败:", error);
      toast.error("生成严肃版分析失败");
    } finally {
      setGeneratingSeriousAnalysis(false);
    }
  };

  // 刷新概念股
  const handleRefreshStocks = async () => {
    try {
      setRefreshingStocks(true);
      toast.info("正在刷新概念股，请稍候...");

      const response = await fetch(`/api/markets/${id}/refresh-stocks`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        // 重新获取市场数据
        await fetchMarket();
      } else {
        toast.error(data.error || "刷新概念股失败");
      }
    } catch (error) {
      console.error("刷新概念股失败:", error);
      toast.error("刷新概念股失败");
    } finally {
      setRefreshingStocks(false);
    }
  };

  // 按产业链环节分组
  const groupedCompanies = market ? market.companies.reduce((acc, company) => {
    const link = company.link || 'other';
    if (!acc[link]) {
      acc[link] = [];
    }
    acc[link].push(company);
    return acc;
  }, {} as Record<string, MarketCompany[]>) : {};

  // 获取所有唯一的产业链环节
  const allLinks = Object.keys(groupedCompanies);

  // 根据选中的环节筛选公司
  const filteredCompanies = selectedLink === "all"
    ? market?.companies || []
    : groupedCompanies[selectedLink] || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">潜力市场不存在</h2>
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    {market.name}
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* 市场概览 */}
        <Card>
          <CardHeader>
            <CardTitle>市场概览</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 标签 */}
            {market.tags && market.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {market.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* 描述 */}
            <p className="text-muted-foreground">{market.description}</p>

            {/* 评分 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">潜力评分</span>
                  <span className="text-2xl font-bold text-purple-600">{market.potentialScore}/100</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                    style={{ width: `${market.potentialScore}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">市场关注度</span>
                  <span className="text-2xl font-bold text-slate-600 dark:text-slate-400">{market.attentionScore}/100</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-slate-400 to-slate-500 transition-all duration-500"
                    style={{ width: `${market.attentionScore}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 深度分析 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  深度分析
                  {market.marketType === "hot" && (
                    <Badge variant="destructive" className="ml-2">热门板块</Badge>
                  )}
                  {market.marketType === "potential" && (
                    <Badge variant="secondary" className="ml-2">潜力市场</Badge>
                  )}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={analysisType === "basic" ? "default" : "outline"}
                  onClick={() => {
                    setAnalysisType("basic");
                    setShowEnhancedAnalysis(false);
                    setShowSeriousAnalysis(false);
                  }}
                  size="sm"
                >
                  基础分析
                </Button>
                <Button
                  variant={analysisType === "enhanced" ? "default" : "outline"}
                  onClick={() => {
                    setAnalysisType("enhanced");
                    setShowEnhancedAnalysis(true);
                    setShowSeriousAnalysis(false);
                    if (!enhancedAnalysis) {
                      generateEnhancedAnalysis();
                    }
                  }}
                  size="sm"
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  增强分析
                </Button>
                <Button
                  variant={analysisType === "serious" ? "default" : "outline"}
                  onClick={() => {
                    setAnalysisType("serious");
                    setShowSeriousAnalysis(true);
                    setShowEnhancedAnalysis(false);
                    if (!seriousAnalysis) {
                      generateSeriousAnalysis();
                    }
                  }}
                  size="sm"
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <AlertTriangle className="w-4 h-4" />
                  严肃版分析
                  <Badge className="ml-1 bg-yellow-400 text-yellow-900 hover:bg-yellow-500">推荐</Badge>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {analysisType === "serious" ? (
              // 严肃版深度分析（推荐）
              <>
                {generatingSeriousAnalysis ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-4 space-x-2">
                      <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-muted-foreground font-medium">正在生成严肃版深度分析...</span>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 text-xs space-y-2">
                      <p className="font-semibold text-red-900 dark:text-red-100">📊 分析团队（五位专家）</p>
                      <div className="text-red-800 dark:text-red-200 space-y-1">
                        <p>• 📈 技术分析师：分析A股技术走势</p>
                        <p>• 🏢 基本面分析师：分析行业竞争力</p>
                        <p>• 🌐 全球市场分析师：分析美股/港股涨势联动</p>
                        <p>• 📰 资讯分析师：分析最新利好/利空</p>
                        <p>• 💰 首席投资分析师：综合给出投资建议</p>
                      </div>
                      <p className="font-semibold text-red-900 dark:text-red-100 mt-3">🌍 全球关联分析</p>
                      <div className="text-red-800 dark:text-red-200 space-y-1">
                        <p>• 实时获取美股/港股相关性股票涨势</p>
                        <p>• 分析全球市场对A股的影响</p>
                        <p>• 结合国际市场动态判断投资机会</p>
                      </div>
                      <p className="font-semibold text-red-900 dark:text-red-100 mt-3">⚠️ 严格时效性</p>
                      <div className="text-red-800 dark:text-red-200">
                        <p>• 基于近3天最新资讯</p>
                        <p>• 获取实时全球股票涨势信息</p>
                        <p>• 交叉验证确保分析全面</p>
                      </div>
                    </div>
                  </div>
                ) : seriousAnalysis ? (
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap">{seriousAnalysis}</div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-500" />
                    <p className="text-lg font-semibold text-muted-foreground">严肃版深度分析</p>
                    <p className="text-sm text-muted-foreground mt-2">推荐用于严肃投资决策</p>
                    <div className="mt-4 text-xs text-muted-foreground space-y-2 max-w-md mx-auto">
                      <p>✨ 五位专家AI并行分析，再交叉讨论</p>
                      <p>🌍 集成美股/港股实时涨势信息</p>
                      <p>📰 深度分析近3天最新资讯</p>
                      <p>🎯 给出明确、可操作的投资建议</p>
                      <p>⚠️ 基于最新讯息，严格时效性</p>
                    </div>
                  </div>
                )}
              </>
            ) : analysisType === "enhanced" ? (
              // 增强深度分析
              <>
                {generatingEnhancedAnalysis ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-4 space-x-2">
                      <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-muted-foreground">正在生成增强深度分析...</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>📊 技术分析师：分析价格走势和技术指标</p>
                      <p>🏢 基本面分析师：分析行业地位和竞争优势</p>
                      <p>🌐 市场分析师：分析宏观环境和最新资讯</p>
                      <p>💰 综合分析师：提供最终投资建议</p>
                    </div>
                  </div>
                ) : enhancedAnalysis ? (
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap">{enhancedAnalysis}</div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>暂无增强深度分析</p>
                    <p className="text-sm mt-1">点击"增强深度分析"按钮，获取多AI模型深度分析报告</p>
                    <div className="mt-4 text-xs text-muted-foreground space-y-1">
                      <p>✨ 包含技术、基本面、市场多维度分析</p>
                      <p>🌍 集成国内外相关性股票对比</p>
                      <p>📰 基于最新行业资讯和新闻</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // 基础分析
              <>
                {!analysisExists && !generatingAnalysis && (
                  <Button
                    onClick={generateAnalysis}
                    size="sm"
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    生成分析
                  </Button>
                )}
                {generatingAnalysis ? (
                  <div className="flex items-center justify-center py-8 space-x-2">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-muted-foreground">正在生成深度分析...</span>
                  </div>
                ) : analysis ? (
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap">{analysis}</div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>暂无深度分析</p>
                    <p className="text-sm mt-1">点击"生成分析"按钮，获取 AI 深度分析报告</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* 产业链企业 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                产业链企业 ({market.companies.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshStocks}
                disabled={refreshingStocks}
                className="gap-2"
              >
                {refreshingStocks ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    刷新中...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    刷新概念股
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 产业链环节筛选 */}
            {allLinks.length > 1 && (
              <div>
                <p className="text-sm text-muted-foreground mb-3">按产业链环节筛选:</p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedLink === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLink("all")}
                  >
                    全部 ({market.companies.length})
                  </Button>
                  {allLinks.map((link) => (
                    <Button
                      key={link}
                      variant={selectedLink === link ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedLink(link)}
                    >
                      {linkMapping[link] || link} ({groupedCompanies[link].length})
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* 企业列表 */}
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无企业数据</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredCompanies.map((company) => (
                  <Card
                    key={company.id}
                    className="hover:shadow-lg transition-all duration-200"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base font-bold">
                              {company.stockName}
                            </CardTitle>
                            <span className="text-xs text-muted-foreground font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {company.stockCode}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs border ${
                              linkColorMapping[company.link] || 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {linkMapping[company.link] || company.link}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {company.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {company.description}
                        </p>
                      )}

                      {/* 实时股价信息 */}
                      {company.stockData ? (
                        <div className="space-y-3 pt-2 border-t">
                          {/* 走势图 */}
                          {company.stockData.trendData && (
                            <div className="h-10">
                              <StockMiniChart
                                data={company.stockData.trendData}
                                width={200}
                                height={40}
                              />
                            </div>
                          )}

                          <div className="flex items-baseline justify-between">
                            <div>
                              <span className="text-2xl font-bold">
                                {company.stockData.currentPrice}
                              </span>
                              <span className="text-sm text-muted-foreground ml-1">元</span>
                            </div>
                            <div className={`text-right ${
                              parseFloat(company.stockData.changePercent) > 0
                                ? 'text-red-600'
                                : parseFloat(company.stockData.changePercent) < 0
                                ? 'text-green-600'
                                : 'text-slate-600'
                            }`}>
                              <div className="text-sm font-medium">
                                {parseFloat(company.stockData.changePercent) > 0 ? '+' : ''}
                                {company.stockData.changePercent}%
                              </div>
                              <div className="text-xs">
                                {parseFloat(company.stockData.changeAmount) > 0 ? '+' : ''}
                                {company.stockData.changeAmount}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>最高: {company.stockData.highPrice}</div>
                            <div>最低: {company.stockData.lowPrice}</div>
                            <div>换手率: {company.stockData.turnoverRate}%</div>
                            <div>成交额: {(company.stockData.amount / 10000).toFixed(2)}亿</div>
                          </div>

                          {/* 换手率分析 */}
                          {company.stockData.turnoverAnalysis && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs font-semibold text-purple-600 mb-1">换手率分析</p>
                              <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                                {company.stockData.turnoverAnalysis}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
                          {loadingPrices ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>加载股价...</span>
                            </div>
                          ) : (
                            <span>暂无股价数据</span>
                          )}
                        </div>
                      )}

                      {company.marketCap && !company.stockData && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="font-medium">
                            ¥{company.marketCap.toLocaleString()} 亿
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
