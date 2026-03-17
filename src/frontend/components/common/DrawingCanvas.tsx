"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Save, Undo2 } from "lucide-react";

interface Coordinate {
  x: number;
  y: number;
}

interface DrawingPath {
  points: Coordinate[];
  color: string;
  size: number;
}

interface DrawingCanvasProps {
  imageUrl: string;
  onSave?: (dataUrl: string) => void;
  onClose?: () => void;
}

export default function DrawingCanvas({
  imageUrl,
  onSave,
  onClose,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [aspectRatio, setAspectRatio] = useState(1);

  const currentColor = "#ef4444";
  const brushSize = 3;

  const setupCanvas = useCallback(
    (redrawPaths?: DrawingPath[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.min(window.innerWidth - 32, 700);
      const displayHeight = displayWidth / aspectRatio;

      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      if (imageRef.current) {
        ctx.drawImage(imageRef.current, 0, 0, displayWidth, displayHeight);
      }

      // パスを再描画
      if (redrawPaths) {
        for (const path of redrawPaths) {
          if (path.points.length < 2) continue;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.strokeStyle = path.color;
          ctx.lineWidth = path.size;
          ctx.beginPath();
          ctx.moveTo(path.points[0].x, path.points[0].y);
          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
          }
          ctx.stroke();
        }
      }
    },
    [aspectRatio],
  );

  // 画像読み込み
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // aspectRatio確定後にcanvasセットアップ
  useEffect(() => {
    if (aspectRatio !== 1 || imageRef.current) {
      setupCanvas();
    }
  }, [aspectRatio, setupCanvas]);

  const getCoordinates = (
    e: React.PointerEvent<HTMLCanvasElement>,
  ): Coordinate => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getCoordinates(e);
    setIsDrawing(true);
    setPaths((prev) => [
      ...prev,
      { points: [coords], color: currentColor, size: brushSize },
    ]);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    setPaths((prev) => {
      const newPaths = [...prev];
      const currentPath = newPaths[newPaths.length - 1];
      currentPath.points.push(coords);

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = currentPath.color;
      ctx.lineWidth = currentPath.size;

      const pts = currentPath.points;
      if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }
      return newPaths;
    });
  };

  const stopDrawing = () => setIsDrawing(false);

  const handleUndo = () => {
    setPaths((prev) => {
      const newPaths = prev.slice(0, -1);
      setupCanvas(newPaths);
      return newPaths;
    });
  };

  const handleClear = () => {
    setPaths([]);
    setupCanvas();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave?.(dataUrl);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* ツールバー */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={paths.length === 0}
          >
            <Undo2 className="h-4 w-4 mr-1" />
            戻す
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Eraser className="h-4 w-4 mr-1" />
            消去
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {onSave && (
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              閉じる
            </Button>
          )}
        </div>
      </div>

      {/* キャンバス */}
      <canvas
        ref={canvasRef}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        className="rounded-lg border border-slate-200 cursor-crosshair touch-none shadow-sm"
        style={{ touchAction: "none", maxWidth: "100%", maxHeight: "70vh" }}
      />

      <p className="text-xs text-center text-slate-400">
        指やマウスで赤い線を書き込めます
      </p>
    </div>
  );
}
