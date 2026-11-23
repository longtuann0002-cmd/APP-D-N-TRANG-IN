import React, { useState, useRef } from 'react';
import { X, Upload, Check, Tag, Columns, Layers } from 'lucide-react';
import { TemplateItem, BorderStyle, SubSlotLayout, PriceTier } from '../../types';

interface TemplateEditorModalProps {
  template?: TemplateItem | null;
  onClose: () => void;
  onSave: (savedTemplate: TemplateItem) => void;
}

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  template,
  onClose,
  onSave
}) => {
  const isEditing = !!template;

  const [name, setName] = useState(template?.name || 'Mẫu Polaroid tùy chỉnh');
  const [description, setDescription] = useState(template?.description || 'Viền thiết kế riêng cho tiệm');
  const [widthMm, setWidthMm] = useState(template?.photoSize.widthMm || 54);
  const [heightMm, setHeightMm] = useState(template?.photoSize.heightMm || 86);
  
  // Sub-slot layout (Single vs Photobooth strips vs Grid 2x2)
  const [subSlotLayout, setSubSlotLayout] = useState<SubSlotLayout>(template?.subSlotLayout || 'single');

  // Border style
  const [borderStyle, setBorderStyle] = useState<BorderStyle>(template?.borderStyle || 'polaroid');
  
  // Border dimensions
  const [borderWidthMm, setBorderWidthMm] = useState(
    template?.borderWidthMm !== undefined ? template.borderWidthMm : (template?.borderStyle === 'polaroid' ? 5 : 3)
  );
  const [borderTopMm, setBorderTopMm] = useState<number>(
    template?.borderTopMm !== undefined 
      ? template.borderTopMm 
      : (template?.borderWidthMm !== undefined ? template.borderWidthMm : (template?.borderStyle === 'polaroid' ? 5 : 3))
  );
  const [borderLeftMm, setBorderLeftMm] = useState<number>(template?.borderLeftMm !== undefined ? template.borderLeftMm : 12);
  const [borderRightMm, setBorderRightMm] = useState<number>(template?.borderRightMm !== undefined ? template.borderRightMm : 3);
  const [borderBottomMm, setBorderBottomMm] = useState<number>(template?.borderBottomMm !== undefined ? template.borderBottomMm : 3);
  const [polaroidBottomMm, setPolaroidBottomMm] = useState(template?.polaroidBottomMm !== undefined ? template.polaroidBottomMm : 12);

  // Background color
  const [bgHex, setBgHex] = useState<string>(template?.bgHex || '#ffffff');

  const [borderPattern, setBorderPattern] = useState<string>(template?.borderPattern || '');
  const [customPrice, setCustomPrice] = useState<number>(template?.customPrice || 2000);
  const [customFrameImage, setCustomFrameImage] = useState<string>(template?.customFrameImage || '');

  // Dedicated quantity tiers for this template
  const [enableTieredPricing, setEnableTieredPricing] = useState<boolean>(() => {
    return !!(template?.priceTiers && template.priceTiers.length > 0);
  });
  const [tier1, setTier1] = useState<number>(() => {
    return template?.priceTiers?.[0]?.unitPrice || template?.customPrice || 2000;
  });
  const [tier2, setTier2] = useState<number>(() => {
    return template?.priceTiers?.[1]?.unitPrice || Math.round((template?.customPrice || 2000) * 0.9 / 100) * 100;
  });
  const [tier3, setTier3] = useState<number>(() => {
    return template?.priceTiers?.[2]?.unitPrice || Math.round((template?.customPrice || 2000) * 0.75 / 100) * 100;
  });
  const [tier4, setTier4] = useState<number>(() => {
    return template?.priceTiers?.[3]?.unitPrice || Math.round((template?.customPrice || 2000) * 0.65 / 100) * 100;
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pattern CSS generator for live preview
  const getPatternBackground = () => {
    if (customFrameImage) return `url(${customFrameImage})`;
    if (borderStyle === 'custom' && borderPattern) {
      if (borderPattern === 'caro-red-green') {
        return 'repeating-linear-gradient(45deg, #dc2626 0, #dc2626 6px, #16a34a 6px, #16a34a 12px)';
      }
      if (borderPattern === 'scotland-red') {
        return 'repeating-linear-gradient(0deg, #dc2626 0, #dc2626 6px, #15803d 6px, #15803d 12px)';
      }
      if (borderPattern === 'candy-cane') {
        return 'repeating-linear-gradient(45deg, #ef4444 0, #ef4444 6px, #ffffff 6px, #ffffff 12px)';
      }
      if (borderPattern === 'snow-dots-red') {
        return 'radial-gradient(#ffffff 25%, transparent 25%) 0 0/10px 10px, #dc2626';
      }
      if (borderPattern === 'snow-night-blue') {
        return 'radial-gradient(#ffffff 25%, transparent 25%) 0 0/10px 10px, #1e3a8a';
      }
    }
    return undefined;
  };

  // Calculate effective 4-side borders
  let effTop = 0;
  let effBottom = 0;
  let effLeft = 0;
  let effRight = 0;

  if (borderStyle === 'none') {
    effTop = effBottom = effLeft = effRight = 0;
  } else if (borderStyle === 'thin') {
    effTop = effBottom = effLeft = effRight = borderWidthMm;
  } else if (borderStyle === 'polaroid') {
    effTop = borderTopMm;
    effBottom = polaroidBottomMm;
    effLeft = effRight = borderWidthMm;
  } else if (borderStyle === 'asymmetric') {
    effTop = borderTopMm;
    effBottom = borderBottomMm;
    effLeft = borderLeftMm;
    effRight = borderRightMm;
  } else {
    // custom (Viền họa tiết / Upload)
    effTop = borderTopMm;
    effBottom = polaroidBottomMm;
    effLeft = effRight = borderWidthMm;
  }

  const innerW = Math.max(5, widthMm - (effLeft + effRight));
  const innerH = Math.max(5, heightMm - (effTop + effBottom));

  // Sub-slot calculation
  const subGapMm = 1.5;
  let subSlotCount = 1;
  let subSlotW = innerW;
  let subSlotH = innerH;

  if (subSlotLayout === 'strip-3') {
    subSlotCount = 3;
    subSlotW = innerW;
    subSlotH = Math.max(5, (innerH - (subSlotCount - 1) * subGapMm) / subSlotCount);
  } else if (subSlotLayout === 'strip-4') {
    subSlotCount = 4;
    subSlotW = innerW;
    subSlotH = Math.max(5, (innerH - (subSlotCount - 1) * subGapMm) / subSlotCount);
  } else if (subSlotLayout === 'strip-2') {
    subSlotCount = 2;
    subSlotW = innerW;
    subSlotH = Math.max(5, (innerH - (subSlotCount - 1) * subGapMm) / subSlotCount);
  } else if (subSlotLayout === 'grid-2x2') {
    subSlotCount = 4;
    subSlotW = Math.max(5, (innerW - subGapMm) / 2);
    subSlotH = Math.max(5, (innerH - subGapMm) / 2);
  }

  // Preview scaling: fit inside 250px box
  const aspect = widthMm / heightMm;
  const maxDim = 250;
  let previewBoxH = maxDim;
  let previewBoxW = previewBoxH * aspect;
  if (previewBoxW > maxDim) {
    previewBoxW = maxDim;
    previewBoxH = previewBoxW / aspect;
  }
  const scale = previewBoxW / widthMm; // pixels per mm

  // Detect if background is dark to show white text
  const isDarkBg = ['#18181b', '#111111', '#000000', '#1e293b'].includes(bgHex.toLowerCase());

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomFrameImage(reader.result);
          setBorderStyle('custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const finalPriceTiers: PriceTier[] | undefined = enableTieredPricing ? [
      { minQty: 1, maxQty: 10, unitPrice: tier1 },
      { minQty: 11, maxQty: 40, unitPrice: tier2 },
      { minQty: 41, maxQty: 140, unitPrice: tier3 },
      { minQty: 141, unitPrice: tier4 }
    ] : undefined;

    const saved: TemplateItem = {
      id: template?.id || ('tpl-custom-' + Date.now()),
      name: name.trim(),
      description: description.trim(),
      photoSize: { widthMm, heightMm },
      borderStyle,
      borderWidthMm,
      borderTopMm: borderStyle === 'none' ? 0 : borderTopMm,
      borderLeftMm: borderStyle === 'asymmetric' ? borderLeftMm : undefined,
      borderRightMm: borderStyle === 'asymmetric' ? borderRightMm : undefined,
      borderBottomMm: borderStyle === 'asymmetric' ? borderBottomMm : undefined,
      polaroidBottomMm: borderStyle === 'polaroid' ? polaroidBottomMm : 0,
      subSlotLayout,
      bgHex,
      footerText: undefined,
      borderPattern: borderStyle === 'custom' ? borderPattern : undefined,
      customPrice: customPrice > 0 ? customPrice : 2000,
      priceTiers: finalPriceTiers,
      customFrameImage: customFrameImage || undefined,
      isCustom: true,
      isPro: false,
      category: subSlotLayout.startsWith('strip') || subSlotLayout === 'grid-2x2' 
        ? 'photobooth' 
        : (borderStyle === 'polaroid' ? 'polaroid' : 'free')
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[94dvh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-stone-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              ✦
            </span>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">
                {isEditing ? 'Chỉnh sửa mẫu khung in' : 'Tạo mẫu khung in mới'}
              </h3>
              <p className="text-[11px] text-stone-500">Cấu hình viền mm, nhiều ảnh trong khung (Photobooth), màu nền & giá in</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body 2 columns */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden p-4 sm:p-6 gap-5 sm:gap-6">
          
          {/* Left: Live Visual Preview */}
          <div className="w-full md:w-80 flex flex-col items-center justify-between bg-stone-100/70 border border-stone-200 rounded-2xl p-4 shrink-0 overflow-y-auto">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-2">
              Mô phỏng kích thước thực tế
            </span>

            {/* Frame Box */}
            <div 
              className="rounded shadow-md border border-stone-300 relative flex flex-col transition-all overflow-hidden my-auto"
              style={{
                width: previewBoxW,
                height: previewBoxH,
                backgroundColor: bgHex,
                background: getPatternBackground() || bgHex,
                backgroundSize: customFrameImage ? '100% 100%' : undefined
              }}
            >
              {/* Top border spacer */}
              <div style={{ height: effTop * scale, width: '100%' }} />

              {/* Middle row: Left border + Inner Area + Right border */}
              <div className="flex-1 w-full flex">
                <div style={{ width: effLeft * scale, height: '100%' }} />

                <div 
                  className="flex-1 h-full flex flex-col justify-between"
                  style={{
                    width: innerW * scale,
                    height: innerH * scale
                  }}
                >
                  {/* Sub-slots visual rendering */}
                  {subSlotLayout === 'single' ? (
                    <div className="w-full h-full bg-stone-200/90 border border-stone-300/80 rounded-xs flex flex-col items-center justify-center text-center p-1 shadow-inner">
                      <span className="text-[10px] font-bold text-stone-600 block">Khu vực ảnh</span>
                      <span className="text-[9px] text-stone-500 font-mono">
                        {Math.round(innerW)} × {Math.round(innerH)} mm
                      </span>
                    </div>
                  ) : subSlotLayout === 'grid-2x2' ? (
                    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1">
                      {[1, 2, 3, 4].map(idx => (
                        <div key={idx} className="bg-stone-200/90 border border-stone-300/80 rounded-xs flex flex-col items-center justify-center text-center p-0.5 shadow-inner">
                          <span className="text-[9px] font-bold text-stone-600">#{idx}</span>
                          <span className="text-[7.5px] text-stone-400 font-mono">
                            {Math.round(subSlotW)}×{Math.round(subSlotH)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Strip vertical (2, 3, or 4 cuts)
                    <div className="w-full h-full flex flex-col justify-between" style={{ gap: `${subGapMm * scale}px` }}>
                      {Array.from({ length: subSlotCount }).map((_, idx) => (
                        <div 
                          key={idx} 
                          className="flex-1 bg-stone-200/90 border border-stone-300/80 rounded-xs flex flex-col items-center justify-center text-center p-0.5 shadow-inner"
                        >
                          <span className="text-[9px] font-bold text-stone-600">Ảnh #{idx + 1}</span>
                          <span className="text-[7.5px] text-stone-400 font-mono">
                            {Math.round(subSlotW)} × {Math.round(subSlotH)} mm
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ width: effRight * scale, height: '100%' }} />
              </div>

              {/* Bottom border spacer */}
              <div 
                className="w-full flex items-center justify-center px-1"
                style={{ height: effBottom * scale }}
              />
            </div>

            {/* Specs Summary under preview */}
            <div className="mt-3 w-full bg-white p-2.5 rounded-xl border border-stone-200 text-xs space-y-1">
              <div className="flex justify-between text-stone-600">
                <span>Khổ cắt ngoài:</span>
                <strong className="text-stone-900">{widthMm} × {heightMm} mm</strong>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Bố cục trong:</span>
                <strong className="text-brand-600 font-bold">
                  {subSlotLayout === 'single' ? '1 ảnh đơn' : subSlotLayout === 'grid-2x2' ? 'Lưới 4 ảnh 2×2' : `Dải ${subSlotCount} ảnh Photobooth`}
                </strong>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Kích thước mỗi ảnh:</span>
                <strong className="text-stone-900">{Math.round(subSlotW)} × {Math.round(subSlotH)} mm</strong>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Màu nền viền:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border border-stone-300 inline-block" style={{ backgroundColor: bgHex }} />
                  <strong className="font-mono text-[11px] text-stone-800">{bgHex.toUpperCase()}</strong>
                </div>
              </div>
              <div className="flex justify-between text-stone-600 pt-1 border-t border-stone-100">
                <span>Đơn giá in:</span>
                <strong className="text-emerald-700">{customPrice.toLocaleString('vi-VN')} đ</strong>
              </div>
            </div>
          </div>

          {/* Right: Controls form */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Tên & Mô tả */}
            <div>
              <label className="text-xs font-bold text-stone-700 mb-1 block">Tên mẫu khung</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Dải Photobooth 4 ảnh Hàn Quốc..."
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-stone-900"
              />
            </div>

            {/* Chọn khổ ảnh chuẩn nhanh */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700">Khổ cắt thành phẩm ngoài</label>
                <span className="text-[10px] text-stone-400">Kích thước giấy thành phẩm dùng dao xén</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                {[
                  { label: 'Polaroid mini', w: 54, h: 86, style: 'polaroid' as BorderStyle, sub: 'single' as SubSlotLayout },
                  { label: 'Ảnh 6×9', w: 60, h: 90, style: 'thin' as BorderStyle, sub: 'single' as SubSlotLayout },
                  { label: 'Ảnh 9×13', w: 90, h: 130, style: 'thin' as BorderStyle, sub: 'single' as SubSlotLayout },
                  { label: 'Ảnh 10×15', w: 100, h: 150, style: 'none' as BorderStyle, sub: 'single' as SubSlotLayout },
                  { label: 'Photobooth 3 ảnh', w: 50, h: 150, style: 'polaroid' as BorderStyle, sub: 'strip-3' as SubSlotLayout },
                  { label: 'Photobooth 4 ảnh', w: 50, h: 150, style: 'polaroid' as BorderStyle, sub: 'strip-4' as SubSlotLayout },
                  { label: 'Lưới 2×2 (6×9)', w: 60, h: 90, style: 'polaroid' as BorderStyle, sub: 'grid-2x2' as SubSlotLayout },
                  { label: 'Thẻ 3×4', w: 30, h: 40, style: 'none' as BorderStyle, sub: 'single' as SubSlotLayout },
                ].map(preset => {
                  const isCurrent = widthMm === preset.w && heightMm === preset.h && subSlotLayout === preset.sub;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setWidthMm(preset.w);
                        setHeightMm(preset.h);
                        setBorderStyle(preset.style);
                        setSubSlotLayout(preset.sub);
                        if (!name || name === 'Mẫu Polaroid tùy chỉnh' || name.startsWith('Mẫu ')) {
                          setName(`Mẫu ${preset.label}`);
                        }
                      }}
                      className={'py-1.5 px-2 text-[11px] font-bold rounded-lg border text-center transition ' + (
                        isCurrent
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kích thước khổ khung ngoài */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-700 mb-1 block">Chiều rộng cắt (mm)</label>
                <input
                  type="number"
                  min="20"
                  max="300"
                  value={widthMm}
                  onChange={(e) => setWidthMm(parseInt(e.target.value) || 54)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-700 mb-1 block">Chiều cao cắt (mm)</label>
                <input
                  type="number"
                  min="20"
                  max="400"
                  value={heightMm}
                  onChange={(e) => setHeightMm(parseInt(e.target.value) || 86)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Bố cục ảnh bên trong khung (Số lượng ảnh) */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <label className="text-xs font-bold text-stone-900 mb-1.5 flex items-center gap-1.5">
                <Columns className="w-3.5 h-3.5 text-brand-600" />
                <span>Số lượng ảnh trong khung (Bố cục Photobooth)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'single', label: '1 ảnh đơn', desc: 'Ảnh truyền thống' },
                  { id: 'strip-3', label: 'Dải 3 ảnh dọc', desc: 'Photobooth 3 ô' },
                  { id: 'strip-4', label: 'Dải 4 ảnh dọc', desc: 'Hàn Quốc Life4Cuts' },
                  { id: 'strip-2', label: 'Dải 2 ảnh dọc', desc: 'Photobooth 2 ô' },
                  { id: 'grid-2x2', label: 'Lưới 4 ảnh (2×2)', desc: '4 ô ảnh vuông' },
                ].map(layout => (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => {
                      setSubSlotLayout(layout.id as SubSlotLayout);
                      if (layout.id.startsWith('strip') && polaroidBottomMm < 14) {
                        setPolaroidBottomMm(15);
                      }
                    }}
                    className={'p-2 rounded-xl border text-left transition ' + (
                      subSlotLayout === layout.id
                        ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                    )}
                  >
                    <span className="block text-[11px] font-bold">{layout.label}</span>
                    <span className={`block text-[9px] ${subSlotLayout === layout.id ? 'text-stone-300' : 'text-stone-400'}`}>
                      {layout.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Kiểu viền */}
            <div>
              <label className="text-xs font-bold text-stone-700 mb-1.5 block">Kiểu viền khung</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'polaroid', label: 'Polaroid (Chân dày)' },
                  { id: 'thin', label: 'Viền đều 4 cạnh' },
                  { id: 'none', label: 'Không viền (Full bleed)' },
                  { id: 'asymmetric', label: 'Viền 1 cạnh / Lệch tâm' },
                  { id: 'custom', label: 'Viền họa tiết / Upload' }
                ].map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBorderStyle(b.id as any)}
                    className={'py-2 px-3 rounded-xl border text-xs font-semibold transition text-left ' + (
                      borderStyle === b.id 
                        ? 'bg-stone-900 border-stone-900 text-white shadow-xs' 
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Màu nền viền & Chữ in chân đáy */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-800 mb-1.5 block">Màu sắc nền khung / viền</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { hex: '#ffffff', label: 'Trắng' },
                    { hex: '#18181b', label: 'Đen' },
                    { hex: '#fce7f3', label: 'Hồng pastel' },
                    { hex: '#e0f2fe', label: 'Xanh pastel' },
                    { hex: '#fdf6e2', label: 'Be vintage' },
                    { hex: '#fef9c3', label: 'Kem ấm' },
                  ].map(color => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setBgHex(color.hex)}
                      className={'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ' + (
                        bgHex.toLowerCase() === color.hex.toLowerCase()
                          ? 'border-stone-900 ring-2 ring-stone-900/20 bg-white'
                          : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                      )}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-stone-300" style={{ backgroundColor: color.hex }} />
                      <span>{color.label}</span>
                    </button>
                  ))}
                  <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg px-2 py-0.5">
                    <span className="text-[10px] text-stone-400">HEX:</span>
                    <input
                      type="text"
                      value={bgHex}
                      onChange={(e) => setBgHex(e.target.value)}
                      className="w-16 text-[11px] font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Tinh chỉnh milimet theo từng kiểu viền */}
            {borderStyle === 'asymmetric' && (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <span className="text-xs font-bold text-stone-900 block">Viền 4 cạnh độc lập (Ví dụ chừa lề bấm ghim 1 bên):</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Viền Trái (Left):</span>
                      <span className="font-mono text-brand-600">{borderLeftMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={borderLeftMm}
                      onChange={(e) => setBorderLeftMm(parseInt(e.target.value) || 0)}
                      className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Viền Phải (Right):</span>
                      <span className="font-mono text-brand-600">{borderRightMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={borderRightMm}
                      onChange={(e) => setBorderRightMm(parseInt(e.target.value) || 0)}
                      className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Viền Trên (Top):</span>
                      <span className="font-mono text-brand-600">{borderTopMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={borderTopMm}
                      onChange={(e) => setBorderTopMm(parseInt(e.target.value) || 0)}
                      className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Viền Dưới (Bottom):</span>
                      <span className="font-mono text-brand-600">{borderBottomMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={borderBottomMm}
                      onChange={(e) => setBorderBottomMm(parseInt(e.target.value) || 0)}
                      className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {borderStyle === 'polaroid' && (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                {/* Viền trên riêng */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-stone-800">Độ dày viền trên (Top):</span>
                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-stone-900 bg-white border border-stone-200 px-2 py-0.5 rounded-lg">
                      <span>{borderTopMm}</span>
                      <span className="text-stone-400 font-normal">mm</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={borderTopMm}
                    onChange={(e) => setBorderTopMm(parseInt(e.target.value) || 0)}
                    className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Viền ngang / 2 bên riêng */}
                <div className="pt-2 border-t border-stone-200/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-stone-800">Độ dày viền ngang / 2 bên (Sides):</span>
                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-stone-900 bg-white border border-stone-200 px-2 py-0.5 rounded-lg">
                      <span>{borderWidthMm}</span>
                      <span className="text-stone-400 font-normal">mm</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={borderWidthMm}
                    onChange={(e) => setBorderWidthMm(parseInt(e.target.value) || 1)}
                    className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-stone-200/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-stone-800">Độ dày chân đáy Polaroid / Photobooth:</span>
                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-stone-900 bg-white border border-stone-200 px-2 py-0.5 rounded-lg">
                      <span>{polaroidBottomMm}</span>
                      <span className="text-stone-400 font-normal">mm</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="50"
                    value={polaroidBottomMm}
                    onChange={(e) => setPolaroidBottomMm(parseInt(e.target.value) || 12)}
                    className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}

            {borderStyle === 'thin' && (
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-stone-800">Độ dày viền đều 4 cạnh:</span>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-stone-900 bg-white border border-stone-200 px-2 py-0.5 rounded-lg">
                    <span>{borderWidthMm}</span>
                    <span className="text-stone-400 font-normal">mm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={borderWidthMm}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setBorderWidthMm(val);
                    setBorderTopMm(val);
                  }}
                  className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {/* Viền họa tiết & Upload file khung riêng */}
            {borderStyle === 'custom' && (
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
                <label className="text-xs font-bold text-stone-800 block">Chọn hoa văn sẵn có hoặc Tải lên</label>
                
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'caro-red-green', label: 'Ca rô đỏ xanh' },
                    { id: 'scotland-red', label: 'Scotland đỏ' },
                    { id: 'candy-cane', label: 'Sọc kẹo chéo' },
                    { id: 'snow-dots-red', label: 'Chấm tuyết đỏ' },
                    { id: 'snow-night-blue', label: 'Tuyết đêm xanh' }
                  ].map(pat => (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() => { setBorderPattern(pat.id); setCustomFrameImage(''); }}
                      className={'py-1 px-2 text-[11px] font-semibold rounded-lg border transition truncate ' + (
                        borderPattern === pat.id && !customFrameImage
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      )}
                    >
                      {pat.label}
                    </button>
                  ))}
                </div>

                {/* Upload button for custom PNG */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/webp"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-white border border-brand-200 hover:border-brand-300 px-3 py-1.5 rounded-xl transition shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{customFrameImage ? 'Đổi ảnh viền PNG khác' : 'Tải lên khung viền PNG riêng'}</span>
                  </button>

                  {customFrameImage && (
                    <button
                      type="button"
                      onClick={() => setCustomFrameImage('')}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Gỡ ảnh upload
                    </button>
                  )}
                </div>

                {/* Tinh chỉnh chi tiết độ dày khung viền (mm) cho hoa văn / Upload */}
                <div className="pt-3 border-t border-stone-200/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-900">Chi tiết độ dày viền hoa văn (mm):</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setBorderTopMm(4);
                          setBorderWidthMm(4);
                          setPolaroidBottomMm(4);
                        }}
                        className="text-[10px] font-bold text-stone-600 bg-white border border-stone-200 hover:bg-stone-100 px-2 py-0.5 rounded-md transition"
                      >
                        Viền đều 4mm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBorderTopMm(5);
                          setBorderWidthMm(5);
                          setPolaroidBottomMm(14);
                        }}
                        className="text-[10px] font-bold text-stone-600 bg-white border border-stone-200 hover:bg-stone-100 px-2 py-0.5 rounded-md transition"
                      >
                        Chân dày 14mm
                      </button>
                    </div>
                  </div>

                  {/* Viền trên */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-stone-700">Độ dày viền trên (Top):</span>
                      <span className="font-mono text-xs font-bold text-brand-600 bg-white border border-stone-200 px-2 py-0.5 rounded-lg">{borderTopMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={borderTopMm}
                      onChange={(e) => setBorderTopMm(parseInt(e.target.value) || 1)}
                      className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Viền ngang 2 bên */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-stone-700">Độ dày viền 2 bên (Sides):</span>
                      <span className="font-mono text-xs font-bold text-brand-600 bg-white border border-stone-200 px-2 py-0.5 rounded-lg">{borderWidthMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={borderWidthMm}
                      onChange={(e) => setBorderWidthMm(parseInt(e.target.value) || 1)}
                      className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Viền chân đáy */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-stone-700">Độ dày chân đáy (Bottom):</span>
                      <span className="font-mono text-xs font-bold text-brand-600 bg-white border border-stone-200 px-2 py-0.5 rounded-lg">{polaroidBottomMm} mm</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={polaroidBottomMm}
                      onChange={(e) => setPolaroidBottomMm(parseInt(e.target.value) || 1)}
                      className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Liên kết Bảng giá & Giá bậc thang chi tiết cho mẫu này */}
            <div className="pt-3 border-t border-stone-200/90 space-y-3">
              <div>
                <label className="text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đơn giá in cơ bản cho mẫu này (VNĐ / ảnh hoặc dải)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="500"
                    min="500"
                    max="100000"
                    value={customPrice}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setCustomPrice(val);
                      if (!enableTieredPricing) {
                        setTier1(val);
                      }
                    }}
                    className="w-48 border border-stone-200 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-900 bg-white shadow-2xs"
                  />
                  <span className="text-xs text-stone-500 font-medium">VNĐ (áp dụng khi tạo đơn)</span>
                </div>
              </div>

              {/* Bậc thang giá chi tiết theo số lượng của mẫu này */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="pr-2">
                    <span className="text-xs font-bold text-stone-900 block flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      <span>Bậc thang giá theo số lượng cho mẫu này</span>
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Tự động giảm giá khi khách in số lượng nhiều (11–40, 41–140, 141+ ảnh)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={enableTieredPricing}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEnableTieredPricing(checked);
                        if (checked && tier1 === 0) {
                          setTier1(customPrice);
                          setTier2(Math.round(customPrice * 0.9 / 100) * 100);
                          setTier3(Math.round(customPrice * 0.75 / 100) * 100);
                          setTier4(Math.round(customPrice * 0.65 / 100) * 100);
                        }
                      }}
                      className="w-4 h-4 text-stone-900 rounded focus:ring-stone-500 cursor-pointer"
                    />
                  </label>
                </div>

                {enableTieredPricing && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-200/80">
                    <div>
                      <label className="text-[10px] text-stone-500 font-bold block mb-1">1 – 10 ảnh (Gốc)</label>
                      <div className="flex items-center bg-white border border-stone-200 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          step="100"
                          value={tier1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setTier1(val);
                            setCustomPrice(val);
                          }}
                          className="w-full text-xs font-bold text-stone-900 outline-none"
                        />
                        <span className="text-[10px] text-stone-400">đ</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-500 font-bold block mb-1">11 – 40 ảnh</label>
                      <div className="flex items-center bg-white border border-stone-200 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          step="100"
                          value={tier2}
                          onChange={(e) => setTier2(parseInt(e.target.value) || 0)}
                          className="w-full text-xs font-bold text-stone-900 outline-none"
                        />
                        <span className="text-[10px] text-stone-400">đ</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-stone-500 font-bold block mb-1">41 – 140 ảnh</label>
                      <div className="flex items-center bg-white border border-stone-200 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          step="100"
                          value={tier3}
                          onChange={(e) => setTier3(parseInt(e.target.value) || 0)}
                          className="w-full text-xs font-bold text-stone-900 outline-none"
                        />
                        <span className="text-[10px] text-stone-400">đ</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-emerald-700 font-bold block mb-1">141+ ảnh (Sỉ)</label>
                      <div className="flex items-center bg-emerald-50/50 border border-emerald-300 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          step="100"
                          value={tier4}
                          onChange={(e) => setTier4(parseInt(e.target.value) || 0)}
                          className="w-full text-xs font-bold text-emerald-900 outline-none bg-transparent"
                        />
                        <span className="text-[10px] text-emerald-600 font-bold">đ</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 pb-[max(env(safe-area-inset-bottom),14px)] border-t border-stone-100 bg-stone-50/50 flex items-center justify-between shrink-0">
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
            className="flex items-center gap-1.5 px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>{isEditing ? 'Lưu thay đổi mẫu' : 'Tạo và Lưu mẫu mới'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
