import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (formData.password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || '注册失败，请重试');
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
          <h2 className="heading-md">创建账号</h2>
          <p className="text-[#8B7355] mt-2">加入 我有物 社区</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-[#F8E0E0] border border-[#E0C0C0] rounded-mini text-[#8B5555] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4A3728] mb-1">
              用户名 <span className="text-red-400">*</span>
            </label>
            <input
              type="text" name="username" value={formData.username} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-btn text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="用于登录" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4A3728] mb-1">
              昵称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text" name="nickname" value={formData.nickname} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-btn text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="显示名称" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4A3728] mb-1">邮箱</label>
            <input
              type="email" name="email" value={formData.email} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-btn text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="选填"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4A3728] mb-1">手机号</label>
            <input
              type="tel" name="phone" value={formData.phone} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-btn text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="选填"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4A3728] mb-1">
              密码 <span className="text-red-400">*</span>
            </label>
            <input
              type="password" name="password" value={formData.password} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-btn text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="至少6个字符" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4A3728] mb-1">
              确认密码 <span className="text-red-400">*</span>
            </label>
            <input
              type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-[#E8E0D5] rounded-btn text-[#4A3728] placeholder-[#B8A899] focus:outline-none focus:ring-2 focus:ring-[#4A3728]/10 focus:border-[#C8BAAA] transition-all"
              placeholder="再次输入密码" required
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="text-center text-sm text-[#B8A899] mt-6">
          已有账号？{' '}
          <Link to="/login" className="text-[#8B7355] hover:text-[#4A3728] font-medium">
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;