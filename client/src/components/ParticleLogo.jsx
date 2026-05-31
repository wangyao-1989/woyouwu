import { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';

const DEFAULT_PARTICLE_SIZE = 0.9;
const DEFAULT_SPEED = 2.5;
const DEFAULT_SAMPLE_STEP = 2;
const DEFAULT_HOLD_DURATION = 3000;

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uProgress;
  attribute vec3 aTarget;
  attribute vec3 aColor;
  varying vec3 vColor;

  vec3 noise3(vec3 p) {
    return vec3(
      sin(p.y * 0.02 + uTime * 0.5) * cos(p.z * 0.02 + uTime * 0.3),
      sin(p.z * 0.02 + uTime * 0.4) * cos(p.x * 0.02 + uTime * 0.5),
      sin(p.x * 0.02 + uTime * 0.3) * cos(p.y * 0.02 + uTime * 0.4)
    );
  }

  void main() {
    vColor = aColor;
    vec3 wanderPos = position + noise3(position) * 800.0;
    vec3 finalPos = mix(wanderPos, aTarget, uProgress);
    finalPos += noise3(finalPos * 1.5) * (1.0 - uProgress) * 50.0;
    finalPos.y += sin(uTime * 2.0 + finalPos.x * 0.01) * uProgress * 2.0;
    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_PointSize = (800.0 / -mvPosition.z) * (0.6 + uProgress * 0.4);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord.xy - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.05, dist);
    gl_FragColor = vec4(vColor, alpha * 0.9);
  }
