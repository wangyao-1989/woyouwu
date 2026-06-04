import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { key: 'food', label: '餐饮', icon: '🍜' },
  { key: 'shopping', label: '购物', icon: '🛍️' },
  { key: 'transport', label: '出行', icon: '🚗' },
  { key: 'entertain', label: '娱乐', icon: '🎮' },
  { key: 'daily', label: '日用', icon: '🧴' },
  { key: 'housing', label: '住房', icon: '🏠' },
  { key: 'medical', label: '医疗', icon: '💊' },
  { key: 'education', label: '教育', icon: '📚' },
  { key: 'other', label: '其他', icon: '📌' },
];

const MOODS = [
  { key: 'happy', emoji: '😊', label: '快乐' },
  { key: 'normal', emoji: '😀', label: '正常' },
  { key: 'need', emoji: '😐', label: '刚需' },
  { key: 'sad', emoji: '😢', label: '心疼' },
  { key: 'impulse', emoji: '😭', label: '冲动' },
];

const STORAGE_KEY = 'finance_tracker_bills';
const BUDGET_KEY = 'finance_tracker_budget';

function loadBills() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveBills(bills) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
}

function loadBudget() {
  try {
    const raw = localStorage.getItem(BUDGET_KEY);
    return raw ? JSON.parse(raw) : 0;
  } catch { return 0; }
}

