const Settings = require('../models/Settings');

const DEEPSEEK_DEFAULTS = {
  endpoint: 'https://api.deepseek.com',
  model: 'deepseek-chat',
};

/**
 * 调用 DeepSeek API（文生图文章分析用）
 * 优先使用 deepSeek 配置，若未配则回退到 aiChat 配置
 */
async function callDeepSeek(messages) {
  const settings = await Settings.getGlobalSettings();
  const allConfig = settings.externalApiConfig || {};

  // 优先用 deepSeek 配置，回退到 aiChat 配置
  const config = allConfig.deepSeek?.apiKey ? allConfig.deepSeek : allConfig.aiChat;
  const apiKey = config?.apiKey || process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error('DeepSeek API Key 未配置，请先在后台设置');
  }

  // 拼接待端地址：如果 endpoint 已包含 /chat/completions 就不重复加
  let endpoint = (config.endpoint || DEEPSEEK_DEFAULTS.endpoint).replace(/\/+$/, '');
  if (!endpoint.includes('/chat/completions')) {
    endpoint += '/v1/chat/completions';
  }
  const model = config.model || DEEPSEEK_DEFAULTS.model;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`DeepSeek API 调用失败 (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

module.exports = { callDeepSeek };
