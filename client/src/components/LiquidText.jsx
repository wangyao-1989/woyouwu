import { useRef, useEffect } from 'react';

const PARTICLE_SIZE = 1.2;
const SAMPLE_STEP = 1;
const MOUSE_RADIUS = 90;
const EASE = 0.12;
const FRICTION = 0.85;
const PUSH_FORCE = 15;
const BG_COLOR = '#FDFBF7';

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
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    function createParticles() {
      particlesRef.current = [];
      const w = canvas.width;
      const h = canvas.height;

      if (w === 0 || h === 0) return;

      const offCanvas = document.createElement('canvas');
      offCanvas.width = w;
      offCanvas.height = h;
      const offCtx = offCanvas.getContext('2d');

      const textElements = document.querySelectorAll('.liquid-text');

      const subtitle = document.querySelector('#hero-subtitle');
      if (subtitle) {
        const subRect = subtitle.getBoundingClientRect();
        console.log('副标题 rect:', { top: subRect.top, bottom: subRect.bottom, height: subRect.height });
      }

      textElements.forEach(el => {
        const elRect = el.getBoundingClientRect();
        console.log('液态文字 h1 rect:', { top: elRect.top, bottom: elRect.bottom, height: elRect.height });
        if (subtitle) {
          const subRect = subtitle.getBoundingClientRect();
          console.log('h1.bottom → subtitle.top 距离:', subRect.top - elRect.bottom, 'px');
        }

        const computedStyle = window.getComputedStyle(el);
        const fontSize = parseFloat(computedStyle.fontSize);
        const fontWeight = computedStyle.fontWeight;
        const fontFamily = computedStyle.fontFamily;

        const range = document.createRange();
        const textNodes = [];

        function collectTextNodes(node) {
          for (const child of node.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
              textNodes.push(child);
            } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName === 'BR') {
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              collectTextNodes(child);
            }
          }
        }
        collectTextNodes(el);

        offCtx.fillStyle = '#1e2432';
        offCtx.textBaseline = 'top';

        textNodes.forEach(node => {
          const text = node.textContent;
          if (!text.trim()) return;
          range.selectNodeContents(node);
          const nodeRect = range.getBoundingClientRect();
          console.log(`文本节点 "${text.slice(0, 20)}" rect:`, { top: nodeRect.top, bottom: nodeRect.bottom, left: nodeRect.left });
          offCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
          offCtx.fillText(text, nodeRect.left, nodeRect.top + fontSize * 0.22);
        });
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

    let prevScrollY = window.scrollY;

    function animate() {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - prevScrollY;
      if (scrollDelta !== 0) {
        const particles = particlesRef.current;
        for (let i = 0; i < particles.length; i++) {
          particles[i].originY -= scrollDelta;
          particles[i].y -= scrollDelta;
        }
        prevScrollY = currentScrollY;
      }

      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      for (let i = 0; i < particles.length; i++) {
        particles[i].update(mouse);
        particles[i].draw(ctx);
      }
      animRef.current = requestAnimationFrame(animate);
    }

    function handleResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      prevScrollY = window.scrollY;
      createParticles();
    }

    function handleMouseMove(e) {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    }

    function handleMouseOut() {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('resize', handleResize);

    document.fonts.ready.then(() => {
      prevScrollY = window.scrollY;
      createParticles();
      animate();
    });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
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
