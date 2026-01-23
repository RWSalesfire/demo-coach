import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'bars' | 'wave';
}

export function AudioVisualizer({
  analyserNode,
  isActive,
  color = '#4AE3B5',
  size = 'md',
  variant = 'bars',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const sizeConfig = {
    sm: { width: 60, height: 24, barWidth: 2, gap: 2 },
    md: { width: 120, height: 40, barWidth: 3, gap: 2 },
    lg: { width: 200, height: 60, barWidth: 4, gap: 3 },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height, barWidth, gap } = config;
      ctx.clearRect(0, 0, width, height);

      if (!isActive || !analyserNode) {
        // Draw idle state - subtle bars
        const barCount = Math.floor(width / (barWidth + gap));
        ctx.fillStyle = `${color}33`; // 20% opacity

        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap);
          const barHeight = height * 0.2;
          ctx.fillRect(x, (height - barHeight) / 2, barWidth, barHeight);
        }

        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // Get frequency data
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteFrequencyData(dataArray);

      if (variant === 'bars') {
        const barCount = Math.floor(width / (barWidth + gap));
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const dataIndex = i * step;
          const value = dataArray[dataIndex] || 0;
          const barHeight = Math.max((value / 255) * height, height * 0.1);

          // Gradient effect
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, `${color}99`);
          gradient.addColorStop(1, color);
          ctx.fillStyle = gradient;

          const x = i * (barWidth + gap);
          ctx.fillRect(x, (height - barHeight) / 2, barWidth, barHeight);
        }
      } else {
        // Wave variant
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserNode, isActive, color, config, variant]);

  return (
    <canvas
      ref={canvasRef}
      width={config.width}
      height={config.height}
      className="rounded"
      style={{ width: config.width, height: config.height }}
    />
  );
}
