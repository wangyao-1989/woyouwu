const express = require('express');
const { getApiConfig } = require('../utils/apiConfig');
const { callDeepSeek } = require('../services/deepSeekService');

const router = express.Router();
const crypto = require('crypto');

// ======== DeepSeek 分析文章的 System Prompt（植入 SKILL 全部参考信息） ========
const SKILL_SYSTEM_PROMPT = `你是一个中文文章配图策略师和提示词工程师。你的任务是：分析用户输入的文章，输出配图规划（shot list），并为每张图生成完整的英文提示词（用于文生图 API）。

## 你的输出规范

你只输出 JSON，格式如下：
{
  "analysis": "简短的分析总结，说明这篇文章的核心主题和哪些地方适合配图",
  "shots": [
    {
      "id": 1,
      "section": "放置位置描述（如：放在介绍部分后）",
      "theme": "图的主题（一句话，中文）",
      "coreIdea": "核心意思（一句话，中文）",
      "structureType": "结构类型",
      "guoguoAction": "王果果在图里做什么（中文，一句话）",
      "elements": ["元素1", "元素2", "元素3", "元素4"],
      "labels": ["标注词1", "标注词2", "标注词3", "标注词4"],
      "prompt": "完整的英文提示词，用于调用文生图 API（详见下方模板）"
    }
  ]
}

## 视觉风格规范（所有生成图统一遵守）

### 风格 DNA
- 纯白宣纸底、水彩水墨质感、蓝白主调 + 少量暖棕。
- 16:9 横版正文配图。
- 大量留白（主体占画面 40%-60%，至少 35% 空白）。
- 少量中文手写批注，最多 3-6 处，每处 2-6 个字。
- 一张图只讲一个核心动作、结构、状态或隐喻。

### 颜色
- 主色：蓝色（深浅变化的水蓝色块，像蓝墨晕开）
- 墨色线稿，暖棕肤色，点缀红用于标注
- 底色纯白或米白宣纸感

### 绝对不要
- 不要商业插画、PPT 信息图、正式流程图、课程课件、架构图
- 不要左上角写类型标题
- 不要夸张日漫大眼、写实油画、科技感 UI

## 角色 IP：王果果

每张图都要出现王果果，她是 6 岁中国小女孩，核心识别点是双丸子头。详细描述：
- 双丸子头（两个圆圆的黑发髻在头顶），有碎发和刘海
- 约 2.5-3 头身 Q 版比例，圆圆脸
- 棕色大眼睛，长睫毛，眼神好奇真诚，脸颊淡红晕
- 穿蓝白水墨质感的中式汉服（交领右衽、广袖、腰间系带）
- 蓝色布鞋，墨线轮廓有水墨抖动感
- 表情认真但有点迷糊，像读者身边的小表妹
- **重要：prompt 中不要出现"王果果""果果"等名字，只用外形描述**

## 构图模式

选择一种结构类型即可：Workflow 流程、系统局部、前后对比、角色状态、概念隐喻、方法分层、地图路线、小漫画分镜。

## 原创隐喻生成

每次从文章重新发明隐喻：
1. 把抽象概念换成一个物理动作（卡住、漏掉、变轻、分拣、沉淀、发芽、开门等）
2. 把系统结构换成一个童趣物件（小抽屉、纸箱、奇怪小机器、漏斗、小秤、邮筒等）
3. 让王果果承担核心动作

## 生图提示词模板

每张图的 prompt 字段使用以下模板（替换变量）：
Generate one standalone 16:9 horizontal Chinese article illustration.
Visual DNA:
Pure white / slight rice-paper texture background. Chinese watercolor and ink painting style (水彩水墨). Black ink line art with slight wobbly hand-drawn feel. Soft watercolor wash color blocks with bleeding and blending edges. Lots of empty white space, like a child\'s drawing on rice paper. Sparse handwritten Chinese annotations in ink black or warm red. Clean whimsical child-illustration feeling. No gradients, no shadows, no commercial vector style, no PPT infographic look, no anime exaggeration, no realistic photo style, no complex background.
Recurring character required:
A 6-year-old Chinese girl. **Core visual anchor: double hair buns (双丸子头)** — two round black hair buns on top of head, with some loose bangs and stray hairs. Round chubby face. Large warm brown eyes with long lashes, curious and sincere expression. Light pink blush on cheeks. Wearing a blue-and-white Chinese hanfu with watercolor color-block patterns — cross-collar robe with waist sash, the fabric has visible ink-blue watercolor bleeding. Simple blue cloth shoes. Body proportion: about 2.5-3 head tall, chibi-style but not exaggerated. Ink line outlines with slight hand-drawn wobble. Expressions: curious, slightly confused, cheerful, quietly focused — never overly dramatic or cute. She must perform the core conceptual action, not decorate the scene.
Theme: {主题}
Structure type: {结构类型}
Core idea: {核心意思}
Composition: {具体画面}
Suggested elements: {元素列表}
Chinese handwritten labels: {标注词列表}
Color use: Dominant blues (watercolor ink-blue). Black ink outlines. Warm brown skin. Warm red for key labels. Rice-paper white background.
Constraints: One image explains only one core structure. 40%-60% subject. At least 35% blank white space. 3-6 short handwritten Chinese labels. Character with double hair buns and blue hanfu clearly visible and performing central action. No title in top-left corner. No structure type text on image. No character names in image. Not a formal diagram or course slide. She is a child exploring the system, not a cute mascot.

## 配图数量
默认 4-8 张。文章很短（<500 字）出 2-4 张；长文也不要超过 9 张。
优先选择"认知锚点"配图：核心判断、断点、输入输出闭环、分流、前后对比、承接路径、常见坑、角色状态变化。
不要为每段都配图，选最重要的即可。`;

