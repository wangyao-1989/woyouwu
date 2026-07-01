import { useRef, useEffect } from 'react';

const PARTICLE_SIZE = 1.2;
const SAMPLE_STEP = 1;
const MOUSE_RADIUS = 90;
const EASE = 0.12;
const FRICTION = 0.85;
const PUSH_FORCE = 15;
const BG_COLOR = '#F7F5F2';

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.originX = x;
    this.originY = y;
    this.color = color;
    this.size = PARTICLE_SIZE;
    this.vx = 0;
    this.vy = 0;
    this.ease = EASE;
    this.friction = FRICTION;
    this.mass = Math.random() * 2 + 1;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }

  update(mouse) {
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < MOUSE_RADIUS) {
      const forceDirX = dx / distance;
      const forceDirY = dy / distance;
      const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
      this.vx -= forceDirX * force * PUSH_FORCE / this.mass;
      this.vy -= forceDirY * force * PUSH_FORCE / this.mass;
    }
    this.vx += (this.originX - this.x) * this.ease;
    this.vy += (this.originY - this.y) * this.ease;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.x += this.vx;
    this.y += this.vy;
  }
}

function LiquidText() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    if (!parent) return;

    function resizeCanvas() {
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();

    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    function createParticles() {
      particlesRef.current = [];

      const canvasRect = canvas.getBoundingClientRect();
      const w = canvasRect.width;
      const h = canvasRect.height;
      if (w === 0 || h === 0) return;

      const offCanvas = document.createElement('canvas');
      offCanvas.width = w;
      offCanvas.height = h;
      const offCtx = offCanvas.getContext('2d');

      const textElements = document.querySelectorAll('.liquid-text');
      offCtx.fillStyle = '#1e2432';
      offCtx.textBaseline = 'top';
      offCtx.textAlign = 'left';

      textElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const cs = window.getComputedStyle(el);
        const text = el.textContent.trim();
        if (!text) return;

        offCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        offCtx.fillText(text, rect.left - canvasRect.left, rect.top - canvasRect.top);
      });

      const imgData = offCtx.getImageData(0, 0, w, h).data;

      for (let y = 0; y < h; y += SAMPLE_STEP) {
        for (let x = 0; x < w; x += SAMPLE_STEP) {
          const idx = (y * w + x) * 4;
          const alpha = imgData[idx + 3];
          if (alpha > 40) {
            const color = `rgba(30, 36, 50, ${alpha / 255})`;
            particlesRef.current.push(new Particle(x, y, color));
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(mouse);
        particles[i].draw(ctx);
      }
      animRef.current = requestAnimationFrame(animate);
    }

    function handleResize() {
      resizeCanvas();
      createParticles();
    }

    function handleMouseMove(e) {
      const canvasRect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - canvasRect.left;
      mouseRef.current.y = e.clientY - canvasRect.top;
    }

    function handleMouseOut() {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('resize', handleResize);

    function startAnimation() {
      createParticles();
      animate();
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(startAnimation).catch(startAnimation);
    } else {
      startAnimation();
    }
    const fastTimer = setTimeout(startAnimation, 300);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      clearTimeout(fastTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="liquid-text-canvas"
      aria-hidden="true"
    />
  );
}

export default LiquidText;
