import React, { useState, useEffect } from 'react';
import { PriceSetting, TemplateItem, PriceTier } from '../../types';
import { Save, Check, Layers, Tag, Search, AlertCircle, RotateCcw, CheckCircle2, Trash2, Edit2, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { storageManager } from '../../core/storage/storageManager';
import { TemplateEditorModal } from '../templates/TemplateEditorModal';

function getTemplatePatternCss(pattern?: string) {
  if (!pattern) return undefined;
  if (pattern === 'caro-red-green') {
    return 'repeating-linear-gradient(45deg, #dc2626 0, #dc2626 6px, #16a34a 6px, #16a34a 12px)';
  }
  if (pattern === 'scotland-red') {
    return 'repeating-linear-gradient(0deg, #dc2626 0, #dc2626 6px, #15803d 6px, #15803d 12px)';
  }
  if (pattern === 'candy-cane') {
    return 'repeating-linear-gradient(45deg, #ef4444 0, #ef4444 6px, #ffffff 6px, #ffffff 12px)';
  }
  if (pattern === 'snow-dots-red') {
    return 'radial-gradient(#ffffff 25%, transparent 25%) 0 0/10px 10px, #dc2626';
  }
  if (pattern === 'snow-night-blue') {
    return 'radial-gradient(#ffffff 25%, transparent 25%) 0 0/10px 10px, #1e3a8a';
  }
  return undefined;
}

interface PricingManagerProps {
  priceSettings: PriceSetting[];
  onSavePriceSettings: (settings: PriceSetting[]) => void;
  onNavigateToTemplates?: () => void;
}

export const PricingManager: React.FC<PricingManagerProps> = ({
  priceSettings: _priceSettings,
  onSavePriceSettings,
  onNavigateToTemplates
}) => {
  // Template items loaded 100% dynamically from storageManager (Kho mẫu)
  const [templates, setTemplates] = useState<TemplateItem[]>(() => {
    return storageManager.getTemplates();
  });

  // Track which templates have their quantity tiers expanded for inline editing
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set());

  // Modal editing template directly from PricingManager
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [savedNoticeText, setSavedNoticeText] = useState('Đã lưu thành công!');

  // Refresh templates from storage to guarantee 100% sync with Kho mẫu
  const refreshTemplates = () => {
    const fresh = storageManager.getTemplates();
    setTemplates(fresh);
  };

  useEffect(() => {
    refreshTemplates();
  }, []);

  const toggleExpandTiers = (id: string) => {
    setExpandedTiers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Handle base price or lamination update
  const handleUpdatePrice = (id: string, field: 'customPrice' | 'laminationPrice', val: number) => {
    const updated = templates.map(t => {
      if (t.id === id) {
        const nextPrice = Math.max(0, val);
        let nextTiers = t.priceTiers;
        if (field === 'customPrice' && nextTiers && nextTiers.length > 0) {
          nextTiers = nextTiers.map((tier, idx) => idx === 0 ? { ...tier, unitPrice: nextPrice } : tier);
        }
        const next = { ...t, [field]: nextPrice, priceTiers: nextTiers };
        storageManager.saveTemplate(next);
        return next;
      }
      return t;
    });
    setTemplates(updated);

    const updatedSettings: PriceSetting[] = updated.map(t => ({
      id: `tpl-${t.id}`,
      name: t.name,
      sizeName: `${t.photoSize.widthMm}x${t.photoSize.heightMm}`,
      widthMm: t.photoSize.widthMm,
      heightMm: t.photoSize.heightMm,
      unitPrice: t.customPrice || 2000,
      laminationPrice: t.laminationPrice || 1000
    }));
    onSavePriceSettings(updatedSettings);
  };

  // Handle individual tier price update for a specific template
  const handleUpdateTemplateTier = (templateId: string, tierIndex: number, newPrice: number) => {
    const updated = templates.map(t => {
      if (t.id === templateId) {
        const curPrice = t.customPrice || 2000;
        const currentTiers: PriceTier[] = t.priceTiers && t.priceTiers.length === 4
          ? [...t.priceTiers]
          : [
              { minQty: 1, maxQty: 10, unitPrice: curPrice },
              { minQty: 11, maxQty: 40, unitPrice: Math.round(curPrice * 0.9 / 100) * 100 },
              { minQty: 41, maxQty: 140, unitPrice: Math.round(curPrice * 0.75 / 100) * 100 },
              { minQty: 141, unitPrice: Math.round(curPrice * 0.65 / 100) * 100 },
            ];
        currentTiers[tierIndex] = { ...currentTiers[tierIndex], unitPrice: Math.max(0, newPrice) };
        const next = {
          ...t,
          customPrice: tierIndex === 0 ? Math.max(0, newPrice) : t.customPrice,
          priceTiers: currentTiers
        };
        storageManager.saveTemplate(next);
        return next;
      }
      return t;
    });
    setTemplates(updated);
  };

  // Toggle tier pricing on / off for a template
  const handleToggleTiers = (templateId: string, enable: boolean) => {
    const updated = templates.map(t => {
      if (t.id === templateId) {
        const curPrice = t.customPrice || 2000;
        const defaultTiers: PriceTier[] = [
          { minQty: 1, maxQty: 10, unitPrice: curPrice },
          { minQty: 11, maxQty: 40, unitPrice: Math.round(curPrice * 0.9 / 100) * 100 },
          { minQty: 41, maxQty: 140, unitPrice: Math.round(curPrice * 0.75 / 100) * 100 },
          { minQty: 141, unitPrice: Math.round(curPrice * 0.65 / 100) * 100 },
        ];
        const next = {
          ...t,
          priceTiers: enable ? (t.priceTiers && t.priceTiers.length === 4 ? t.priceTiers : defaultTiers) : undefined
        };
        storageManager.saveTemplate(next);
        return next;
      }
      return t;
    });
    setTemplates(updated);

    if (enable) {
      setExpandedTiers(prev => new Set(prev).add(templateId));
    }
  };

  // Save all templates pricing explicitly
  const handleSaveAllTemplates = () => {
    templates.forEach(t => storageManager.saveTemplate(t));
    const updatedSettings: PriceSetting[] = templates.map(t => ({
      id: `tpl-${t.id}`,
      name: t.name,
      sizeName: `${t.photoSize.widthMm}x${t.photoSize.heightMm}`,
      widthMm: t.photoSize.widthMm,
      heightMm: t.photoSize.heightMm,
      unitPrice: t.customPrice || 2000,
      laminationPrice: t.laminationPrice || 1000
    }));
    onSavePriceSettings(updatedSettings);

    setSavedNoticeText('Đã lưu toàn bộ đơn giá và đồng bộ 100% với Kho mẫu & Tạo đơn!');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Open edit modal for a template
  const handleOpenEditModal = (tpl: TemplateItem) => {
    setEditingTemplate(tpl);
    setIsEditorModalOpen(true);
  };

  // Save template from modal
  const handleSaveFromModal = (saved: TemplateItem) => {
    storageManager.saveTemplate(saved);
    refreshTemplates();
    setSavedNoticeText(`Đã cập nhật thông tin và đơn giá mẫu "${saved.name}"!`);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // Delete template from both Kho mẫu AND Bảng giá
  const handleDeleteTemplate = (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mẫu "${name}"?\nMẫu này sẽ bị xóa khỏi cả Kho mẫu và Bảng giá.`)) {
      return;
    }

    storageManager.deleteTemplate(id);
    const fresh = storageManager.getTemplates();
    setTemplates(fresh);

    const updatedSettings: PriceSetting[] = fresh.map(t => ({
      id: `tpl-${t.id}`,
      name: t.name,
      sizeName: `${t.photoSize.widthMm}x${t.photoSize.heightMm}`,
      widthMm: t.photoSize.widthMm,
      heightMm: t.photoSize.heightMm,
      unitPrice: t.customPrice || 2000,
      laminationPrice: t.laminationPrice || 1000
    }));
    onSavePriceSettings(updatedSettings);

    setSavedNoticeText(`Đã xóa mẫu "${name}" khỏi Kho mẫu và loại bỏ dòng giá tương ứng!`);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  // Restore all built-in templates
  const handleRestoreAllTemplates = () => {
    if (!window.confirm('Khôi phục lại toàn bộ danh sách mẫu in mặc định ban đầu của tiệm?')) {
      return;
    }
    storageManager.restoreAllTemplates();
    refreshTemplates();
    setSavedNoticeText('Đã khôi phục toàn bộ mẫu mặc định trong Kho mẫu & Bảng giá!');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const getCategoryBadge = (tpl: TemplateItem) => {
    if (tpl.isCustom) {
      return <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">Tự tạo</span>;
    }
    if (tpl.category === 'photobooth' || tpl.subSlotLayout?.startsWith('strip') || tpl.subSlotLayout === 'grid-2x2') {
      return <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">Photobooth</span>;
    }
    if (tpl.borderStyle === 'polaroid') {
      return <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">Polaroid</span>;
    }
    if (tpl.borderStyle === 'custom') {
      return <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">Họa tiết</span>;
    }
    if (tpl.borderStyle === 'none') {
      return <span className="text-[10px] bg-stone-100 text-stone-700 font-bold px-2 py-0.5 rounded-full">Tràn viền</span>;
    }
    return <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Viền mỏng</span>;
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${t.photoSize.widthMm}x${t.photoSize.heightMm}`.includes(searchQuery)
  );

  return (
    <div 
      className="flex-1 h-full bg-studio-bg overflow-y-auto p-4 md:p-8 pb-36 md:pb-8 md:pt-8 select-none"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-stone-200/80 gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                <Tag className="w-3 h-3" /> Bảng giá Mẫu in
              </span>
              <span className="text-xs text-stone-400">•</span>
              <span className="text-xs text-stone-500 font-semibold">{templates.length} mẫu in</span>
            </div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Tùy chỉnh giá in từng mẫu
            </h1>
            <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
              Bạn có thể <strong>tự gõ số tiền trực tiếp</strong> cho từng mẫu in bên dưới (giá lẻ hoặc bậc thang số lượng). Mọi giá bạn nhập đều tự động lưu và đồng bộ ngay với <strong>Kho mẫu</strong> & màn hình <strong>Tạo đơn</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleRestoreAllTemplates}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition border border-stone-200 bg-white shadow-2xs"
              title="Khôi phục mẫu mặc định ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mẫu gốc</span>
            </button>

            {onNavigateToTemplates && (
              <button
                type="button"
                onClick={onNavigateToTemplates}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition border border-stone-200 shadow-2xs"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Xem Kho mẫu</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAllTemplates}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-98"
            >
              {savedNotice ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
              <span>Lưu bảng giá</span>
            </button>
          </div>
        </div>

        {/* Global Save Notice Banner */}
        {savedNotice && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-950 shadow-xs animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{savedNoticeText}</span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">
              Đồng bộ hoàn tất
            </span>
          </div>
        )}

        {/* Search & Actions Bar */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên mẫu hoặc kích thước (vd: 60x90, polaroid...)"
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium placeholder:text-stone-400 focus:outline-none focus:border-stone-400 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-medium">
              Hiển thị: <strong>{filteredTemplates.length}</strong> / {templates.length} mẫu
            </span>
          </div>
        </div>

        {/* Main Unified Pricing Table: Loaded 100% from Kho mẫu */}
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xs overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-stone-900 uppercase tracking-wide">
                Bảng đơn giá in từng mẫu (Tự gõ số tiền theo ý bạn)
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-semibold">
              Gõ số tiền vào ô • Bấm "Bậc thang sỉ" để nhập giá giảm khi in nhiều
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-stone-50/90 border-b border-stone-100 text-stone-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-5 font-bold">Mẫu in / Dịch vụ</th>
                <th className="py-3 px-4 font-bold text-center">Khổ ngoài</th>
                <th className="py-3 px-4 font-bold">Kiểu viền</th>
                <th className="py-3 px-4 font-bold">Đơn giá in (VNĐ)</th>
                <th className="py-3 px-4 font-bold">Phụ phí Cán màng (VNĐ)</th>
                <th className="py-3 px-4 font-bold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-stone-300" />
                    <span>Không tìm thấy mẫu nào phù hợp với từ khóa tìm kiếm.</span>
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((tpl) => {
                  const wMm = tpl.photoSize?.widthMm || 60;
                  const hMm = tpl.photoSize?.heightMm || 90;
                  const ratio = wMm / hMm;
                  const thumbMaxW = 28, thumbMaxH = 38;
                  let tW: number, tH: number;
                  if (ratio > thumbMaxW / thumbMaxH) {
                    tW = thumbMaxW; tH = Math.max(8, Math.round(thumbMaxW / ratio));
                  } else {
                    tH = thumbMaxH; tW = Math.max(8, Math.round(thumbMaxH * ratio));
                  }

                  const isPhotoB = tpl.subSlotLayout?.startsWith('strip') || tpl.subSlotLayout === 'grid-2x2';
                  const cuts = tpl.subSlotLayout === 'strip-4' ? 4 : tpl.subSlotLayout === 'strip-3' ? 3 : tpl.subSlotLayout === 'strip-2' ? 2 : 4;
                  const patternCss = getTemplatePatternCss(tpl.borderPattern);
                  const hasTiers = tpl.priceTiers && tpl.priceTiers.length === 4;
                  const isExpanded = expandedTiers.has(tpl.id);

                  return (
                    <React.Fragment key={tpl.id}>
                      <tr className="hover:bg-stone-50/80 transition group align-top">
                        
                        {/* Cột 1: Thumbnail + Tên mẫu + Badge */}
                        <td className="py-3.5 px-5 align-top">
                          <div className="flex items-center gap-3">
                            {/* Mini Thumbnail */}
                            <div className="w-10 h-12 bg-stone-100 rounded-lg border border-stone-200/80 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                              <div
                                className="rounded-2xs border border-stone-300 overflow-hidden flex flex-col justify-between"
                                style={{
                                  width: `${tW}px`,
                                  height: `${tH}px`,
                                  backgroundColor: tpl.bgHex || (tpl.name.toLowerCase().includes('đen') ? '#18181b' : '#ffffff'),
                                  background: patternCss || tpl.bgHex || '#ffffff',
                                  padding: '1px'
                                }}
                              >
                                {isPhotoB ? (
                                  <div className={`w-full h-full ${tpl.subSlotLayout === 'grid-2x2' ? 'grid grid-cols-2 gap-0.5' : 'flex flex-col gap-0.5'}`}>
                                    {Array.from({ length: cuts }).map((_, i) => (
                                      <div key={i} className="flex-1 bg-[#d6cebf] rounded-2xs" />
                                    ))}
                                  </div>
                                ) : (
                                  <div className="w-full h-full bg-[#d6cebf] rounded-2xs" />
                                )}
                              </div>
                            </div>

                            {/* Info */}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-stone-900 text-xs">{tpl.name}</span>
                                {getCategoryBadge(tpl)}
                              </div>
                              <span className="text-[11px] text-stone-400 block mt-0.5 truncate max-w-xs">
                                {tpl.description || `${tpl.photoSize.widthMm}×${tpl.photoSize.heightMm} mm`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Cột 2: Kích thước */}
                        <td className="py-3.5 px-4 text-center text-stone-700 font-mono text-xs font-bold whitespace-nowrap align-top">
                          <div className="h-9 flex items-center justify-center">
                            {tpl.photoSize.widthMm} × {tpl.photoSize.heightMm} mm
                          </div>
                        </td>

                        {/* Cột 3: Kiểu viền */}
                        <td className="py-3.5 px-4 text-stone-600 text-xs align-top">
                          <div className="h-9 flex items-center">
                            {tpl.borderStyle === 'polaroid' 
                              ? `Polaroid (chân ${tpl.polaroidBottomMm || 12}mm)` 
                              : tpl.borderStyle === 'thin' 
                              ? `Viền mỏng ${tpl.borderWidthMm || 3}mm` 
                              : tpl.borderStyle === 'custom' 
                              ? 'Họa tiết trang trí' 
                              : tpl.borderStyle === 'asymmetric'
                              ? 'Lề sổ tay (14mm)'
                              : 'Tràn viền (Full bleed)'}
                          </div>
                        </td>

                        {/* Cột 4: Đơn giá in (VNĐ) — Input cùng kích thước chuẩn w-36 h-9 */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex flex-col items-start">
                            <div className="w-36 h-9 inline-flex items-center justify-between bg-white border border-stone-200 hover:border-stone-400 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/10 rounded-xl px-2.5 shadow-2xs transition">
                              <input
                                type="number"
                                step="100"
                                min="0"
                                value={tpl.customPrice || 0}
                                onChange={(e) => handleUpdatePrice(tpl.id, 'customPrice', parseInt(e.target.value) || 0)}
                                className="w-full font-mono font-black text-xs text-stone-900 bg-transparent border-none outline-none text-right pr-1"
                              />
                              <span className="text-[11px] text-stone-400 font-semibold select-none shrink-0">đ/ảnh</span>
                            </div>

                            {/* Nút bật/xem bậc thang giá */}
                            <div className="mt-1.5 h-5 flex items-center">
                              {hasTiers ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpandTiers(tpl.id)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition ${
                                    isExpanded 
                                      ? 'bg-amber-600 text-white shadow-2xs' 
                                      : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80'
                                  }`}
                                  title="Xem & sửa 4 mốc giá sỉ theo số lượng"
                                >
                                  <Layers className="w-2.5 h-2.5" />
                                  <span>4 mốc sỉ: {tpl.priceTiers![0]?.unitPrice.toLocaleString('vi-VN')}đ → {tpl.priceTiers![3]?.unitPrice.toLocaleString('vi-VN')}đ</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleTiers(tpl.id, true)}
                                  className="text-[10px] text-stone-500 hover:text-stone-900 font-semibold flex items-center gap-1 hover:underline"
                                  title="Thêm các mốc giảm giá khi khách in nhiều"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  <span>Thêm bậc thang sỉ</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Cột 5: Phụ phí cán màng (VNĐ) — Input cùng kích thước chuẩn w-36 h-9 */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex flex-col items-start">
                            <div className="w-36 h-9 inline-flex items-center justify-between bg-white border border-stone-200 hover:border-stone-400 focus-within:border-amber-600 focus-within:ring-2 focus-within:ring-amber-500/10 rounded-xl px-2.5 shadow-2xs transition">
                              <span className="text-[11px] text-amber-600 font-bold mr-1 shrink-0">+</span>
                              <input
                                type="number"
                                step="100"
                                min="0"
                                value={tpl.laminationPrice || 0}
                                onChange={(e) => handleUpdatePrice(tpl.id, 'laminationPrice', parseInt(e.target.value) || 0)}
                                className="w-full font-mono font-bold text-xs text-stone-900 bg-transparent border-none outline-none text-right pr-1"
                              />
                              <span className="text-[11px] text-stone-400 font-semibold select-none shrink-0">đ/ảnh</span>
                            </div>

                            {/* Ghi chú đồng bộ chiều cao với nút bậc thang ở cột 4 */}
                            <div className="mt-1.5 h-5 flex items-center">
                              <span className="text-[10px] text-stone-400 font-medium">Ép bóng / mờ</span>
                            </div>
                          </div>
                        </td>

                        {/* Cột 6: Thao tác (Sửa thông số & Xóa) */}
                        <td className="py-3.5 px-4 text-center align-top">
                          <div className="h-9 flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(tpl)}
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                              title={`Sửa thông số & viền mẫu "${tpl.name}"`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title={`Xóa mẫu "${tpl.name}" khỏi Kho mẫu & Bảng giá`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>

                      {/* Dòng mở rộng: Tự gõ 4 mốc giá bậc thang trực tiếp cho mẫu này */}
                      {isExpanded && hasTiers && (
                        <tr className="bg-amber-50/40 border-y border-amber-200/70 animate-in fade-in duration-150">
                          <td colSpan={6} className="py-3 px-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                <span className="text-xs font-bold text-amber-950">
                                  Bậc thang giá theo số lượng của mẫu "{tpl.name}":
                                </span>
                                <span className="text-[11px] text-amber-700">(Gõ trực tiếp giá theo từng mốc số lượng)</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleTiers(tpl.id, false)}
                                className="text-[10px] font-bold text-stone-500 hover:text-red-600 flex items-center gap-1 self-start sm:self-auto"
                                title="Tắt bậc thang, chỉ dùng 1 đơn giá cố định"
                              >
                                <X className="w-3 h-3" />
                                <span>Tắt bậc thang (dùng 1 giá duy nhất)</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2.5">
                              {/* Mốc 1: 1 - 10 ảnh */}
                              <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 shadow-2xs">
                                <span className="text-[10px] font-bold text-stone-500 block mb-1">Mốc 1: 1 – 10 ảnh</span>
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    step="100"
                                    min="0"
                                    value={tpl.priceTiers![0]?.unitPrice || 0}
                                    onChange={(e) => handleUpdateTemplateTier(tpl.id, 0, parseInt(e.target.value) || 0)}
                                    className="w-full font-mono font-black text-xs text-stone-900 outline-none"
                                  />
                                  <span className="text-[10px] text-stone-400 font-semibold">đ</span>
                                </div>
                              </div>

                              {/* Mốc 2: 11 - 40 ảnh */}
                              <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 shadow-2xs">
                                <span className="text-[10px] font-bold text-stone-500 block mb-1">Mốc 2: 11 – 40 ảnh</span>
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    step="100"
                                    min="0"
                                    value={tpl.priceTiers![1]?.unitPrice || 0}
                                    onChange={(e) => handleUpdateTemplateTier(tpl.id, 1, parseInt(e.target.value) || 0)}
                                    className="w-full font-mono font-black text-xs text-stone-900 outline-none"
                                  />
                                  <span className="text-[10px] text-stone-400 font-semibold">đ</span>
                                </div>
                              </div>

                              {/* Mốc 3: 41 - 140 ảnh */}
                              <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 shadow-2xs">
                                <span className="text-[10px] font-bold text-stone-500 block mb-1">Mốc 3: 41 – 140 ảnh</span>
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    step="100"
                                    min="0"
                                    value={tpl.priceTiers![2]?.unitPrice || 0}
                                    onChange={(e) => handleUpdateTemplateTier(tpl.id, 2, parseInt(e.target.value) || 0)}
                                    className="w-full font-mono font-black text-xs text-stone-900 outline-none"
                                  />
                                  <span className="text-[10px] text-stone-400 font-semibold">đ</span>
                                </div>
                              </div>

                              {/* Mốc 4: 141+ ảnh (Sỉ) */}
                              <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-300 shadow-2xs">
                                <span className="text-[10px] font-bold text-emerald-800 block mb-1">Mốc 4: 141+ ảnh (Sỉ)</span>
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    step="100"
                                    min="0"
                                    value={tpl.priceTiers![3]?.unitPrice || 0}
                                    onChange={(e) => handleUpdateTemplateTier(tpl.id, 3, parseInt(e.target.value) || 0)}
                                    className="w-full font-mono font-black text-xs text-emerald-950 outline-none bg-transparent"
                                  />
                                  <span className="text-[10px] text-emerald-600 font-bold">đ</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>

      </div>

      {/* Template Editor Modal for editing full template specs & per-template quantity tiers */}
      {isEditorModalOpen && (
        <TemplateEditorModal
          template={editingTemplate}
          onClose={() => setIsEditorModalOpen(false)}
          onSave={handleSaveFromModal}
        />
      )}
    </div>
  );
};