// ======== 内存存储 ========
const tasks = {};
const batches = {};

// ======== 文生图 - 提交任务 ========
router.post('/submit', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: '请输入描述文字' });
    }

    const config = await getApiConfig('textToImage');
    const apiKey = config.apiKey || process.env.TEXT_TO_IMAGE_API_KEY || '';

    if (!apiKey) {
      return res.status(400).json({
        error: '文生图 API 未配置，请先在后台设置 API Key',
      });
    }

    const endpoint = config.endpoint || 'https://tokenhub.tencentmaas.com/v1/api/image/submit';
    const model = config.model || 'hy-image-v3.0';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, prompt: prompt.trim() }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `提交失败 (${response.status}): ${errText}` });
    }

    const data = await response.json();
    const taskId = data?.data?.id || data?.id;

    if (!taskId) {
      return res.status(500).json({ error: '提交成功但未获取到任务 ID: ' + JSON.stringify(data) });
    }

    const queryUrl = endpoint.replace(/\/submit$/, '/query');
    tasks[taskId] = { model, apiKey, queryUrl, status: 'processing', result: null };

    pollTask(taskId);

    res.json({ taskId });
  } catch (err) {
    console.error('文生图提交失败:', err);
    res.status(500).json({ error: err.message || '提交失败' });
  }
});

// ======== 同步轮询单任务直到完成 ========
async function pollTaskSync(taskId, task) {
  const MAX_POLL_COUNT = 60;
  const POLL_INTERVAL = 2000;

  for (let i = 0; i < MAX_POLL_COUNT; i++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL));

    try {
      const response = await fetch(task.queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${task.apiKey}`,
        },
        body: JSON.stringify({ model: task.model, id: taskId }),
      });

      if (!response.ok) continue;

      const data = await response.json();
      const status = data?.status || '';
      const isFinished = ['succeeded', 'success', 'finished', 'completed'].includes(status);

      if (isFinished) {
        const images = data?.data;
        let imageUrl = '';
        if (Array.isArray(images) && images.length > 0) {
          imageUrl = images[0].url || images[0].image_url || images[0].image || images[0];
        }
        if (!imageUrl) {
          imageUrl = data.image_url || data.url || data.image;
        }

        if (imageUrl) {
          task.status = 'succeeded';
          task.result = imageUrl;
          return true;
        }
      }

      if (status === 'failed' || status === 'error') {
        task.status = 'failed';
        task.result = data?.message || data?.error_msg || '图片生成失败';
        return false;
      }
    } catch (err) {
      console.error(`轮询任务 ${taskId} 出错:`, err.message);
    }
  }

  task.status = 'failed';
  task.result = '生成超时，请稍后重试';
  return false;
}

// ======== 后台逐个处理批次任务 ========
async function processBatch(batchId) {
  const batch = batches[batchId];
  if (!batch) return;

  for (let i = 0; i < batch.tasks.length; i++) {
    const taskItem = batch.tasks[i];
    if (taskItem.status === 'failed') {
      batch.done++;
      continue;
    }

    // 提交任务到混元
    const response = await fetch(batch.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${batch.apiKey}`,
      },
      body: JSON.stringify({ model: batch.model, prompt: taskItem.prompt }),
    });

    if (!response.ok) {
      taskItem.status = 'failed';
      taskItem.error = `提交失败 (${response.status})`;
      batch.done++;
      continue;
    }

    const data = await response.json();
    const taskId = data?.data?.id || data?.id;

    if (!taskId) {
      console.error(`批次 ${batchId} 第 ${i+1} 张提交失败, 响应:`, JSON.stringify(data));
      taskItem.status = 'failed';
      taskItem.error = data?.error?.message || '未获取到任务 ID';
      batch.done++;
      continue;
    }

    // 等待此任务完成
    taskItem.status = 'processing';
    const task = { model: batch.model, apiKey: batch.apiKey, queryUrl: batch.queryUrl, status: 'processing', result: null };
    tasks[taskId] = task;
    const success = await pollTaskSync(taskId, task);

    if (success) {
      taskItem.status = 'succeeded';
      taskItem.image = task.result;
    } else {
      taskItem.status = 'failed';
      taskItem.error = task.result;
    }
    batch.done++;
  }
}

