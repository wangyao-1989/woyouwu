import { useState, useEffect, useRef, useCallback } from 'react';

// 瞳孔组件 — 跟踪鼠标位置计算瞳孔偏移
export function Pupil({
  size = 12,
  maxDistance = 5,
  pupilColor = '#2D2D2D',
  forceLookX,
  forceLookY,
}) {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const pupilRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const calcPosition = useCallback(() => {
    if (!pupilRef.current) return { x: 0, y: 0 };
    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }
    const rect = pupilRef.current.getBoundingClientRect();
    const eyeCenterX = rect.left + rect.width / 2;
    const eyeCenterY = rect.top + rect.height / 2;
    const dx = mouseX - eyeCenterX;
    const dy = mouseY - eyeCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDist = Math.min(maxDistance, 10);
    if (distance < 1) return { x: 0, y: 0 };
    const ratio = Math.min(distance / 100, 1) * maxDist;
    return {
      x: (dx / distance) * ratio,
      y: (dy / distance) * ratio,
    };
  }, [mouseX, mouseY, forceLookX, forceLookY, maxDistance]);

  const pos = calcPosition();

  return (
    <div
      ref={pupilRef}
      className="relative"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          backgroundColor: pupilColor,
          left: '50%',
          top: '50%',
          transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
          transition: 'transform 0.08s ease-out',
        }}
      />
    </div>
  );
}

// 眼球组件 — 白色眼眶 + 瞳孔 + 眨眼
export function EyeBall({
  size = 16,
  pupilSize = 6,
  maxDistance = 4,
  eyeColor = 'white',
  pupilColor = '#2D2D2D',
  isBlinking = false,
  forceLookX,
  forceLookY,
}) {
  return (
    <div
      className="relative rounded-full flex items-center justify-center transition-transform duration-150"
      style={{
        width: size,
        height: size,
        backgroundColor: eyeColor,
        transform: isBlinking ? 'scaleY(0.1)' : 'scaleY(1)',
      }}
    >
      <Pupil
        size={pupilSize}
        maxDistance={maxDistance}
        pupilColor={pupilColor}
        forceLookX={forceLookX}
        forceLookY={forceLookY}
      />
    </div>
  );
}
