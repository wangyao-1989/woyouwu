// Live2D 网页宠物 —— 基于 pixi-live2d-display 的专业级动画角色
import { useEffect, useRef, useState, Component } from 'react';
import * as PIXI from 'pixi.js';

// 第一步：先暴露 PIXI 到全局
window.PIXI = PIXI;

/* ==================== 免费模型映射表 ==================== */
const MODEL_CDN = 'https://cdn.jsdelivr.net/npm';
const MODEL_VERSION = '1.0.5';
const OFFICIAL_SAMPLES = 'https://cdn.jsdelivr.net/gh/Live2D/CubismWebSamples@develop/Samples/Resources';

const MODEL_MAP = {
  ox:     `${OFFICIAL_SAMPLES}/Hiyori/Hiyori.model3.json`,
  horse:  `${OFFICIAL_SAMPLES}/Haru/Haru.model3.json`,
  fox:    `${OFFICIAL_SAMPLES}/Mao/Mao.model3.json`,
  cat:    `live2d-widget-model-shizuku@${MODEL_VERSION}/assets/shizuku.model.json`,
  monkey: `live2d-widget-model-z16@${MODEL_VERSION}/assets/z16.model.json`,
  panda:  `live2d-widget-model-unitychan@${MODEL_VERSION}/assets/unitychan.model.json`,
};

function getModelUrl(type) {
  const path = MODEL_MAP[type] || MODEL_MAP.cat;
  // 官方样本模型已经是完整 URL
  if (path.startsWith('http')) return path;
  return `${MODEL_CDN}/${path}`;
}

/* ==================== React Error Boundary ==================== */
class Live2DErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: 150, height: 180, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: 4,
        }}>
          <span style={{ fontSize: 28 }}>😿</span>
          <span style={{ fontSize: 10, color: '#999' }}>加载失败</span>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ==================== 尺寸常量 ==================== */
const CANVAS_W = 240;
const CANVAS_H = 280;
const WRAPPER_W = 150;
const WRAPPER_H = 180;

/* ==================== 主组件 ==================== */
export default function Live2DPet({ type = 'cat', style }) {
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;

    setLoading(true);
    setError(null);

    let app;
    try {
      app = new PIXI.Application({
        view: canvas,
        width: CANVAS_W,
        height: CANVAS_H,
        transparent: true,
        backgroundAlpha: 0,
        antialias: true,
        resolution: 1,
        autoDensity: false,
      });
    } catch (err) {
      console.error('PIXI init failed:', err);
      if (!disposed) { setError('引擎初始化失败'); setLoading(false); }
      return;
    }

    // 动态导入 pixi-live2d-display（此时 window.PIXI 已就绪）
    import('pixi-live2d-display').then(({ Live2DModel }) => {
      if (disposed) return;
      const modelUrl = getModelUrl(type);
      return Live2DModel.from(modelUrl, { autoInteract: true });
    }).then(model => {
      if (disposed || !model) return;

      model.anchor.set(0.5, 0.5);
      model.x = CANVAS_W / 2;
      model.y = CANVAS_H / 2 + 12;

      if (model.internalModel && model.internalModel.width > 0 && model.internalModel.height > 0) {
        const scale = Math.min(
          (CANVAS_H * 0.82) / model.internalModel.height,
          (CANVAS_W * 0.78) / model.internalModel.width
        );
        model.scale.set(scale);
      } else {
        model.scale.set(0.12);
      }

      app.stage.addChild(model);

      // 不启用内部拖拽，外部 PetWidget 已接管拖拽
      model.interactive = true;
      model.buttonMode = true;

      if (!disposed) setLoading(false);
    }).catch(err => {
      if (disposed) return;
      console.warn('Live2D load failed:', type, err.message);
      setError('模型加载失败');
      setLoading(false);
    });

    return () => {
      disposed = true;
      try {
        if (app) {
          if (app.stage) app.stage.removeChildren();
          app.destroy(true, { children: true, texture: true, baseTexture: true });
        }
      } catch (e) { /* silent */ }
    };
  }, [type]);

  return (
    <Live2DErrorBoundary>
      <div style={{
        width: WRAPPER_W,
        height: WRAPPER_H,
        position: 'relative',
        ...style,
      }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.5)', borderRadius: 12,
          }}>
            <div style={{
              width: 24, height: 24, border: '3px solid #e8e8e8', borderTopColor: '#ab47bc',
              borderRadius: '50%', animation: 'live2dSpin 0.8s linear infinite',
            }}/>
          </div>
        )}
        {error && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4,
            background: 'rgba(255,255,255,0.9)', borderRadius: 12,
          }}>
            <span style={{ fontSize: 28 }}>😿</span>
            <span style={{ fontSize: 10, color: '#999' }}>{error}</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            display: 'block',
            width: WRAPPER_W,
            height: WRAPPER_H,
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.25s',
          }}
        />
        <style>{`@keyframes live2dSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Live2DErrorBoundary>
  );
}