// ======== 文生图 - 查询单任务状态 ========
router.get('/status/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = tasks[taskId];

  if (!task) {
    return res.status(404).json({ error: '任务不存在或已过期' });
  }

  if (task.status === 'succeeded') {
    res.json({ status: 'succeeded', image: task.result });
  } else if (task.status === 'failed') {
    res.json({ status: 'failed', error: task.result });
  } else {
    res.json({ status: 'processing' });
  }
});

// ======== 文生图 - 分析文章生成 shot list（DeepSeek 驱动） ========
router.post('/analyze-article', async (req, res) => {
  try {
    const { article } = req.body;

    if (!article || !article.trim()) {
      return res.status(400).json({ error: '请提供文章内容' });
    }

    if (article.length > 10000) {
      return res.status(400).json({ error: '文章过长，请控制在 10000 字以内' });
    }

    const content = await callDeepSeek([
      { role: 'system', content: SKILL_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `请分析下面的中文文章，输出配图规划（shot list）。输出必须是合法的 JSON 格式。\n\n---\n${article}\n---`,
      },
    ]);

    // 从返回文本中提取 JSON
    let jsonStr = content.trim();
    // 如果被 markdown 代码块包裹，提取出来
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result = JSON.parse(jsonStr);

    if (!result.shots || !Array.isArray(result.shots) || result.shots.length === 0) {
      return res.status(500).json({ error: 'AI 分析结果异常，未生成配图规划' });
    }

    res.json({
      analysis: result.analysis || '',
      shots: result.shots.slice(0, 9),
    });
  } catch (err) {
    console.error('分析文章失败:', err);
    res.status(500).json({ error: '分析文章失败: ' + err.message });
  }
});

// ======== 文生图 - 批量提交（文章多图模式） ========
router.post('/batch-submit', async (req, res) => {
  try {
    const { prompts } = req.body;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ error: '请提供至少一段描述文字' });
    }

    if (prompts.length > 9) {
      return res.status(400).json({ error: '一次最多生成 9 张图' });
    }

    const config = await getApiConfig('textToImage');
    const apiKey = config.apiKey || process.env.TEXT_TO_IMAGE_API_KEY || '';

    if (!apiKey) {
      return res.status(400).json({
        error: '文生图 API 未配置，请先在后台设置 API Key',
      });
    }

    const endpoint = config.endpoint || 'https://tokenhub.tencentmaas.com/v1/api/image/submit';
    const model = config.model || 'hy-image-v3.0';
    const queryUrl = endpoint.replace(/\/submit$/, '/query');

    // 创建批次：所有任务初始为 waiting
    const batchTasks = prompts.filter(p => p.trim()).map(p => ({
      prompt: p.trim(),
      status: 'waiting',
      image: null,
      error: null,
    }));

    const batchId = crypto.randomUUID();
    batches[batchId] = {
      tasks: batchTasks,
      total: batchTasks.length,
      done: 0,
      endpoint,
      apiKey,
      model,
      queryUrl,
    };

    // 后台逐个处理
    processBatch(batchId);

    res.json({ batchId, total: batchTasks.length });
  } catch (err) {
    console.error('文生图批量提交失败:', err);
    res.status(500).json({ error: err.message || '批量提交失败' });
  }
});

// ======== 文生图 - 查询批量任务状态 ========
router.get('/batch-status/:batchId', (req, res) => {
  const { batchId } = req.params;
  const batch = batches[batchId];

  if (!batch) {
    return res.status(404).json({ error: '批次不存在或已过期' });
  }

  let done = 0;
  const tasksResult = batch.tasks.map((t) => {
    if (t.status === 'succeeded') { done++; return t; }
    if (t.status === 'failed') { done++; return t; }
    return t;
  });

  res.json({
    batchId,
    total: batch.total,
    done,
    allDone: done === batch.total,
    tasks: tasksResult,
  });
});

module.exports = router;
