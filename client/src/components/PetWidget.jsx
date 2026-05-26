import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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

  const [petState, setPetState] = useState(PET_STATES.IDLE);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'pet', text: '喵~ 我是果果仁！(=^ω^=) 有什么可以帮你的吗？' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [faceIndex, setFaceIndex] = useState(0);
  const [tailWag, setTailWag] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const [yawning, setYawning] = useState(false);
  const [scratchingEar, setScratchingEar] = useState(false);
  const [showThoughtBubble, setShowThoughtBubble] = useState(false);
  const [showHeadMessage, setShowHeadMessage] = useState('');
  const [isFrightened, setIsFrightened] = useState(false);
  const [isPlayingDead, setIsPlayingDead] = useState(false);
  const [petName, setPetName] = useState('果果仁');
  const [customPetImage, setCustomPetImage] = useState('');
  const [walkGif, setWalkGif] = useState('');
  const [newPetName, setNewPetName] = useState('');
  const [petInfoLoaded, setPetInfoLoaded] = useState(false);

  const [wanderingEnabled, setWanderingEnabled] = useState(false);
  const [petVideos, setPetVideos] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [hearts, setHearts] = useState([]);
  const [imageBounce, setImageBounce] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [toast, setToast] = useState(null);
  const [gifTrimStart, setGifTrimStart] = useState('');
  const [gifTrimEnd, setGifTrimEnd] = useState('');
  const [trimming, setTrimming] = useState(false);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const petRef = useRef(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const videoRef = useRef(null);
  const imgRef = useRef(null);

  const animationRef = useRef(null);
  const wanderTimerRef = useRef(null);
  const faceTimerRef = useRef(null);
  const blinkTimerRef = useRef(null);
  const tailTimerRef = useRef(null);
  const breathTimerRef = useRef(null);
  const yawnTimerRef = useRef(null);
  const scratchTimerRef = useRef(null);
  const walkPhaseRef = useRef(0);

  const posRef = useRef({ x: window.innerWidth - 140, y: window.innerHeight - 160 });
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const targetRef = useRef({ x: window.innerWidth - 140, y: window.innerHeight - 160 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const isLoggedIn = !!authUser && !authLoading;

  useEffect(() => {
    if (authLoading) return;

    const fetchPetInfo = async () => {
      if (authUser) {
        try {
          const res = await axios.get('/api/users/pet/info');
          const name = res.data.pet.name || '果果仁';
          setPetName(name);
          setCustomPetImage(res.data.pet.image || '');
          setWalkGif(res.data.pet.walkGif || '');
          setPetVideos(res.data.pet.videos || []);
          setMessages([{ role: 'pet', text: `喵~ 我是${name}！(=^ω^=) 有什么可以帮你的吗？` }]);
        } catch (err) {
          console.error('Failed to fetch pet info:', err);
        }
      } else {
        setPetName('果果仁');
        setCustomPetImage('');
        setWalkGif('');
        setPetVideos([]);
        setMessages([{ role: 'pet', text: '喵~ 我是果果仁！(=^ω^=) 有什么可以帮你的吗？' }]);
      }
      setPetInfoLoaded(true);
    };
    fetchPetInfo();
  }, [authUser, authLoading]);

  useEffect(() => {
    const pickNewTarget = () => {
      const margin = 60;
      const maxX = window.innerWidth - 120;
      const maxY = window.innerHeight - 140;
      targetRef.current = {
        x: margin + Math.random() * (maxX - margin * 2),
        y: margin + Math.random() * (maxY - margin * 2),
      };
    };

    const wanderLoop = () => {
      if (!wanderingEnabled || isDraggingRef.current || isChatOpen || isSettingsOpen) {
        animationRef.current = requestAnimationFrame(wanderLoop);
        return;
      }

      const pos = posRef.current;
      const target = targetRef.current;

      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        pickNewTarget();
        velocityRef.current = { vx: 0, vy: 0 };
      } else {
        const maxSpeed = 0.8;
        const ax = (dx / dist) * 0.04;
        const ay = (dy / dist) * 0.04;

        velocityRef.current = {
          vx: Math.max(-maxSpeed, Math.min(maxSpeed, velocityRef.current.vx + ax)),
          vy: Math.max(-maxSpeed, Math.min(maxSpeed, velocityRef.current.vy + ay)),
        };

        const friction = 0.96;
        velocityRef.current = {
          vx: velocityRef.current.vx * friction,
          vy: velocityRef.current.vy * friction,
        };

        posRef.current = {
          x: Math.max(10, Math.min(window.innerWidth - 120, pos.x + velocityRef.current.vx)),
          y: Math.max(10, Math.min(window.innerHeight - 140, pos.y + velocityRef.current.vy)),
        };
      }

      if (petRef.current) {
        petRef.current.style.left = posRef.current.x + 'px';
        petRef.current.style.top = posRef.current.y + 'px';
      }

      const speed = Math.abs(velocityRef.current.vx) + Math.abs(velocityRef.current.vy);
      setIsWalking(speed > 0.1);

      if (imgRef.current) {
        if (speed > 0.1) {
          walkPhaseRef.current += speed * 0.35;
          const bounce = Math.abs(Math.sin(walkPhaseRef.current)) * 7;
          imgRef.current.style.marginTop = `${-bounce}px`;
        } else {
          walkPhaseRef.current = 0;
          imgRef.current.style.marginTop = '0px';
        }
      }

      if (velocityRef.current.vx > 0.05) setFacingRight(true);
      else if (velocityRef.current.vx < -0.05) setFacingRight(false);

      animationRef.current = requestAnimationFrame(wanderLoop);
    };

    wanderTimerRef.current = setInterval(() => {
      if (wanderingEnabled && !isDraggingRef.current && Math.random() > 0.4) {
        const margin = 60;
        targetRef.current = {
          x: margin + Math.random() * (window.innerWidth - margin * 2 - 120),
          y: margin + Math.random() * (window.innerHeight - margin * 2 - 140),
        };
      }
    }, 4000 + Math.random() * 3000);

    animationRef.current = requestAnimationFrame(wanderLoop);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (wanderTimerRef.current) clearInterval(wanderTimerRef.current);
    };
  }, [wanderingEnabled, isChatOpen, isSettingsOpen]);

  useEffect(() => {
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

    return () => {
      [faceTimerRef, blinkTimerRef, tailTimerRef, breathTimerRef, yawnTimerRef, scratchTimerRef].forEach(ref => {
        if (ref.current) clearInterval(ref.current);
      });
    };
  }, [petState]);

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (!petRef.current) return;
      const petRect = petRef.current.getBoundingClientRect();
      const mx = e.clientX;
      const my = e.clientY;
      if (
        mx >= petRect.left &&
        mx <= petRect.right &&
        my >= petRect.top &&
        my <= petRect.bottom
      ) {
        isDraggingRef.current = true;
        dragStartRef.current = { x: mx, y: my };
        dragOffsetRef.current = {
          x: posRef.current.x - mx,
          y: posRef.current.y - my,
        };
        setWanderingEnabled(false);
      }
    };

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      posRef.current = {
        x: Math.max(10, Math.min(window.innerWidth - 120, e.clientX + dragOffsetRef.current.x)),
        y: Math.max(10, Math.min(window.innerHeight - 140, e.clientY + dragOffsetRef.current.y)),
      };
      if (petRef.current) {
        petRef.current.style.left = posRef.current.x + 'px';
        petRef.current.style.top = posRef.current.y + 'px';
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
      }
    };

    const handleTouchStart = (e) => {
      if (!petRef.current || e.touches.length !== 1) return;
      const petRect = petRef.current.getBoundingClientRect();
      const tx = e.touches[0].clientX;
      const ty = e.touches[0].clientY;
      if (
        tx >= petRect.left &&
        tx <= petRect.right &&
        ty >= petRect.top &&
        ty <= petRect.bottom
      ) {
        isDraggingRef.current = true;
        dragStartRef.current = { x: tx, y: ty };
        dragOffsetRef.current = {
          x: posRef.current.x - tx,
          y: posRef.current.y - ty,
        };
        setWanderingEnabled(false);
      }
    };

    const handleTouchMove = (e) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      e.preventDefault();
      posRef.current = {
        x: Math.max(10, Math.min(window.innerWidth - 120, e.touches[0].clientX + dragOffsetRef.current.x)),
        y: Math.max(10, Math.min(window.innerHeight - 140, e.touches[0].clientY + dragOffsetRef.current.y)),
      };
      if (petRef.current) {
        petRef.current.style.left = posRef.current.x + 'px';
        petRef.current.style.top = posRef.current.y + 'px';
      }
    };

    const handleTouchEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
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

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isChatOpen, isSettingsOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (playingVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [playingVideo]);

  const handlePetClick = useCallback((part) => {
    if (isDraggingRef.current) return;

    if (petVideos.length > 0 && part !== 'chat' && part !== 'settings') {
      const randomVideo = petVideos[Math.floor(Math.random() * petVideos.length)];
      setPlayingVideo(randomVideo);
      setTimeout(() => setPlayingVideo(null), 8000);
    }

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
    setImageBounce(true);
    setTimeout(() => setImageBounce(false), 400);

    const heartId = Date.now();
    setHearts(prev => [...prev, { id: heartId, x: 0, y: -20 }]);
    setTimeout(() => setHearts(prev => prev.filter(h => h.id !== heartId)), 1200);

    setTimeout(() => {
      setShowHeadMessage('');
      setPetState(PET_STATES.HAPPY);
      setTimeout(() => setPetState(PET_STATES.IDLE), 1000);
    }, 2500);

    if (part === 'tail') {
      setTailWag(true);
      setTimeout(() => setTailWag(false), 800);
    }
  }, [petVideos]);

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

    if (file.size > 20 * 1024 * 1024) {
      showToast('图片大小不能超过20MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('/api/users/pet/image', formData);
      setCustomPetImage(res.data.pet.image);
      showToast('✅ 图片上传成功！', 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || '上传失败，请重试';
      showToast('❌ ' + errorMsg, 'error');
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showToast('视频大小不能超过50MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('video', file);
    formData.append('label', file.name.replace(/\.[^/.]+$/, ''));

    try {
      const res = await axios.post('/api/users/pet/video', formData);
      setPetVideos(res.data.pet.videos || []);
      showToast('✅ 视频上传成功！', 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || '上传失败，请重试';
      showToast('❌ ' + errorMsg, 'error');
    }
  };

  const handleDeleteVideo = async (filename) => {
    try {
      const res = await axios.delete(`/api/users/pet/video/${filename}`);
      setPetVideos(res.data.pet.videos || []);
      if (playingVideo?.filename === filename) setPlayingVideo(null);
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  const handleNameChange = async () => {
    if (!newPetName.trim()) return;

    try {
      const res = await axios.put('/api/users/pet/name', { name: newPetName });
      setPetName(res.data.pet.name);
      setNewPetName('');
      showToast('✅ 名字修改成功！', 'success');
    } catch (err) {
      showToast('❌ 修改失败，请重试', 'error');
    }
  };

  const handleResetPet = async () => {
    try {
      await axios.put('/api/users/pet/name', { name: '果果仁' });
      try { await axios.delete('/api/users/pet/image'); } catch (e) {}
      try { await axios.delete('/api/users/pet/walk-gif'); } catch (e) {}
      for (const v of petVideos) {
        try { await axios.delete(`/api/users/pet/video/${v.filename}`); } catch (e) {}
      }
      setCustomPetImage('');
      setWalkGif('');
      setPetName('果果仁');
      setPetVideos([]);
      setPlayingVideo(null);
      showToast('✅ 已恢复默认宠物！', 'success');
    } catch (err) {
      showToast('❌ 重置失败', 'error');
    }
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return path;
  };

  const getVideoUrl = (filename) => {
    if (!filename) return '';
    return `/uploads/${filename}`;
  };

  const handleGifTrim = async () => {
    const start = parseFloat(gifTrimStart);
    const end = parseFloat(gifTrimEnd);
    if (isNaN(start) || isNaN(end) || start < 0 || end <= start) {
      showToast('请输入有效的时间范围（结束时间需大于开始时间）', 'error');
      return;
    }
    setTrimming(true);
    try {
      const res = await axios.post('/api/users/pet/walk-gif/trim', {
        startTime: start,
        endTime: end,
      });
      setWalkGif(res.data.pet.walkGif);
      setGifTrimStart('');
      setGifTrimEnd('');
      showToast('✂️ ' + (res.data.message || 'GIF裁剪成功！'), 'success');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || '裁剪失败';
      showToast('❌ ' + errorMsg, 'error');
    } finally {
      setTrimming(false);
    }
  };

  if (authLoading || !petInfoLoaded) return null;

  return (
    <>
      <div
        ref={petRef}
        className="fixed z-50 select-none"
        style={{
          left: posRef.current.x,
          top: posRef.current.y,
          cursor: isDraggingRef.current ? 'grabbing' : 'grab',
          transition: (isDraggingRef.current || !wanderingEnabled) ? 'none' : 'none',
        }}
        title={`${petName} - 拖拽移动 | 点击互动 | 按 P 键聊天`}
      >
        <div className="relative" onClick={() => handlePetClick('chat')}>
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

          {playingVideo && (
            <div className="absolute -top-40 left-1/2 transform -translate-x-1/2 bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-orange-400 z-20"
              style={{ width: '160px', height: '120px' }}>
              <video
                ref={videoRef}
                src={getVideoUrl(playingVideo.filename)}
                className="w-full h-full object-cover"
                muted
                loop
                playsInline
                onEnded={() => setPlayingVideo(null)}
              />
              <button
                onClick={(e) => { e.stopPropagation(); setPlayingVideo(null); }}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/80"
              >
                ✕
              </button>
            </div>
          )}

          {customPetImage ? (
            <div className="relative inline-block" style={{
              filter: isFrightened ? 'drop-shadow(0 8px 16px rgba(255,0,0,0.3))' : 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))',
            }}>
              <img
                ref={imgRef}
                src={getImageUrl(walkGif || customPetImage)}
                alt={petName}
                width="150"
                height="140"
                className={`object-contain ${isFrightened ? 'scale-110' : 'scale-100'}`}
                style={{
                  maxWidth: '150px',
                  maxHeight: '140px',
                  transform: `scaleX(${facingRight ? 1 : -1})`,
                  transition: 'transform 0.15s ease-out, margin-top 0.2s ease-out',
                  animation: imageBounce ? 'petBounce 0.4s ease-out' : ((!isWalking || !walkGif) && breathing ? 'petBreathing 2s ease-in-out' : 'none'),
                }}
                draggable="false"
              />
              {hearts.map(h => (
                <div key={h.id} className="absolute pointer-events-none"
                  style={{
                    left: '50%', top: '50%',
                    transform: `translate(${h.x}px, ${h.y}px)`,
                    animation: 'heartFloat 1.2s ease-out forwards',
                    fontSize: '18px',
                  }}>
                  {['❤️', '💕', '💖'][h.id % 3]}
                </div>
              ))}
            </div>
          ) : (
            <svg
              viewBox="0 0 220 190"
              width="110"
              height="95"
              className={`drop-shadow-lg transition-all duration-300 ${isFrightened ? 'scale-110' : 'scale-100'}`}
              style={{
                filter: isFrightened ? 'drop-shadow(0 8px 16px rgba(255,0,0,0.3))' : 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))',
              }}
            >
              {isFrightened && (
                <>
                  <circle cx="5" cy="40" r="10" fill="#f59e0b" opacity="0.5" />
                  <circle cx="5" cy="60" r="7" fill="#f59e0b" opacity="0.4" />
                  <circle cx="215" cy="40" r="10" fill="#f59e0b" opacity="0.5" />
                  <circle cx="215" cy="60" r="7" fill="#f59e0b" opacity="0.4" />
                </>
              )}

              <g style={{
                transformOrigin: '190px 110px',
                transition: 'transform 0.3s ease-in-out',
                transform: tailWag ? 'rotate(-30deg)' : 'rotate(-5deg)'
              }}>
                <path d="M190 110 Q215 85 230 55 Q235 42 225 38 Q210 34 212 55 Q208 78 195 105" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1" />
                <path d="M225 42 Q222 36 228 38" fill="#fffbeb" stroke="none" />
              </g>

              <ellipse cx="70" cy="170" rx="18" ry="12" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1" />
              <ellipse cx="115" cy="170" rx="18" ry="12" fill="#fcd34d" stroke="#f59e0b" strokeWidth="1" />
              <ellipse cx="70" cy="174" rx="12" ry="7" fill="#fffbeb" />
              <ellipse cx="115" cy="174" rx="12" ry="7" fill="#fffbeb" />

              <ellipse cx="85" cy="125" rx="48" ry={breathing ? 38 : 34} fill="#fcd34d" stroke="#f59e0b" strokeWidth="1.5"
                style={{ transition: 'ry 0.5s ease-in-out' }} />
              <ellipse cx="82" cy="130" rx="30" ry={breathing ? 24 : 21} fill="#fffbeb"
                style={{ transition: 'ry 0.5s ease-in-out' }} />

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

                <ellipse cx="48" cy="78" rx="9" ry={blinking || yawning ? 1.5 : 10} fill="#1f2937"
                  style={{ transition: 'all 0.1s' }} />
                <ellipse cx="82" cy="78" rx="9" ry={blinking || yawning ? 1.5 : 10} fill="#1f2937"
                  style={{ transition: 'all 0.1s' }} />
                {!blinking && !yawning && (
                  <>
                    <circle cx="51" cy="75" r="4" fill="white" />
                    <circle cx="85" cy="75" r="4" fill="white" />
                    <circle cx="53" cy="74" r="1.5" fill="#1f2937" />
                    <circle cx="87" cy="74" r="1.5" fill="#1f2937" />
                  </>
                )}

                <ellipse cx="65" cy="94" rx="5" ry="3.5" fill="#f97316" />

                {yawning ? (
                  <path d="M65 98 Q58 115 48 108 Q65 125 82 108 Q72 115 65 98" fill="#78350f" stroke="#572d0a" strokeWidth="1.2" />
                ) : (
                  <>
                    <path d={`M65 96 Q56 ${104 + (faceIndex % 2) * 3} 52 100`} fill="none" stroke="#9a3412" strokeWidth="1.5" strokeLinecap="round" />
                    <path d={`M65 96 Q74 ${104 + (faceIndex % 2) * 3} 78 100`} fill="none" stroke="#9a3412" strokeWidth="1.5" strokeLinecap="round" />
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

              <g style={{ pointerEvents: 'all' }}>
                <rect x="25" y="45" width="30" height="40" fill="rgba(0,0,0,0.01)"
                  onClick={(e) => { e.stopPropagation(); handlePetClick('ear'); }} className="cursor-pointer" />
                <rect x="35" y="75" width="50" height="35" fill="rgba(0,0,0,0.01)"
                  onClick={(e) => { e.stopPropagation(); handlePetClick('head'); }} className="cursor-pointer" />
                <rect x="60" y="110" width="55" height="45" fill="rgba(0,0,0,0.01)"
                  onClick={(e) => { e.stopPropagation(); handlePetClick('body'); }} className="cursor-pointer" />
                <rect x="180" y="80" width="35" height="45" fill="rgba(0,0,0,0.01)"
                  onClick={(e) => { e.stopPropagation(); handlePetClick('tail'); }} className="cursor-pointer" />
              </g>
            </svg>
          )}

          <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents: 'none' }}>
            {petVideos.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full border-2 border-white animate-pulse"
                style={{ pointerEvents: 'auto' }} title={`${petVideos.length}个交互视频`}></span>
            )}
          </div>
        </div>
      </div>

      {isChatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          style={{ maxHeight: '450px' }}>
          <div className="bg-gradient-to-r from-amber-500 to-orange-400 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {customPetImage ? (
                <img src={getImageUrl(customPetImage)} alt={petName} width="32" height="32" className="rounded-full object-cover" />
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
            <div className="flex items-center space-x-1">
              <button
                onClick={() => { setIsChatOpen(false); setIsSettingsOpen(true); }}
                className="text-white hover:text-orange-200 transition p-1 rounded-full hover:bg-white/10"
                title="宠物设置"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-orange-200 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-3 h-64 overflow-y-auto bg-orange-50/30">
            {messages.map((msg, i) => (
              <div key={i} className={`flex mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'pet' && (
                  <div className="flex-shrink-0 mr-1 mt-0.5">
                    {customPetImage ? (
                      <img src={getImageUrl(customPetImage)} alt={petName} width="22" height="22" className="rounded-full object-cover" />
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
                <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-orange-400 text-white rounded-br-md'
                    : 'bg-white text-gray-700 rounded-bl-md border border-orange-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex mb-3">
                <div className="flex-shrink-0 mr-1">
                  {customPetImage ? (
                    <img src={getImageUrl(customPetImage)} alt={petName} width="22" height="22" className="rounded-full object-cover" />
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
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[80vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-400 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <div>
              <p className="font-semibold text-sm">宠物设置</p>
              <p className="text-xs text-blue-100">按 P 关闭</p>
            </div>
            <button onClick={() => setIsSettingsOpen(false)} className="text-white hover:text-blue-200 transition">
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
                <p className="text-xs text-gray-500">登录后可以上传图片、视频和修改名字</p>
                <button
                  onClick={() => { setIsSettingsOpen(false); window.location.href = '/login'; }}
                  className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition text-sm"
                >
                  去登录
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">上传宠物图片</label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="pet-image-upload" />
                  <label htmlFor="pet-image-upload"
                    className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-500 mt-1">点击上传图片</span>
                  </label>
                  {customPetImage && (
                    <img src={getImageUrl(customPetImage)} alt="当前宠物" className="mt-2 w-full h-24 object-contain rounded-lg" />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">上传走路GIF动画 🚶</label>
                  <input type="file" accept="image/gif" onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 100 * 1024 * 1024) {
                      showToast('GIF大小不能超过100MB', 'error');
                      return;
                    }
                    const formData = new FormData();
                    formData.append('walkGif', file);
                    try {
                      const res = await axios.post('/api/users/pet/walk-gif', formData);
                      setWalkGif(res.data.pet.walkGif);
                      showToast('✅ 走路GIF上传成功！', 'success');
                    } catch (err) {
                      const errorMsg = err.response?.data?.message || err.message || '上传失败';
                      showToast('❌ ' + errorMsg, 'error');
                    }
                  }} className="hidden" id="pet-walk-gif-upload" />
                  <label htmlFor="pet-walk-gif-upload"
                    className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-orange-300 rounded-lg cursor-pointer hover:bg-orange-50 transition">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-gray-500 mt-1">上传GIF（猫走路动画，≤10MB）</span>
                  </label>
                  {walkGif && (
                    <div className="mt-2 flex items-center justify-between bg-orange-50 rounded-lg px-2 py-1.5">
                      <div className="flex items-center space-x-2">
                        <img src={getImageUrl(walkGif)} alt="走路GIF" className="w-8 h-8 object-contain rounded" />
                        <span className="text-xs text-gray-600">走路动画已设置</span>
                      </div>
                      <button onClick={async () => {
                        try {
                          await axios.delete('/api/users/pet/walk-gif');
                          setWalkGif('');
                          showToast('✅ 走路动画已删除', 'success');
                        } catch (err) {
                          showToast('❌ 删除失败', 'error');
                        }
                      }} className="text-red-400 hover:text-red-600 text-xs">删除</button>
                    </div>
                  )}
                  {walkGif && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-blue-700 mb-2">✂️ 裁剪GIF长度</p>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={gifTrimStart}
                          onChange={e => setGifTrimStart(e.target.value)}
                          placeholder="起始(秒)"
                          step="0.1"
                          min="0"
                          className="w-1/2 px-2 py-1.5 text-xs border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400"
                        />
                        <span className="text-xs text-gray-400">~</span>
                        <input
                          type="number"
                          value={gifTrimEnd}
                          onChange={e => setGifTrimEnd(e.target.value)}
                          placeholder="结束(秒)"
                          step="0.1"
                          min="0"
                          className="w-1/2 px-2 py-1.5 text-xs border border-blue-200 rounded-lg focus:outline-none focus:border-blue-400"
                        />
                        <button
                          onClick={handleGifTrim}
                          disabled={trimming || !gifTrimStart || !gifTrimEnd}
                          className="px-2 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium whitespace-nowrap"
                        >
                          {trimming ? '裁剪中...' : '裁剪'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">上传交互视频</label>
                  <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/ogg" onChange={handleVideoUpload} className="hidden" id="pet-video-upload" />
                  <label htmlFor="pet-video-upload"
                    className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50 transition">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-500 mt-1">点击上传视频（MP4/WebM，≤50MB）</span>
                  </label>
                  {petVideos.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {petVideos.map((v, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1.5">
                          <div className="flex items-center space-x-2 min-w-0">
                            <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                            <span className="text-xs text-gray-600 truncate">{v.originalName || v.filename}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteVideo(v.filename)}
                            className="text-red-400 hover:text-red-600 text-xs flex-shrink-0 ml-1"
                          >
                            删除
                          </button>
                        </div>
                      ))}
                    </div>
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
                    <button onClick={handleNameChange}
                      className="px-3 py-2 bg-blue-400 text-white rounded-xl hover:bg-blue-500 transition text-sm">
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
        @keyframes petBounce {
          0% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-14px) scale(1.08); }
          60% { transform: translateY(-4px) scale(0.96); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes petBreathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes petWalk {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          15% { transform: translateY(-6px) rotate(-2deg); }
          35% { transform: translateY(-2px) rotate(0deg); }
          65% { transform: translateY(-5px) rotate(2deg); }
          85% { transform: translateY(-1px) rotate(0deg); }
        }
        @keyframes heartFloat {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          40% { opacity: 1; transform: translate(-15px, -50px) scale(1.3); }
          100% { opacity: 0; transform: translate(-25px, -80px) scale(0.5); }
        }
        @keyframes toastIn {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-[toastIn_0.3s_ease-out] pointer-events-none ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </>
  );
}

export default PetWidget;
