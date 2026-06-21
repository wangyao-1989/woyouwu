import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EyeBall, Pupil } from '../components/CartoonEye';

// 眼睛图标（内联SVG）
function EyeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  // 眨眼动画
  const [isPurpleBlinking, setPurpleBlinking] = useState(false);
  const [isBlackBlinking, setBlackBlinking] = useState(false);
  const [isPurplePeeking, setPurplePeeking] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // 随机眨眼
  useEffect(() => {
    const blinkPurple = () => {
      setPurpleBlinking(true);
      setTimeout(() => setPurpleBlinking(false), 150);
    };
    const blinkBlack = () => {
      setBlackBlinking(true);
      setTimeout(() => setBlackBlinking(false), 150);
    };
    const schedule = () => {
      const delay = 2000 + Math.random() * 4000;
      return setTimeout(() => {
        if (Math.random() > 0.5) blinkPurple();
        else blinkBlack();
        schedule();
      }, delay);
    };
    const timer = schedule();
    return () => clearTimeout(timer);
  }, []);

  // 紫色角色偷瞄切换
  useEffect(() => {
    if (!showPassword) return;
    const toggle = () => {
      setPurplePeeking(prev => !prev);
    };
    const interval = setInterval(toggle, 800);
    return () => clearInterval(interval);
  }, [showPassword]);

  // 角色微动（鼠标移动时身体轻微摇摆）
  const [mouseDelta, setMouseDelta] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e) => {
      const cx = window.innerWidth * 0.75;
      const deltaX = ((e.clientX - cx) / window.innerWidth) * 4;
      const deltaY = ((e.clientY - window.innerHeight / 2) / window.innerHeight) * 4;
      setMouseDelta({ x: deltaX, y: deltaY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

  // 角色状态计算
  const isLookingAtEachOther = !isTyping && username.length === 0 && password.length === 0;
  const hasHiddenPassword = password.length > 0 && !showPassword;
  const isPeeking = showPassword;

  // 角色bodySkew — 紫色的
  const purpleSkew = isPeeking ? 0 : hasHiddenPassword ? -12 : isTyping ? -6 : mouseDelta.x * -0.8;
  // 黑色身体
  const blackSkew = isPeeking ? 0 : isLookingAtEachOther ? 10 : hasHiddenPassword ? 8 : isTyping ? 6 : mouseDelta.x * 0.6;
  // 橙色半圆
  const orangeSkew = isPeeking ? 0 : mouseDelta.x * 0.4;
  // 黄色
  const yellowSkew = isPeeking ? 0 : mouseDelta.x * 0.5;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F2] px-4">
      <div className="flex items-end">
        {/* ======== 左侧：卡通角色区域 ======== */}
        <div className="hidden lg:block relative" style={{ width: 720 }}>
          {/* ======== 4个卡通角色 ======== */}
          <div className="relative pb-16" style={{ width: 720, height: 520 }}>
            {/* 1. 陶土色高个 — 最底层 */}
            <div
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 90,
                width: 232,
                height: isPeeking ? 576 : hasHiddenPassword ? 564 : isTyping ? 576 : 522,
                backgroundColor: '#C47A5A',
                borderRadius: '15px 15px 0 0',
                zIndex: 1,
                transform: `skewX(${purpleSkew}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div
                className="absolute flex gap-10 transition-all duration-700 ease-in-out"
                style={{
                  left: isPeeking ? 29 : isLookingAtEachOther ? 80 : 60 + mouseDelta.x * 2,
                  top: isPeeking ? 45 : isLookingAtEachOther ? 92 : 53 + mouseDelta.y * 2,
                }}
              >
                <EyeBall size={26} pupilSize={10} maxDistance={8} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={isPeeking ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} forceLookY={isPeeking ? (isPurplePeeking ? 4 : -5) : isLookingAtEachOther ? 4 : undefined} />
                <EyeBall size={26} pupilSize={10} maxDistance={8} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isPurpleBlinking} forceLookX={isPeeking ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} forceLookY={isPeeking ? (isPurplePeeking ? 4 : -5) : isLookingAtEachOther ? 4 : undefined} />
              </div>
            </div>

            {/* 2. 深褐色中个 — 第二层 */}
            <div
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 315,
                width: 158,
                height: 405,
                backgroundColor: '#3D2E20',
                borderRadius: '12px 12px 0 0',
                zIndex: 2,
                transform: isPeeking ? 'skewX(0deg)' : isLookingAtEachOther ? `skewX(${10 + mouseDelta.x * 1.5}deg) translateX(24px)` : hasHiddenPassword ? `skewX(${8}deg)` : isTyping ? `skewX(${6}deg)` : `skewX(${mouseDelta.x * 1.1}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div
                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                style={{
                  left: isPeeking ? 12 : isLookingAtEachOther ? 45 : 35 + mouseDelta.x * 2,
                  top: isPeeking ? 36 : isLookingAtEachOther ? 18 : 41 + mouseDelta.y * 2,
                }}
              >
                <EyeBall size={24} pupilSize={9} maxDistance={6} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={isPeeking ? -5 : isLookingAtEachOther ? 0 : undefined} forceLookY={isPeeking ? -5 : isLookingAtEachOther ? -5 : undefined} />
                <EyeBall size={24} pupilSize={9} maxDistance={6} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={isPeeking ? -5 : isLookingAtEachOther ? 0 : undefined} forceLookY={isPeeking ? -5 : isLookingAtEachOther ? -5 : undefined} />
              </div>
            </div>

            {/* 3. 金色半圆 — 前左 */}
            <div
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 0,
                width: 315,
                height: 263,
                zIndex: 3,
                backgroundColor: '#D4A853',
                borderRadius: '158px 158px 0 0',
                transform: `skewX(${orangeSkew}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div
                className="absolute flex gap-10 transition-all duration-200 ease-out"
                style={{
                  left: isPeeking ? 65 : 108 + mouseDelta.x * 2,
                  top: isPeeking ? 111 : 117 + mouseDelta.y * 2,
                }}
              >
                <Pupil size={17} maxDistance={8} pupilColor="#2D2D2D" forceLookX={isPeeking ? -5 : undefined} forceLookY={isPeeking ? -4 : undefined} />
                <Pupil size={17} maxDistance={8} pupilColor="#2D2D2D" forceLookX={isPeeking ? -5 : undefined} forceLookY={isPeeking ? -4 : undefined} />
              </div>
            </div>

            {/* 4. 米色圆角矩形 — 前右 */}
            <div
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: 405,
                width: 180,
                height: 300,
                backgroundColor: '#E8D5C0',
                borderRadius: '90px 90px 0 0',
                zIndex: 4,
                transform: `skewX(${yellowSkew}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div
                className="absolute flex gap-8 transition-all duration-200 ease-out"
                style={{
                  left: isPeeking ? 27 : 69 + mouseDelta.x * 2,
                  top: isPeeking ? 45 : 53 + mouseDelta.y * 2,
                }}
              >
                <Pupil size={17} maxDistance={8} pupilColor="#2D2D2D" forceLookX={isPeeking ? -5 : undefined} forceLookY={isPeeking ? -4 : undefined} />
                <Pupil size={17} maxDistance={8} pupilColor="#2D2D2D" forceLookX={isPeeking ? -5 : undefined} forceLookY={isPeeking ? -4 : undefined} />
              </div>
              <div
                className="absolute h-[5px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
                style={{
                  width: 105,
                  left: isPeeking ? 12 : 53 + mouseDelta.x * 2,
                  top: isPeeking ? 116 : 116 + mouseDelta.y * 2,
                }}
              />
            </div>
          </div>
        </div>

        {/* ======== 右侧：登录表单 ======== */}
        <div className="py-8 pl-8">
        <div className="w-full max-w-[420px]">
          {/* 移动端 Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
            {logoFailed ? (
              <div className="w-10 h-10 bg-[#4A3728]/10 rounded-xl flex items-center justify-center">
                <span className="text-[#4A3728]/60 text-xl font-kai">悟</span>
              </div>
            ) : (
              <img
                src="/uploads/logo.png"
                alt="Logo"
                className="w-10 h-10 object-contain"
                onError={() => setLogoFailed(true)}
              />
            )}
            <span className="text-[#4A3728] text-lg font-semibold">我有物</span>
          </div>

          {/* 标题 */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-[#222] mb-2">欢迎回来</h1>
            <p className="text-[#999] text-sm">请输入您的账号信息</p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-[#4A3728]"
              >
                用户名
              </label>
              <input
                id="username"
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                className="w-full h-12 px-4 rounded-xl border border-stone-300 bg-white text-[#222] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#6C3FF5]/20 focus:border-[#6C3FF5] transition-all"
                placeholder="请输入用户名"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#4A3728]"
              >
                密码
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 pr-12 rounded-xl border border-stone-300 bg-white text-[#222] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#6C3FF5]/20 focus:border-[#6C3FF5] transition-all"
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#4A3728] text-white font-medium hover:bg-[#5C4332] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-base"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 注册链接 */}
          <p className="text-center text-sm text-stone-400 mt-8">
            还没有账号？{' '}
            <Link to="/register" className="text-[#8B7355] hover:text-[#4A3728] font-medium">
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}

export default Login;
