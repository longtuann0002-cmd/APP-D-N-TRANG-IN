import React, { useState } from 'react';
import { 
  PaperConfig, 
  LayoutConfig, 
  PaperSizeId, 
  BorderStyle, 
  CutLineStyle,
  CropMode,
  MultiSizeDemand,
  TemplateItem
} from '../../types';
import { PAPER_PRESETS, PHOTO_SIZE_PRESETS } from '../../core/constants';
import { storageManager } from '../../core/storage/storageManager';
import { 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Bookmark, 
  Sliders, 
  Check, 
  FileDown,
  Plus,
  Trash2
} from 'lucide-react';

interface PrintSettingsAccordionProps {
  paperConfig: PaperConfig;
  layoutConfig: LayoutConfig;
  onChangePaperConfig: (cfg: PaperConfig) => void;
  onChangeLayoutConfig: (cfg: LayoutConfig) => void;
  onQuickAutoLayout: () => void;
  
  // Stats
  photosCount: number;
  totalPages: number;
  wastePercent: number;
  onOpenExportModal: () => void;
}

export const PrintSettingsAccordion: React.FC<PrintSettingsAccordionProps> = ({
  paperConfig,
  layoutConfig,
  onChangePaperConfig,
  onChangeLayoutConfig,
  onQuickAutoLayout,
  photosCount,
  totalPages,
  wastePercent,
  onOpenExportModal
}) => {
  // Open accordion section: 1..5
  const [openSection, setOpenSection] = useState<number | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savedSuccessToast, setSavedSuccessToast] = useState(false);

  const toggleSection = (idx: number) => {
    setOpenSection(openSection === idx ? null : idx);
  };

  const availableTemplates = storageManager.getTemplates();
  const isMulti = layoutConfig.mode === 'multi';
  const totalMultiSlots = isMulti && layoutConfig.multiSizes
    ? layoutConfig.multiSizes.reduce((sum, m) => sum + m.count, 0)
    : 0;

  const getPhotoPresetName = () => {
    if (isMulti) {
      const count = layoutConfig.multiSizes?.length || 0;
      return `Nhiều khổ (${count} mẫu)`;
    }
    const tpl = availableTemplates.find(t => t.id === layoutConfig.photoPresetId || t.name === layoutConfig.photoPresetId);
    if (tpl) return `${tpl.name} • ${tpl.photoSize.widthMm}×${tpl.photoSize.heightMm} mm`;
    const p = PHOTO_SIZE_PRESETS.find(pr => pr.id === layoutConfig.photoPresetId);
    if (p) return `${p.name} • ${p.widthMm}×${p.heightMm} mm`;
    return `${layoutConfig.customWidthMm}×${layoutConfig.customHeightMm} mm`;
  };

  const getPaperName = () => {
    const p = PAPER_PRESETS[paperConfig.sizeId];
    if (p) return `${p.name} • ${p.dimensions.widthMm}x${p.dimensions.heightMm} mm`;
    return 'Khổ tùy chỉnh';
  };

  const getBorderName = () => {
    if (isMulti) return 'Theo mẫu từng khổ trong đơn';
    if (layoutConfig.borderStyle === 'polaroid') return 'Polaroid trắng • góc vuông';
    if (layoutConfig.borderStyle === 'thin') return 'Viền mỏng 3mm';
    if (layoutConfig.borderStyle === 'custom') return 'Mẫu hoa văn lễ hội';
    return 'Không viền (Full bleed)';
  };

  const handleOpenSaveModal = () => {
    const defaultName = isMulti 
      ? `Combo ${layoutConfig.multiSizes?.length || 0} mẫu (${paperConfig.sizeId})`
      : `${getPhotoPresetName().split('•')[0].trim()} (${paperConfig.sizeId})`;
    setTemplateName(defaultName);
    setIsSaveModalOpen(true);
  };

  const handleConfirmSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    const newTemplate: TemplateItem = {
      id: `tpl-custom-${Date.now()}`,
      name: templateName.trim(),
      description: `Khổ ${layoutConfig.customWidthMm || 54}×${layoutConfig.customHeightMm || 86} mm • Giấy ${paperConfig.sizeId}`,
      photoSize: {
        widthMm: layoutConfig.customWidthMm || 54,
        heightMm: layoutConfig.customHeightMm || 86
      },
      borderStyle: layoutConfig.borderStyle || 'polaroid',
      borderWidthMm: layoutConfig.borderWidthMm !== undefined ? layoutConfig.borderWidthMm : 5,
      borderTopMm: layoutConfig.borderTopMm !== undefined ? layoutConfig.borderTopMm : 5,
      borderLeftMm: layoutConfig.borderLeftMm,
      borderRightMm: layoutConfig.borderRightMm,
      borderBottomMm: layoutConfig.borderBottomMm,
      polaroidBottomMm: layoutConfig.polaroidBottomMm !== undefined ? layoutConfig.polaroidBottomMm : 12,
      subSlotLayout: layoutConfig.subSlotLayout || 'single',
      bgHex: layoutConfig.bgHex || '#ffffff',
      footerText: layoutConfig.footerText,
      isCustom: true,
      isPro: false,
      category: layoutConfig.subSlotLayout?.startsWith('strip') || layoutConfig.subSlotLayout === 'grid-2x2' 
        ? 'photobooth' 
        : (layoutConfig.borderStyle === 'polaroid' ? 'polaroid' : 'free')
    };

    storageManager.saveTemplate(newTemplate);
    setIsSaveModalOpen(false);
    setSavedSuccessToast(true);
    setTimeout(() => setSavedSuccessToast(false), 2500);
  };

  return (
    <aside className="w-[320px] h-full bg-white border-l border-studio-border flex flex-col justify-between shrink-0 select-none z-10">
      
      {/* Top Header matching Screenshot */}
      <div>
        <div className="h-12 px-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-stone-900 text-xs tracking-tight">Thiết lập in</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenSaveModal}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition active:scale-95 ${
                savedSuccessToast
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
              title="Lưu thiết lập này thành Template mẫu của tiệm"
            >
              {savedSuccessToast ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Đã lưu mẫu!</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-stone-600" />
                  <span>Lưu mẫu</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 5 Accordion Steps matching Screenshot */}
        <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
          
          {/* Step 1: Khổ giấy */}
          <div className="border border-stone-200/90 rounded-xl overflow-hidden transition">
            <button
              onClick={() => toggleSection(1)}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-stone-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold uppercase">Khổ giấy</span>
                  <span className="text-xs font-bold text-stone-800">{getPaperName()}</span>
                </div>
              </div>
              {openSection === 1 ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </button>

            {openSection === 1 && (
              <div className="p-3 bg-stone-50 border-t border-stone-100 space-y-2 text-xs">
                <select
                  value={paperConfig.sizeId}
                  onChange={(e) => onChangePaperConfig({ ...paperConfig, sizeId: e.target.value as PaperSizeId })}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 font-medium"
                >
                  {Object.entries(PAPER_PRESETS).map(([id, info]) => (
                    <option key={id} value={id}>
                      {info.name} ({info.dimensions.widthMm} x {info.dimensions.heightMm} mm)
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onChangePaperConfig({ ...paperConfig, orientation: 'portrait' })}
                    className={`py-1.5 rounded-lg border font-semibold ${paperConfig.orientation === 'portrait' ? 'bg-stone-900 text-white' : 'bg-white'}`}
                  >
                    Giấy dọc
                  </button>
                  <button
                    onClick={() => onChangePaperConfig({ ...paperConfig, orientation: 'landscape' })}
                    className={`py-1.5 rounded-lg border font-semibold ${paperConfig.orientation === 'landscape' ? 'bg-stone-900 text-white' : 'bg-white'}`}
                  >
                    Giấy ngang
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Kiểu dàn và số ảnh */}
          <div className="border border-stone-200/90 rounded-xl overflow-hidden transition">
            <button
              onClick={() => toggleSection(2)}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-stone-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold uppercase">Kiểu dàn và số ảnh</span>
                  <span className="text-xs font-bold text-stone-800">
                    {isMulti ? `Nhiều khổ chung tờ • ${totalMultiSlots} ô` : `${layoutConfig.algorithm === 'grid' ? 'Lưới cố định' : 'Tối ưu'} • ${photosCount} ảnh`}
                  </span>
                </div>
              </div>
              {openSection === 2 ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </button>

            {openSection === 2 && (
              <div className="p-3 bg-stone-50 border-t border-stone-100 space-y-2.5 text-xs">
                {isMulti ? (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-stone-700 block">Danh sách khổ trong đơn ({totalMultiSlots} ô):</span>
                    {layoutConfig.multiSizes?.map((m) => (
                      <div key={m.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-stone-200">
                        <div className="truncate pr-2">
                          <span className="font-bold text-stone-800 block text-xs truncate">{m.name}</span>
                          <span className="text-[10px] text-stone-400">{m.widthMm}×{m.heightMm} mm</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = layoutConfig.multiSizes.map(item =>
                                item.id === m.id ? { ...item, count: Math.max(1, item.count - 1) } : item
                              );
                              onChangeLayoutConfig({ ...layoutConfig, multiSizes: updated });
                            }}
                            className="w-5 h-5 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-bold text-stone-900">{m.count}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = layoutConfig.multiSizes.map(item =>
                                item.id === m.id ? { ...item, count: item.count + 1 } : item
                              );
                              onChangeLayoutConfig({ ...layoutConfig, multiSizes: updated });
                            }}
                            className="w-5 h-5 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                          >
                            +
                          </button>
                          {layoutConfig.multiSizes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = layoutConfig.multiSizes.filter(item => item.id !== m.id);
                                onChangeLayoutConfig({ ...layoutConfig, multiSizes: updated });
                              }}
                              className="p-1 text-stone-300 hover:text-red-500 ml-1"
                              title="Xóa khổ này"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-stone-200 cursor-pointer mt-2">
                      <div>
                        <span className="text-[11px] font-bold text-stone-800 block">Tự động xoay ảnh để tiết kiệm giấy</span>
                        <span className="text-[10px] text-stone-500 block">Tắt để giữ toàn bộ ảnh thẳng đứng (không xoay ngang)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!layoutConfig.allowRotation}
                        onChange={(e) => onChangeLayoutConfig({ ...layoutConfig, allowRotation: e.target.checked })}
                        className="w-4 h-4 rounded text-stone-900 focus:ring-stone-500 cursor-pointer shrink-0 ml-2"
                      />
                    </label>

                    {layoutConfig.allowRotation && (
                      <div className="flex items-center justify-between p-2 bg-amber-50/70 border border-amber-200 rounded-lg animate-in fade-in duration-150">
                        <div>
                          <span className="text-[11px] font-bold text-amber-900 block">Đổi đầu ảnh (hướng đầu)</span>
                          <span className="text-[10px] text-amber-700 block">
                            Đầu đang hướng: <strong>{layoutConfig.rotationHeadDirection === 'right' ? 'Sang phải' : 'Sang trái (Khớp đỉnh thẻ)'}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextDir = layoutConfig.rotationHeadDirection === 'right' ? 'left' : 'right';
                            onChangeLayoutConfig({ ...layoutConfig, rotationHeadDirection: nextDir });
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-md shadow-xs transition active:scale-95 shrink-0"
                        >
                          🔄 Đổi đầu ảnh
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onChangeLayoutConfig({ ...layoutConfig, algorithm: 'grid' })}
                        className={`py-1.5 rounded-lg border font-semibold ${layoutConfig.algorithm === 'grid' ? 'bg-stone-900 text-white' : 'bg-white'}`}
                      >
                        Lưới cố định
                      </button>
                      <button
                        onClick={() => onChangeLayoutConfig({ ...layoutConfig, algorithm: 'optimal-maxrects' })}
                        className={`py-1.5 rounded-lg border font-semibold ${layoutConfig.algorithm === 'optimal-maxrects' ? 'bg-stone-900 text-white' : 'bg-white'}`}
                      >
                        Tối ưu diện tích
                      </button>
                    </div>

                    <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-stone-200 cursor-pointer">
                      <div>
                        <span className="text-[11px] font-bold text-stone-800 block">Tự động xoay ảnh để tiết kiệm giấy</span>
                        <span className="text-[10px] text-stone-500 block">Tắt để giữ toàn bộ ảnh thẳng đứng (không xoay ngang)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!layoutConfig.allowRotation}
                        onChange={(e) => onChangeLayoutConfig({ ...layoutConfig, allowRotation: e.target.checked })}
                        className="w-4 h-4 rounded text-stone-900 focus:ring-stone-500 cursor-pointer shrink-0 ml-2"
                      />
                    </label>

                    {layoutConfig.allowRotation && (
                      <div className="flex items-center justify-between p-2 bg-amber-50/70 border border-amber-200 rounded-lg animate-in fade-in duration-150">
                        <div>
                          <span className="text-[11px] font-bold text-amber-900 block">Đổi đầu ảnh (hướng đầu)</span>
                          <span className="text-[10px] text-amber-700 block">
                            Đầu đang hướng: <strong>{layoutConfig.rotationHeadDirection === 'right' ? 'Sang phải' : 'Sang trái (Khớp đỉnh thẻ)'}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextDir = layoutConfig.rotationHeadDirection === 'right' ? 'left' : 'right';
                            onChangeLayoutConfig({ ...layoutConfig, rotationHeadDirection: nextDir });
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-md shadow-xs transition active:scale-95 shrink-0"
                        >
                          🔄 Đổi đầu ảnh
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Khổ ảnh / Mẫu in của tiệm */}
          <div className="border border-stone-200/90 rounded-xl overflow-hidden transition">
            <button
              onClick={() => toggleSection(3)}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-stone-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold uppercase">
                    {isMulti ? 'Mẫu in trong đơn' : 'Mẫu in của tiệm'}
                  </span>
                  <span className="text-xs font-bold text-stone-800 truncate block max-w-[200px]">
                    {getPhotoPresetName()}
                  </span>
                </div>
              </div>
              {openSection === 3 ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </button>

            {openSection === 3 && (
              <div className="p-3 bg-stone-50 border-t border-stone-100 space-y-2 text-xs">
                {isMulti ? (
                  <div className="space-y-2">
                    <span className="text-[11px] text-stone-500 block leading-tight">Thêm khổ từ Kho mẫu của tiệm:</span>
                    <select
                      className="w-full bg-white border border-stone-200 rounded-lg p-2 font-medium"
                      defaultValue=""
                      onChange={(e) => {
                        const tplId = e.target.value;
                        if (!tplId) return;
                        const tpl = availableTemplates.find(t => t.id === tplId);
                        if (!tpl) return;
                        const newDemand: MultiSizeDemand = {
                          id: String(Date.now()),
                          sizeId: `tpl-${tpl.id}`,
                          name: tpl.name,
                          widthMm: tpl.photoSize.widthMm,
                          heightMm: tpl.photoSize.heightMm,
                          count: 2,
                          borderStyle: tpl.borderStyle,
                          borderWidthMm: tpl.borderWidthMm,
                          borderTopMm: tpl.borderTopMm,
                          borderLeftMm: tpl.borderLeftMm,
                          borderRightMm: tpl.borderRightMm,
                          borderBottomMm: tpl.borderBottomMm,
                          polaroidBottomMm: tpl.polaroidBottomMm,
                          borderPattern: tpl.borderPattern,
                          subSlotLayout: tpl.subSlotLayout || 'single',
                          bgHex: tpl.bgHex || '#ffffff',
                          footerText: tpl.footerText
                        };
                        onChangeLayoutConfig({
                          ...layoutConfig,
                          multiSizes: [...(layoutConfig.multiSizes || []), newDemand]
                        });
                        e.target.value = '';
                      }}
                    >
                      <option value="" disabled>+ Chọn mẫu thêm vào tờ in...</option>
                      {availableTemplates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.photoSize.widthMm}×{t.photoSize.heightMm} mm)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <select
                    value={layoutConfig.photoPresetId}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const tpl = availableTemplates.find(t => t.id === selectedVal);
                      if (tpl) {
                        onChangeLayoutConfig({
                          ...layoutConfig,
                          photoPresetId: tpl.id,
                          customWidthMm: tpl.photoSize.widthMm,
                          customHeightMm: tpl.photoSize.heightMm,
                          aspectRatio: tpl.photoSize.widthMm / tpl.photoSize.heightMm,
                          borderStyle: tpl.borderStyle,
                          borderWidthMm: tpl.borderWidthMm !== undefined ? tpl.borderWidthMm : (tpl.borderStyle === 'polaroid' ? 5 : 3),
                          borderTopMm: tpl.borderTopMm,
                          borderLeftMm: tpl.borderLeftMm,
                          borderRightMm: tpl.borderRightMm,
                          borderBottomMm: tpl.borderBottomMm,
                          polaroidBottomMm: tpl.polaroidBottomMm !== undefined ? tpl.polaroidBottomMm : (tpl.borderStyle === 'polaroid' ? 12 : 0),
                          borderPattern: tpl.borderPattern,
                          subSlotLayout: tpl.subSlotLayout || 'single',
                          bgHex: tpl.bgHex || '#ffffff',
                          footerText: tpl.footerText
                        });
                      } else {
                        onChangeLayoutConfig({ ...layoutConfig, photoPresetId: selectedVal });
                      }
                    }}
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 font-medium"
                  >
                    <optgroup label="Kho mẫu khung của tiệm">
                      {availableTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.photoSize.widthMm}×{t.photoSize.heightMm} mm)
                        </option>
                      ))}
                    </optgroup>
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Step 4: Viền ảnh (template) */}
          <div className="border border-stone-200/90 rounded-xl overflow-hidden transition">
            <button
              onClick={() => toggleSection(4)}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-stone-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold uppercase">Viền ảnh (template)</span>
                  <span className="text-xs font-bold text-stone-800">{getBorderName()}</span>
                </div>
              </div>
              {openSection === 4 ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </button>

            {openSection === 4 && (
              <div className="p-3 bg-stone-50 border-t border-stone-100 space-y-2 text-xs">
                {isMulti ? (
                  <p className="text-stone-600 leading-relaxed text-[11px]">
                    ✨ Đơn hàng đang ở chế độ <b>Nhiều khổ chung tờ</b>: Mỗi ô ảnh tự động nhận đúng kiểu viền của mẫu tương ứng (Polaroid, Viền mỏng, Không viền,...).
                  </p>
                ) : (
                  <select
                    value={layoutConfig.borderStyle}
                    onChange={(e) => {
                      const bStyle = e.target.value as BorderStyle;
                      onChangeLayoutConfig({
                        ...layoutConfig,
                        borderStyle: bStyle,
                        borderWidthMm: bStyle === 'polaroid' ? 5 : bStyle === 'thin' ? 3 : bStyle === 'asymmetric' ? 3 : 0,
                        borderLeftMm: bStyle === 'asymmetric' ? 14 : undefined,
                        borderRightMm: bStyle === 'asymmetric' ? 3 : undefined,
                        borderTopMm: bStyle === 'asymmetric' ? 3 : undefined,
                        borderBottomMm: bStyle === 'asymmetric' ? 3 : undefined,
                        polaroidBottomMm: bStyle === 'polaroid' ? 12 : 0
                      });
                    }}
                    className="w-full bg-white border border-stone-200 rounded-lg p-2 font-medium"
                  >
                    <option value="polaroid">Polaroid trắng • góc vuông (chân 12mm)</option>
                    <option value="thin">Viền mỏng 3mm</option>
                    <option value="none">Không viền (Full bleed)</option>
                    <option value="asymmetric">Viền 1 cạnh / Lệch tâm (Sổ tay 14mm)</option>
                    <option value="custom">Mẫu hoa văn Giáng sinh / Lễ hội</option>
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Step 5: Nâng cao */}
          <div className="border border-stone-200/90 rounded-xl overflow-hidden transition">
            <button
              onClick={() => toggleSection(5)}
              className="w-full p-3 flex items-center justify-between text-left hover:bg-stone-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-4 h-4 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  5
                </span>
                <div>
                  <span className="text-[10px] text-stone-400 block font-semibold uppercase">Nâng cao</span>
                  <span className="text-xs font-bold text-stone-800 block truncate max-w-[200px]">
                    Khe {layoutConfig.gapX} mm • {layoutConfig.cropMode === 'fill' ? 'phủ đầy ô' : 'giữ trọn hình'} • đường cắt bệt
                  </span>
                </div>
              </div>
              {openSection === 5 ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </button>

            {openSection === 5 && (
              <div className="p-3 bg-stone-50 border-t border-stone-100 space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 font-bold block mb-1">Chế độ hiển thị</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onChangeLayoutConfig({ ...layoutConfig, cropMode: 'fill' })}
                      className={`py-1.5 rounded-lg border font-semibold ${layoutConfig.cropMode === 'fill' ? 'bg-stone-900 text-white' : 'bg-white'}`}
                    >
                      Phủ đầy ô (Fill)
                    </button>
                    <button
                      onClick={() => onChangeLayoutConfig({ ...layoutConfig, cropMode: 'fit' })}
                      className={`py-1.5 rounded-lg border font-semibold ${layoutConfig.cropMode === 'fit' ? 'bg-stone-900 text-white' : 'bg-white'}`}
                    >
                      Giữ trọn hình (Fit)
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 font-bold block mb-1">Khoảng cách khe giữa ảnh (mm)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={layoutConfig.gapX}
                      onChange={(e) => onChangeLayoutConfig({ ...layoutConfig, gapX: parseFloat(e.target.value) || 0, gapY: parseFloat(e.target.value) || 0 })}
                      className="w-20 bg-white border border-stone-200 rounded p-1.5 font-bold"
                    />
                    <span className="text-[11px] text-stone-400">mm</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-stone-500 font-bold block mb-1">Đường cắt xén</span>
                  <select
                    value={layoutConfig.cutLineStyle}
                    onChange={(e) => onChangeLayoutConfig({ ...layoutConfig, cutLineStyle: e.target.value as CutLineStyle })}
                    className="w-full bg-white border border-stone-200 rounded p-1.5 font-medium"
                  >
                    <option value="solid">Đường cắt bệt (Solid cut lines)</option>
                    <option value="dashed">Đường cắt nét đứt (Dashed)</option>
                    <option value="cropmarks">Vạch xén góc (Crop marks)</option>
                    <option value="none">Không đường cắt</option>
                  </select>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Bottom Fixed Stats Box & "Dàn & Xuất" Button matching Screenshot */}
      <div className="p-4 border-t border-stone-100 bg-white space-y-3">
        {/* 3 Stats Cards in a row matching PicDesk */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
            <span className="text-base font-bold text-stone-900 block leading-tight">{photosCount}</span>
            <span className="text-[10px] text-stone-400">ảnh</span>
          </div>
          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
            <span className="text-base font-bold text-stone-900 block leading-tight">{totalPages}</span>
            <span className="text-[10px] text-stone-400">tờ {paperConfig.sizeId}</span>
          </div>
          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
            <span className="text-base font-bold text-stone-900 block leading-tight">{wastePercent}%</span>
            <span className="text-[10px] text-stone-400">phí giấy</span>
          </div>
        </div>

        {/* Large Main Button: Dàn & Xuất matching Screenshot */}
        <button
          onClick={onOpenExportModal}
          className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 group"
        >
          <span>Dàn & Xuất</span>
          <ChevronDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-white transition" />
        </button>
      </div>

      {/* Modal: Lưu thiết lập in thành Template của tiệm */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Bookmark className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-stone-900">Lưu thành Mẫu của tiệm</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Lưu toàn bộ thông số khổ ảnh, viền và kiểu dàn hiện tại thành template để tái sử dụng cho các đơn in sau.
            </p>

            <form onSubmit={handleConfirmSaveTemplate} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Tên mẫu in:</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Nhập tên mẫu..."
                  autoFocus
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                />
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 space-y-1 text-[11px] text-stone-600">
                <div className="flex justify-between">
                  <span>Khổ giấy:</span>
                  <strong className="text-stone-800">{paperConfig.sizeId}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Khổ ảnh:</span>
                  <strong className="text-stone-800">{layoutConfig.customWidthMm}×{layoutConfig.customHeightMm} mm</strong>
                </div>
                <div className="flex justify-between">
                  <span>Kiểu viền:</span>
                  <strong className="text-stone-800">{getBorderName()}</strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!templateName.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  Lưu vào kho mẫu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </aside>
  );
};
