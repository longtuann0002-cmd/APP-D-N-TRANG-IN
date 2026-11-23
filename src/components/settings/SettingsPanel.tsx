import React, { useState } from 'react';
import { 
  Sliders, 
  FileText, 
  Image, 
  Cpu, 
  RotateCw, 
  Scissors, 
  Maximize, 
  Minimize,
  RefreshCw
} from 'lucide-react';
import { 
  PaperConfig, 
  LayoutConfig, 
  PaperSizeId, 
  CropMode, 
  BorderStyle, 
  CutLineStyle,
  LayoutAlgorithm
} from '../../types';
import { PAPER_PRESETS, PHOTO_SIZE_PRESETS } from '../../core/constants';

interface SettingsPanelProps {
  paperConfig: PaperConfig;
  layoutConfig: LayoutConfig;
  onChangePaperConfig: (config: PaperConfig) => void;
  onChangeLayoutConfig: (config: LayoutConfig) => void;
  onRecalculateLayout: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  paperConfig,
  layoutConfig,
  onChangePaperConfig,
  onChangeLayoutConfig,
  onRecalculateLayout
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'paper' | 'photo' | 'algorithm'>('paper');

  return (
    <div className="w-80 h-full bg-white border-r border-studio-border flex flex-col z-10 select-none">
      {/* Sub Tabs */}
      <div className="h-11 border-b border-stone-200/80 flex items-center px-2 bg-stone-50/70">
        <button
          onClick={() => setActiveSubTab('paper')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'paper' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Khổ giấy</span>
        </button>
        <button
          onClick={() => setActiveSubTab('photo')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'photo' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          <span>Kích thước ảnh</span>
        </button>
        <button
          onClick={() => setActiveSubTab('algorithm')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'algorithm' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Dàn tự động</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 p-4 overflow-y-auto space-y-5 text-xs">
        
        {/* --- TAB 1: KHỔ GIẤY & LỀ --- */}
        {activeSubTab === 'paper' && (
          <div className="space-y-4">
            {/* Paper Size Preset */}
            <div>
              <label className="font-semibold text-stone-800 block mb-1.5">Khổ giấy in</label>
              <select
                value={paperConfig.sizeId}
                onChange={(e) => {
                  onChangePaperConfig({
                    ...paperConfig,
                    sizeId: e.target.value as PaperSizeId
                  });
                }}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {Object.entries(PAPER_PRESETS).map(([id, info]) => (
                  <option key={id} value={id}>
                    {info.name} ({info.dimensions.widthMm} x {info.dimensions.heightMm} mm)
                  </option>
                ))}
              </select>
            </div>

            {/* Orientation */}
            <div>
              <label className="font-semibold text-stone-800 block mb-1.5">Chiều giấy</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangePaperConfig({ ...paperConfig, orientation: 'portrait' })}
                  className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                    paperConfig.orientation === 'portrait'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  Giấy dọc
                </button>
                <button
                  type="button"
                  onClick={() => onChangePaperConfig({ ...paperConfig, orientation: 'landscape' })}
                  className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                    paperConfig.orientation === 'landscape'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  Giấy ngang
                </button>
              </div>
            </div>

            {/* Margins */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-stone-800">Lề giấy (mm)</label>
                <span className="text-[10px] text-stone-400">Vật lý chuẩn xác</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-stone-500 block mb-0.5">Lề trên (Top)</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={paperConfig.margins.top}
                    onChange={(e) => onChangePaperConfig({
                      ...paperConfig,
                      margins: { ...paperConfig.margins, top: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block mb-0.5">Lề dưới (Bottom)</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={paperConfig.margins.bottom}
                    onChange={(e) => onChangePaperConfig({
                      ...paperConfig,
                      margins: { ...paperConfig.margins, bottom: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block mb-0.5">Lề trái (Left)</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={paperConfig.margins.left}
                    onChange={(e) => onChangePaperConfig({
                      ...paperConfig,
                      margins: { ...paperConfig.margins, left: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block mb-0.5">Lề phải (Right)</span>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={paperConfig.margins.right}
                    onChange={(e) => onChangePaperConfig({
                      ...paperConfig,
                      margins: { ...paperConfig.margins, right: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Printer Offset Calibration indicator */}
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1">
              <span className="text-[11px] font-semibold text-stone-800 block">Độ lệch máy in (Offset)</span>
              <p className="text-[10px] text-stone-500 leading-tight">
                Lệch ngang: {paperConfig.printerOffsetX} mm | Lệch dọc: {paperConfig.printerOffsetY} mm
              </p>
            </div>
          </div>
        )}

        {/* --- TAB 2: KÍCH THƯỚC ẢNH & KIỂU DÀN --- */}
        {activeSubTab === 'photo' && (
          <div className="space-y-4">
            {/* Photo Preset */}
            <div>
              <label className="font-semibold text-stone-800 block mb-1.5">Khổ ảnh</label>
              <select
                value={layoutConfig.photoPresetId}
                onChange={(e) => {
                  onChangeLayoutConfig({
                    ...layoutConfig,
                    photoPresetId: e.target.value
                  });
                }}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-medium focus:outline-none"
              >
                {PHOTO_SIZE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.widthMm}x{p.heightMm} mm)
                  </option>
                ))}
                <option value="custom">Tùy chỉnh kích thước...</option>
              </select>
            </div>

            {/* Custom dimension inputs if custom */}
            {layoutConfig.photoPresetId === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-stone-500 block mb-0.5">Rộng (mm)</span>
                  <input
                    type="number"
                    value={layoutConfig.customWidthMm}
                    onChange={(e) => onChangeLayoutConfig({
                      ...layoutConfig,
                      customWidthMm: parseFloat(e.target.value) || 10
                    })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block mb-0.5">Cao (mm)</span>
                  <input
                    type="number"
                    value={layoutConfig.customHeightMm}
                    onChange={(e) => onChangeLayoutConfig({
                      ...layoutConfig,
                      customHeightMm: parseFloat(e.target.value) || 10
                    })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 font-bold"
                  />
                </div>
              </div>
            )}

            {/* Crop Mode: FIT vs FILL */}
            <div>
              <label className="font-semibold text-stone-800 block mb-1.5">Chế độ hiển thị</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChangeLayoutConfig({ ...layoutConfig, cropMode: 'fill' })}
                  className={`p-2 rounded-lg border text-left transition ${
                    layoutConfig.cropMode === 'fill'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span className="font-bold block">FILL</span>
                  <span className="text-[10px] opacity-70">Lấp đầy khung, crop cân đối</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeLayoutConfig({ ...layoutConfig, cropMode: 'fit' })}
                  className={`p-2 rounded-lg border text-left transition ${
                    layoutConfig.cropMode === 'fit'
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <span className="font-bold block">FIT</span>
                  <span className="text-[10px] opacity-70">Giữ trọn hình, có viền trắng</span>
                </button>
              </div>
            </div>

            {/* Gap Between Photos */}
            <div>
              <label className="font-semibold text-stone-800 block mb-1.5">Khoảng cách giữa các ảnh (mm)</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-stone-500 block mb-0.5">Khe ngang (X)</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={layoutConfig.gapX}
                    onChange={(e) => onChangeLayoutConfig({
                      ...layoutConfig,
                      gapX: parseFloat(e.target.value) || 0
                    })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 font-bold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block mb-0.5">Khe dọc (Y)</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={layoutConfig.gapY}
                    onChange={(e) => onChangeLayoutConfig({
                      ...layoutConfig,
                      gapY: parseFloat(e.target.value) || 0
                    })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Border Style */}
            <div>
              <label className="font-semibold text-stone-800 block mb-1.5">Kiểu viền ảnh</label>
              <select
                value={layoutConfig.borderStyle}
                onChange={(e) => onChangeLayoutConfig({
                  ...layoutConfig,
                  borderStyle: e.target.value as BorderStyle,
                  borderWidthMm: e.target.value === 'polaroid' ? 5 : e.target.value === 'thin' ? 3 : 0,
                  polaroidBottomMm: e.target.value === 'polaroid' ? 12 : 0
                })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2 px-3 text-xs font-medium"
              >
                <option value="polaroid">Polaroid trắng (chân dày 12mm)</option>
                <option value="thin">Viền mỏng (3mm đều)</option>
                <option value="none">Không viền (Full bleed)</option>
                <option value="custom">Viền họa tiết lễ hội / Seasonal</option>
              </select>
            </div>

            {/* Cut Lines style */}
            <div>
              <label className="font-semibold text-stone-800 block mb-1.5">Đường cắt xén (Cut marks)</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'dashed' as CutLineStyle, label: 'Nét đứt' },
                  { id: 'solid' as CutLineStyle, label: 'Nét liền' },
                  { id: 'cropmarks' as CutLineStyle, label: 'Vạch xén góc' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeLayoutConfig({ ...layoutConfig, cutLineStyle: item.id })}
                    className={`py-1.5 px-2 rounded-lg border text-center font-medium transition ${
                      layoutConfig.cutLineStyle === item.id
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: THUẬT TOÁN & TỰ ĐỘNG --- */}
        {activeSubTab === 'algorithm' && (
          <div className="space-y-4">
            <div>
              <label className="font-semibold text-stone-800 block mb-1.5">Thuật toán dàn trang</label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onChangeLayoutConfig({ ...layoutConfig, algorithm: 'grid' })}
                  className={`w-full p-2.5 rounded-xl border text-left transition ${
                    layoutConfig.algorithm === 'grid'
                      ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span className="font-bold text-stone-900 block">Lưới cố định (Uniform Grid)</span>
                  <span className="text-[11px] text-stone-500">
                    Sắp xếp theo hàng và cột đều nhau, thích hợp in ảnh cùng kích thước.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeLayoutConfig({ ...layoutConfig, algorithm: 'optimal-maxrects' })}
                  className={`w-full p-2.5 rounded-xl border text-left transition ${
                    layoutConfig.algorithm === 'optimal-maxrects'
                      ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span className="font-bold text-stone-900 block">Đóng gói MaxRects tối ưu diện tích</span>
                  <span className="text-[11px] text-stone-500">
                    Tự động xoay và ghép các hình chữ nhật để tối thiểu hóa diện tích giấy thừa.
                  </span>
                </button>
              </div>
            </div>

            {/* Options switches */}
            <div className="space-y-2.5 pt-2 border-t border-stone-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-stone-800 block">Cho phép xoay 90°</span>
                  <span className="text-[10px] text-stone-400">Xoay ảnh để xếp được nhiều ảnh nhất</span>
                </div>
                <input
                  type="checkbox"
                  checked={layoutConfig.allowRotation}
                  onChange={(e) => onChangeLayoutConfig({ ...layoutConfig, allowRotation: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-stone-800 block">Giữ thứ tự ảnh</span>
                  <span className="text-[10px] text-stone-400">Không xáo trộn ảnh khi dàn sang trang sau</span>
                </div>
                <input
                  type="checkbox"
                  checked={layoutConfig.preserveOrder}
                  onChange={(e) => onChangeLayoutConfig({ ...layoutConfig, preserveOrder: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={onRecalculateLayout}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl shadow-xs transition active:scale-98"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Dàn lại tự động ngay</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
