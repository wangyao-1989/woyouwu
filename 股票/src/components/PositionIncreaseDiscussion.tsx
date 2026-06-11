"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ThumbsUp, ThumbsDown, Minus, Sparkles, AlertTriangle, Target, TrendingUp, Clock, ChevronDown, ChevronUp, Shield, DollarSign, Crosshair, History, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AIDiscussionsData, PositionIncreaseSuggestion } from "@/storage/database/shared/schema";

interface DiscussionResult {
  id: string;
  stockCode: string;
  stockName: string;
  sector?: string;
  discussions: AIDiscussionsData;
  decision: "agree" | "disagree" | "neutral";
  suggestion: PositionIncreaseSuggestion;
  confidence: number;
  consensus: boolean;
  finalVote: { agree: number; disagree: number; neutral: number };
  createdAt: string;
}

interface PositionIncreaseDiscussionProps {
  holdingId: string;
  stockCode: string;
  stockName: string;
  sector?: string;
  onDiscussionComplete?: () => void;
}

export default function PositionIncreaseDiscussion({
  holdingId,
  stockCode,
  stockName,
  sector,
  onDiscussionComplete
}: PositionIncreaseDiscussionProps) {
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [discussion, setDiscussion] = useState<DiscussionResult | null>(null);
  const [history, setHistory] = useState<DiscussionResult[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  const [showEntryPoints, setShowEntryPoints] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // 加载历史记录
  useEffect(() => {
    fetchHistory();
  }, [holdingId]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/holdings/${holdingId}/position-increase-discussion`);
      const data = await response.json();
      if (data.success && data.discussions && data.discussions.length > 0) {
        // 转换数据格式
        const formattedHistory = data.discussions.map((d: any) => ({
          id: d.id,
          stockCode: d.stockCode,
          stockName: d.stockName,
          sector: d.sector,
          discussions: d.discussions,
          decision: d.finalDecision,
          suggestion: d.finalSuggestion,
          confidence: d.confidenceScore,
          consensus: d.discussions?.consensus ?? false,
          finalVote: d.discussions?.finalVote ?? { agree: 0, disagree: 0, neutral: 0 },
          createdAt: d.createdAt
        }));
        setHistory(formattedHistory);
        // 默认显示最新的讨论
        setDiscussion(formattedHistory[0]);
      }
    } catch (error) {
      console.error("加载历史记录失败:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const startDiscussion = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/holdings/${holdingId}/position-increase-discussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error("讨论请求失败");
      }

      const data = await response.json();
      if (data.success) {
        setDiscussion(data.discussion);
        // 刷新历史记录
        await fetchHistory();
        toast.success("AI讨论完成！");
        onDiscussionComplete?.();
      } else {
        toast.error(data.error || "讨论失败");
      }
    } catch (error) {
      console.error("讨论失败:", error);
      toast.error("发起讨论失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const getDecisionConfig = (decision: string) => {
    switch (decision) {
      case "agree": 
        return { 
          label: "建议加仓", 
          color: "text-red-600", 
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-400"
        };
      case "disagree": 
        return { 
          label: "不建议加仓", 
          color: "text-green-600", 
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-400"
        };
      default: 
        return { 
          label: "建议观望", 
          color: "text-amber-600", 
          bgColor: "bg-amber-50 dark:bg-amber-900/20",
          borderColor: "border-amber-400"
        };
    }
  };

  const getOpinionIcon = (opinion: string) => {
    switch (opinion) {
      case "agree": return <ThumbsUp className="w-4 h-4 text-red-600" />;
      case "disagree": return <ThumbsDown className="w-4 h-4 text-green-600" />;
      default: return <Minus className="w-4 h-4 text-amber-600" />;
    }
  };

  const getOpinionLabel = (opinion: string) => {
    switch (opinion) {
      case "agree": return "同意加仓";
      case "disagree": return "反对加仓";
      default: return "中立观望";
    }
  };

  const decisionConfig = discussion ? getDecisionConfig(discussion.decision) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            AI圆桌讨论
          </span>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="gap-1 text-xs h-7"
              >
                <History className="w-3.5 h-3.5" />
                历史记录 ({history.length})
              </Button>
            )}
            {discussion && (
              <Badge variant="outline" className="text-xs font-normal">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(discussion.createdAt).toLocaleString("zh-CN")}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 历史记录列表 */}
        {showHistory && history.length > 0 && (
          <div className="mb-4 border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-3 py-2 text-sm font-medium flex items-center gap-2">
              <History className="w-4 h-4" />
              历史讨论记录
            </div>
            <div className="max-h-48 overflow-y-auto">
              {history.map((item, idx) => {
                const config = getDecisionConfig(item.decision);
                const isSelected = discussion?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setDiscussion(item);
                      setShowDetails(false);
                      setShowRiskWarning(false);
                      setShowEntryPoints(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors border-b last:border-b-0 ${
                      isSelected ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-6">#{history.length - idx}</span>
                      <div>
                        <div className={`text-sm font-medium ${config.color}`}>
                          {config.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString("zh-CN")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{item.confidence}%</div>
                      <div className="text-xs text-muted-foreground">信心指数</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !discussion ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <Sparkles className="w-12 h-12 mx-auto text-blue-500 mb-3" />
              <p className="text-muted-foreground mb-2">
                邀请多位AI分析师共同讨论
              </p>
              <p className="text-xs text-muted-foreground">
                DeepSeek · Kimi · 豆包 将从不同角度分析
              </p>
            </div>
            <Button
              onClick={startDiscussion}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI正在讨论中...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  发起AI讨论
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 最终决策 - 紧凑版 */}
            <div className={`p-4 rounded-lg border-2 ${decisionConfig?.bgColor} ${decisionConfig?.borderColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${decisionConfig?.bgColor}`}>
                    <Target className={`w-6 h-6 ${decisionConfig?.color}`} />
                  </div>
                  <div>
                    <div className={`text-xl font-bold ${decisionConfig?.color}`}>
                      {decisionConfig?.label}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {discussion.consensus ? "三位AI达成共识" : "AI观点存在分歧"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{discussion.confidence}%</div>
                  <div className="text-xs text-muted-foreground">信心指数</div>
                </div>
              </div>
              
              {/* 投票结果 - 紧凑横排 */}
              <div className="flex gap-6 mt-3 pt-3 border-t border-current/10">
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">{discussion.finalVote.agree}</span>
                  <span className="text-xs text-muted-foreground">同意</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ThumbsDown className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">{discussion.finalVote.disagree}</span>
                  <span className="text-xs text-muted-foreground">反对</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Minus className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium">{discussion.finalVote.neutral}</span>
                  <span className="text-xs text-muted-foreground">中立</span>
                </div>
              </div>
            </div>

            {/* 核心建议 - 简洁版 */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <p className="text-sm leading-relaxed text-foreground">
                {discussion.suggestion?.suggestion || "暂无建议"}
              </p>
            </div>

            {/* 操作参数 - 卡片网格 */}
            {discussion.suggestion && (
              <div className="grid grid-cols-3 gap-3">
                {discussion.suggestion.positionSize && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                    <DollarSign className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                    <div className="text-xs text-muted-foreground">建议仓位</div>
                    <div className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                      {discussion.suggestion.positionSize}
                    </div>
                  </div>
                )}
                {discussion.suggestion.targetPrice && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-center">
                    <TrendingUp className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                    <div className="text-xs text-muted-foreground">目标价位</div>
                    <div className="text-sm font-semibold text-purple-700 dark:text-purple-400">
                      {discussion.suggestion.targetPrice}
                    </div>
                  </div>
                )}
                {discussion.suggestion.stopLoss && (
                  <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg text-center">
                    <Crosshair className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                    <div className="text-xs text-muted-foreground">止损策略</div>
                    <div className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                      {discussion.suggestion.stopLoss}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 入场时机 - 可折叠 */}
            {discussion.suggestion?.entryPoints && discussion.suggestion.entryPoints.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowEntryPoints(!showEntryPoints)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    入场时机 ({discussion.suggestion.entryPoints.length}条)
                  </span>
                  {showEntryPoints ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showEntryPoints && (
                  <div className="p-3 space-y-2 border-t">
                    {discussion.suggestion.entryPoints.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs px-1.5 py-0.5 rounded shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-muted-foreground">{point}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 风险提示 - 可折叠 */}
            {discussion.suggestion?.riskWarning && (
              <div className="border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowRiskWarning(!showRiskWarning)}
                  className="w-full flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                >
                  <span className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Shield className="w-4 h-4" />
                    风险提示
                  </span>
                  {showRiskWarning ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showRiskWarning && (
                  <div className="p-3 border-t border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                    <p className="text-sm text-amber-700 dark:text-amber-300 whitespace-pre-line">
                      {discussion.suggestion.riskWarning}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 查看详细讨论 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full"
            >
              {showDetails ? "收起AI观点" : "查看AI观点详情"}
              {showDetails ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>

            {/* AI详细观点 */}
            {showDetails && discussion.discussions?.participants && (
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-semibold text-muted-foreground">AI观点详情</h4>
                {discussion.discussions.participants.map((participant, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      participant.opinion === "agree" ? "border-red-200 bg-red-50/30 dark:bg-red-900/10" :
                      participant.opinion === "disagree" ? "border-green-200 bg-green-50/30 dark:bg-green-900/10" :
                      "border-amber-200 bg-amber-50/30 dark:bg-amber-900/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{participant.avatar}</span>
                        <span className="font-semibold text-sm">{participant.name}</span>
                        {getOpinionIcon(participant.opinion)}
                        <span className="text-xs text-muted-foreground">
                          {getOpinionLabel(participant.opinion)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {participant.confidence}%
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                      {participant.reasoning}
                    </p>

                    {participant.keyPoints && participant.keyPoints.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {participant.keyPoints.map((point, pidx) => (
                          <Badge key={pidx} variant="secondary" className="text-xs font-normal">
                            {point}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 重新讨论按钮 */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={startDiscussion}
                disabled={loading}
                className="w-full text-muted-foreground"
              >
                {loading ? "讨论中..." : "重新发起讨论"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
