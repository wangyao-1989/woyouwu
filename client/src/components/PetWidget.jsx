import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const PET_POSITIONS = [
  { bottom: '12px', right: '20px' },
  { bottom: '60px', right: '120px' },
  { bottom: '140px', right: '40px' },
  { bottom: '30px', right: '220px' },
  { bottom: '100px', right: '280px' },
  { bottom: '50px', right: '160px' },
  { bottom: '170px', right: '100px' },
  { bottom: '12px', right: '300px' },
];

function PetWidget() {
  const [posIndex, setPosIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'pet', text: '喵~ 我是果果仁！(=^ω^=) 有什么可以帮你的吗？' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [faceIndex, setFaceIndex] = useState(0);
  const [tailWag, setTailWag] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const chatEndRef = useRef(null);
  const posTimerRef = useRef(null);
  const faceTimerRef = useRef(null);
  const blinkTimerRef = useRef(null);
  const tailTimerRef = useRef(null);

  useEffect(() => {
    posTimerRef.current = setInterval(() => {
      setIsMoving(true);
      setTimeout(() => setIsMoving(false), 800);
      setPosIndex(prev => (prev + 1) % PET_POSITIONS.length);
    }, 6000 + Math.random() * 3000);

    faceTimerRef.current = setInterval(() => {
      setFaceIndex(prev => (prev + 1) % 3);
      setIsIdle(prev => !prev);
    }, 3500);

    blinkTimerRef.current = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 2000 + Math.random() * 2000);

    tailTimerRef.current = setInterval(() => {
      setTailWag(true);
      setTimeout(() => setTailWag(false), 600);
    }, 4000 + Math.random() * 3000);

    return () => {
      if (posTimerRef.current) clearInterval(posTimerRef.current);
      if (faceTimerRef.current) clearInterval(faceTimerRef.current);
      if (blinkTimerRef.current) clearInterval(blinkTimerRef.current);
      if (tailTimerRef.current) clearInterval(tailTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleChat = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await axios.post('/api/ai/chat', { message: trimmed });
      setMessages(prev => [...prev, { role: 'pet', text: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'pet', text: '喵~ 网络不太好，稍等一会再试试吧~' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const currentPos = PET_POSITIONS[posIndex];

  return (
    <>
      <div
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed z-50 cursor-pointer select-none"
        style={{
          ...currentPos,
          transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isMoving ? 'translateY(-6px) rotate(-3deg)' : 'translateY(0) rotate(0deg)',
        }}
        title="果果仁 - 点击聊天"
      >
        <div className="relative">
          <svg
            viewBox="0 0 180 160"
            width="90"
            height="80"
            className={`drop-shadow-lg transition-transform duration-200 ${isIdle ? 'scale-[1.03]' : 'scale-100'}`}
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.18))' }}
          >
            {/* Tail */}
            <g style={{
              transformOrigin: '170px 95px',
              transition: 'transform 0.4s ease-in-out',
              transform: tailWag ? 'rotate(-18deg)' : 'rotate(-8deg)'
            }}>
              <path
                d="M170 95 Q185 75 195 60 Q200 52 192 50 Q184 48 180 58 Q175 72 167 90"
                fill="#f59e0b"
                stroke="#d97706"
                strokeWidth="1.5"
              />
              <path
                d="M190 53 Q188 49 192 50"
                fill="#fef3c7"
                stroke="none"
              />
            </g>

            {/* Back legs */}
            <ellipse cx="55" cy="145" rx="14" ry="10" fill="#f59e0b" stroke="#d97706" strokeWidth="1.2" />
            <ellipse cx="95" cy="145" rx="14" ry="10" fill="#f59e0b" stroke="#d97706" strokeWidth="1.2" />
            <ellipse cx="55" cy="148" rx="10" ry="5" fill="#fff8e7" />
            <ellipse cx="95" cy="148" rx="10" ry="5" fill="#fff8e7" />

            {/* Body */}
            <ellipse cx="70" cy="105" rx="40" ry="32" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
            {/* Belly */}
            <ellipse cx="68" cy="110" rx="25" ry="20" fill="#fef3c7" />
            {/* Body stripes */}
            <path d="M88 82 Q90 85 88 88" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
            <path d="M93 90 Q95 93 93 96" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
            <path d="M90 100 Q92 103 90 106" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />

            {/* Front paws */}
            <ellipse cx="42" cy="132" rx="12" ry="8" fill="#f59e0b" stroke="#d97706" strokeWidth="1.2" />
            <ellipse cx="80" cy="134" rx="12" ry="8" fill="#f59e0b" stroke="#d97706" strokeWidth="1.2" />
            <ellipse cx="42" cy="135" rx="8" ry="4" fill="#fff8e7" />
            <ellipse cx="80" cy="137" rx="8" ry="4" fill="#fff8e7" />

            {/* Head */}
            <ellipse cx="52" cy="72" rx="30" ry="26" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />

            {/* Left ear */}
            <polygon points="28,55 22,28 42,48" fill="#f59e0b" stroke="#d97706" strokeWidth="1.3" strokeLinejoin="round" />
            <polygon points="30,52 26,36 38,48" fill="#fca5a5" />

            {/* Right ear */}
            <polygon points="62,48 82,28 76,55" fill="#f59e0b" stroke="#d97706" strokeWidth="1.3" strokeLinejoin="round" />
            <polygon points="66,48 74,36 70,52" fill="#fca5a5" />

            {/* Face white patch */}
            <ellipse cx="52" cy="80" rx="20" ry="16" fill="#fef3c7" />

            {/* Eyes */}
            <ellipse cx="42" cy="68" rx="5" ry={blinking ? 0.5 : 6} fill="#1c1917" style={{ transition: 'all 0.1s' }} />
            <ellipse cx="62" cy="68" rx="5" ry={blinking ? 0.5 : 6} fill="#1c1917" style={{ transition: 'all 0.1s' }} />
            {/* Eye shine */}
            {!blinking && (
              <>
                <circle cx="44" cy="66" r="2" fill="white" />
                <circle cx="64" cy="66" r="2" fill="white" />
              </>
            )}

            {/* Nose */}
            <ellipse cx="52" cy="78" rx="3.5" ry="2.5" fill="#f97316" />

            {/* Mouth */}
            <path
              d={`M52 80 Q46 ${85 + (faceIndex % 2) * 2} 44 83`}
              fill="none"
              stroke="#9a3412"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d={`M52 80 Q58 ${85 + (faceIndex % 2) * 2} 60 83`}
              fill="none"
              stroke="#9a3412"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Whiskers */}
            <line x1="16" y1="74" x2="34" y2="78" stroke="#d97706" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="14" y1="80" x2="33" y2="81" stroke="#d97706" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="16" y1="86" x2="34" y2="83" stroke="#d97706" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="70" y1="78" x2="88" y2="74" stroke="#d97706" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="71" y1="81" x2="90" y2="80" stroke="#d97706" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="70" y1="83" x2="88" y2="86" stroke="#d97706" strokeWidth="0.8" strokeLinecap="round" />

            {/* Head stripes */}
            <path d="M52 48 L52 54" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
            <path d="M45 49 L47 53" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M59 49 L57 53" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />

            {/* Blush circles */}
            <ellipse cx="36" cy="80" rx="4" ry="3" fill="#fca5a5" opacity="0.4" />
            <ellipse cx="68" cy="80" rx="4" ry="3" fill="#fca5a5" opacity="0.4" />
          </svg>

          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full border-2 border-white animate-pulse"></span>
        </div>
      </div>

      {isChatOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" style={{ maxHeight: '450px' }}>
          <div className="bg-gradient-to-r from-amber-500 to-orange-400 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg viewBox="0 0 40 40" width="32" height="32">
                <ellipse cx="20" cy="22" rx="15" ry="13" fill="#f59e0b" />
                <polygon points="8,14 4,3 17,12" fill="#f59e0b" />
                <polygon points="32,14 36,3 23,12" fill="#f59e0b" />
                <polygon points="10,12 6,8 15,12" fill="#fca5a5" />
                <polygon points="30,12 34,8 25,12" fill="#fca5a5" />
                <ellipse cx="20" cy="26" rx="11" ry="9" fill="#fef3c7" />
                <ellipse cx="15" cy="22" rx="3" ry="3.5" fill="#1c1917" />
                <ellipse cx="25" cy="22" rx="3" ry="3.5" fill="#1c1917" />
                <circle cx="17" cy="20" r="1.2" fill="white" />
                <circle cx="27" cy="20" r="1.2" fill="white" />
                <ellipse cx="20" cy="28" rx="2" ry="1.5" fill="#f97316" />
                <path d="M20 29.5 Q16 33 13 31" fill="none" stroke="#9a3412" strokeWidth="0.8" strokeLinecap="round" />
                <path d="M20 29.5 Q24 33 27 31" fill="none" stroke="#9a3412" strokeWidth="0.8" strokeLinecap="round" />
              </svg>
              <div>
                <p className="font-semibold text-sm">果果仁</p>
                <p className="text-xs text-orange-100">我有物 · 吉祥物</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-white hover:text-orange-200 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-3 h-64 overflow-y-auto bg-orange-50/30">
            {messages.map((msg, i) => (
              <div key={i} className={`flex mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'pet' && (
                  <div className="flex-shrink-0 mr-1 mt-0.5">
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <ellipse cx="12" cy="14" rx="9" ry="8" fill="#f59e0b" />
                      <polygon points="6,8 4,3 10,7" fill="#f59e0b" />
                      <polygon points="18,8 20,3 14,7" fill="#f59e0b" />
                      <polygon points="7,7 5,5 9,7" fill="#fca5a5" />
                      <polygon points="17,7 19,5 15,7" fill="#fca5a5" />
                      <ellipse cx="12" cy="16" rx="7" ry="5" fill="#fef3c7" />
                      <ellipse cx="9" cy="13" rx="2" ry="2.5" fill="#1c1917" />
                      <ellipse cx="15" cy="13" rx="2" ry="2.5" fill="#1c1917" />
                      <circle cx="10" cy="12" r="0.8" fill="white" />
                      <circle cx="16" cy="12" r="0.8" fill="white" />
                      <ellipse cx="12" cy="17" rx="1.5" ry="1" fill="#f97316" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-orange-400 text-white rounded-br-md'
                      : 'bg-white text-gray-700 rounded-bl-md border border-orange-200'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex mb-3">
                <div className="flex-shrink-0 mr-1">
                  <svg viewBox="0 0 24 24" width="22" height="22">
                    <ellipse cx="12" cy="14" rx="9" ry="8" fill="#f59e0b" />
                    <polygon points="6,8 4,3 10,7" fill="#f59e0b" />
                    <polygon points="18,8 20,3 14,7" fill="#f59e0b" />
                    <ellipse cx="12" cy="16" rx="7" ry="5" fill="#fef3c7" />
                    <ellipse cx="9" cy="13" rx="2" ry="2.5" fill="#1c1917" />
                    <ellipse cx="15" cy="13" rx="2" ry="2.5" fill="#1c1917" />
                    <ellipse cx="12" cy="17" rx="1.5" ry="1" fill="#f97316" />
                  </svg>
                </div>
                <div className="bg-white text-gray-400 px-3 py-2 rounded-2xl rounded-bl-md border border-orange-200 text-sm">
                  <span className="inline-block animate-bounce">●</span>
                  <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                  <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>●</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-gray-100 bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChat()}
                placeholder="和果果仁说点什么..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm"
              />
              <button
                onClick={handleChat}
                disabled={!input.trim() || isTyping}
                className="px-4 py-2 bg-orange-400 text-white rounded-xl hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PetWidget;
