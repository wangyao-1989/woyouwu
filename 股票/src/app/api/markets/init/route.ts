import { NextRequest, NextResponse } from "next/server";
import { marketManager } from "@/storage/database/marketManager";

// 初始化潜力市场示例数据
export async function POST(request: NextRequest) {
  try {
    // 检查是否已有数据，避免重复初始化
    const existingMarkets = await marketManager.getMarkets();
    if (existingMarkets.length > 0) {
      return NextResponse.json({
        success: true,
        message: "市场数据已存在，跳过初始化",
        markets: existingMarkets.length,
        companies: 0,
      });
    }

    // 固态电池
    const solidStateBattery = await marketManager.createMarket({
      name: "固态电池",
      description: "固态电池是下一代电池技术的核心，具有高能量密度、高安全性、长循环寿命等优势。随着新能源汽车、储能系统等应用场景的不断扩展，固态电池将成为未来电池技术的主流方向。当前关注度较低，但技术突破后潜力巨大。",
      attentionScore: 35, // 当前关注度较低
      potentialScore: 90, // 潜力评分极高
      icon: "battery",
      tags: ["新能源", "储能", "前沿技术", "材料科学"],
    });

    // 固态电池相关企业
    await marketManager.createCompany({
      marketId: solidStateBattery.id,
      stockCode: "300750",
      stockName: "宁德时代",
      link: "production",
      description: "全球动力电池龙头，固态电池技术领先，已实现固态电池的小批量试产。",
      marketCap: "12000",
    });

    await marketManager.createCompany({
      marketId: solidStateBattery.id,
      stockCode: "002594",
      stockName: "比亚迪",
      link: "production",
      description: "新能源汽车龙头，固态电池技术布局完善，已在部分车型上应用。",
      marketCap: "8000",
    });

    await marketManager.createCompany({
      marketId: solidStateBattery.id,
      stockCode: "300014",
      stockName: "亿纬锂能",
      link: "production",
      description: "锂离子电池制造商，固态电池研发进展顺利。",
      marketCap: "1500",
    });

    await marketManager.createCompany({
      marketId: solidStateBattery.id,
      stockCode: "300073",
      stockName: "当升科技",
      link: "raw_material",
      description: "锂电正极材料龙头，为固态电池提供关键材料。",
      marketCap: "800",
    });

    await marketManager.createCompany({
      marketId: solidStateBattery.id,
      stockCode: "002460",
      stockName: "赣锋锂业",
      link: "raw_material",
      description: "锂资源龙头，固态电池电解质材料研发领先。",
      marketCap: "1200",
    });

    // 量子计算
    const quantumComputing = await marketManager.createMarket({
      name: "量子计算",
      description: "量子计算是下一代计算技术的颠覆性创新，能够解决传统计算机无法处理的复杂问题。在密码学、药物研发、金融建模等领域具有巨大应用前景。目前仍处于早期阶段，关注度较低，但一旦技术成熟将带来革命性变化。",
      attentionScore: 25, // 当前关注度极低
      potentialScore: 95, // 潜力评分极高
      icon: "cpu",
      tags: ["量子技术", "计算机科学", "前沿科技", "信息安全"],
    });

    // 量子计算相关企业
    await marketManager.createCompany({
      marketId: quantumComputing.id,
      stockCode: "688027",
      stockName: "国盾量子",
      link: "production",
      description: "量子通信技术龙头，量子计算布局完善。",
      marketCap: "200",
    });

    await marketManager.createCompany({
      marketId: quantumComputing.id,
      stockCode: "002371",
      stockName: "北方华创",
      link: "equipment",
      description: "半导体设备制造商，为量子计算提供关键设备。",
      marketCap: "1800",
    });

    await marketManager.createCompany({
      marketId: quantumComputing.id,
      stockCode: "603986",
      stockName: "兆易创新",
      link: "chip",
      description: "存储芯片龙头，量子计算存储器研发。",
      marketCap: "1000",
    });

    // 氢燃料电池
    const hydrogenFuel = await marketManager.createMarket({
      name: "氢燃料电池",
      description: "氢燃料电池是清洁能源的重要发展方向，具有零排放、高能量密度等优势。在商用车、储能系统等领域具有广阔应用前景。随着氢能基础设施的完善，氢燃料电池将成为新能源的重要组成部分。",
      attentionScore: 40,
      potentialScore: 85,
      icon: "droplet",
      tags: ["氢能", "新能源", "清洁能源", "绿色科技"],
    });

    // 氢燃料电池相关企业
    await marketManager.createCompany({
      marketId: hydrogenFuel.id,
      stockCode: "600104",
      stockName: "上汽集团",
      link: "production",
      description: "汽车制造龙头，氢燃料电池汽车布局完善。",
      marketCap: "2000",
    });

    await marketManager.createCompany({
      marketId: hydrogenFuel.id,
      stockCode: "300471",
      stockName: "厚普股份",
      link: "equipment",
      description: "加氢设备制造商，氢燃料电池加注站建设。",
      marketCap: "100",
    });

    await marketManager.createCompany({
      marketId: hydrogenFuel.id,
      stockCode: "002274",
      stockName: "华昌化工",
      link: "raw_material",
      description: "制氢企业，氢燃料电池原材料供应。",
      marketCap: "150",
    });

    await marketManager.createCompany({
      marketId: hydrogenFuel.id,
      stockCode: "300435",
      stockName: "中泰股份",
      link: "raw_processing",
      description: "气体分离设备制造商，氢气提纯技术领先。",
      marketCap: "80",
    });

    // 人形机器人
    const humanoidRobot = await marketManager.createMarket({
      name: "人形机器人",
      description: "人形机器人是人工智能与机器人技术的结合体，能够替代人类在危险、重复性工作中发挥作用。随着AI技术的发展和成本的下降，人形机器人在制造业、服务业、医疗等领域具有巨大潜力。目前处于爆发前夜。",
      attentionScore: 45,
      potentialScore: 88,
      icon: "bot",
      tags: ["人工智能", "机器人", "智能制造", "自动化"],
    });

    // 人形机器人相关企业
    await marketManager.createCompany({
      marketId: humanoidRobot.id,
      stockCode: "603160",
      stockName: "汇顶科技",
      link: "chip",
      description: "触控芯片龙头，人形机器人传感器技术。",
      marketCap: "500",
    });

    await marketManager.createCompany({
      marketId: humanoidRobot.id,
      stockCode: "002049",
      stockName: "紫光国微",
      link: "chip",
      description: "FPGA芯片龙头，人形机器人控制芯片。",
      marketCap: "800",
    });

    await marketManager.createCompany({
      marketId: humanoidRobot.id,
      stockCode: "300124",
      stockName: "汇川技术",
      link: "component",
      description: "工业自动化龙头，人形机器人伺服系统。",
      marketCap: "2000",
    });

    await marketManager.createCompany({
      marketId: humanoidRobot.id,
      stockCode: "002008",
      stockName: "大族激光",
      link: "equipment",
      description: "激光设备制造商，人形机器人精密加工。",
      marketCap: "500",
    });

    // ===== 热门板块（高关注度，已受市场追捧）=====

    // 半导体
    const semiconductor = await marketManager.createMarket({
      name: "半导体",
      description: "半导体是国家战略核心产业，受益于国产替代和科技自立自强。在AI芯片、汽车芯片、存储芯片等领域需求旺盛。但板块已有多轮行情，估值处于历史高位，竞争激烈，需警惕回调风险。",
      attentionScore: 85, // 关注度很高
      potentialScore: 75, // 潜力评分中等（已透支部分预期）
      marketType: "hot", // 标记为热门板块
      icon: "chip",
      tags: ["半导体", "芯片", "国产替代", "人工智能"],
    });

    // 半导体相关企业
    await marketManager.createCompany({
      marketId: semiconductor.id,
      stockCode: "600584",
      stockName: "中芯国际",
      link: "production",
      description: "中国大陆最大的晶圆代工企业，7nm工艺量产。",
      marketCap: "5000",
    });

    await marketManager.createCompany({
      marketId: semiconductor.id,
      stockCode: "300661",
      stockName: "圣邦股份",
      link: "design",
      description: "模拟芯片龙头，国产替代核心标的。",
      marketCap: "1200",
    });

    await marketManager.createCompany({
      marketId: semiconductor.id,
      stockCode: "688981",
      stockName: "中芯国际-U",
      link: "production",
      description: "中芯国际科创板上市主体，先进制程领先。",
      marketCap: "4800",
    });

    await marketManager.createCompany({
      marketId: semiconductor.id,
      stockCode: "688008",
      stockName: "澜起科技",
      link: "design",
      description: "内存接口芯片龙头，受益于DDR5升级。",
      marketCap: "800",
    });

    // 算力租赁
    const computePowerRental = await marketManager.createMarket({
      name: "算力租赁",
      description: "算力租赁是AI时代的基础设施，受益于大模型训练和推理需求激增。拥有GPU集群的公司通过租赁算力获得稳定现金流。但概念已充分炒作，同质化严重，估值高企，需关注实际业务落地情况。",
      attentionScore: 80, // 关注度很高
      potentialScore: 70, // 潜力评分中等（已充分炒作）
      marketType: "hot", // 标记为热门板块
      icon: "server",
      tags: ["算力", "人工智能", "云计算", "大模型"],
    });

    // 算力租赁相关企业（核心概念股）
    await marketManager.createCompany({
      marketId: computePowerRental.id,
      stockCode: "002229",
      stockName: "鸿博股份",
      link: "production",
      description: "算力租赁龙头，英伟达合作伙伴，AI智算中心运营商。",
      marketCap: "150",
    });

    await marketManager.createCompany({
      marketId: computePowerRental.id,
      stockCode: "300462",
      stockName: "华铭智能",
      link: "equipment",
      description: "算力服务器供应商，数据中心基础设施。",
      marketCap: "80",
    });

    await marketManager.createCompany({
      marketId: computePowerRental.id,
      stockCode: "300382",
      stockName: "斯莱克",
      link: "equipment",
      description: "GPU服务器制造商，算力硬件供应商。",
      marketCap: "100",
    });

    await marketManager.createCompany({
      marketId: computePowerRental.id,
      stockCode: "301178",
      stockName: "天亿马",
      link: "integration",
      description: "算力云服务商，AI算力调度平台。",
      marketCap: "60",
    });

    await marketManager.createCompany({
      marketId: computePowerRental.id,
      stockCode: "300049",
      stockName: "福瑞股份",
      link: "service",
      description: "算力运维服务商，数据中心运营管理。",
      marketCap: "90",
    });

    await marketManager.createCompany({
      marketId: computePowerRental.id,
      stockCode: "688256",
      stockName: "寒武纪-U",
      link: "chip",
      description: "AI芯片设计，算力芯片国产替代。",
      marketCap: "500",
    });

    // 航空
    const aviation = await marketManager.createMarket({
      name: "航空",
      description: "航空行业受益于后疫情时代的出行复苏，客流和货运需求快速恢复。油价回落和人民币汇率企稳也有利于航空业绩修复。但板块已从底部反弹，当前位置估值合理，空间相对有限。",
      attentionScore: 65, // 关注度较高
      potentialScore: 70, // 潜力评分中等（修复行情已启动）
      marketType: "hot", // 标记为热门板块
      icon: "plane",
      tags: ["航空", "消费复苏", "交通运输", "旅游"],
    });

    // 航空相关企业
    await marketManager.createCompany({
      marketId: aviation.id,
      stockCode: "600029",
      stockName: "南方航空",
      link: "production",
      description: "国内三大航之一，航线网络覆盖全国。",
      marketCap: "1200",
    });

    await marketManager.createCompany({
      marketId: aviation.id,
      stockCode: "601021",
      stockName: "春秋航空",
      link: "production",
      description: "低成本航空龙头，盈利能力突出。",
      marketCap: "600",
    });

    await marketManager.createCompany({
      marketId: aviation.id,
      stockCode: "600115",
      stockName: "中国东航",
      link: "production",
      description: "国内三大航之一，国际航线布局完善。",
      marketCap: "1100",
    });

    await marketManager.createCompany({
      marketId: aviation.id,
      stockCode: "601888",
      stockName: "中国国航",
      link: "production",
      description: "国内三大航之一，国内航线优势明显。",
      marketCap: "1300",
    });

    // 航天
    const aerospace = await marketManager.createMarket({
      name: "航天",
      description: "航天是国家战略科技力量的重要组成，商业航天快速发展，卫星互联网、运载火箭、卫星应用等领域投资火热。但概念已热，多家公司布局，估值较高，需关注技术突破和商业化进展。",
      attentionScore: 55, // 关注度较高
      potentialScore: 80, // 潜力评分较高（长期空间大）
      marketType: "hot", // 标记为热门板块
      icon: "rocket",
      tags: ["航天", "卫星", "商业航天", "军工"],
    });

    // 航天相关企业
    await marketManager.createCompany({
      marketId: aerospace.id,
      stockCode: "600879",
      stockName: "航天电子",
      link: "production",
      description: "航天电子设备龙头，卫星导航芯片。",
      marketCap: "300",
    });

    await marketManager.createCompany({
      marketId: aerospace.id,
      stockCode: "600118",
      stockName: "中国卫星",
      link: "production",
      description: "卫星运营龙头，卫星通信服务提供商。",
      marketCap: "400",
    });

    await marketManager.createCompany({
      marketId: aerospace.id,
      stockCode: "688256",
      stockName: "寒武纪-U",
      link: "chip",
      description: "AI芯片公司，卫星边缘计算应用。",
      marketCap: "500",
    });

    await marketManager.createCompany({
      marketId: aerospace.id,
      stockCode: "300454",
      stockName: "深信服",
      link: "production",
      description: "网络安全厂商，卫星通信安全解决方案。",
      marketCap: "600",
    });

    return NextResponse.json({
      success: true,
      message: "市场示例数据初始化成功（包含潜力市场和热门板块）",
      markets: 8,
      companies: 32,
    });
  } catch (error) {
    console.error("初始化潜力市场数据失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "初始化潜力市场数据失败",
      },
      { status: 500 }
    );
  }
}
