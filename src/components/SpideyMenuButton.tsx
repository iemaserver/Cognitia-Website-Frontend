import React, { useState, useEffect, useRef } from "react";
import { sound } from "../utils/audio";

interface SpideyMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export function SpideyMenuButton({
  isOpen,
  onClick,
  className = "",
}: SpideyMenuButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const buttonCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const hangingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep state refs so the RAF animation loops run continuously without restarting or glitching
  const isOpenRef = useRef(isOpen);
  const isHoveredRef = useRef(isHovered);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    isHoveredRef.current = isHovered;
  }, [isHovered]);

  // --------------------------------------------------------------------------
  // 1. TOP BUTTON: spidey_head_spritesheet.png (46 frames, 81x83)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = buttonCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    const img = new Image();
    img.src = "/spidey_head_spritesheet.png";

    const BTN_FRAME_W = 81;
    const BTN_FRAME_H = 83;
    const BTN_TOTAL_FRAMES = 46;

    let animId: number;
    let currentFrame = 0;
    let lastTime = performance.now();

    const startLoop = () => {
      const render = (now: number) => {
        const open = isOpenRef.current;
        const hovered = isHoveredRef.current;

        // Transition speed vs idle loop speed
        const interval = open || hovered || currentFrame > 11 ? 35 : 85;

        if (now - lastTime >= interval) {
          lastTime = now;

          if (open) {
            // Smoothly advance to Cross (X) (frame 45) and hold
            if (currentFrame < 45) {
              currentFrame += 1;
            }
          } else if (hovered) {
            // Smoothly advance to MENU (frame 23) and hold
            if (currentFrame < 23) {
              currentFrame += 1;
            } else if (currentFrame > 23) {
              currentFrame -= 1;
            }
          } else {
            // Idle state: rewind back if coming from menu/cross, otherwise loop 0..11
            if (currentFrame > 11) {
              currentFrame -= 1;
            } else {
              currentFrame = (currentFrame + 1) % 12;
            }
          }

          const f = Math.min(BTN_TOTAL_FRAMES - 1, Math.max(0, currentFrame));
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            img,
            f * BTN_FRAME_W,
            0,
            BTN_FRAME_W,
            BTN_FRAME_H,
            0,
            0,
            canvas.width,
            canvas.height,
          );
        }

        animId = requestAnimationFrame(render);
      };

      animId = requestAnimationFrame(render);
    };

    if (img.complete) {
      startLoop();
    } else {
      img.onload = startLoop;
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  // --------------------------------------------------------------------------
  // 2. HANGING SPIDER-MAN: spidey_user_spritesheet.png (25 frames, 68x110)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = hangingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    const img = new Image();
    img.src = "/spidey_user_spritesheet.png";

    const HANG_FRAME_W = 68;
    const HANG_FRAME_H = 110;
    const HANG_TOTAL_FRAMES = 25;
    const CONSTANT_FRAME_DURATION = 80;

    let animId: number;
    let currentFrame = 0;
    let lastTime = performance.now();

    const startLoop = () => {
      const render = (now: number) => {
        if (now - lastTime >= CONSTANT_FRAME_DURATION) {
          lastTime = now;
          currentFrame = (currentFrame + 1) % HANG_TOTAL_FRAMES;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(
            img,
            currentFrame * HANG_FRAME_W,
            0,
            HANG_FRAME_W,
            HANG_FRAME_H,
            0,
            0,
            canvas.width,
            canvas.height,
          );
        }

        animId = requestAnimationFrame(render);
      };

      animId = requestAnimationFrame(render);
    };

    if (img.complete) {
      startLoop();
    } else {
      img.onload = startLoop;
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, []); // Run once on mount - steady uninterrupted loop

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    onClick();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    sound.playHover();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      className={`relative select-none flex flex-col items-center origin-top z-50 pointer-events-auto ${className}`}
      id="top-right-spidey-menu-root"
    >
      {/* 
        TOP BUTTON: SPIDEY FACE -> MENU (on hover) -> CROSS (on click/open)
      */}
      <button
        id="btn-spidey-interactive-menu"
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={isOpen ? "Close Menu [ESC]" : "Open Menu [TAB]"}
        className="relative cursor-pointer select-none rounded-full p-0 border-none outline-none
                   flex items-center justify-center focus:outline-none"
      >
        <canvas
          ref={buttonCanvasRef}
          width={48}
          height={48}
          className="w-[42px] h-[42px] sm:w-[48px] sm:h-[48px] md:w-[52px] md:h-[52px] block drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)]"
          style={{ imageRendering: "pixelated" }}
        />
      </button>

      {/* 
        ATTACHED DIRECTLY UNDER THE BUTTON: HANGING SPIDER-MAN SPRITE
        - Attached with no white line divider
        - Steady, constant animation with NO hover/click speed or scale changes
      */}
      <div
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title="Spider-Man (Click to Toggle Menu)"
        className="cursor-pointer flex flex-col items-center origin-top -mt-1"
      >
        <canvas
          ref={hangingCanvasRef}
          width={68}
          height={110}
          className="w-[50px] h-[80px] sm:w-[58px] sm:h-[94px] md:w-[64px] md:h-[104px] block drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}
