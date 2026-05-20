const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: '无效的登录凭证，请重新登录' });
  }
  
  if (err.name === 'NotBeforeError') {
    return res.status(401).json({ message: '登录凭证尚未生效' });
  }
  
  if (err.code === 'ENOENT') {
    return res.status(404).json({ message: '资源不存在' });
  }
  
  res.status(500).json({ message: '服务器错误，请稍后重试' });
};

module.exports = errorHandler;