function saveBudget(budget) {
  localStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtDateGroup(dateStr) {
  const d = new Date(dateStr);
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return {
    label: `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]}`,
    key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
  };
}

function groupBillsByDate(bills) {
  const groups = [];
  for (const bill of bills) {
    const { key, label } = fmtDateGroup(bill.date);
    let group = groups.find(g => g.key === key);
    if (!group) {
      group = { key, label, bills: [] };
      groups.push(group);
    }
    group.bills.push(bill);
  }
  return groups;
}

export default function FinanceTracker() {
  const navigate = useNavigate();
  const [bills, setBills] = useState(loadBills);
  const [amount, setAmount] = useState('');
  const [isIncome, setIsIncome] = useState(false);
  const [category, setCategory] = useState('food');
  const [mood, setMood] = useState('need');
  const [note, setNote] = useState('');
  const [budget, setBudget] = useState(loadBudget);
  const [budgetInput, setBudgetInput] = useState('');
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // 清理旧版演示数据（ID 以 demo 开头）
  useEffect(() => {
    const stored = loadBills();
    const cleaned = stored.filter(b => !String(b.id).startsWith('demo'));
    if (cleaned.length !== stored.length) {
      saveBills(cleaned);
      setBills(cleaned);
    }
  }, []);

  useEffect(() => {
    saveBills(bills);
  }, [bills]);

  const currentMonth = getCurrentMonth();
  const monthBills = bills.filter(b => b.date.startsWith(currentMonth));

  const monthlyIncome = monthBills
    .filter(b => b.type === 'income')
    .reduce((sum, b) => sum + b.amount, 0);

  const monthlyExpense = monthBills
    .filter(b => b.type === 'expense')
    .reduce((sum, b) => sum + b.amount, 0);

  const balance = monthlyIncome - monthlyExpense;
  const budgetUsed = budget > 0 ? Math.min((monthlyExpense / budget) * 100, 100) : 0;

  const impulseTotal = monthBills
    .filter(b => b.mood === 'impulse' && b.type === 'expense')
    .reduce((sum, b) => sum + b.amount, 0);

  const isImpulseWarning = impulseTotal > 500;
  const sortedBills = [...bills].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleRecord = useCallback(() => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    const newBill = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      amount: Math.round(val * 100) / 100,
      type: isIncome ? 'income' : 'expense',
      category,
      mood: isIncome ? null : mood,
      note: note.trim(),
      date: new Date().toISOString(),
    };

    setBills(prev => [newBill, ...prev]);
    setAmount('');
    setNote('');
  }, [amount, isIncome, category, mood, note]);

  const handleDelete = useCallback((id) => {
    setBills(prev => prev.filter(b => b.id !== id));
  }, []);

  const handleBudgetSave = () => {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val < 0) return;
    setBudget(val);
    saveBudget(val);
    setBudgetInput('');
    setShowBudgetModal(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRecord();
  };

  const recentBills = sortedBills.slice(0, 20);

  return (
    <div className="min-h-screen bg-[#f7f5f3] pb-20">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              title="返回"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-slate-800">
              💰 谁动我钱了
            </h1>
          </div>
          <button
            onClick={() => {
              setBudgetInput(budget > 0 ? String(budget) : '');
              setShowBudgetModal(true);
            }}
            className="text-sm text-indigo-500 hover:text-indigo-600 font-medium"
          >
            {budget > 0 ? `预算 ¥${budget}` : '设预算'}
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* ====== 顶部看板区 ====== */}
        <div className="grid grid-cols-3 gap-3">
          {/* 本月收入 */}
          <div className="bg-emerald-50/60 rounded-2xl p-3.5 border border-emerald-100">
            <p className="text-xs text-emerald-600/70 mb-1 font-medium">本月收入</p>
            <p className="text-lg font-bold text-emerald-700">¥{monthlyIncome.toFixed(2)}</p>
          </div>
          {/* 本月支出 */}
          <div className="bg-rose-50/60 rounded-2xl p-3.5 border border-rose-100">
            <p className="text-xs text-rose-400/80 mb-1 font-medium">本月支出</p>
            <p className="text-lg font-bold text-rose-500">¥{monthlyExpense.toFixed(2)}</p>
          </div>
          {/* 当前结余 */}
          <div className="bg-indigo-50/60 rounded-2xl p-3.5 border border-indigo-100">
            <p className="text-xs text-indigo-400/80 mb-1 font-medium">当前结余</p>
            <p className={`text-lg font-bold ${balance >= 0 ? 'text-indigo-600' : 'text-rose-500'}`}>
              ¥{balance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* 预算进度条 */}
        {budget > 0 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500 font-medium">本月预算</span>
              <span className="text-xs text-slate-400">
                ¥{monthlyExpense.toFixed(0)} / ¥{budget}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetUsed > 90
                    ? 'bg-gradient-to-r from-amber-400 to-rose-400'
                    : budgetUsed > 60
                      ? 'bg-gradient-to-r from-emerald-400 to-amber-400'
                      : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                }`}
                style={{ width: `${budgetUsed}%` }}
              />
            </div>
            {budgetUsed > 90 && (
              <p className="text-xs text-rose-400 mt-1.5 font-medium">⚠️ 预算即将耗尽</p>
            )}
          </div>
        )}

        {/* 冲动消费警告窗 */}
        {impulseTotal > 0 && (
          <div
            className={`rounded-2xl p-3.5 border text-center transition-all ${
              isImpulseWarning
                ? 'bg-rose-50 border-rose-200 animate-pulse'
                : 'bg-white border-slate-100'
            }`}
          >
            <p className={`text-sm font-medium ${isImpulseWarning ? 'text-rose-500' : 'text-slate-500'}`}>
              😭 冲动剁手：
              <span className={`font-bold ml-1 ${isImpulseWarning ? 'text-rose-600' : 'text-slate-700'}`}>
                ¥{impulseTotal.toFixed(2)}
              </span>
            </p>
            {isImpulseWarning && (
              <p className="text-xs text-rose-400 mt-0.5">已超 ¥500，冷静一下！</p>
            )}
          </div>
        )}

        {/* ====== 中部记账区 ====== */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">记一笔</h2>

          {/* 收入/支出切换 */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-3">
            <button
              onClick={() => setIsIncome(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                !isIncome
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              支出
            </button>
            <button
              onClick={() => setIsIncome(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                isIncome
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              收入
            </button>
          </div>

          {/* 金额输入 */}
          <div className="mb-3">
            <div className="flex items-center border-2 border-slate-200 rounded-xl px-3 py-2 focus-within:border-indigo-400 transition-colors bg-slate-50/50">
              <span className="text-slate-400 text-lg mr-1 font-medium">¥</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="flex-1 outline-none text-xl font-semibold text-slate-800 placeholder-slate-300 bg-transparent"
              />
            </div>
          </div>

          {/* 分类九宫格 */}
          <div className="mb-3">
            <p className="text-xs text-slate-400 mb-2 font-medium">选择分类</p>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`py-2.5 px-2 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-0.5 ${
                    category === cat.key
                      ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-300 shadow-sm'
                      : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 消费心情 - 仅支出时显示 */}
          {!isIncome && (
            <div className="mb-3">
              <p className="text-xs text-slate-400 mb-2 font-medium">消费心情</p>
              <div className="flex gap-1.5">
                {MOODS.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setMood(m.key)}
                    className={`flex-1 py-2 rounded-xl text-center transition-all ${
                      mood === m.key
                        ? 'bg-indigo-50 border-2 border-indigo-300 shadow-sm'
                        : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                    }`}
                    title={m.label}
                  >
                    <span className="text-lg">{m.emoji}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 备注 */}
          <div className="mb-3">
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="添加备注（可选）"
              maxLength={50}
              className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl outline-none text-sm text-slate-700 placeholder-slate-300 focus:border-indigo-400 transition-colors bg-slate-50/50"
            />
          </div>

          {/* 记录按钮 */}
          <button
            onClick={handleRecord}
            disabled={!amount || parseFloat(amount) <= 0}
            className={`w-full py-3 rounded-xl text-white font-semibold text-base transition-all ${
              amount && parseFloat(amount) > 0
                ? isIncome
                  ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] shadow-sm'
                  : 'bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] shadow-sm'
                : 'bg-slate-200 cursor-not-allowed text-slate-400'
            }`}
          >
            {isIncome ? '💰 记录收入' : '📝 记录支出'}
          </button>
        </div>

        {/* ====== 底部流水区 ====== */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            近期流水
            {recentBills.length > 0 && (
              <span className="text-slate-400 font-normal ml-1">({recentBills.length})</span>
            )}
          </h2>

          {recentBills.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-4xl block mb-3 opacity-50">📋</span>
              <p className="text-sm text-slate-400">还没有记账记录</p>
              <p className="text-xs text-slate-300 mt-1">开始记下你的第一笔吧</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupBillsByDate(recentBills).map((group) => {
                const dayIncome = group.bills
                  .filter(b => b.type === 'income')
                  .reduce((s, b) => s + b.amount, 0);
                const dayExpense = group.bills
                  .filter(b => b.type === 'expense')
                  .reduce((s, b) => s + b.amount, 0);
                const isToday = group.key === fmtDateGroup(new Date().toISOString()).key;

                return (
                  <div key={group.key}>
                    {/* 日期分组头 */}
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">
                          {group.label}
                        </span>
                        {isToday && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-500 font-medium">
                            今天
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {dayIncome > 0 && (
                          <span className="text-emerald-500 font-medium">
                            收 ¥{dayIncome.toFixed(2)}
                          </span>
                        )}
                        {dayExpense > 0 && (
                          <span className="text-rose-400 font-medium">
                            支 ¥{dayExpense.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 当天账单列表 */}
                    <div className="space-y-1">
                      {group.bills.map((bill) => {
                        const cat = CATEGORIES.find(c => c.key === bill.category);
                        const moodObj = MOODS.find(m => m.key === bill.mood);
                        return (
                          <div
                            key={bill.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl transition-colors bg-slate-50 hover:bg-slate-100"
                          >
                            {/* 图标 */}
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${
                                bill.type === 'income'
                                  ? 'bg-emerald-100 text-emerald-600'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {cat?.icon || '📌'}
                            </div>

                            {/* 信息 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-slate-700 truncate">
                                  {cat?.label || bill.category}
                                </span>
                                {moodObj && (
                                  <span className="text-sm" title={moodObj.label}>
                                    {moodObj.emoji}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                                <span>{fmtDate(bill.date).split(' ')[1]}</span>
                                {bill.note && (
                                  <>
                                    <span>·</span>
                                    <span className="truncate max-w-[120px]">{bill.note}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* 金额 + 删除 */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span
                                className={`text-sm font-bold tabular-nums ${
                                  bill.type === 'income' ? 'text-emerald-600' : 'text-rose-500'
                                }`}
                              >
                                {bill.type === 'income' ? '+' : '-'}¥{bill.amount.toFixed(2)}
                              </span>
                              <button
                                onClick={() => handleDelete(bill.id)}
                                className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-400 hover:text-rose-500 flex items-center justify-center transition-colors flex-shrink-0"
                                title="删除"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 预算设置弹窗 */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 mx-4 border border-slate-100">
            <h3 className="text-base font-semibold text-slate-800 mb-1">设置月度预算</h3>
            <p className="text-xs text-slate-400 mb-4">设定每月支出预算，合理控制消费</p>
            <div className="flex items-center border-2 border-slate-200 rounded-xl px-3 py-2.5 mb-4 focus-within:border-indigo-400 bg-slate-50/50">
              <span className="text-slate-400 mr-1 font-medium">¥</span>
              <input
                type="number"
                value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleBudgetSave()}
                placeholder="输入预算金额"
                className="flex-1 outline-none text-lg font-semibold bg-transparent text-slate-800 placeholder-slate-300"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBudget(0);
                  saveBudget(0);
                  setBudgetInput('');
                  setShowBudgetModal(false);
                }}
                className="flex-1 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                清除预算
              </button>
              <button
                onClick={handleBudgetSave}
                className="flex-1 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
