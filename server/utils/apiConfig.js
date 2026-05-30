const Settings = require('../models/Settings');

const DEFAULT_CONFIG = {
  endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  model: 'doubao-seed-2-0-pro-260215',
};

async function getApiConfig(apiType) {
  const settings = await Settings.getGlobalSettings();
  const config = settings.externalApiConfig && settings.externalApiConfig[apiType];
  if (!config || !config.endpoint) {
    return { ...DEFAULT_CONFIG, apiKey: '' };
  }
  return {
    endpoint: config.endpoint || DEFAULT_CONFIG.endpoint,
    model: config.model || DEFAULT_CONFIG.model,
    apiKey: config.apiKey || '',
  };
}

module.exports = { getApiConfig, DEFAULT_CONFIG };
