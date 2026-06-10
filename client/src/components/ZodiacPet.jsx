// 高品质 SVG 网页宠物 —— 大眼萌系灵动风格
// 设计原则：大头小身、巨眼多层高光、持续微动、随机看、有机形
import { useState, useEffect, useRef, useCallback } from 'react';

/* ==================== CSS 动画注入 ==================== */
const STYLE_INJECTED = { current: false };
function injectStyles() {
  if (STYLE_INJECTED.current) return;
  STYLE_INJECTED.current = true;
  const style = document.createElement('style');
  style.textContent = `
    /* 持续身体微摆 */
    @keyframes petSway {
      0%,100% { transform:rotate(-1.5deg) }
      50% { transform:rotate(1.5deg) }
    }
    /* 呼吸起伏 */
    @keyframes petBreathe {
      0%,100% { transform:scaleY(1) scaleX(1) }
      25% { transform:scaleY(1.04) scaleX(1.01) }
      75% { transform:scaleY(0.97) scaleX(0.99) }
    }
    /* 眨眼 */
    @keyframes petBlink {
      0%,88%,100% { transform:scaleY(1) }
      94% { transform:scaleY(0.06) }
    }
    /* 尾巴轻摆 */
    @keyframes petTailSway {
      0%,100% { transform:rotate(-5deg) }
      25% { transform:rotate(8deg) }
      50% { transform:rotate(-3deg) }
      75% { transform:rotate(6deg) }
    }
    /* 尾巴快摇 */
    @keyframes petTailWag {
      0%,100% { transform:rotate(0deg) }
      30% { transform:rotate(22deg) }
      60% { transform:rotate(-16deg) }
    }
    /* 耳朵抽动 */
    @keyframes earTwitchL {
      0%,92%,100% { transform:rotate(0) }
      96% { transform:rotate(15deg) }
    }
    @keyframes earTwitchR {
      0%,92%,100% { transform:rotate(0) }
      96% { transform:rotate(-15deg) }
    }
    /* 开心弹跳 */
    @keyframes petHappyBounce {
      0% { transform:translateY(0) scale(1,1) }
      20% { transform:translateY(-12px) scale(1.08,0.92) }
      40% { transform:translateY(-2px) scale(0.95,1.06) }
      60% { transform:translateY(-6px) scale(1.03,0.97) }
      80% { transform:translateY(-1px) scale(0.99,1.01) }
      100% { transform:translateY(0) scale(1,1) }
    }
    /* 害怕发抖 */
    @keyframes petShake {
      0%,100% { transform:translateX(0) }
      15% { transform:translateX(-5px) }
      30% { transform:translateX(5px) }
      45% { transform:translateX(-4px) }
      60% { transform:translateX(4px) }
      75% { transform:translateX(-2px) }
      90% { transform:translateX(2px) }
    }
    /* 浮动 */
    @keyframes petFloat {
      0%,100% { transform:translateY(0) }
      50% { transform:translateY(-4px) }
    }
    /* 歪头 */
    @keyframes headTilt {
      0%,100% { transform:rotate(0) }
      30% { transform:rotate(6deg) }
      70% { transform:rotate(-4deg) }
    }
  `;
  document.head.appendChild(style);
}

