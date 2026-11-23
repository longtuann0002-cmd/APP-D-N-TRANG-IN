import React, { useState, useRef } from "react";
import { X, ZoomIn, ZoomOut, RotateCw, FlipHorizontal, Maximize, Check, ArrowUp, ArrowDown, Move } from "lucide-react";
import { PhotoItem, PhotoCropSettings } from "../../types";

interface PhotoCropAdjustModalProps {
  photo: PhotoItem;
  slotAspect?: number;
  onClose: () => void;
  onSave: (photoId: string, cropSettings: PhotoCropSettings, applyToAll?: boolean) => void;
  onRotate?: (photoId: string) => void;
  onFlip?: (photoId: string) => void;
}

export const PhotoCropAdjustModal: React.FC<PhotoCropAdjustModalProps> = ({
  photo,
  slotAspect = 54 / 86,
  onClose,
  onSave,
  onRotate,
  onFlip
}) => {
  const [mode, setMode] = useState<"fill" | "fit" | "custom">(photo.cropSettings?.mode || photo.cropMode || "fill");
  const [scale, setScale] = useState<number>(photo.cropSettings?.scale !== undefined ? photo.cropSettings.scale : 1.0);
  const [offsetX, setOffsetX] = useState<number>(photo.cropSettings?.offsetX || 0);
  const [offsetY, setOffsetY] = useState<number>(photo.cropSettings?.offsetY || 0);
  const [applyToAll, setApplyToAll] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startOffX: number; startOffY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startOffX: offsetX,
      startOffY: offsetY
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const newOffX = Math.max(-50, Math.min(50, dragStartRef.current.startOffX + (dx / 2.5)));
    const newOffY = Math.max(-50, Math.min(50, dragStartRef.current.startOffY + (dy / 2.5)));
    setOffsetX(Math.round(newOffX));
    setOffsetY(Math.round(newOffY));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      startOffX: offsetX,
      startOffY: offsetY
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dragStartRef.current || !e.touches[0]) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    const newOffX = Math.max(-50, Math.min(50, dragStartRef.current.startOffX + (dx / 2.5)));
    const newOffY = Math.max(-50, Math.min(50, dragStartRef.current.startOffY + (dy / 2.5)));
    setOffsetX(Math.round(newOffX));
    setOffsetY(Math.round(newOffY));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleAlign = (dir: "center" | "top" | "bottom" | "left" | "right") => {
    if (dir === "center") {
      setOffsetX(0);
      setOffsetY(0);
    } else if (dir === "top") {
      setOffsetY(25);
    } else if (dir === "bottom") {
      setOffsetY(-25);
    } else if (dir === "left") {
      setOffsetX(25);
    } else if (dir === "right") {
      setOffsetX(-25);
    }
  };

  const handleSave = () => {
    onSave(
      photo.id,
      {
        mode,
        scale,
        offsetX,
        offsetY
      },
      applyToAll
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none overscroll-contain">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-xl max-h-[92dvh] overflow-hidden flex flex-col overscroll-contain"
        onMouseUp={handleMouseUp}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 bg-stone-50/50 shrink-0">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Căn chỉnh ảnh trong khung</h3>
            <p className="text-[11px] text-stone-500">{photo.originalName} • Kéo rê ảnh để đổi vị trí</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto flex flex-col md:flex-row gap-6 items-center">
          <div className="flex flex-col items-center">
            <div 
              className="relative bg-stone-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center select-none cursor-grab active:cursor-grabbing border-2 border-dashed border-stone-300 touch-none"
              style={{
                width: 220,
                height: 220 / slotAspect
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={photo.url}
                alt={photo.originalName}
                draggable={false}
                className="pointer-events-none transition-transform"
                style={{
                  width: mode === "fit" ? "100%" : "auto",
                  height: mode === "fill" ? "100%" : "auto",
                  maxWidth: mode === "fit" ? "100%" : "none",
                  maxHeight: mode === "fit" ? "100%" : "none",
                  objectFit: mode === "fit" ? "contain" : "cover",
                  transform: "translate(" + offsetX + "%, " + offsetY + "%) scale(" + scale + ") rotate(" + (photo.rotation || 0) + "deg) " + (photo.flipHorizontal ? "scaleX(-1)" : "")
                }}
              />

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white/90 text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1 pointer-events-none">
                <Move className="w-2.5 h-2.5" />
                <span>Kéo để di chuyển</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              {onRotate && (
                <button
                  type="button"
                  onClick={() => onRotate(photo.id)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-lg transition"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Xoay 90°</span>
                </button>
              )}
              {onFlip && (
                <button
                  type="button"
                  onClick={() => onFlip(photo.id)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-lg transition"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Lật ảnh</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 w-full">
            <div>
              <label className="text-xs font-bold text-stone-700 mb-1.5 block">Chế độ hiển thị trong khung</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setMode("fill"); setScale(1.0); }}
                  className={"py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition " + (mode === "fill" ? "bg-stone-900 border-stone-900 text-white shadow-xs" : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50")}
                >
                  <Maximize className="w-3.5 h-3.5" />
                  <span>Phủ đầy ô (Fill)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("fit"); setScale(1.0); }}
                  className={"py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition " + (mode === "fit" ? "bg-stone-900 border-stone-900 text-white shadow-xs" : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50")}
                >
                  <span>Giữ trọn hình (Fit)</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-1">
                <span>Thu phóng (Zoom)</span>
                <span className="text-stone-500 font-mono text-[11px]">{Math.round(scale * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScale(prev => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10))}
                  className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-600"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="flex-1 accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setScale(prev => Math.min(3.0, Math.round((prev + 0.1) * 10) / 10))}
                  className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-600"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 mb-1.5 block">Căn vị trí nhanh</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAlign("top")}
                  className="flex-1 py-1 px-2 border border-stone-200 hover:bg-stone-50 rounded-lg text-xs font-medium text-stone-700 flex items-center justify-center gap-1"
                >
                  <ArrowUp className="w-3 h-3" />
                  <span>Trên</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAlign("center")}
                  className="flex-1 py-1 px-2 border border-stone-200 hover:bg-stone-50 rounded-lg text-xs font-medium text-stone-700 flex items-center justify-center"
                >
                  <span>Chính giữa</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAlign("bottom")}
                  className="flex-1 py-1 px-2 border border-stone-200 hover:bg-stone-50 rounded-lg text-xs font-medium text-stone-700 flex items-center justify-center gap-1"
                >
                  <ArrowDown className="w-3 h-3" />
                  <span>Dưới</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyToAll}
                  onChange={(e) => setApplyToAll(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 accent-stone-900"
                />
                <span>Áp dụng căn chỉnh này cho tất cả ảnh trong đơn</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 pb-[max(env(safe-area-inset-bottom),14px)] border-t border-stone-100 bg-stone-50/50 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMode("fill");
              setScale(1.0);
              setOffsetX(0);
              setOffsetY(0);
            }}
            className="text-xs text-stone-500 hover:text-stone-800 font-medium"
          >
            Đặt lại mặc định
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Xác nhận</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};