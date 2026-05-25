const OperationLog = require('../models/OperationLog');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || req.ip
    || '';
}

function getClientPort(req) {
  return req.connection?.remotePort
    || req.socket?.remotePort
    || '';
}

function logOperation(action, targetType, targetId, detail) {
  return async (req) => {
    try {
      const log = new OperationLog({
        user: req.user?._id || null,
        username: req.user?.username || '',
        action,
        targetType: targetType || null,
        targetId: targetId || null,
        detail: detail || '',
        sourceIp: getClientIp(req),
        sourcePort: getClientPort(req),
        userAgent: req.headers['user-agent'] || '',
        method: req.method,
        path: req.originalUrl
      });
      await log.save();
    } catch (error) {
      console.error('Operation log error:', error);
    }
  };
}

async function logOperationDirect(action, targetType, targetId, detail, req) {
  try {
    const log = new OperationLog({
      user: req?.user?._id || null,
      username: req?.user?.username || '',
      action,
      targetType: targetType || null,
      targetId: targetId || null,
      detail: detail || '',
      sourceIp: req ? getClientIp(req) : '',
      sourcePort: req ? getClientPort(req) : '',
      userAgent: req?.headers?.['user-agent'] || '',
      method: req?.method || '',
      path: req?.originalUrl || ''
    });
    await log.save();
  } catch (error) {
    console.error('Operation log error:', error);
  }
}

module.exports = { getClientIp, getClientPort, logOperation, logOperationDirect };