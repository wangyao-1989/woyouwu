const Settings = require('../models/Settings');

const DEFAULT_CONFIGS = {
  aiChat: {
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: 'doubao-seed-2-0-pro-260215',
  },
  newsGeneration: {
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: 'doubao-seed-2-0-pro-260215',
  },
  resumeParse: {
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: 'doubao-seed-2-0-pro-260215',
  },
  textToImage: {
    endpoint: 'https://tokenhub.tencentmaas.com/v1/api/image/submit',
    model: 'hy-image-v3.0',
  },
};

const DEFAULT_CONFIG = DEFAULT_CONFIGS.aiChat;

async function getApiConfig(apiType) {
  const settings = await Settings.getGlobalSettings();
  const config = settings.externalApiConfig && settings.externalApiConfig[apiType];
  const defaults = DEFAULT_CONFIGS[apiType] || DEFAULT_CONFIG;
  if (!config || !config.endpoint) {
    return { ...defaults, apiKey: '' };
  }
  return {
    endpoint: config.endpoint || defaults.endpoint,
    model: config.model || defaults.model,
    apiKey: config.apiKey || '',
    imageSize: config.imageSize || defaults.imageSize,
  };
}

module.exports = { getApiConfig, DEFAULT_CONFIG };