`;

function ParticleLogo() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef(null);
  const materialRef = useRef(null);
  const bgParticlesRef = useRef(null);
  const controlsRef = useRef(null);
  const animFrameRef = useRef(null);
  const isGatheredRef = useRef(true);
  const autoTimerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const currentTweenRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingCancelledRef = useRef(false);

  const [imageUrl, setImageUrl] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [statusText, setStatusText] = useState('上传一张透明 Logo 图片，体验 3D 粒子魔法');
  const [particleSize, setParticleSize] = useState(DEFAULT_PARTICLE_SIZE);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [sampleStep, setSampleStep] = useState(DEFAULT_SAMPLE_STEP);
  const [useImageColors, setUseImageColors] = useState(true);
  const [particleColor, setParticleColor] = useState('#00f2fe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState('');
  const [hasLogo, setHasLogo] = useState(false);

  const initScene = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00025);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, w / h, 1, 5000);
    camera.position.z = 700;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controls.enablePan = false;
    controls.minDistance = 200;
    controls.maxDistance = 1500;
    controlsRef.current = controls;

    initBackgroundParticles(scene);
    initDefaultParticles(scene);
  }, []);

  const initBackgroundParticles = useCallback((scene) => {
    const bgCount = 8000;
    const bgGeometry = new THREE.BufferGeometry();
    const bgPositions = new Float32Array(bgCount * 3);

    for (let i = 0; i < bgCount; i++) {
      const r = 2000 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      bgPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      bgPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      bgPositions[i * 3 + 2] = r * Math.cos(phi);
    }

    bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));

    const bgMaterial = new THREE.PointsMaterial({
      color: 0x334488,
      size: 3,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const bgPoints = new THREE.Points(bgGeometry, bgMaterial);
    bgParticlesRef.current = bgPoints;
    scene.add(bgPoints);
  }, []);

  const initDefaultParticles = useCallback((scene) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 120px "Georgia", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('我有物', canvas.width / 2, canvas.height / 2 + 5);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    createParticleSystem(scene, imgData, canvas.width, canvas.height);
    setHasLogo(true);
    startAutoCycle();
  }, []);

  const createParticleSystem = useCallback((scene, imgData, imgWidth, imgHeight) => {
    if (particlesRef.current) {
      scene.remove(particlesRef.current);
      particlesRef.current.geometry.dispose();
      particlesRef.current.material.dispose();
    }
    if (materialRef.current) {
      materialRef.current.dispose();
    }

    const step = sampleStep;
    const positions = [];
    const targets = [];
    const colors = [];

    let minX = imgWidth, maxX = 0, minY = imgHeight, maxY = 0;

    for (let y = 0; y < imgHeight; y += step) {
      for (let x = 0; x < imgWidth; x += step) {
        const idx = (y * imgWidth + x) * 4;
        if (imgData[idx + 3] > 120 && (imgData[idx] > 15 || imgData[idx + 1] > 15 || imgData[idx + 2] > 15)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const contentW = maxX - minX + step;
    const contentH = maxY - minY + step;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const offsetX = -cx;
    const offsetY = cy;

    const scale = Math.max(contentW, contentH);
    const zRange = scale * 0.5;

    const customRgb = hexToRgb(particleColor);

    for (let y = minY; y <= maxY; y += step) {
      for (let x = minX; x <= maxX; x += step) {
        const pxIndex = (y * imgWidth + x) * 4;
        const alpha = imgData[pxIndex + 3];

        if (alpha > 120 && (imgData[pxIndex] > 15 || imgData[pxIndex + 1] > 15 || imgData[pxIndex + 2] > 15)) {
          const radius = 1500;
          const theta = Math.random() * 2 * Math.PI;
          const phi = Math.acos((Math.random() * 2) - 1);

          positions.push(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
          );

          const nx = (x - minX) / contentW;
          const ny = (y - minY) / contentH;
          const zCurve = Math.cos((nx - 0.5) * Math.PI * 0.7) * zRange;
          const zWave = Math.sin(ny * Math.PI * 1.5) * zRange * 0.2;
          const zRand = (Math.random() - 0.5) * zRange * 0.5;

          const dx = Math.abs(nx - 0.5) * 2;
          const dy = Math.abs(ny - 0.5) * 2;
          const edgeFade = Math.max(dx, dy);
          const jitterRange = edgeFade * scale * 0.08 + step * 0.6;

          targets.push(
            x + offsetX + (Math.random() - 0.5) * jitterRange,
            offsetY - y + (Math.random() - 0.5) * jitterRange,
            zCurve + zWave + zRand
          );

          if (useImageColors) {
            colors.push(
              Math.min(imgData[pxIndex] / 255 + 0.1, 1.0),
              Math.min(imgData[pxIndex + 1] / 255 + 0.1, 1.0),
              Math.min(imgData[pxIndex + 2] / 255 + 0.1, 1.0)
            );
          } else {
            colors.push(customRgb.r / 255, customRgb.g / 255, customRgb.b / 255);
          }
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('aTarget', new THREE.Float32BufferAttribute(targets, 3));
    geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 1.0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    materialRef.current = material;

    const points = new THREE.Points(geometry, material);
    particlesRef.current = points;
    scene.add(points);

    isGatheredRef.current = true;

    setStatusText(`已提取 ${positions.length / 3} 个粒子`);
    setHasLogo(true);
    startAutoCycle();
  }, [sampleStep, useImageColors, particleColor]);

  const startAutoCycle = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);

    autoTimerRef.current = setInterval(() => {
      if (!materialRef.current) return;
      isGatheredRef.current = !isGatheredRef.current;
      const target = isGatheredRef.current ? 1.0 : 0.0;

      if (currentTweenRef.current) {
        currentTweenRef.current.kill();
      }

      currentTweenRef.current = gsap.to(materialRef.current.uniforms.uProgress, {
        value: target,
        duration: speed,
        ease: isGatheredRef.current ? 'expo.out' : 'power3.inOut',
      });
    }, speed * 1000 + DEFAULT_HOLD_DURATION);
  }, [speed]);

  const handleGather = useCallback(() => {
    if (!materialRef.current) return;
    if (currentTweenRef.current) currentTweenRef.current.kill();
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);

    isGatheredRef.current = true;
    setIsPlaying(true);
    setStatusText('🔮 粒子正在聚合...');

    currentTweenRef.current = gsap.to(materialRef.current.uniforms.uProgress, {
      value: 1.0,
      duration: speed,
      ease: 'expo.out',
      onComplete: () => {
        setStatusText('✨ Logo 聚合完成！');
        startAutoCycle();
      },
    });
  }, [speed, startAutoCycle]);

  const handleScatter = useCallback(() => {
    if (!materialRef.current) return;
    if (currentTweenRef.current) currentTweenRef.current.kill();
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);

    isGatheredRef.current = false;
    setIsPlaying(true);
    setStatusText('💥 粒子正在散开...');

    currentTweenRef.current = gsap.to(materialRef.current.uniforms.uProgress, {
      value: 0.0,
      duration: speed * 1.2,
      ease: 'power3.inOut',
      onComplete: () => {
        setStatusText('粒子已散开');
        setIsPlaying(false);
      },
    });
  }, [speed]);

  const handleDownload = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const material = materialRef.current;
    if (!renderer || !scene || !camera || !material) return;

    if (currentTweenRef.current) currentTweenRef.current.kill();
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);

    recordingCancelledRef.current = false;

    const stream = renderer.domElement.captureStream(30);
    recordingStreamRef.current = stream;

    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
      videoBitsPerSecond: 8000000,
    });

    mediaRecorderRef.current = recorder;
    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      if (recordingCancelledRef.current) {
        recordingCancelledRef.current = false;
        return;
      }
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `particle-logo-3d-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      recordingStreamRef.current = null;
      mediaRecorderRef.current = null;
      setStatusText('✅ 下载完成！');
    };

    recorder.start();
    setIsRecording(true);
    setRecordingProgress('聚合中');
    setStatusText('🔴 正在录制...');

    isGatheredRef.current = true;
    material.uniforms.uProgress.value = 0;

    gsap.to(material.uniforms.uProgress, {
      value: 1.0,
      duration: speed * 0.8,
      ease: 'expo.out',
      onComplete: () => {
        setRecordingProgress('保持中');
        setTimeout(() => {
          if (!mediaRecorderRef.current) return;
          setRecordingProgress('散开中');
          gsap.to(material.uniforms.uProgress, {
            value: 0.0,
            duration: speed * 0.8,
            ease: 'power3.inOut',
            onComplete: () => {
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
              }
              setIsRecording(false);
              setRecordingProgress('');
              isGatheredRef.current = false;
              setIsPlaying(false);
              startAutoCycle();
            },
          });
        }, 1500);
      },
    });
  }, [speed, startAutoCycle]);

  const handleCancelRecording = useCallback(() => {
    recordingCancelledRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (currentTweenRef.current) currentTweenRef.current.kill();
    mediaRecorderRef.current = null;
    recordingStreamRef.current = null;
    setIsRecording(false);
    setRecordingProgress('');
    startAutoCycle();
    setStatusText('录制已取消');
  }, [startAutoCycle]);

  const handleImageLoad = useCallback((img, scene) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const maxDim = 350;
    let scale = Math.min(maxDim / img.width, maxDim / img.height);
    let w = Math.floor(img.width * scale);
    let h = Math.floor(img.height * scale);
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h).data;
    createParticleSystem(scene, imgData, w, h);
    setIsProcessing(false);
  }, [createParticleSystem]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    if (currentTweenRef.current) currentTweenRef.current.kill();
    setIsProcessing(true);
    setIsPlaying(false);

    const scene = sceneRef.current;

    if (file.type.startsWith('video/')) {
      setIsVideo(true);
      setStatusText('正在从视频中提取帧...');

      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      const url = URL.createObjectURL(file);
      video.onloadeddata = () => { video.currentTime = 0.5; };
      video.onseeked = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        tempCanvas.getContext('2d').drawImage(video, 0, 0);
        const img = new Image();
        img.onload = () => {
          setImageUrl(url);
          handleImageLoad(img, scene);
        };
        img.src = tempCanvas.toDataURL('image/png');
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        setStatusText('视频加载失败，请重试');
        setIsProcessing(false);
      };
      video.src = url;
    } else {
      setIsVideo(false);
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImageUrl(url);
        handleImageLoad(img, scene);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setStatusText('图片加载失败，请重试');
        setIsProcessing(false);
      };
      img.src = url;
    }
  }, [handleImageLoad]);

  const handleRegenerate = useCallback(() => {
    if (!imageUrl) return;
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    if (currentTweenRef.current) currentTweenRef.current.kill();
    setIsProcessing(true);
    setIsPlaying(false);

    const img = new Image();
    img.onload = () => handleImageLoad(img, sceneRef.current);
    img.src = imageUrl;
  }, [imageUrl, handleImageLoad]);

  useEffect(() => {
    initScene();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = clockRef.current.getElapsedTime();
      }
      if (bgParticlesRef.current) {
        bgParticlesRef.current.rotation.y += 0.0005;
        bgParticlesRef.current.rotation.x += 0.0002;
      }
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      const container = containerRef.current;
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      if (currentTweenRef.current) currentTweenRef.current.kill();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
        }
      }
      if (sceneRef.current) {
        sceneRef.current.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(m => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
      }
    };
  }, [initScene]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0"
      />

      {isProcessing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">{isVideo ? '正在提取视频帧...' : '正在解析图片...'}</p>
          </div>
        </div>
      )}

      <div className="absolute top-6 left-6 z-20">
        <div className="pointer-events-none">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              3D 粒子 Logo
            </span>
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">🖱 拖拽旋转 · 滚轮缩放 · 自动循环</p>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        {(isPlaying || hasLogo) && (
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm ${
            isRecording
              ? 'bg-red-400/10 text-red-400 border-red-400/20'
              : 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20'
          }`}>
            {isRecording && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse align-middle" />}
            {statusText}
          </span>
        )}
      </div>

      <div className="absolute bottom-0 inset-x-0 z-20 pb-6">
        <div className="flex justify-center">
          <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl">
            {imageUrl && (
              <button
                onClick={handleRegenerate}
                disabled={isProcessing || isRecording}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20 hover:bg-amber-400/20 transition disabled:opacity-40 whitespace-nowrap"
              >
                重新生成
              </button>
            )}
            {isRecording ? (
              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-400/10 text-red-400 border border-red-400/20 flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {recordingProgress || '录制中'}
                </button>
                <button
                  onClick={handleCancelRecording}
                  className="px-2 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 transition"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGather}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/20 transition whitespace-nowrap"
                >
                  聚合
                </button>
                <button
                  onClick={handleScatter}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-400/10 text-rose-400 border border-rose-400/20 hover:bg-rose-400/20 transition whitespace-nowrap"
                >
                  散开
                </button>
              </div>
            )}
            {hasLogo && !isRecording && (
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-400/10 text-sky-400 border border-sky-400/20 hover:bg-sky-400/20 transition flex items-center gap-1 whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                下载
              </button>
            )}
            <div className="w-px h-5 bg-white/10" />
            <label className="cursor-pointer px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-cyan-400 transition whitespace-nowrap flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              上传
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2 px-1">
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">速度</label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="0.5"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-16 h-1 rounded-full appearance-none bg-white/10 accent-cyan-400 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">密度</label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={sampleStep}
                  onChange={(e) => { setSampleStep(Number(e.target.value)); handleRegenerate(); }}
                  className="w-16 h-1 rounded-full appearance-none bg-white/10 accent-cyan-400 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-600 mb-0.5">颜色</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setUseImageColors(true); handleRegenerate(); }}
                    className={`w-5 h-5 rounded text-[9px] font-medium transition ${
                      useImageColors
                        ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/30'
                        : 'bg-white/5 text-gray-500 border border-white/10'
                    }`}
                  >
                    A
                  </button>
                  {!useImageColors && (
                    <input
                      type="color"
                      value={particleColor}
                      onChange={(e) => setParticleColor(e.target.value)}
                      className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!hasLogo && !isProcessing && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-gray-600 text-sm mb-4">上传一张透明 Logo 开始体验</p>
          <label className="pointer-events-auto cursor-pointer">
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-400/10 rounded-full blur-2xl group-hover:bg-cyan-400/20 transition" />
              <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-cyan-500/40 flex items-center justify-center group-hover:border-cyan-400/80 group-hover:scale-110 transition-all duration-500">
                <svg className="w-7 h-7 text-cyan-400/60 group-hover:text-cyan-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 242, b: 254 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export default ParticleLogo;
