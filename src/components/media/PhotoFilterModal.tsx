import React, { useState } from "react";
import { X, Sparkles, Sliders, Check, RotateCcw } from "lucide-react";
import { PhotoItem, PhotoFilterSettings } from "../../types";

interface PhotoFilterModalProps {
  photo: PhotoItem;
  onClose: () => void;
  onSave: (photoId: string, filters: PhotoFilterSettings, applyToAll?: boolean) => void;
}

export const PhotoFilterModal: React.FC<PhotoFilterModalProps> = ({
  photo,
  onClose,
  onSave
}) => {
  const [brightness, setBrightness] = useState<number>(photo.filters?.brightness || 0);
  const [contrast, setContrast] = useState<number>(photo.filters?.contrast || 0);
  const [saturation, setSaturation] = useState<number>(photo.filters?.saturation || 0);
  const [preset, setPreset] = useState<"none" | "bw" | "vintage" | "warm" | "cool">(photo.filters?.preset || "none");
  const [applyToAll, setApplyToAll] = useState(false);

  // Compute CSS filter string for live preview
  let filterStr = "";
  if (brightness) filterStr += " brightness(" + (100 + brightness) + "%)";
  if (contrast) filterStr += " contrast(" + (100 + contrast) + "%)";
  if (saturation) filterStr += " saturate(" + (100 + saturation) + "%)";
  if (preset === "bw") filterStr += " grayscale(100%)";
  else if (preset === "vintage") filterStr += " sepia(60%) contrast(110%)";
  else if (preset === "warm") filterStr += " sepia(30%) hue-rotate(-10deg)";
  else if (preset === "cool") filterStr += " hue-rotate(20deg) saturate(90%)";

  const handleApplyPreset = (p: "none" | "bw" | "vintage" | "warm" | "cool") => {
    setPreset(p);
    if (p === "none") {
      setBrightness(0);
      setContrast(0);
      setSaturation(0);
    } else if (p === "bw") {
      setContrast(10);
      setBrightness(5);
    } else if (p === "vintage") {
      setContrast(15);
      setBrightness(-5);
    } else if (p === "warm") {
      setBrightness(5);
      setSaturation(15);
    } else if (p === "cool") {
      setBrightness(0);
      setSaturation(-10);
    }
  };

  const handleSave = () => {
    onSave(
      photo.id,
      {
        brightness,
        contrast,
        saturation,
        preset
      },
      applyToAll
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg max-h-[92dvh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 bg-stone-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-stone-900 text-sm">Chỉnh màu & Bộ lọc ảnh</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto flex flex-col md:flex-row gap-5 items-center">
          <div className="w-48 h-56 bg-stone-900 rounded-xl overflow-hidden flex items-center justify-center shadow-md shrink-0">
            <img
              src={photo.url}
              alt={photo.originalName}
              className="max-w-full max-h-full object-contain transition-all"
              style={{
                filter: filterStr.trim() || undefined,
                transform: "rotate(" + (photo.rotation || 0) + "deg) " + (photo.flipHorizontal ? "scaleX(-1)" : "")
              }}
            />
          </div>

          <div className="flex-1 w-full flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 mb-1.5 block">Bộ lọc sẵn có</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "none", label: "Gốc" },
                  { id: "bw", label: "Trắng đen" },
                  { id: "vintage", label: "Vintage" },
                  { id: "warm", label: "Ấm áp" },
                  { id: "cool", label: "Tươi mát" }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p.id as any)}
                    className={"py-1.5 px-2 text-xs font-medium rounded-lg border transition " + (preset === p.id ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1">
                  <span>Độ sáng</span>
                  <span className="font-mono text-[11px] text-stone-500">{brightness > 0 ? "+" + brightness : brightness}%</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1">
                  <span>Độ tương phản</span>
                  <span className="font-mono text-[11px] text-stone-500">{contrast > 0 ? "+" + contrast : contrast}%</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1">
                  <span>Độ bão hòa màu</span>
                  <span className="font-mono text-[11px] text-stone-500">{saturation > 0 ? "+" + saturation : saturation}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                  className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                />
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
                <span>Áp dụng màu này cho toàn bộ ảnh trong đơn</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 pb-[max(env(safe-area-inset-bottom),14px)] border-t border-stone-100 bg-stone-50/50 shrink-0">
          <button
            type="button"
            onClick={() => handleApplyPreset("none")}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Đặt lại gốc</span>
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
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};