import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const MBTI_PROFILES = {
  INTJ: { title: '建筑师', emoji: '🏛️', summary: '富有战略思维，独立果断，擅长制定长远计划。', strengths: '战略规划、独立思考、高效执行', weakness: '可能显得过于冷静疏离', color: '#6366f1' },
  INTP: { title: '逻辑学家', emoji: '🔬', summary: '热爱思考与分析，对知识和理论充满好奇心。', strengths: '逻辑分析、创新思维、深度学习', weakness: '可能拖延实践、忽略社交', color: '#8b5cf6' },
  ENTJ: { title: '指挥官', emoji: '👑', summary: '天生的领导者，果敢自信，善于组织和推动事情。', strengths: '领导力、战略眼光、高效决策', weakness: '可能过于强势、忽略他人感受', color: '#f59e0b' },
  ENTP: { title: '辩论家', emoji: '💡', summary: '机智灵活，热爱挑战和辩论，总能找到新角度。', strengths: '创新思维、口才敏捷、适应力强', weakness: '可能三分钟热度、争论过度', color: '#f97316' },
  INFJ: { title: '提倡者', emoji: '🌿', summary: '内心深邃，富有同理心，致力于让世界更美好。', strengths: '洞察力强、善于倾听、理想主义', weakness: '可能过于敏感、完美主义', color: '#10b981' },
  INFP: { title: '调停者', emoji: '🕊️', summary: '温柔善良，充满理想，追寻内心的价值与意义。', strengths: '富有创造力、忠诚善良、富有同理心', weakness: '可能过于理想化、容易受伤', color: '#ec4899' },
  ENFJ: { title: '主人公', emoji: '\u2b50', summary: '富有魅力，善于激励他人，天生的教育者和引导者。', strengths: '感染力强、善于沟通、乐于助人', weakness: '可能忽视自身需求、过于操心他人', color: '#ef4444' },
  ENFP: { title: '竞选者', emoji: '🎨', summary: '热情洋溢，充满创意，总能发现生活中的美好。', strengths: '社交能力、创意无限、乐观积极', weakness: '可能不够专注、容易分心', color: '#f97316' },
  ISTJ: { title: '物流师', emoji: '\u2699\ufe0f', summary: '严谨务实，可靠负责，是团队中最稳定的支柱。', strengths: '踏实可靠、注重细节、责任心强', weakness: '可能固执保守、难以灵活变通', color: '#64748b' },
  ISFJ: { title: '守卫者', emoji: '🛡️', summary: '温柔体贴，默默守护身边的人，温暖而坚定。', strengths: '忠诚可靠、细心体贴、勤奋实干', weakness: '可能过于谦让、不敢表达自己', color: '#84cc16' },
  ESTJ: { title: '总经理', emoji: '📋', summary: '优秀的管理者，务实高效，善于组织和执行。', strengths: '组织能力、高效执行、实事求是', weakness: '可能过于刻板、缺乏弹性', color: '#0ea5e9' },
  ESFJ: { title: '执政官', emoji: '🤝', summary: '热心周到，善于照顾他人，是社交圈中的暖阳。', strengths: '善于合作、体贴入微、社交能力强', weakness: '可能过于在意他人评价、避免冲突', color: '#14b8a6' },
  ISTP: { title: '鉴赏家', emoji: '🔧', summary: '冷静理智，动手能力强，喜欢探索事物如何运作。', strengths: '实操能力强、冷静沉着、灵活应变', weakness: '可能过于独立、不善表达情感', color: '#a855f7' },
  ISFP: { title: '探险家', emoji: '🌸', summary: '温柔的艺术灵魂，用美和感受来体验世界。', strengths: '审美敏锐、随和友善、活在当下', weakness: '可能回避冲突、缺乏长远规划', color: '#d946ef' },
  ESTP: { title: '企业家', emoji: '🚀', summary: '行动派，敢于冒险，在挑战中找到乐趣。', strengths: '行动力强、随机应变、魅力四射', weakness: '可能冲动冒险、忽略长远影响', color: '#eab308' },
  ESFP: { title: '表演者', emoji: '🎭', summary: '活力四射，享受当下，是人群中的开心果。', strengths: '热情洋溢、善于社交、乐在其中', weakness: '可能不够专注、不喜欢条条框框', color: '#f43f5e' },
};