/* ==================== 物种定义 ==================== */
// ViewBox: 140×160, 头中心 (70,62), 眼位左(50,62)右(90,62), 身体(70,124)
const SPECIES = {
  // ===== 猫咪 =====
  cat: {
    bodyGrad: ['#ff9800','#e65100'],
    bellyGrad: ['#fff8e1','#ffe0b2'],
    earOuter: '#ff9800',
    earInner: '#ffab91',
    nose: '#ff5252',
    eyeIris: '#4dd0e1',
    pupil: '#1a237e',
    // 特征渲染
    ears: (b) => (
      <>
        <g style={{transformOrigin:'32px 48px',animation:'earTwitchL 4s ease-in-out infinite'}}>
          <polygon points="20,48 28,8 48,40" fill="#ff9800" stroke="#e65100" strokeWidth="0.7" strokeLinejoin="round"/>
          <polygon points="25,45 30,16 43,38" fill="#ffab91"/>
        </g>
        <g style={{transformOrigin:'108px 48px',animation:'earTwitchR 4s ease-in-out infinite',animationDelay:'0.5s'}}>
          <polygon points="120,48 112,8 92,40" fill="#ff9800" stroke="#e65100" strokeWidth="0.7" strokeLinejoin="round"/>
          <polygon points="115,45 110,16 97,38" fill="#ffab91"/>
        </g>
        {/* 额纹 */}
        <path d="M58,26 L70,14 L82,26" fill="none" stroke="#e65100" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
        <path d="M50,30 L70,20 L90,30" fill="none" stroke="#e65100" strokeWidth="1" strokeLinecap="round" opacity="0.2"/>
      </>
    ),
    snout: (b) => (
      <>
        <ellipse cx="70" cy="80" rx="22" ry="16" fill="rgba(255,255,255,0.5)"/>
        <ellipse cx="70" cy="82" rx="6" ry="4.5" fill="#ff5252"/>
        <path d="M64,86 Q70,93 76,86" fill="none" stroke="#bf360c" strokeWidth="1" strokeLinecap="round"/>
      </>
    ),
    mouth: (b) => (
      <path d="M62,86 Q70,94 78,86" fill="none" stroke="#bf360c" strokeWidth="1" strokeLinecap="round"/>
    ),
    tail: (w) => (
      <path d="M105,120 Q138,85 128,52 Q120,28 108,38 Q98,48 104,72 Q108,90 102,115" 
        fill="#ff9800" stroke="#e65100" strokeWidth="0.8"/>
    ),
    spot: (b) => (
      <>
        <ellipse cx="52" cy="116" rx="10" ry="6" fill="rgba(255,255,255,0.25)"/>
        <ellipse cx="88" cy="118" rx="10" ry="6" fill="rgba(255,255,255,0.25)"/>
      </>
    ),
    hasPaws: true,
    bodyPath: null,
    whiskers: true,
  },
  // ===== 狗 =====
  dog: {
    bodyGrad: ['#d97706','#b45309'],
    bellyGrad: ['#fef3c7','#fde68a'],
    earOuter: '#92400e',
    earInner: '#c4956a',
    nose: '#1f2937',
    eyeIris: '#78350f',
    pupil: '#1a1a1a',
    ears: (b) => (
      <>
        <g style={{transformOrigin:'28px 50px',animation:'earTwitchL 5s ease-in-out infinite'}}>
          <ellipse cx="26" cy="52" rx="14" ry="22" fill="#92400e" transform="rotate(-10,26,52)"/>
          <ellipse cx="26" cy="52" rx="9" ry="17" fill="#c4956a" transform="rotate(-10,26,52)"/>
        </g>
        <g style={{transformOrigin:'112px 50px',animation:'earTwitchR 5s ease-in-out infinite',animationDelay:'0.7s'}}>
          <ellipse cx="114" cy="52" rx="14" ry="22" fill="#92400e" transform="rotate(10,114,52)"/>
          <ellipse cx="114" cy="52" rx="9" ry="17" fill="#c4956a" transform="rotate(10,114,52)"/>
        </g>
      </>
    ),
    snout: (b) => (
      <>
        <ellipse cx="70" cy="82" rx="18" ry="14" fill="rgba(255,255,255,0.6)"/>
        <ellipse cx="70" cy="79" rx="6" ry="4" fill="#1f2937"/>
        {/* 伸舌头 */}
        <ellipse cx="70" cy="87" rx="5" ry="7" fill="#ef4444" opacity="0.8"/>
      </>
    ),
    mouth: null,
    tail: (w) => (
      <path d="M105,120 Q126,98 120,72 Q116,58 110,66 Q105,74 108,92" 
        fill="#d97706" stroke="#b45309" strokeWidth="0.8"/>
    ),
    spot: (b) => null,
    hasPaws: true,
    bodyPath: null,
    whiskers: false,
  },
  // ===== 兔子 =====
  rabbit: {
    bodyGrad: ['#fafafa','#e0e0e0'],
    bellyGrad: ['#ffffff','#fafafa'],
    earOuter: '#fafafa',
    earInner: '#fce4ec',
    nose: '#f48fb1',
    eyeIris: '#e91e63',
    pupil: '#880e4f',
    ears: (b) => (
      <>
        <g style={{transformOrigin:'36px 18px',animation:'earTwitchL 4.5s ease-in-out infinite'}}>
          <ellipse cx="36" cy="14" rx="10" ry="28" fill="#fafafa" stroke="#e0e0e0" strokeWidth="0.5"/>
          <ellipse cx="36" cy="14" rx="5" ry="23" fill="#fce4ec"/>
        </g>
        <g style={{transformOrigin:'104px 18px',animation:'earTwitchR 4.5s ease-in-out infinite',animationDelay:'0.6s'}}>
          <ellipse cx="104" cy="14" rx="10" ry="28" fill="#fafafa" stroke="#e0e0e0" strokeWidth="0.5"/>
          <ellipse cx="104" cy="14" rx="5" ry="23" fill="#fce4ec"/>
        </g>
      </>
    ),
    snout: (b) => (
      <>
        <ellipse cx="70" cy="80" rx="14" ry="10" fill="rgba(255,255,255,0.6)"/>
        <ellipse cx="70" cy="78" rx="4" ry="3" fill="#f48fb1"/>
        <path d="M70,81 L70,84" stroke="#e0e0e0" strokeWidth="0.7"/>
        <path d="M70,84 Q64,90 60,85" fill="none" stroke="#e0e0e0" strokeWidth="0.7" strokeLinecap="round"/>
        <path d="M70,84 Q76,90 80,85" fill="none" stroke="#e0e0e0" strokeWidth="0.7" strokeLinecap="round"/>
      </>
    ),
    mouth: null,
    tail: (w) => (
      <circle cx="112" cy="122" r="11" fill="#ffffff" stroke="#e0e0e0" strokeWidth="0.5"/>
    ),
    spot: (b) => null,
    hasPaws: true,
    bodyPath: null,
    whiskers: true,
  },
  // ===== 鼠 =====
  rat: {
    bodyGrad: ['#9ca3af','#6b7280'],
    bellyGrad: ['#e5e7eb','#d1d5db'],
    earOuter: '#9ca3af',
    earInner: '#fbcfe8',
    nose: '#f472b6',
    eyeIris: '#1f2937',
    pupil: '#000',
    ears: (b) => (
      <>
        <g style={{transformOrigin:'28px 38px',animation:'earTwitchL 3.5s ease-in-out infinite'}}>
          <ellipse cx="28" cy="36" rx="13" ry="15" fill="#9ca3af" stroke="#6b7280" strokeWidth="0.5"/>
          <ellipse cx="28" cy="36" rx="8" ry="10" fill="#fbcfe8"/>
        </g>
        <g style={{transformOrigin:'112px 38px',animation:'earTwitchR 3.5s ease-in-out infinite',animationDelay:'0.4s'}}>
          <ellipse cx="112" cy="36" rx="13" ry="15" fill="#9ca3af" stroke="#6b7280" strokeWidth="0.5"/>
          <ellipse cx="112" cy="36" rx="8" ry="10" fill="#fbcfe8"/>
        </g>
      </>
    ),
    snout: (b) => (
      <>
        {/* 尖吻 */}
        <ellipse cx="70" cy="82" rx="10" ry="7" fill="#e5e7eb"/>
        <circle cx="70" cy="80" r="3" fill="#f472b6"/>
      </>
    ),
    mouth: null,
    tail: (w) => (
      <path d="M105,120 Q140,105 148,78 Q153,55 142,60" fill="none" stroke="#9ca3af" strokeWidth="3.5" strokeLinecap="round"/>
    ),
    spot: (b) => null,
    hasPaws: true,
    bodyPath: null,
    whiskers: true,
  },
  // ===== 牛 =====
  ox: {
    bodyGrad: ['#d4a574','#b8956a'],
    bellyGrad: ['#f5e6d0','#e8cfa0'],
    earOuter: '#d4a574',
    earInner: '#e8c9a0',
    nose: '#4a3728',
    eyeIris: '#3e2723',
    pupil: '#1a1a1a',
    ears: (b) => (
      <>
        <ellipse cx="26" cy="44" rx="9" ry="13" fill="#d4a574" stroke="#b8956a" strokeWidth="0.5" transform="rotate(-8,26,44)"/>
        <ellipse cx="26" cy="44" rx="5" ry="9" fill="#e8c9a0" transform="rotate(-8,26,44)"/>
        <ellipse cx="114" cy="44" rx="9" ry="13" fill="#d4a574" stroke="#b8956a" strokeWidth="0.5" transform="rotate(8,114,44)"/>
        <ellipse cx="114" cy="44" rx="5" ry="9" fill="#e8c9a0" transform="rotate(8,114,44)"/>
        {/* 角 */}
        <path d="M22,36 Q16,14 30,22" fill="none" stroke="#b0b0b0" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M118,36 Q124,14 110,22" fill="none" stroke="#b0b0b0" strokeWidth="3.5" strokeLinecap="round"/>
      </>
    ),
    snout: (b) => (
      <>
        <ellipse cx="70" cy="80" rx="16" ry="11" fill="#f5e6d0" stroke="#d4a574" strokeWidth="0.3"/>
        <circle cx="66" cy="78" r="2.5" fill="#4a3728"/>
        <circle cx="74" cy="78" r="2.5" fill="#4a3728"/>
      </>
    ),
    mouth: (b) => (
      <path d="M66,82 Q70,86 74,82" fill="none" stroke="#8d6e63" strokeWidth="0.8" strokeLinecap="round"/>
    ),
    tail: (w) => (
      <path d="M105,120 Q125,112 130,100 Q133,90 128,95" fill="none" stroke="#b8956a" strokeWidth="3" strokeLinecap="round"/>
    ),
    spot: (b) => null,
    hasPaws: true,
    bodyPath: null,
    whiskers: false,
  },
  // ===== 虎 =====
  tiger: {
    bodyGrad: ['#f57c00','#e65100'],
    bellyGrad: ['#fff3e0','#ffe0b2'],
    earOuter: '#f57c00',
    earInner: '#ffffff',
    nose: '#d32f2f',
    eyeIris: '#ffd54f',
    pupil: '#1a1a1a',
    ears: (b) => (
      <>
        <g style={{transformOrigin:'30px 46px',animation:'earTwitchL 4.2s ease-in-out infinite'}}>
          <ellipse cx="28" cy="46" rx="12" ry="14" fill="#f57c00" stroke="#e65100" strokeWidth="0.5"/>
          <ellipse cx="28" cy="46" rx="7" ry="9" fill="#ffffff"/>
        </g>
        <g style={{transformOrigin:'110px 46px',animation:'earTwitchR 4.2s ease-in-out infinite',animationDelay:'0.5s'}}>
          <ellipse cx="112" cy="46" rx="12" ry="14" fill="#f57c00" stroke="#e65100" strokeWidth="0.5"/>
          <ellipse cx="112" cy="46" rx="7" ry="9" fill="#ffffff"/>
        </g>
        {/* 王字 */}
        <line x1="58" y1="20" x2="82" y2="20" stroke="#3e2723" strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
        <line x1="62" y1="26" x2="78" y2="26" stroke="#3e2723" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/>
        <line x1="70" y1="14" x2="70" y2="30" stroke="#3e2723" strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
      </>
    ),
    snout: (b) => (
      <ellipse cx="70" cy="80" rx="14" ry="9" fill="#fff3e0" stroke="#e65100" strokeWidth="0.2"/>
    ),
    mouth: (b) => (
      <path d="M62,82 Q70,90 78,82" fill="none" stroke="#9a3412" strokeWidth="1" strokeLinecap="round"/>
    ),
    tail: (w) => (
      <path d="M105,118 Q138,95 128,64 Q122,48 114,55 Q107,62 111,80 Q114,95 104,115" 
        fill="#f57c00" stroke="#e65100" strokeWidth="0.8"/>
    ),
    spot: (b) => (
      <>
        <path d="M48,112 L52,120" stroke="#3e2723" strokeWidth="1.8" strokeLinecap="round" opacity="0.4"/>
        <path d="M60,108 L58,118" stroke="#3e2723" strokeWidth="1.8" strokeLinecap="round" opacity="0.4"/>
        <path d="M80,108 L82,118" stroke="#3e2723" strokeWidth="1.8" strokeLinecap="round" opacity="0.4"/>
        <path d="M92,112 L88,120" stroke="#3e2723" strokeWidth="1.8" strokeLinecap="round" opacity="0.4"/>
      </>
    ),
    hasPaws: true,
    bodyPath: null,
    whiskers: true,
  },
  // ===== 龙 =====
  dragon: {
    bodyGrad: ['#43a047','#2e7d32'],
    bellyGrad: ['#c8e6c9','#a5d6a7'],
    earOuter: null,
    earInner: null,
    nose: '#ff9800',
    eyeIris: '#ffd54f',
    pupil: '#1a1a1a',
    ears: (b) => (
      <>
        {/* 龙角 */}
        <path d="M24,36 Q16,10 34,18" fill="none" stroke="#ffb300" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M30,32 Q24,8 38,16" fill="none" stroke="#ffc107" strokeWidth="2" strokeLinecap="round"/>
        <path d="M116,36 Q124,10 106,18" fill="none" stroke="#ffb300" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M110,32 Q116,8 102,16" fill="none" stroke="#ffc107" strokeWidth="2" strokeLinecap="round"/>
        {/* 小翅膀 */}
        <ellipse cx="44" cy="46" rx="8" ry="5" fill="#66bb6a" opacity="0.8"/>
        <ellipse cx="96" cy="46" rx="8" ry="5" fill="#66bb6a" opacity="0.8"/>
      </>
    ),
    snout: (b) => (
      <>
        <ellipse cx="70" cy="78" rx="14" ry="9" fill="#c8e6c9" stroke="#2e7d32" strokeWidth="0.3"/>
        <circle cx="66" cy="76" r="2" fill="#2e7d32"/>
        <circle cx="74" cy="76" r="2" fill="#2e7d32"/>
      </>
    ),
    mouth: null,
    tail: (w) => (
      <path d="M105,120 Q142,100 148,72 Q152,50 140,58 Q130,66 133,84" 
        fill="none" stroke="#43a047" strokeWidth="5" strokeLinecap="round"/>
    ),
    spot: (b) => null,
    hasPaws: true,
    bodyPath: null,
    whiskers: false,
  },
  // ===== 蛇 =====
  snake: {
    bodyGrad: ['#8bc34a','#558b2f'],
    bellyGrad: ['#dcedc8','#c5e1a5'],
    earOuter: null,
    earInner: null,
    nose: null,
    eyeIris: '#f44336',
    pupil: '#1a1a1a',
    ears: null,
    snout: (b) => (
      <path d="M63,84 L70,92 L77,84" fill="none" stroke="#d32f2f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    ),
    mouth: null,
    tail: null,
    spot: (b) => (
      <>
        <ellipse cx="70" cy="130" rx="8" ry="4" fill="#aed581" opacity="0.5"/>
        <ellipse cx="70" cy="142" rx="6" ry="3" fill="#aed581" opacity="0.5"/>
        <ellipse cx="70" cy="118" rx="9" ry="4.5" fill="#aed581" opacity="0.5"/>
      </>
    ),
    hasPaws: false,
    bodyPath: (b) => (
      <>
        <ellipse cx="70" cy="124" rx="24" ry="32" fill="#8bc34a" stroke="#558b2f" strokeWidth="1"/>
        <ellipse cx="70" cy="126" rx="17" ry="24" fill="#dcedc8"/>
        <path d="M88,146 Q104,152 94,158 Q78,162 66,154" fill="none" stroke="#8bc34a" strokeWidth="7" strokeLinecap="round"/>
      </>
    ),
    whiskers: false,
  },
  // ===== 马 =====
  horse: {
    bodyGrad: ['#c9956b','#a67c52'],
    bellyGrad: ['#f5e1ce','#e8d0b8'],
    earOuter: '#c9956b',
    earInner: '#d4a373',
    nose: '#4a3728',
    eyeIris: '#3e2723',
    pupil: '#1a1a1a',
    ears: (b) => (
      <>
        <g style={{transformOrigin:'34px 38px',animation:'earTwitchL 4.8s ease-in-out infinite'}}>
          <polygon points="30,44 28,16 42,38" fill="#c9956b" stroke="#a67c52" strokeWidth="0.6" strokeLinejoin="round"/>
          <polygon points="33,40 30,20 40,36" fill="#d4a373"/>
        </g>
        <g style={{transformOrigin:'106px 38px',animation:'earTwitchR 4.8s ease-in-out infinite',animationDelay:'0.5s'}}>
          <polygon points="110,44 112,16 98,38" fill="#c9956b" stroke="#a67c52" strokeWidth="0.6" strokeLinejoin="round"/>
          <polygon points="107,40 110,20 100,36" fill="#d4a373"/>
        </g>
        {/* 鬃毛 */}
        <path d="M34,26 Q40,18 46,26" fill="none" stroke="#5d4037" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M32,32 Q38,24 44,30" fill="none" stroke="#5d4037" strokeWidth="2" strokeLinecap="round"/>
      </>
    ),
    snout: (b) => (
      <>
        <ellipse cx="70" cy="82" rx="12" ry="15" fill="#f5e1ce" stroke="#d4a373" strokeWidth="0.5"/>
        <ellipse cx="66" cy="83" rx="2.5" ry="2" fill="#4a3728"/>
        <ellipse cx="74" cy="83" rx="2.5" ry="2" fill="#4a3728"/>
      </>
    ),
    mouth: null,
    tail: (w) => (
      <path d="M105,118 Q130,110 133,92 Q135,78 128,88" 
        fill="none" stroke="#5d4037" strokeWidth="3.5" strokeLinecap="round"/>
    ),
    spot: (b) => null,
    hasPaws: true,
    bodyPath: null,
    whiskers: false,
  },
  // ===== 羊 =====
  goat: {
    bodyGrad: ['#fafafa','#e0e0e0'],
    bellyGrad: ['#ffffff','#fafafa'],
    earOuter: '#fafafa',
    earInner: '#fce4ec',
    nose: '#e91e63',
    eyeIris: '#6a1b9a',
    pupil: '#1a1a1a',
    ears: (b) => (
      <>
        <g style={{transformOrigin:'26px 56px'}}>
          <ellipse cx="24" cy="56" rx="10" ry="15" fill="#fafafa" stroke="#e0e0e0" strokeWidth="0.5"/>
          <ellipse cx="24" cy="56" rx="6" ry="10" fill="#fce4ec"/>
        </g>
        <g style={{transformOrigin:'114px 56px'}}>
          <ellipse cx="116" cy="56" rx="10" ry="15" fill="#fafafa" stroke="#e0e0e0" strokeWidth="0.5"/>
          <ellipse cx="116" cy="56" rx="6" ry="10" fill="#fce4ec"/>
        </g>
        {/* 弯曲角 */}
        <path d="M30,36 Q22,20 30,14 Q38,12 36,24" fill="none" stroke="#bdbdbd" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M110,36 Q118,20 110,14 Q102,12 104,24" fill="none" stroke="#bdbdbd" strokeWidth="3.5" strokeLinecap="round"/>
      </>
    ),
    snout: (b) => (
      <ellipse cx="70" cy="78" rx="11" ry="7" fill="#fafafa" stroke="#e0e0e0" strokeWidth="0.3"/>
    ),
    mouth: (b) => (
      <path d="M66,80 Q70,84 74,80" fill="none" stroke="#9e9e9e" strokeWidth="0.7" strokeLinecap="round"/>
    ),
    tail: (w) => (
      <circle cx="114" cy="122" r="8" fill="#fafafa" stroke="#e0e0e0" strokeWidth="0.5"/>
    ),
    spot: (b) => null,
    hasPaws: true,
    bodyPath: null,
    whiskers: false,
  },
  // ===== 猴 =====
  monkey: {
    bodyGrad: ['#a1887f','#795548'],
    bellyGrad: ['#d7ccc8','#bcaaa4'],
    earOuter: '#a1887f',
    earInner: '#d7ccc8',
    nose: '#4e342e',
    eyeIris: '#3e2723',
    pupil: '#1a1a1a',
    ears: (b) => (
      <>
        <g style={{transformOrigin:'22px 40px',animation:'earTwitchL 3.8s ease-in-out infinite'}}>
          <circle cx="22" cy="40" r="11" fill="#a1887f" stroke="#795548" strokeWidth="0.5"/>
          <circle cx="22" cy="40" r="6" fill="#d7ccc8"/>
        </g>
        <g style={{transformOrigin:'118px 40px',animation:'earTwitchR 3.8s ease-in-out infinite',animationDelay:'0.5s'}}>
          <circle cx="118" cy="40" r="11" fill="#a1887f" stroke="#795548" strokeWidth="0.5"/>
          <circle cx="118" cy="40" r="6" fill="#d7ccc8"/>
        </g>
      </>
    ),
    snout: (b) => (
      <>
        <ellipse cx="70" cy="74" rx="24" ry="20" fill="#efebe9"/>
        <ellipse cx="70" cy="84" rx="9" ry="7" fill="#d7ccc8"/>
        <circle cx="66" cy="82" r="2" fill="#4e342e"/>
        <circle cx="74" cy="82" r="2" fill="#4e342e"/>
      </>
    ),
    mouth: (b) => (
      <path d="M64,86 Q70,94 76,86" fill="none" stroke="#795548" strokeWidth="1" strokeLinecap="round"/>
    ),
    tail: (w) => (
      <path d="M105,120 Q132,100 138,74 Q142,54 130,62 Q120,70 124,88" 
        fill="none" stroke="#a1887f" strokeWidth="3.5" strokeLinecap="round"/>
    ),
    spot: (b) => null,
    hasPaws: true,
    bodyPath: null,
    whiskers: false,
  },
  // ===== 鸡 =====
  rooster: {
    bodyGrad: ['#e53935','#b71c1c'],
    bellyGrad: ['#ffcdd2','#ef9a9a'],
    earOuter: null,
    earInner: null,
    nose: null,
    eyeIris: '#1a1a1a',
    pupil: '#000',
    ears: (b) => (
      <>
        {/* 鸡冠 */}
        <path d="M56,18 Q54,4 62,14 Q66,4 68,14 Q72,4 74,18 Q76,28 70,30" 
          fill="#d32f2f" stroke="#b71c1c" strokeWidth="0.5" strokeLinejoin="round"/>
        {/* 喙 */}
        <polygon points="60,80 70,94 80,80" fill="#ffb300" stroke="#f57f17" strokeWidth="0.5" strokeLinejoin="round"/>
      </>
    ),
    snout: null,
    mouth: null,
    tail: (w) => (
      <>
        <path d="M100,108 Q132,80 136,52 Q140,36 130,44" fill="none" stroke="#e53935" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M103,112 Q138,88 142,64 Q145,48 135,55" fill="none" stroke="#ef5350" strokeWidth="3" strokeLinecap="round"/>
        <path d="M105,116 Q142,98 146,78" fill="none" stroke="#ffb300" strokeWidth="2.5" strokeLinecap="round"/>
      </>
    ),
    spot: (b) => null,
    hasPaws: true,
    bodyPath: null,
    whiskers: false,
  },
  // ===== 猪 =====
  pig: {
    bodyGrad: ['#f8bbd0','#f48fb1'],
    bellyGrad: ['#fce4ec','#f8bbd0'],
    earOuter: '#f8bbd0',
    earInner: '#fce4ec',
    nose: '#e91e63',
    eyeIris: '#1a1a1a',
    pupil: '#000',
    ears: (b) => (
      <>
        <g style={{transformOrigin:'34px 38px',animation:'earTwitchL 5s ease-in-out infinite'}}>
          <polygon points="30,44 24,22 40,40" fill="#f8bbd0" stroke="#f48fb1" strokeWidth="0.5" strokeLinejoin="round"/>
          <polygon points="33,42 28,26 38,40" fill="#fce4ec"/>
        </g>
        <g style={{transformOrigin:'106px 38px',animation:'earTwitchR 5s ease-in-out infinite',animationDelay:'0.7s'}}>
          <polygon points="110,44 116,22 100,40" fill="#f8bbd0" stroke="#f48fb1" strokeWidth="0.5" strokeLinejoin="round"/>
          <polygon points="107,42 112,26 102,40" fill="#fce4ec"/>
        </g>
      </>
    ),
    snout: (b) => (
      <>
        <ellipse cx="70" cy="80" rx="12" ry="8" fill="#ec407a"/>
        <circle cx="66" cy="79" r="2.5" fill="#880e4f"/>
        <circle cx="74" cy="79" r="2.5" fill="#880e4f"/>
      </>
    ),
    mouth: (b) => (
      <path d="M66,84 Q70,88 74,84" fill="none" stroke="#ad1457" strokeWidth="0.7" strokeLinecap="round"/>
    ),
    tail: (w) => (
      <path d="M105,118 Q120,124 115,108 Q112,100 108,106" fill="none" stroke="#f48fb1" strokeWidth="3" strokeLinecap="round"/>
    ),
    spot: (b) => null,
    hasPaws: true,
    bodyPath: null,
    whiskers: false,
  },
  // ===== 狐狸 =====
  fox: {
    bodyGrad: ['#ff7043','#e64a19'],
    bellyGrad: ['#fff3e0','#ffe0b2'],
    earOuter: '#ff7043',
    earInner: '#ffffff',
    nose: '#1a1a1a',
    eyeIris: '#ffd54f',
    pupil: '#1a1a1a',
    ears: (b) => (
      <>
        <g style={{transformOrigin:'28px 38px',animation:'earTwitchL 3.6s ease-in-out infinite'}}>
          <polygon points="22,48 16,12 42,36" fill="#ff7043" stroke="#e64a19" strokeWidth="0.5" strokeLinejoin="round"/>
          <polygon points="25,43 20,18 38,35" fill="#ffffff"/>
        </g>
        <g style={{transformOrigin:'112px 38px',animation:'earTwitchR 3.6s ease-in-out infinite',animationDelay:'0.5s'}}>
          <polygon points="118,48 124,12 98,36" fill="#ff7043" stroke="#e64a19" strokeWidth="0.5" strokeLinejoin="round"/>
          <polygon points="115,43 120,18 102,35" fill="#ffffff"/>
        </g>
      </>
    ),
    snout: (b) => (
      <>
        <ellipse cx="70" cy="78" rx="20" ry="15" fill="#ffffff"/>
        <ellipse cx="70" cy="82" rx="7" ry="5" fill="#1a1a1a"/>
      </>
    ),
    mouth: null,
    tail: (w) => (
      <path d="M105,118 Q142,88 132,55 Q125,34 116,44 Q108,53 112,76 Q115,94 104,112" 
        fill="#ff7043" stroke="#e64a19" strokeWidth="0.8"/>
    ),
    spot: (b) => null,
    hasPaws: true,
    bodyPath: null,
    whiskers: true,
  },
  // ===== 熊猫 =====
  panda: {
    bodyGrad: ['#fafafa','#e0e0e0'],
    bellyGrad: ['#ffffff','#fafafa'],
    earOuter: '#212121',
    earInner: null,
    nose: '#212121',
    eyeIris: '#1a1a1a',
    pupil: '#000',
    ears: (b) => (
      <>
        <circle cx="22" cy="40" r="12" fill="#212121"/>
        <circle cx="118" cy="40" r="12" fill="#212121"/>
        {/* 黑眼圈 */}
        <ellipse cx="48" cy="62" rx="13" ry="11" fill="#212121" transform="rotate(-8,48,62)"/>
        <ellipse cx="92" cy="62" rx="13" ry="11" fill="#212121" transform="rotate(8,92,62)"/>
      </>
    ),
    snout: (b) => (
      <ellipse cx="70" cy="78" rx="10" ry="8" fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="0.3"/>
    ),
    mouth: (b) => (
      <path d="M64,80 Q70,86 76,80" fill="none" stroke="#757575" strokeWidth="0.8" strokeLinecap="round"/>
    ),
    tail: (w) => (
      <circle cx="112" cy="122" r="7" fill="#212121"/>
    ),
    spot: (b) => (
      <>
        <ellipse cx="40" cy="114" rx="14" ry="10" fill="#212121"/>
        <ellipse cx="100" cy="114" rx="14" ry="10" fill="#212121"/>
      </>
    ),
    hasPaws: true,
    bodyPath: null,
    whiskers: false,
  },
};

/* ==================== 主组件 ==================== */
export default function ZodiacPet({
  type = 'cat',
  blinking = false,
  yawning = false,
  breathing = false,
  isFrightened = false,
  tailWag = false,
  imageBounce = false,
  pupilOffset = null,
}) {
  injectStyles();
  const s = SPECIES[type] || SPECIES.cat;
  const mouseOff = pupilOffset || { lx: 0, ly: -1, rx: 0, ry: -1 };

  // ===== 随机四处看 =====
  const [idleLook, setIdleLook] = useState({ lx: 0, ly: -1, rx: 0, ry: -1 });
  useEffect(() => {
    const pickRandom = () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.5 + Math.random() * 2;
      setIdleLook({ lx: Math.cos(angle) * dist, ly: Math.sin(angle) * dist, rx: Math.cos(angle) * dist, ry: Math.sin(angle) * dist });
    };
    pickRandom();
    const timer = setInterval(pickRandom, 2500 + Math.random() * 3000);
    return () => clearInterval(timer);
  }, []);

  // ===== 歪头 =====
  const [headTilt, setHeadTilt] = useState(false);
  useEffect(() => {
    const doTilt = () => {
      setHeadTilt(true);
      setTimeout(() => setHeadTilt(false), 2000);
    };
    const timer = setInterval(doTilt, 8000 + Math.random() * 10000);
    return () => clearInterval(timer);
  }, []);

  // ===== 混合鼠标跟踪与随机看 =====
  const mouseDist = Math.sqrt(mouseOff.lx ** 2 + mouseOff.ly ** 2);
  const blend = Math.min(1, mouseDist / 4);
  const off = {
    lx: mouseOff.lx * blend + idleLook.lx * (1 - blend),
    ly: mouseOff.ly * blend + idleLook.ly * (1 - blend),
    rx: mouseOff.rx * blend + idleLook.rx * (1 - blend),
    ry: mouseOff.ry * blend + idleLook.ry * (1 - blend),
  };

  // 整体动画
  const wrapperAnim = isFrightened
    ? 'petShake 0.12s ease-in-out 4'
    : imageBounce
    ? 'petHappyBounce 0.5s ease-out'
    : (type === 'dragon' ? 'petFloat 3s ease-in-out infinite' : 'petSway 4s ease-in-out infinite');

  return (
    <div style={{
      width: 130, height: 150,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: wrapperAnim,
    }}>
      <svg viewBox="0 0 140 160" width="130" height="150"
        style={{
          filter: isFrightened
            ? 'drop-shadow(0 6px 14px rgba(255,0,0,0.35))'
            : 'drop-shadow(0 5px 12px rgba(0,0,0,0.18))',
          animation: breathing ? 'petBreathe 1.6s ease-in-out infinite' : 'none',
        }}
      >
        <defs>
          <radialGradient id={`bg-${type}`} cx="40%" cy="30%">
            <stop offset="0%" stopColor={s.bodyGrad[0]}/>
            <stop offset="100%" stopColor={s.bodyGrad[1]}/>
          </radialGradient>
          <radialGradient id={`blg-${type}`} cx="40%" cy="30%">
            <stop offset="0%" stopColor={s.bellyGrad[0]}/>
            <stop offset="100%" stopColor={s.bellyGrad[1]}/>
          </radialGradient>
          {/* 阴影 */}
          <ellipse id={`shadow-${type}`} cx="70" cy="150" rx="35" ry="6" fill="rgba(0,0,0,0.12)"/>
        </defs>

        {/* 地面阴影 */}
        <use href={`#shadow-${type}`} style={{
          transformOrigin: '70px 150px',
          animation: breathing ? 'petBreathe 1.6s ease-in-out infinite' : 'none',
        }}/>

        {/* 尾巴 - 始终微摆 */}
        {s.tail && (
          <g style={{
            transformOrigin: '105px 118px',
            animation: tailWag ? 'petTailWag 0.4s ease-in-out 3' : 'petTailSway 2.5s ease-in-out infinite',
          }}>
            {s.tail(tailWag)}
          </g>
        )}

        {/* 身体 */}
        <g style={{
          transformOrigin: '70px 124px',
          animation: headTilt ? 'headTilt 1.5s ease-in-out' : 'none',
        }}>
          {s.bodyPath ? s.bodyPath(null) : (
            <>
              {/* 身体主体 - 梨形 */}
              <path d="M44,108 Q42,130 50,140 Q60,148 70,148 Q80,148 90,140 Q98,130 96,108 Q96,94 88,96 Q70,92 52,96 Q44,94 44,108 Z"
                fill={`url(#bg-${type})`} stroke={s.bodyGrad[1]} strokeWidth="0.8"/>
              {/* 肚皮 */}
              <ellipse cx="70" cy="126" rx="18" ry={breathing ? 18 : 16} fill={`url(#blg-${type})`}
                style={{transition:'ry 0.6s'}}/>
              {s.spot && s.spot(null)}
            </>
          )}

          {/* 爪子 */}
          {s.hasPaws && (
            <>
              <ellipse cx="46" cy="144" rx="10" ry="6" fill={s.bodyGrad[0]} stroke={s.bodyGrad[1]} strokeWidth="0.5"/>
              <ellipse cx="94" cy="144" rx="10" ry="6" fill={s.bodyGrad[0]} stroke={s.bodyGrad[1]} strokeWidth="0.5"/>
              {/* 小肉垫 */}
              <ellipse cx="46" cy="147" rx="6" ry="3" fill={s.bellyGrad[0]} opacity="0.7"/>
              <ellipse cx="94" cy="147" rx="6" ry="3" fill={s.bellyGrad[0]} opacity="0.7"/>
            </>
          )}
        </g>

        {/* 头部 */}
        <g style={{
          transformOrigin: '70px 62px',
          animation: headTilt ? 'headTilt 1.5s ease-in-out' : 'none',
        }}>
          {/* 头 - 有机形 */}
          <path d="M32,62 Q28,22 70,18 Q112,22 108,62 Q112,90 96,96 Q70,104 44,96 Q28,90 32,62 Z"
            fill={`url(#bg-${type})`} stroke={s.bodyGrad[1]} strokeWidth="0.8"/>

          {/* 耳朵等特征 */}
          {s.ears && s.ears(null)}

          {/* 面部浅色区 */}
          <ellipse cx="70" cy="70" rx="30" ry="24" fill={`url(#blg-${type})`} opacity="0.7"/>

          {/* 嘴鼻 */}
          {s.snout ? s.snout(null) : (
            <>
              <ellipse cx="70" cy="78" rx="7" ry="5" fill={s.nose || '#e91e63'}/>
              <path d="M63,84 Q70,92 77,84" fill="none" stroke={s.bodyGrad[1]} strokeWidth="1" strokeLinecap="round"/>
            </>
          )}

          {/* 打哈欠 */}
          {yawning && <ellipse cx="70" cy="86" rx="16" ry="18" fill="#3e0000"/>}

          {/* 嘴巴 */}
          {s.mouth && !yawning && s.mouth(null)}

          {/* 胡须 */}
          {s.whiskers && (
            <>
              <line x1="40" y1="78" x2="22" y2="74" stroke="#999" strokeWidth="0.6" strokeLinecap="round" opacity="0.5"/>
              <line x1="40" y1="82" x2="20" y2="82" stroke="#999" strokeWidth="0.6" strokeLinecap="round" opacity="0.5"/>
              <line x1="40" y1="86" x2="22" y2="90" stroke="#999" strokeWidth="0.6" strokeLinecap="round" opacity="0.5"/>
              <line x1="100" y1="78" x2="118" y2="74" stroke="#999" strokeWidth="0.6" strokeLinecap="round" opacity="0.5"/>
              <line x1="100" y1="82" x2="120" y2="82" stroke="#999" strokeWidth="0.6" strokeLinecap="round" opacity="0.5"/>
              <line x1="100" y1="86" x2="118" y2="90" stroke="#999" strokeWidth="0.6" strokeLinecap="round" opacity="0.5"/>
            </>
          )}

          {/* ===== 巨大灵动的眼睛 ===== */}
          <g style={{
            animation: blinking ? 'petBlink 0.18s ease-in-out' : 'none',
            transformOrigin: blinking ? '70px 62px' : 'none',
          }}>
            {/* 左眼 */}
            <g transform="translate(50,62)">
              {/* 眼白 */}
              <ellipse cx="0" cy="0" rx="15" ry="17" fill="white" stroke="#333" strokeWidth="0.5"/>
              {/* 虹膜 */}
              <ellipse cx={off.lx * 0.7} cy={off.ly * 0.7} rx="10" ry="12" fill={s.eyeIris}
                style={{transition:'all 0.1s linear'}}/>
              {/* 虹膜暗环 */}
              <ellipse cx={off.lx * 0.7} cy={off.ly * 0.7} rx="10" ry="12" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2"
                style={{transition:'all 0.1s linear'}}/>
              {/* 瞳孔 */}
              <ellipse cx={off.lx * 0.7} cy={off.ly * 0.7} rx="5.5" ry="6.5" fill={s.pupil}
                style={{transition:'all 0.1s linear'}}/>
              {/* 主高光（右上） */}
              <ellipse cx={3.5 + off.lx * 0.7} cy={-5 + off.ly * 0.7} rx="4" ry="4.5" fill="white" opacity="0.92"
                style={{transition:'all 0.1s linear'}}/>
              {/* 次高光（左下小） */}
              <circle cx={-3.5 + off.lx * 0.7} cy={5 + off.ly * 0.7} r="1.8" fill="white" opacity="0.45"
                style={{transition:'all 0.1s linear'}}/>
              {/* 上眼睑线 */}
              <path d="M-15,-2 Q0,-20 15,-2" fill="none" stroke="#555" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
            </g>

            {/* 右眼 */}
            <g transform="translate(90,62)">
              <ellipse cx="0" cy="0" rx="15" ry="17" fill="white" stroke="#333" strokeWidth="0.5"/>
              <ellipse cx={off.rx * 0.7} cy={off.ry * 0.7} rx="10" ry="12" fill={s.eyeIris}
                style={{transition:'all 0.1s linear'}}/>
              <ellipse cx={off.rx * 0.7} cy={off.ry * 0.7} rx="10" ry="12" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.2"
                style={{transition:'all 0.1s linear'}}/>
              <ellipse cx={off.rx * 0.7} cy={off.ry * 0.7} rx="5.5" ry="6.5" fill={s.pupil}
                style={{transition:'all 0.1s linear'}}/>
              <ellipse cx={3.5 + off.rx * 0.7} cy={-5 + off.ry * 0.7} rx="4" ry="4.5" fill="white" opacity="0.92"
                style={{transition:'all 0.1s linear'}}/>
              <circle cx={-3.5 + off.rx * 0.7} cy={5 + off.ry * 0.7} r="1.8" fill="white" opacity="0.45"
                style={{transition:'all 0.1s linear'}}/>
              <path d="M-15,-2 Q0,-20 15,-2" fill="none" stroke="#555" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
            </g>
          </g>

          {/* 腮红 */}
          <ellipse cx="30" cy="78" rx="8" ry="5" fill="#f48fb1" opacity="0.3"/>
          <ellipse cx="110" cy="78" rx="8" ry="5" fill="#f48fb1" opacity="0.3"/>
        </g>

        {/* 互动热区 */}
        <rect x="0" y="0" width="140" height="160" fill="transparent"/>
      </svg>
    </div>
  );
}
