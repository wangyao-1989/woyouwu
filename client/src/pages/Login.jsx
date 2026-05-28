import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F0E8] pb-12 px-4">
      <div className="max-w-md w-full bg-white rounded-card border border-[#E8E0D5] shadow-card p-8 fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            {logoFailed ? (
              <div className="w-12 h-12 bg-[#4A3728] rounded-mini flex items-center justify-center">
                <span className="text-white font-kai text-xl">悟</span>
              </div>
            ) : (
              <img 
                src={`/uploads/logo.png?t=${Date.now()}`}
                alt="Logo"
                className="w-12 h-12 object-contain"
                onError={() => setLogoFailed(true)}
              />
            )}
          </Link>
          <h2 className="heading-md">欢迎回来</h2>
          <p className="text-[#8B7355] mt-2">登录到 我有物</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-[#F8E0E0] border border-[#E0C0C0] rounded-mini text-[#8B5555] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#4A3728] mb-2">用户名</label>
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-[#E8E0D5] rounded-btn text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#4A3728] mb-2">密码</label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-[#E8E0D5] rounded-btn text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-center text-sm text-[#B8A899] mt-6">
          还没有账号？{' '}
          <Link to="/register" className="text-[#8B7355] hover:text-[#4A3728] font-medium">
            注册
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;