const SCALE_OPTIONS = [
  { value: 3, label: '更倾向左侧', short: '更倾向A' },
  { value: 2, label: '倾向左侧', short: '倾向A' },
  { value: 1, label: '略倾向左侧', short: '略倾向A' },
  { value: -1, label: '略倾向右侧', short: '略倾向B' },
  { value: -2, label: '倾向右侧', short: '倾向B' },
  { value: -3, label: '更倾向右侧', short: '更倾向B' },
];

const DIM_LABELS = { EI: '精力来源', SN: '信息获取', TF: '决策方式', JP: '生活态度' };
const TRAIT_LABELS = { E: 'E 外向', I: 'I 内向', S: 'S 实感', N: 'N 直觉', T: 'T 思考', F: 'F 情感', J: 'J 判断', P: 'P 感知' };

function MBTITest() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('intro');
  const [testMode, setTestMode] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [savedMbti, setSavedMbti] = useState('');
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!loading && user && user.pet && user.pet.mbti) {
      setSavedMbti(user.pet.mbti);
    }
  }, [user, loading]);

  const fetchQuestions = useCallback(async (mode) => {
    setFetching(true);
    setFetchError('');
    try {
      const res = await axios.get('/api/mbti/questions', { params: { mode } });
      if (res.data.questions && res.data.questions.length > 0) {
        setQuestions(res.data.questions);
        return true;
      }
      setFetchError('题库尚未初始化，请联系管理员');
      return false;
    } catch (err) {
      setFetchError(err.response?.data?.message || '获取题库失败，请稍后重试');
      return false;
    } finally {
      setFetching(false);
    }
  }, []);

  const startTest = async (mode) => {
    setTestMode(mode);
    const ok = await fetchQuestions(mode);
    if (ok) {
      setStep('testing');
      setCurrentIdx(0);
      setAnswers({});
      setResult(null);
    }
  };

  const selectAnswer = (value) => {
    const q = questions[currentIdx];
    const newAnswers = { ...answers, [q._id]: value };
    setAnswers(newAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setTimeout(() => calculateResult(newAnswers), 100);
    }
  };

  const prevQuestion = () => {
    if (currentIdx > 0) setCurrentIdx(prev => prev - 1);
  };

  const calculateResult = (finalAnswers) => {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    const dimTotals = { EI: 0, SN: 0, TF: 0, JP: 0 };

    questions.forEach(q => {
      const raw = finalAnswers[q._id];
      if (raw === undefined || raw === null) return;
      const opposite = { E: 'I', I: 'E', S: 'N', N: 'S', T: 'F', F: 'T', J: 'P', P: 'J' };

      if (raw > 0) {
        scores[q.traitA] += raw;
      } else {
        scores[opposite[q.traitA]] += Math.abs(raw);
      }
      dimTotals[q.dimension] += Math.abs(raw);
    });

    const totalPossible = questions.reduce((sum, q) => sum + 3, 0) / 4;
    const percentages = {};
    Object.keys(dimTotals).forEach(dim => {
      percentages[dim] = dimTotals[dim] > 0 ? Math.round((dimTotals[dim] / totalPossible) * 100) : 0;
    });

    const type = [
      scores.E >= scores.I ? 'E' : 'I',
      scores.S >= scores.N ? 'S' : 'N',
      scores.T >= scores.F ? 'T' : 'F',
      scores.J >= scores.P ? 'J' : 'P',
    ].join('');

    setResult({ type, scores, percentages, dimTotals });
    setStep('result');
  };

  const saveMBTI = async () => {
    if (!user) { showToast('请先登录再保存', 'error'); return; }
    setSaving(true);
    try {
      await axios.put('/api/settings/my-pet/mbti', { mbti: result.type });
      setSavedMbti(result.type);
      window.dispatchEvent(new CustomEvent('pet-refresh'));
      showToast('性格标签已保存到你的宠物上！', 'success');
    } catch (err) {
      showToast('保存失败：' + (err.response?.data?.message || '网络错误'), 'error');
    } finally { setSaving(false); }
  };

  const clearMBTI = async () => {
    setSaving(true);
    try {
      await axios.put('/api/settings/my-pet/mbti', { mbti: '' });
      setSavedMbti('');
      showToast('性格标签已清除', 'info');
    } catch (err) { showToast('清除失败', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F5F0E8' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#4A3728' }}></div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const currentQ = questions[currentIdx];

  return (
    <div className="min-h-screen pb-16" style={{ background: '#F5F0E8' }}>
      <div className="max-w-2xl mx-auto px-4">

        {step === 'intro' && (
          <div className="text-center">
            <div className="card p-10">
              <div className="text-6xl mb-6">{'🧠'}</div>
              <h1 className="heading-xl mb-4">MBTI 性格测试</h1>
              <p className="text-gray-600 text-lg mb-2 leading-relaxed">
                通过场景化题目，发现你真实的性格类型
              </p>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                每题请在两个选项之间选择你的倾向程度，没有绝对的对错
              </p>

              {savedMbti && MBTI_PROFILES[savedMbti] && (
                <div className="mb-8 p-5 rounded-2xl border" style={{
                  backgroundColor: MBTI_PROFILES[savedMbti].color + '15',
                  borderColor: MBTI_PROFILES[savedMbti].color + '40'
                }}>
                  <p className="text-sm text-gray-500 mb-2">你已完成的测试结果</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl">{MBTI_PROFILES[savedMbti].emoji}</span>
                    <span className="text-3xl font-bold" style={{ color: MBTI_PROFILES[savedMbti].color }}>{savedMbti}</span>
                    <span className="text-lg text-gray-600">{'\u2014'} {MBTI_PROFILES[savedMbti].title}</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">{MBTI_PROFILES[savedMbti].summary}</p>
                  <button onClick={clearMBTI} disabled={saving}
                    className="mt-3 text-xs text-gray-400 hover:text-red-500 transition underline">
                    清除标签，重新测试
                  </button>
                </div>
              )}

              {fetchError && (
                <div className="mb-6 p-4 bg-red-50 rounded-2xl text-red-600 text-sm">{fetchError}</div>
              )}

              <p className="text-sm text-gray-500 mb-6 font-medium">请选择测试模式</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button onClick={() => startTest('express')} disabled={fetching}
                  className="p-5 rounded-2xl border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all text-left"
                  style={{ background: 'linear-gradient(135deg, #faf5ff, #ede9fe)' }}>
                  <div className="text-2xl mb-2">{'\u26a1'}</div>
                  <div className="font-bold text-purple-700 text-sm">极速版</div>
                  <div className="text-xs text-gray-500 mt-1">约 20 题 · 2-3 分钟</div>
                  <div className="text-xs text-gray-400 mt-1">快速了解性格轮廓</div>
                </button>
                <button onClick={() => startTest('professional')} disabled={fetching}
                  className="p-5 rounded-2xl border-2 border-amber-200 hover:border-amber-400 hover:shadow-lg transition-all text-left"
                  style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
                  <div className="text-2xl mb-2">{'📊'}</div>
                  <div className="font-bold text-amber-700 text-sm">专业版</div>
                  <div className="text-xs text-gray-500 mt-1">约 60 题 · 6-10 分钟</div>
                  <div className="text-xs text-gray-400 mt-1">结果更精准深入</div>
                </button>
              </div>

              {fetching && (
                <div className="flex items-center justify-center gap-2 text-purple-500 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                  正在加载题库...
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'testing' && currentQ && (
          <div>
            <div className="card p-6 sm:p-8">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">
                    第 {currentIdx + 1} / {questions.length} 题
                    <span className="ml-2 text-purple-500 font-medium">{testMode === 'express' ? '极速版' : '专业版'}</span>
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-50 text-purple-600">
                    {DIM_LABELS[currentQ.dimension]}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: progress + '%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}></div>
                </div>
              </div>

              <h2 className="text-base sm:text-lg font-medium text-gray-800 mb-6 text-center leading-relaxed">
                {currentQ.text}
              </h2>

              <div className="flex items-stretch gap-2 sm:gap-3 mb-4">
                <div className="flex-1 bg-purple-50 rounded-2xl p-3 sm:p-4 flex items-center justify-center text-center border-2 border-purple-200">
                  <p className="text-xs sm:text-sm font-medium text-purple-700">{currentQ.poleA}</p>
                </div>
                <div className="flex items-center text-gray-400 text-lg font-bold">{'\u2194'}</div>
                <div className="flex-1 bg-amber-50 rounded-2xl p-3 sm:p-4 flex items-center justify-center text-center border-2 border-amber-200">
                  <p className="text-xs sm:text-sm font-medium text-amber-700">{currentQ.poleB}</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center mb-3">请选择你的倾向程度：</p>

              <div className="space-y-2">
                {SCALE_OPTIONS.map((opt, i) => {
                  const isSelected = answers[currentQ._id] === opt.value;
                  const rowColors = i < 3
                    ? 'border-purple-200 hover:border-purple-400 hover:bg-purple-50'
                    : 'border-amber-200 hover:border-amber-400 hover:bg-amber-50';
                  const activeColors = i < 3
                    ? 'border-purple-500 bg-purple-100'
                    : 'border-amber-500 bg-amber-100';
                  const dotColor = i < 3 ? 'bg-purple-500' : 'bg-amber-500';

                  return (
                    <button key={opt.value}
                      onClick={() => selectAnswer(opt.value)}
                      className={'w-full p-2.5 sm:p-3 rounded-xl border-2 flex items-center gap-3 transition-all ' +
                        (isSelected ? activeColors : rowColors)}>
                      <span className={'w-3 h-3 rounded-full flex-shrink-0 ' + (isSelected ? dotColor + ' ring-2 ring-offset-1 ' + dotColor : dotColor + ' opacity-30')}></span>
                      <span className={'text-xs sm:text-sm font-medium ' + (isSelected ? (i < 3 ? 'text-purple-700' : 'text-amber-700') : 'text-gray-600')}>
                        {opt.label}
                      </span>
                      {isSelected && (
                        <span className="ml-auto text-xs text-gray-400">{'\u2713'}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center mt-5">
                <button onClick={prevQuestion} disabled={currentIdx === 0}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed">
                  {'\u2190'} 上一题
                </button>
                <div className="flex gap-1">
                  {questions.map((_, i) => (
                    <div key={i}
                      className={'w-1.5 h-1.5 rounded-full transition-all ' + (
                        i === currentIdx ? 'bg-purple-500 w-3' :
                        answers[questions[i]._id] !== undefined ? 'bg-purple-300' : 'bg-gray-300')}></div>
                  ))}
                </div>
                <span className="text-xs text-gray-400">{progress}%</span>
              </div>
            </div>
          </div>
        )}

        {step === 'result' && result && MBTI_PROFILES[result.type] && (
          <div>
            <div className="card p-8 text-center">
              <div className="text-5xl mb-4">{MBTI_PROFILES[result.type].emoji}</div>
              <h1 className="heading-xl mb-2" style={{ color: MBTI_PROFILES[result.type].color }}>{result.type}</h1>
              <p className="text-xl font-semibold text-gray-700 mb-1">{MBTI_PROFILES[result.type].title}</p>
              <p className="text-gray-600 mb-2">{MBTI_PROFILES[result.type].summary}</p>
              <span className="text-xs text-gray-400">测试模式：{testMode === 'express' ? '极速版' : '专业版'} · {questions.length} 题</span>

              <div className="grid grid-cols-2 gap-4 my-6 text-left">
                <div className="bg-green-50 rounded-2xl p-4">
                  <p className="text-green-700 font-medium text-sm mb-1">优势</p>
                  <p className="text-gray-600 text-sm">{MBTI_PROFILES[result.type].strengths}</p>
                </div>
                <div className="bg-amber-50 rounded-2xl p-4">
                  <p className="text-amber-700 font-medium text-sm mb-1">注意</p>
                  <p className="text-gray-600 text-sm">{MBTI_PROFILES[result.type].weakness}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 mb-6">
                <p className="text-sm text-gray-500 mb-3 font-medium">各维度得分详情</p>
                {[
                  { d: 'EI', a: 'E', b: 'I', ca: 'blue', cb: 'green' },
                  { d: 'SN', a: 'S', b: 'N', ca: 'yellow', cb: 'purple' },
                  { d: 'TF', a: 'T', b: 'F', ca: 'red', cb: 'pink' },
                  { d: 'JP', a: 'J', b: 'P', ca: 'indigo', cb: 'teal' },
                ].map(({ d, a, b, ca, cb }) => (
                  <div key={d} className="mb-4 last:mb-0">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{DIM_LABELS[d]}</span>
                      <span className="text-gray-400">{result.percentages[d]}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold w-8 text-right" style={{ color: result.type.includes(a) ? '#4A3728' : '#999' }}>
                        {TRAIT_LABELS[a].split(' ')[0]}
                      </span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden flex">
                        <div className='h-full rounded-l-full transition-all' style={{ width: ((result.scores[a] / (result.scores[a] + result.scores[b])) * 100) + '%', minWidth: result.scores[a] > 0 ? '4px' : '0', backgroundColor: ({ blue: '#60a5fa', yellow: '#facc15', red: '#f87171', indigo: '#818cf8' })[ca] }}></div>
                        <div className='h-full rounded-r-full transition-all' style={{ width: ((result.scores[b] / (result.scores[a] + result.scores[b])) * 100) + '%', minWidth: result.scores[b] > 0 ? '4px' : '0', backgroundColor: ({ green: '#4ade80', purple: '#c084fc', pink: '#f472b6', teal: '#2dd4bf' })[cb] }}></div>
                      </div>
                      <span className="text-xs font-bold w-8 text-left" style={{ color: result.type.includes(b) ? '#4A3728' : '#999' }}>
                        {TRAIT_LABELS[b].split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                      <span>{result.scores[a]} 分</span>
                      <span>{result.scores[b]} 分</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                {user ? (
                  savedMbti === result.type ? (
                    <div className="px-6 py-3 rounded-2xl text-white font-medium"
                      style={{ backgroundColor: MBTI_PROFILES[result.type].color }}>已保存到宠物标签</div>
                  ) : (
                    <button onClick={saveMBTI} disabled={saving}
                      className="px-6 py-3 rounded-2xl text-white font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50"
                      style={{ background: MBTI_PROFILES[result.type].color }}>
                      {saving ? '保存中...' : '贴到宠物角色上'}
                    </button>
                  )
                ) : (
                  <div className="text-sm text-gray-500">
                    请先 <button onClick={() => navigate('/login')} className="text-purple-500 underline">登录</button> 后再保存标签
                  </div>
                )}
                <button onClick={() => { setStep('intro'); setResult(null); setQuestions([]); }}
                  className="px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-600 hover:bg-gray-100 transition font-medium">
                  重新测试
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-none"
          style={{ backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#6366f1', color: 'white' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default MBTITest;
