import { NextRequest, NextResponse } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { holdingManager } from "@/storage/database/holdingManager";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "未找到上传的文件" },
        { status: 400 }
      );
    }

    // 读取文件并转换为 base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 使用 LLM 识别图片中的股票信息
    const config = new Config();
    const client = new LLMClient(config);

    const messages = [
      {
        role: "system" as const,
        content: `你是一个专业的股票信息识别助手。请从图片中识别出股票持仓信息，并以 JSON 格式返回。
要求：
1. 识别股票代码（如：600519）
2. 识别股票名称（如：贵州茅台）
3. 识别持仓数量
4. 识别成本价
5. 如果图片中有多个股票，请返回数组

返回格式示例：
{
  "stocks": [
    {
      "stockCode": "600519",
      "stockName": "贵州茅台",
      "shares": 100,
      "costPrice": 1850.50
    }
  ]
}`,
      },
      {
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: "请识别这张图片中的股票持仓信息",
          },
          {
            type: "image_url" as const,
            image_url: {
              url: dataUri,
              detail: "high" as const,
            },
          },
        ],
      },
    ];

    const response = await client.invoke(
      messages,
      {
        model: "doubao-seed-1-6-vision-250815",
        temperature: 0.3,
      },
      undefined,
      customHeaders
    );

    // 解析返回的 JSON
    const content = response.content;
    let parsedData;

    try {
      // 尝试提取 JSON 部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = JSON.parse(content);
      }
    } catch (e) {
      // 如果无法解析为 JSON，返回原始文本
      return NextResponse.json({
        success: true,
        rawText: content,
        error: "无法解析为结构化数据，请手动输入",
      });
    }

    // 将识别到的股票信息保存到数据库
    const stocks = parsedData.stocks || [];
    const savedHoldings = [];

    for (const stock of stocks) {
      // 数据清洗：确保数值字段不为空
      const shares = stock.shares !== null && stock.shares !== undefined ? Number(stock.shares) : 0;
      const costPrice = stock.costPrice !== null && stock.costPrice !== undefined ? Number(stock.costPrice) : 0;

      // 检查是否已存在相同代码的股票
      const existing = await holdingManager.getHoldingByCode(stock.stockCode);

      if (existing) {
        // 更新现有持仓
        const updated = await holdingManager.updateHolding(existing.id, {
          stockName: stock.stockName,
          shares: shares,
          costPrice: costPrice.toString(),
        });
        if (updated) {
          savedHoldings.push(updated);
        }
      } else {
        // 创建新持仓
        const created = await holdingManager.createHolding({
          stockCode: stock.stockCode,
          stockName: stock.stockName,
          shares: shares,
          costPrice: costPrice.toString(),
        });
        savedHoldings.push(created);
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功识别并保存了 ${savedHoldings.length} 只股票`,
      stocks: savedHoldings.map((h) => ({
        ...h,
        costPrice: h.costPrice || "0.0000",
        currentPrice: h.currentPrice || null,
      })),
    });
  } catch (error) {
    console.error("OCR 识别失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "识别失败，请重试",
      },
      { status: 500 }
    );
  }
}
