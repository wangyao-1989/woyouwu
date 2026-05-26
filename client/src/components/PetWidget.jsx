import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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

const PET_STATES = {
  IDLE: 'idle',
  BREATHING: 'breathing',
  YAWNING: 'yawning',
  SCRATCHING_EAR: 'scratching_ear',
  LOOKING_AT_MOUSE: 'looking_at_mouse',
  WALKING: 'walking',
  TALKING: 'talking',
  THINKING: 'thinking',
  FRIGHTENED: 'frightened',
  PLAYING_DEAD: 'playing_dead',
  HAPPY: 'happy',
};

const ACTION_MESSAGES = {
  head: [
    '喵~ 不要戳人家的头啦！(≧∇≦)ﾉ',
    '呼噜呼噜~ 舒服~',
    '再摸一下嘛~',
  ],
  body: [
    '嗯~ 肚肚好舒服~',
    '喵呜~ 揉得太棒了！',
    '不要停不要停！',
  ],
  tail: [
    '呀！尾巴很敏感的！',
    '别拽啦~ 痛痛！',
    '甩甩尾巴赶走你~',
  ],
  ear: [
    '耳朵痒~ 帮我抓抓~',
    '呜哇！好舒服！',
  ],
};

function PetWidget() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [posIndex, setPosIndex] = useState(0);
  const [petState, setPetState] = useState(PET_STATES.IDLE);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'pet', text: '喵~ 我是果果仁！(=^ω^=) 有什么可以帮你的吗？' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [faceIndex, setFaceIndex] = useState(0);
  const [tailWag, setTailWag] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const [yawning, setYawning] = useState(false);
  const [scratchingEar, setScratchingEar] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [showThoughtBubble, setShowThoughtBubble] = useState(false);
  const [showHeadMessage, setShowHeadMessage] = useState('');
  const [isFrightened, setIsFrightened] = useState(false);
  const [isPlayingDead, setIsPlayingDead] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [isFollowingMouse, setIsFollowingMouse] = useState(false);
  const [petName, setPetName] = useState('果果仁');
  const [customPetImage, setCustomPetImage] = useState('');
  const [newPetName, setNewPetName] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [petInfoLoaded, setPetInfoLoaded] = useState(false);
  
  const chatEndRef = useRef(null);
  const petRef = useRef(null);
  const fileInputRef = useRef(null);
  const posTimerRef = useRef(null);
  const faceTimerRef = useRef(null);
  const blinkTimerRef = useRef(null);
  const tailTimerRef = useRef(null);
  const breathTimerRef = useRef(null);
  const yawnTimerRef = useRef(null);
  const scratchTimerRef = useRef(null);
  const idleTimerRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    
    const fetchPetInfo = async () => {
      if (authUser) {
        try {
          const res = await axios.get('/api/users/pet/info');
          const name = res.data.pet.name || '果果仁';
          setPetName(name);
          setCustomPetImage(res.data.pet.image || '');
          setMessages([{ role: 'pet', text: `喵~ 我是${name}！(=^ω^=) 有什么可以帮你的吗？` }]);
        } catch (err) {
          console.error('Failed to fetch pet info:', err);
        }
      } else {
        setPetName('果果仁');
        setCustomPetImage('');
        setMessages([{ role: 'pet', text: '喵~ 我是果果仁！(=^ω^=) 有什么可以帮你的吗？' }]);
      }
      setPetInfoLoaded(true);
    };
    fetchPetInfo();
  }, [authUser, authLoading]);

  useEffect(() => {
    posTimerRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastInteractionTime > 15000 && petState === PET_STATES.IDLE) {
        setIsMoving(true);
        setTimeout(() => setIsMoving(false), 800);
        setPosIndex(prev => (prev + 1) % PET_POSITIONS.length);
      }
    }, 5000);

    faceTimerRef.current = setInterval(() => {
      if (petState === PET_STATES.IDLE) {
        setFaceIndex(prev => (prev + 1) % 3);
      }
    }, 3500);

    blinkTimerRef.current = setInterval(() => {
      if (!yawning && !scratchingEar) {
        setBlinking(true);
        setTimeout(() => setBlinking(false), 150);
      }
    }, 2000 + Math.random() * 2000);

    tailTimerRef.current = setInterval(() => {
      if (petState === PET_STATES.IDLE || petState === PET_STATES.HAPPY) {
        setTailWag(true);
        setTimeout(() => setTailWag(false), 600);
      }
    }, 4000 + Math.random() * 3000);

    breathTimerRef.current = setInterval(() => {
      if (petState === PET_STATES.IDLE) {
        setBreathing(true);
        setTimeout(() => setBreathing(false), 1000);
      }
    }, 3000);

    yawnTimerRef.current = setInterval(() => {
      if (petState === PET_STATES.IDLE && Math.random() > 0.6) {
        setYawning(true);
        setPetState(PET_STATES.YAWNING);
        setTimeout(() => {
          setYawning(false);
          setPetState(PET_STATES.IDLE);
        }, 1500);
      }
    }, 15000 + Math.random() * 10000);

    scratchTimerRef.current = setInterval(() => {
      if (petState === PET_STATES.IDLE && Math.random() > 0.7) {
        setScratchingEar(true);
        setPetState(PET_STATES.SCRATCHING_EAR);
        setTimeout(() => {
          setScratchingEar(false);
          setPetState(PET_STATES.IDLE);
        }, 2000);
      }
    }, 20000 + Math.random() * 10000);

    idleTimerRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastInteractionTime > 30000 && petState === PET_STATES.IDLE) {
        setIsMoving(true);
        setTimeout(() => setIsMoving(false), 1000);
        setPosIndex(prev => (prev + 1) % PET_POSITIONS.length);
      }
    }, 5000);

    return () => {
      [posTimerRef, faceTimerRef, blinkTimerRef, tailTimerRef, breathTimerRef, yawnTimerRef, scratchTimerRef, idleTimerRef].forEach(ref => {
        if (ref.current) clearInterval(ref.current);
      });
    };
  }, [petState, lastInteractionTime]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!petRef.current || isChatOpen || isSettingsOpen) return;
      
      const petRect = petRef.current.getBoundingClientRect();
      const petCenterX = petRect.left + petRect.width / 2;
      const petCenterY = petRect.top + petRect.height / 2;
      
      const dx = e.clientX - petCenterX;
      const dy = e.clientY - petCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 300) {
        setIsFollowingMouse(true);
        const maxOffset = 8;
        const xOffset = Math.max(-maxOffset, Math.min(maxOffset, dx * 0.05));
        const yOffset = Math.max(-maxOffset, Math.min(maxOffset, dy * 0.03));
        setMouseOffset({ x: xOffset, y: yOffset });
      } else {
        setIsFollowingMouse(false);
        setMouseOffset({ x: 0, y: 0 });
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'p' || e.key === 'P') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else {
          setIsChatOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isChatOpen, isSettingsOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handlePetClick = useCallback((part) => {
    setLastInteractionTime(Date.now());
    setIsFollowingMouse(false);
    setMouseOffset({ x: 0, y: 0 });

    if (part === 'chat') {
      setIsChatOpen(true);
      return;
    }

    if (part === 'settings') {
      setIsSettingsOpen(true);
      return;
    }

    const msgs = ACTION_MESSAGES[part] || ACTION_MESSAGES.body;
    const randomMessage = msgs[Math.floor(Math.random() * msgs.length)];
    
    setShowHeadMessage(randomMessage);
    setPetState(PET_STATES.TALKING);
    
    setTimeout(() => {
      setShowHeadMessage('');
      setPetState(PET_STATES.HAPPY);
      setTimeout(() => setPetState(PET_STATES.IDLE), 1000);
    }, 2500);

    if (part === 'tail') {
      setTailWag(true);
      setTimeout(() => setTailWag(false), 800);
    }
  }, []);

  const handleChat = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setIsTyping(true);
    setShowThoughtBubble(true);
    setPetState(PET_STATES.THINKING);

    try {
      const res = await axios.post('/api/ai/chat', { message: trimmed });
      const responseText = res.data.response || '喵~ 我没听懂呢~';
      setShowThoughtBubble(false);
      setPetState(PET_STATES.TALKING);
      setShowHeadMessage(responseText.length > 30 ? responseText.substring(0, 30) + '...' : responseText);
      setMessages(prev => [...prev, { role: 'pet', text: responseText }]);
      
      setTimeout(() => {
        setShowHeadMessage('');
        setPetState(PET_STATES.IDLE);
      }, 3000);
    } catch (err) {
      setShowThoughtBubble(false);
      const errorMsg = err.response?.data?.response || '喵~ 网络有点问题，稍后再聊吧~';
      setPetState(PET_STATES.TALKING);
      setMessages(prev => [...prev, { role: 'pet', text: errorMsg }]);
      setShowHeadMessage(errorMsg);
      
      setTimeout(() => {
        setShowHeadMessage('');
        setPetState(PET_STATES.IDLE);
      }, 2000);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('/api/users/pet/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCustomPetImage(res.data.pet.image);
      setUploadMessage('图片上传成功！');
      setTimeout(() => setUploadMessage(''), 2000);
    } catch (err) {
      setUploadMessage('上传失败，请重试');
      setTimeout(() => setUploadMessage(''), 2000);
    }
  };

  const handleNameChange = async () => {
    if (!newPetName.trim()) return;
    
    try {
      const res = await axios.put('/api/users/pet/name', { name: newPetName });
      setPetName(res.data.pet.name);
      setNewPetName('');
      setUploadMessage('名字修改成功！');
      setTimeout(() => setUploadMessage(''), 2000);
    } catch (err) {
      setUploadMessage('修改失败，请重试');
      setTimeout(() => setUploadMessage(''), 2000);
    }
  };

  const handleResetPet = async () => {
    try {
      await axios.put('/api/users/pet/name', { name: '果果仁' });
      try {
        await axios.delete('/api/users/pet/image');
      } catch (e) {}
      setCustomPetImage('');
      setPetName('果果仁');
      setUploadMessage('已恢复默认宠物！');
      setTimeout(() => setUploadMessage(''), 2000);
    } catch (err) {
      setUploadMessage('重置失败');
      setTimeout(() => setUploadMessage(''), 2000);
    }
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return path;
  };

  const currentPos = PET_POSITIONS[posIndex];
  const isLoggedIn = !!authUser && !authLoading;

  if (authLoading) return null;

  return (
    <>
      <div
        ref={petRef}
        className="fixed z-50 cursor-pointer select-none"
        style={{
          ...currentPos,
          transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isMoving 
            ? 'translateY(-10px) rotate(-5deg) scale(1.05)' 
            : isPlayingDead 
              ? 'translateY(5px) rotate(180deg)' 
              : 'translateY(0) rotate(0deg)',
        }}
        title={`${petName} - 按 P 键聊天`}
      >
        <div className="relative">
          {showThoughtBubble && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white rounded-xl px-3 py-2 shadow-lg border border-gray-200 animate-pulse">
              <span className="text-gray-600 text-sm">...</span>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
              </div>
            </div>
          )}

          {showHeadMessage && (
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white rounded-xl px-3 py-2 shadow-lg border border-orange-200 max-w-[180px]">
              <p className="text-gray-700 text-xs leading-relaxed">{showHeadMessage}</p>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
              </div>
            </div>
          )}

          {customPetImage ? (
            <img
              src={getImageUrl(customPetImage)}
              alt={petName}
              width="100"
              height="95"
              className={`drop-shadow-lg transition-all duration-300 ${isFrightened ? 'scale-110' : 'scale-100'} object-contain`}
              style={{ 
                filter: isFrightened ? 'drop-shadow(0 8px 16px rgba(255,0,0,0.3))' : 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))',
                transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)`,
                borderRadius: '12px'
              }}
            />
          ) : (
            <svg
              viewBox="0 0 220 190"
              width="110"
              height="95"
              className={`drop-shadow-lg transition-all duration-300 ${isFrightened ? 'scale-110' : 'scale-100'}`}
              style={{ 
                filter: isFrightened ? 'drop-shadow(0 8px 16px rgba(255,0,0,0.3))' : 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))',
                transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)`
              }}
            >
              <defs>
                <filter id="fluffy" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
                </filter>
              </defs>

              {isFrightened && (
                <g>
                  <circle cx="5" cy="40" r="10" fill="#f59e0b" opacity="0.5" />
                  <circle cx="5" cy="60" r="7" fill="#f59e0b" opacity="0.4" />
                  <circle cx="215" cy="40" r="10" fill="#f59e0b" opacity="0.5" />
                  <circle cx="215" cy="60" r="7" fill="#f59e0b" opacity="0.4" />
                </g>
              )}

              <g style={{
                transformOrigin: '190px 110px',
                transition: 'transform 0.3s ease-in-out',
                transform: tailWag ? 'rotate(-30deg)' : 'rotate(-5deg)'
              }}>
                <path
                  d="M190 110 Q215 85 230 55 Q235 42 225 38 Q210 34 212 55 Q208 78 195 105"
                  fill="#fcd34d"
                  stroke="#f59e0b"
                  strokeWidth="1"
                />
                <path
                  d="M225 42 Q222 36 228 38"
                  fill="#fffbeb"
                  stroke="none"
                />
              </g>

              <ellipse cx="70" cy="170" rx="18" ry="12" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1" />
              <ellipse cx="115" cy="170" rx="18" ry="12" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1" />
              <ellipse cx="70" cy="174" rx="12" ry="7" fill="#fffbeb" />
              <ellipse cx="115" cy="174" rx="12" ry="7" fill="#fffbeb" />

              <ellipse 
                cx="85" cy="125" rx="48" ry={breathing ? 38 : 34} 
                fill="#fcd34d" stroke="#f59e0b" strokeWidth="1.5"
                style={{ transition: 'ry 0.5s ease-in-out' }}
              />
              <ellipse cx="82" cy="130" rx="30" ry={breathing ? 24 : 21} fill="#fffbeb" style={{ transition: 'ry 0.5s ease-in-out' }} />
              
              <path d="M105 95 Q108 100 105 105" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <path d="M112 105 Q115 110 112 115" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              <path d="M108 117 Q111 122 108 127" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />

              <ellipse cx="55" cy="148" rx="16" ry="10" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1" />
              <ellipse cx="95" cy="150" rx="16" ry="10" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1" />
              <ellipse cx="55" cy="152" rx="10" ry="5" fill="#fffbeb" />
              <ellipse cx="95" cy="154" rx="10" ry="5" fill="#fffbeb" />

              <g style={{ transform: scratchingEar ? 'rotate(12deg)' : 'rotate(0deg)', transformOrigin: '65px 85px' }}>
                <ellipse cx="65" cy="80" rx="38" ry="32" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1.2" />

                <path d="M30 65 Q20 30 50 52 Q55 55 35 68" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1" />
                <ellipse cx="35" cy="48" rx="12" ry="18" fill="#fca5a5" opacity="0.7" />

                <path d="M85 52 Q105 22 85 50 Q80 53 88 55" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1" />
                <ellipse cx="90" cy="42" rx="10" ry="15" fill="#fca5a5" opacity="0.7" />

                <ellipse cx="32" cy="45" rx="5" ry="8" fill="#fca5a5" />
                <ellipse cx="98" cy="38" rx="5" ry="8" fill="#fca5a5" />

                <ellipse cx="65" cy="92" rx="26" ry="20" fill="#fffbeb" />

                <g style={{ transform: isFollowingMouse ? `translate(${mouseOffset.x * 0.4}px, ${mouseOffset.y * 0.2}px)` : 'translate(0, 0)' }}>
                  <ellipse cx="48" cy="78" rx="9" ry={blinking || yawning ? 1.5 : 10} fill="#1f2937" style={{ transition: 'all 0.1s' }} />
                  <ellipse cx="82" cy="78" rx="9" ry={blinking || yawning ? 1.5 : 10} fill="#1f2937" style={{ transition: 'all 0.1s' }} />
                  {!blinking && !yawning && (
                    <>
                      <circle cx="51" cy="75" r="4" fill="white" />
                      <circle cx="85" cy="75" r="4" fill="white" />
                      <circle cx="53" cy="74" r="1.5" fill="#1f2937" />
                      <circle cx="87" cy="74" r="1.5" fill="#1f2937" />
                    </>
                  )}
                </g>

                <ellipse cx="65" cy="94" rx="5" ry="3.5" fill="#f97316" />

                {yawning ? (
                  <path
                    d="M65 98 Q58 115 48 108 Q65 125 82 108 Q72 115 65 98"
                    fill="#78350f"
                    stroke="#572d0a"
                    strokeWidth="1.2"
                  />
                ) : (
                  <>
                    <path
                      d={`M65 96 Q56 ${104 + (faceIndex % 2) * 3} 52 100`}
                      fill="none"
                      stroke="#9a3412"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M65 96 Q74 ${104 + (faceIndex % 2) * 3} 78 100`}
                      fill="none"
                      stroke="#9a3412"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </>
                )}

                <line x1="15" y1="85" x2="40" y2="90" stroke="#f59e0b" strokeWidth="0.7" strokeLinecap="round" />
                <line x1="12" y1="92" x2="38" y2="94" stroke="#f59e0b" strokeWidth="0.7" strokeLinecap="round" />
                <line x1="15" y1="99" x2="40" y2="98" stroke="#f59e0b" strokeWidth="0.7" strokeLinecap="round" />
                <line x1="90" y1="90" x2="115" y2="85" stroke="#f59e0b" strokeWidth="0.7" strokeLinecap="round" />
                <line x1="92" y1="94" x2="118" y2="92" stroke="#f59e0b" strokeWidth="0.7" strokeLinecap="round" />
                <line x1="90" y1="98" x2="115" y2="99" stroke="#f59e0b" strokeWidth="0.7" strokeLinecap="round" />

                <ellipse cx="42" cy="96" rx="8" ry="5" fill="#fca5a5" opacity="0.5" />
                <ellipse cx="88" cy="96" rx="8" ry="5" fill="#fca5a5" opacity="0.5" />

                <circle cx="65" cy="55" r="3" fill="#f59e0b" />
                <circle cx="55" cy="58" r="2" fill="#f59e0b" />
                <circle cx="75" cy="58" r="2" fill="#f59e0b" />
              </g>

              <g>
                <ellipse cx="75" cy="128" rx="15" ry="8" fill="#ec4899" />
                <path d="M62 125 Q60 115 75 120 Q90 115 88 125" fill="none" stroke="#be185d" strokeWidth="1.5" />
              </g>

              {scratchingEar && (
                <g style={{ transformOrigin: '90px 140px', animation: 'scratch 0.3s infinite' }}>
                  <ellipse cx="95" cy="140" rx="14" ry="9" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1" />
                  <ellipse cx="95" cy="144" rx="9" ry="5" fill="#fffbeb" />
                  <line x1="95" y1="130" x2="85" y2="60" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="98" y1="128" x2="92" y2="58" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="101" y1="130" x2="100" y2="62" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                </g>
              )}

              <g className="absolute" style={{ top: '0', left: '0' }}>
                <rect 
                  x="25" y="45" width="30" height="40" 
                  fill="transparent" 
                  onClick={(e) => { e.stopPropagation(); handlePetClick('ear'); }}
                  className="cursor-pointer"
                />
                <rect 
                  x="35" y="75" width="50" height="35" 
                  fill="transparent" 
                  onClick={(e) => { e.stopPropagation(); handlePetClick('head'); }}
                  className="cursor-pointer"
                />
                <rect 
                  x="60" y="110" width="55" height="45" 
                  fill="transparent" 
                  onClick={(e) => { e.stopPropagation(); handlePetClick('body'); }}
                  className="cursor-pointer"
                />
                <rect 
                  x="180" y="80" width="35" height="45" 
                  fill="transparent" 
                  onClick={(e) => { e.stopPropagation(); handlePetClick('tail'); }}
                  className="cursor-pointer"
                />
              </g>
            </svg>
          )}

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full border-2 border-white animate-pulse"></span>
            <button
              onClick={(e) => { e.stopPropagation(); handlePetClick('settings'); }}
              className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-sm hover:from-blue-500 hover:to-blue-700 hover:scale-110 transition-all z-10"
              title="宠物设置"
            >
              ⚙
            </button>
          </div>
        </div>
      </div>

      {isChatOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" style={{ maxHeight: '450px' }}>
          <div className="bg-gradient-to-r from-amber-500 to-orange-400 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {customPetImage ? (
                <img
                  src={getImageUrl(customPetImage)}
                  alt={petName}
                  width="32"
                  height="32"
                  className="rounded-full object-cover"
                />
              ) : (
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
              )}
              <div>
                <p className="font-semibold text-sm">{petName}</p>
                <p className="text-xs text-orange-100">我有物 · 吉祥物 | 按 P 关闭</p>
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
                    {customPetImage ? (
                      <img
                        src={getImageUrl(customPetImage)}
                        alt={petName}
                        width="22"
                        height="22"
                        className="rounded-full object-cover"
                      />
                    ) : (
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
                    )}
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
                  {customPetImage ? (
                    <img
                      src={getImageUrl(customPetImage)}
                      alt={petName}
                      width="22"
                      height="22"
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <ellipse cx="12" cy="14" rx="9" ry="8" fill="#f59e0b" />
                      <polygon points="6,8 4,3 10,7" fill="#f59e0b" />
                      <polygon points="18,8 20,3 14,7" fill="#f59e0b" />
                      <ellipse cx="12" cy="16" rx="7" ry="5" fill="#fef3c7" />
                      <ellipse cx="9" cy="13" rx="2" ry="2.5" fill="#1c1917" />
                      <ellipse cx="15" cy="13" rx="2" ry="2.5" fill="#1c1917" />
                      <ellipse cx="12" cy="17" rx="1.5" ry="1" fill="#f97316" />
                    </svg>
                  )}
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
                placeholder={`和${petName}说点什么...`}
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

      {isSettingsOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-400 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">宠物设置</p>
              <p className="text-xs text-blue-100">按 P 关闭</p>
            </div>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-white hover:text-blue-200 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-4">
            {!isLoggedIn ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">登录后可自定义宠物</p>
                <p className="text-xs text-gray-500">登录后可以上传图片和修改名字</p>
                <button
                  onClick={() => { setIsSettingsOpen(false); window.location.href = '/login'; }}
                  className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition text-sm"
                >
                  去登录
                </button>
              </div>
            ) : (
              <>
                {uploadMessage && (
                  <div className={`text-center text-sm py-2 rounded-lg ${uploadMessage.includes('成功') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {uploadMessage}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">上传宠物图片</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="pet-image-upload"
                  />
                  <label
                    htmlFor="pet-image-upload"
                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                  >
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-500 mt-1">点击上传图片</span>
                  </label>
                  {customPetImage && (
                    <img
                      src={getImageUrl(customPetImage)}
                      alt="当前宠物"
                      className="mt-2 w-full h-24 object-contain rounded-lg bg-gray-100"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">宠物名字</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newPetName || petName}
                      onChange={e => setNewPetName(e.target.value)}
                      placeholder="输入宠物名字"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm"
                      maxLength={20}
                    />
                    <button
                      onClick={handleNameChange}
                      className="px-3 py-2 bg-blue-400 text-white rounded-xl hover:bg-blue-500 transition text-sm"
                    >
                      保存
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleResetPet}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                >
                  恢复默认宠物
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scratch {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }
      `}</style>
    </>
  );
}

export default PetWidget;
