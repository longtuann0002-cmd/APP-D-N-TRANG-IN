import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Minus, Check, ChevronLeft, ChevronRight, HelpCircle, Edit3, Tag } from 'lucide-react';
import { 
  PaperSizeId, 
  PaperConfig, 
  LayoutConfig, 
  MultiSizeDemand, 
  BorderStyle,
  Project,
  TemplateItem,
  Customer,
  PaperFinishType,
  LaminationType
} from '../../types';
import { PAPER_PRESETS, PHOTO_SIZE_PRESETS } from '../../core/constants';
import { computeLayout } from '../../core/layout/layoutEngine';
import { storageManager } from '../../core/storage/storageManager';
import { calculateOrderPrice } from '../../core/pricing/pricingEngine';

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

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
  initialCustomer?: Customer | null;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  initialCustomer
}) => {
  // Step 1: Khổ giấy
  const [paperSizeId, setPaperSizeId] = useState<PaperSizeId>('A4');
  const [isOtherPaperOpen, setIsOtherPaperOpen] = useState(false);
  const [customPaperW, setCustomPaperW] = useState(210);
  const [customPaperH, setCustomPaperH] = useState(297);

  // Step 2: Kiểu dàn và số ảnh
  const [layoutMode, setLayoutMode] = useState<'single' | 'multi'>('single');
  const [photoCount, setPhotoCount] = useState(6);
  const [allowRotation, setAllowRotation] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');

  // Chất liệu giấy & Cán màng
  const [paperFinish, setPaperFinish] = useState<PaperFinishType>('glossy');
  const [lamination, setLamination] = useState<LaminationType>('none');
  const [multiSizes, setMultiSizes] = useState<MultiSizeDemand[]>(() => {
    const tpls = storageManager.getTemplates();
    const tpl1 = tpls[0] || { id: 'default-1', name: 'Polaroid', photoSize: { widthMm: 60, heightMm: 90 }, borderStyle: 'polaroid' };
    const tpl2 = tpls[1] || tpl1;
    return [
      { 
        id: '1', 
        sizeId: `tpl-${tpl1.id}`, 
        name: tpl1.name, 
        widthMm: tpl1.photoSize.widthMm, 
        heightMm: tpl1.photoSize.heightMm, 
        count: 5,
        borderStyle: tpl1.borderStyle,
        borderWidthMm: tpl1.borderWidthMm,
        borderTopMm: tpl1.borderTopMm,
        polaroidBottomMm: tpl1.polaroidBottomMm,
        borderPattern: tpl1.borderPattern
      },
      { 
        id: '2', 
        sizeId: `tpl-${tpl2.id}`, 
        name: tpl2.name, 
        widthMm: tpl2.photoSize.widthMm, 
        heightMm: tpl2.photoSize.heightMm, 
        count: 2,
        borderStyle: tpl2.borderStyle,
        borderWidthMm: tpl2.borderWidthMm,
        borderTopMm: tpl2.borderTopMm,
        polaroidBottomMm: tpl2.polaroidBottomMm,
        borderPattern: tpl2.borderPattern
      },
    ];
  });

  // Step 3: Khổ ảnh
  const [sizeTab, setSizeTab] = useState<'standard' | 'template'>('standard');
  const [selectedPhotoPresetId, setSelectedPhotoPresetId] = useState<string>('6x9');
  const [isCustomSizeOpen, setIsCustomSizeOpen] = useState(false);
  const [customUnit, setCustomUnit] = useState<'mm' | 'cm' | 'inch'>('mm');
  const [customPhotoWMm, setCustomPhotoWMm] = useState(72);
  const [customPhotoHMm, setCustomPhotoHMm] = useState(86);
  const [customBorderMm, setCustomBorderMm] = useState(5);
  const [customBottomMm, setCustomBottomMm] = useState(13);
  const [customSizeName, setCustomSizeName] = useState('Vuông');
  const [savedCustomSizes, setSavedCustomSizes] = useState<Array<{id: string; name: string; w: number; h: number; border: number; bottom: number}>>([]);

  // Unit conversion helpers
  const toMm = (val: number, unit: 'mm' | 'cm' | 'inch') =>
    unit === 'cm' ? val * 10 : unit === 'inch' ? val * 25.4 : val;
  const fromMm = (val: number, unit: 'mm' | 'cm' | 'inch') =>
    unit === 'cm' ? +(val / 10).toFixed(2) : unit === 'inch' ? +(val / 25.4).toFixed(3) : val;

  // Display values in current unit
  const dispW = fromMm(customPhotoWMm, customUnit);
  const dispH = fromMm(customPhotoHMm, customUnit);
  const dispBorder = fromMm(customBorderMm, customUnit);
  const dispBottom = fromMm(customBottomMm, customUnit);

  // Derived: inner photo area
  const innerW = Math.max(1, customPhotoWMm - 2 * customBorderMm);
  const innerH = Math.max(1, customPhotoHMm - 2 * customBorderMm - customBottomMm);

  // Photos per A4 sheet with current custom size
  const a4W = 210, a4H = 297, a4Margin = 10;
  const printW = a4W - 2 * a4Margin;
  const printH = a4H - 2 * a4Margin;
  const colsPerSheet = customPhotoWMm > 0 ? Math.floor(printW / customPhotoWMm) : 1;
  const rowsPerSheet = customPhotoHMm > 0 ? Math.floor(printH / customPhotoHMm) : 1;
  const photosPerSheet = Math.max(1, colsPerSheet * rowsPerSheet);
  const usedPercent = Math.round((customPhotoWMm * customPhotoHMm * photosPerSheet) / (printW * printH) * 100);

  // Step 4: Viền ảnh & Mẫu in (loaded dynamically from Kho mẫu)
  const [availableTemplates, setAvailableTemplates] = useState<TemplateItem[]>(() => storageManager.getTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('polaroid-classic');
  const [borderStyle, setBorderStyle] = useState<BorderStyle>('polaroid');

  // Reload templates on modal open
  useEffect(() => {
    if (isOpen) {
      setAvailableTemplates(storageManager.getTemplates());
    }
  }, [isOpen]);

  const selectedTemplate = useMemo(() => {
    return availableTemplates.find(t => t.id === selectedTemplateId) || availableTemplates[0];
  }, [availableTemplates, selectedTemplateId]);

  // Derived dimensions and name based on selected preset/template
  const effectivePhotoDimensions = useMemo(() => {
    if (isCustomSizeOpen || selectedPhotoPresetId === '__custom__') {
      return {
        w: customPhotoWMm,
        h: customPhotoHMm,
        name: customSizeName.trim() || `${customPhotoWMm}x${customPhotoHMm}mm`
      };
    }
    if (selectedPhotoPresetId.startsWith('tpl-')) {
      const tplId = selectedPhotoPresetId.replace('tpl-', '');
      const tpl = availableTemplates.find(t => t.id === tplId);
      if (tpl) {
        return {
          w: tpl.photoSize.widthMm,
          h: tpl.photoSize.heightMm,
          name: tpl.name
        };
      }
    }
    const preset = PHOTO_SIZE_PRESETS.find(p => p.id === selectedPhotoPresetId);
    if (preset) {
      return {
        w: preset.widthMm,
        h: preset.heightMm,
        name: preset.name
      };
    }
    if (selectedTemplate && selectedTemplate.photoSize) {
      return {
        w: selectedTemplate.photoSize.widthMm,
        h: selectedTemplate.photoSize.heightMm,
        name: selectedTemplate.name
      };
    }
    return { w: 60, h: 90, name: '6x9' };
  }, [selectedPhotoPresetId, isCustomSizeOpen, customPhotoWMm, customPhotoHMm, customSizeName, availableTemplates, selectedTemplate]);

  const customPhotoW = effectivePhotoDimensions.w;
  const customPhotoH = effectivePhotoDimensions.h;

  // Preview page index
  const [previewPageIndex, setPreviewPageIndex] = useState(0);

  // Build draft configurations
  const paperConfig: PaperConfig = useMemo(() => ({
    sizeId: paperSizeId,
    customWidthMm: customPaperW,
    customHeightMm: customPaperH,
    orientation: 'portrait',
    margins: { top: 5, bottom: 5, left: 5, right: 5 },
    printerOffsetX: 0,
    printerOffsetY: 0
  }), [paperSizeId, customPaperW, customPaperH]);

  const layoutConfig: LayoutConfig = useMemo(() => {
    const effectiveBorderStyle = selectedTemplate?.borderStyle || borderStyle;
    const bWidth = selectedTemplate?.borderWidthMm !== undefined 
      ? selectedTemplate.borderWidthMm 
      : (effectiveBorderStyle === 'polaroid' ? 5 : effectiveBorderStyle === 'thin' ? 3 : 0);
    const bTop = selectedTemplate?.borderTopMm !== undefined
      ? selectedTemplate.borderTopMm
      : bWidth;
    const pBottom = selectedTemplate?.polaroidBottomMm !== undefined 
      ? selectedTemplate.polaroidBottomMm 
      : (effectiveBorderStyle === 'polaroid' ? 12 : 0);

    return {
      mode: layoutMode,
      photoPresetId: selectedPhotoPresetId,
      customWidthMm: customPhotoW,
      customHeightMm: customPhotoH,
      lockAspectRatio: true,
      aspectRatio: customPhotoW / customPhotoH,
      gapX: 0,
      gapY: 0,
      cropMode: 'fill',
      borderStyle: effectiveBorderStyle,
      borderWidthMm: bWidth,
      borderTopMm: bTop,
      borderLeftMm: selectedTemplate?.borderLeftMm,
      borderRightMm: selectedTemplate?.borderRightMm,
      borderBottomMm: selectedTemplate?.borderBottomMm,
      polaroidBottomMm: pBottom,
      cutLineStyle: 'solid',
      algorithm: layoutMode === 'multi' ? 'optimal-maxrects' : 'grid',
      allowRotation,
      preserveOrder: true,
      multiSizes,
      borderPattern: selectedTemplate?.borderPattern,
      subSlotLayout: selectedTemplate?.subSlotLayout || 'single',
      bgHex: selectedTemplate?.bgHex || '#ffffff',
      footerText: selectedTemplate?.footerText,
      paperFinish,
      lamination
    };
  }, [layoutMode, selectedPhotoPresetId, customPhotoW, customPhotoH, borderStyle, selectedTemplate, multiSizes, allowRotation, paperFinish, lamination]);

  // Capacity layout — fills a full sheet without photoCount limit, used ONLY for preview
  const capacityLayoutResult = useMemo(() => {
    return computeLayout(paperConfig, layoutConfig, []);
  }, [paperConfig, layoutConfig]);

  const previewPage = capacityLayoutResult.pages[0];
  const slotsPerPage = previewPage?.placedPhotos.length || 1;

  // Real-time layout computation for stats (respects photoCount)
  const layoutResult = useMemo(() => {
    return computeLayout(
      paperConfig,
      layoutConfig,
      [],
      layoutMode === 'single' ? photoCount : undefined
    );
  }, [paperConfig, layoutConfig, photoCount, layoutMode]);

  const currentPage = layoutResult.pages[previewPageIndex] || layoutResult.pages[0];

  // Selected photo preset details
  const currentPhotoPreset = PHOTO_SIZE_PRESETS.find(p => p.id === selectedPhotoPresetId);
  const currentPresetName = effectivePhotoDimensions.name;

  // Real-time pricing calculation based on Template custom price + per-template tiers + lamination
  const orderQty = layoutMode === 'single' ? photoCount : layoutResult.totalSlots;
  const currentPricing = useMemo(() => {
    return calculateOrderPrice({
      widthMm: customPhotoW,
      heightMm: customPhotoH,
      quantity: Math.max(1, orderQty),
      paperFinish,
      lamination,
      nameOrId: selectedPhotoPresetId === '__custom__' ? customSizeName : (selectedTemplate?.name || selectedPhotoPresetId),
      subSlotLayout: selectedTemplate?.subSlotLayout,
      customOverridePrice: selectedTemplate?.customPrice,
      priceTiers: selectedTemplate?.priceTiers
    });
  }, [customPhotoW, customPhotoH, orderQty, paperFinish, lamination, selectedPhotoPresetId, customSizeName, selectedTemplate]);

  // Helper to compute capacity for a given preset on paper
  const computePresetCapacity = (presetId: string, customPaperCfg?: PaperConfig) => {
    const pCfg = customPaperCfg || paperConfig;
    let pW = 60;
    let pH = 90;

    if (presetId.startsWith('tpl-')) {
      const tpl = availableTemplates.find(t => t.id === presetId.replace('tpl-', ''));
      if (tpl) {
        pW = tpl.photoSize.widthMm;
        pH = tpl.photoSize.heightMm;
      }
    } else if (presetId === '__custom__') {
      pW = customPhotoWMm;
      pH = customPhotoHMm;
    } else {
      const preset = PHOTO_SIZE_PRESETS.find(p => p.id === presetId);
      pW = preset?.widthMm || 60;
      pH = preset?.heightMm || 90;
    }

    const tempLayout: LayoutConfig = {
      ...layoutConfig,
      photoPresetId: presetId,
      customWidthMm: pW,
      customHeightMm: pH,
      aspectRatio: pW / pH
    };
    const res = computeLayout(pCfg, tempLayout, []);
    return res.pages[0]?.placedPhotos.length || 1;
  };

  const handleSelectTemplate = (tpl: TemplateItem) => {
    setSelectedTemplateId(tpl.id);
    setBorderStyle(tpl.borderStyle);
    setSelectedPhotoPresetId(`tpl-${tpl.id}`);
    setIsCustomSizeOpen(false);
    setSizeTab('template');

    const bWidth = tpl.borderWidthMm !== undefined ? tpl.borderWidthMm : (tpl.borderStyle === 'polaroid' ? 5 : 3);
    const bTop = tpl.borderTopMm !== undefined ? tpl.borderTopMm : bWidth;
    const pBottom = tpl.polaroidBottomMm !== undefined ? tpl.polaroidBottomMm : (tpl.borderStyle === 'polaroid' ? 12 : 0);

    const tempLayout: LayoutConfig = {
      ...layoutConfig,
      photoPresetId: `tpl-${tpl.id}`,
      customWidthMm: tpl.photoSize.widthMm,
      customHeightMm: tpl.photoSize.heightMm,
      aspectRatio: tpl.photoSize.widthMm / tpl.photoSize.heightMm,
      borderStyle: tpl.borderStyle,
      borderWidthMm: bWidth,
      borderTopMm: bTop,
      borderLeftMm: tpl.borderLeftMm,
      borderRightMm: tpl.borderRightMm,
      borderBottomMm: tpl.borderBottomMm,
      polaroidBottomMm: pBottom,
      borderPattern: tpl.borderPattern,
      subSlotLayout: tpl.subSlotLayout || 'single',
      bgHex: tpl.bgHex || '#ffffff',
      footerText: tpl.footerText
    };
    const res = computeLayout(paperConfig, tempLayout, []);
    setPhotoCount(res.pages[0]?.placedPhotos.length || 1);
  };

  const handleSelectPaperSize = (pId: PaperSizeId) => {
    setPaperSizeId(pId);
    setIsOtherPaperOpen(false);
    const nextPaper = { ...paperConfig, sizeId: pId };
    const cap = computePresetCapacity(selectedPhotoPresetId, nextPaper);
    setPhotoCount(cap);
  };

  const handleCreate = () => {
    // Fill the full sheet with slots so all slots (e.g. 36 for Thẻ 3x4) exist on the paper
    const finalPhotoCount = Math.max(photoCount, slotsPerPage);
    const finalLayoutResult = computeLayout(
      paperConfig,
      layoutConfig,
      [],
      finalPhotoCount
    );

    const newProject: Project = {
      id: 'proj-' + Date.now(),
      name: initialCustomer
        ? `Đơn in - ${initialCustomer.name} - ${currentPresetName}`
        : `Đơn in ${new Date().toLocaleDateString('vi-VN')} - ${currentPresetName}`,
      customerId: initialCustomer?.id,
      customerName: initialCustomer?.name,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photos: [],
      paperConfig,
      paperFinish,
      lamination,
      layoutConfig: {
        ...layoutConfig,
        paperFinish,
        lamination
      },
      pages: finalLayoutResult.pages,
      totalPhotosCount: finalLayoutResult.totalSlots
    };

    onCreateProject(newProject);
    onClose();
  };

  const handleUseCustomSize = () => {
    setSelectedPhotoPresetId('__custom__');
  };

  const handleSaveCustomSize = () => {
    const name = customSizeName.trim() || `${customPhotoWMm}x${customPhotoHMm}mm`;
    setSavedCustomSizes(prev => [
      ...prev.filter(s => !(s.w === customPhotoWMm && s.h === customPhotoHMm)),
      { id: `custom-${Date.now()}`, name, w: customPhotoWMm, h: customPhotoHMm, border: customBorderMm, bottom: customBottomMm }
    ]);
    setSelectedPhotoPresetId('__custom__');
    alert(`Đã lưu khổ "${name}" vào danh sách khổ riêng!`);
  };

  const handleAddMultiSize = () => {
    const newId = String(Date.now());
    const firstTpl = availableTemplates[0];
    setMultiSizes([
      ...multiSizes,
      firstTpl
        ? { 
            id: newId, 
            sizeId: `tpl-${firstTpl.id}`, 
            name: firstTpl.name, 
            widthMm: firstTpl.photoSize.widthMm, 
            heightMm: firstTpl.photoSize.heightMm, 
            count: 2,
            borderStyle: firstTpl.borderStyle,
            borderWidthMm: firstTpl.borderWidthMm,
            borderTopMm: firstTpl.borderTopMm,
            polaroidBottomMm: firstTpl.polaroidBottomMm,
            borderPattern: firstTpl.borderPattern
          }
        : { id: newId, sizeId: '10x15', name: '10x15', widthMm: 100, heightMm: 150, count: 2, borderStyle: 'none' }
    ]);
  };

  const handleUpdateMultiSize = (id: string, updates: Partial<MultiSizeDemand>) => {
    setMultiSizes(multiSizes.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        if (updates.sizeId) {
          if (updates.sizeId.startsWith('tpl-')) {
            const tplId = updates.sizeId.replace('tpl-', '');
            const tpl = availableTemplates.find(t => t.id === tplId);
            if (tpl) {
              updated.name = tpl.name;
              updated.widthMm = tpl.photoSize.widthMm;
              updated.heightMm = tpl.photoSize.heightMm;
              updated.borderStyle = tpl.borderStyle;
              updated.borderWidthMm = tpl.borderWidthMm;
              updated.borderTopMm = tpl.borderTopMm;
              updated.polaroidBottomMm = tpl.polaroidBottomMm;
              updated.borderPattern = tpl.borderPattern;
            }
          } else {
            const preset = PHOTO_SIZE_PRESETS.find(p => p.id === updates.sizeId);
            if (preset) {
              updated.name = preset.name;
              updated.widthMm = preset.widthMm;
              updated.heightMm = preset.heightMm;
              updated.borderStyle = 'none';
            }
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const handleRemoveMultiSize = (id: string) => {
    if (multiSizes.length <= 1) return;
    setMultiSizes(multiSizes.filter(item => item.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-0 md:p-3 select-none overscroll-contain">
      <div className="bg-white rounded-none md:rounded-3xl shadow-2xl border-0 md:border border-stone-200/90 w-full max-w-6xl h-full md:h-[94vh] flex flex-col overflow-hidden animate-in fade-in duration-150 overscroll-contain">
        
        {/* Header */}
        <div className="px-4 md:px-7 pt-3 md:pt-5 pb-2 flex items-center justify-between shrink-0 border-b border-stone-100 md:border-b-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg md:text-xl font-extrabold text-stone-900 tracking-tight">Tạo đơn mới</h2>
            {initialCustomer && (
              <span className="text-xs bg-amber-50 text-amber-800 font-semibold px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
                <span>👤</span>
                <span className="truncate max-w-[140px]">Khách: <strong>{initialCustomer.name}</strong></span>
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Tab Switcher: Cấu hình vs Xem trước */}
        <div className="md:hidden flex items-center bg-stone-100 p-1 mx-4 mt-2 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('form')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition text-center ${
              mobileTab === 'form' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
            }`}
          >
            ⚙️ Cấu hình ({currentPresetName})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition text-center ${
              mobileTab === 'preview' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-500'
            }`}
          >
            👁️ Xem trước ({slotsPerPage} ô/tờ)
          </button>
        </div>

        {/* Modal Body: 2 Columns on desktop, Tabbed on mobile */}
        <div className="flex-1 flex overflow-hidden px-4 md:px-7 py-3 gap-6 min-h-0 flex-col md:flex-row">
          
          {/* Left Column: 4 Steps */}
          <div className={`${mobileTab === 'form' ? 'block' : 'hidden'} md:block w-full md:w-1/2 overflow-y-auto overscroll-contain space-y-5 pr-0 md:pr-3`}>
            
            {/* Step 1: Khổ giấy */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold text-stone-900">Khổ giấy</span>
              </div>

              {/* Single Pill Container matching screenshot */}
              <div className="border border-stone-200 rounded-full p-1 inline-flex items-center gap-1 w-full justify-between">
                {(['A4', 'A5', '10x15'] as PaperSizeId[]).map((pId) => {
                  const isSelected = paperSizeId === pId && !isOtherPaperOpen;
                  return (
                    <button
                      key={pId}
                      type="button"
                      onClick={() => handleSelectPaperSize(pId)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-full transition text-center ${
                        isSelected
                          ? 'bg-stone-900 text-white shadow-xs'
                          : 'text-stone-700 hover:text-stone-900'
                      }`}
                    >
                      {pId === '10x15' ? '10x15' : pId}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setIsOtherPaperOpen(!isOtherPaperOpen)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-full transition text-center ${
                    isOtherPaperOpen || !['A4', 'A5', '10x15'].includes(paperSizeId)
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  Khác
                </button>
              </div>

              {isOtherPaperOpen && (
                <div className="mt-2 p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center gap-2 text-xs">
                  <select
                    value={paperSizeId}
                    onChange={(e) => handleSelectPaperSize(e.target.value as PaperSizeId)}
                    className="flex-1 bg-white border border-stone-200 rounded-lg p-1.5 font-bold"
                  >
                    <option value="A3">A3 (297x420 mm)</option>
                    <option value="13x18">13x18 cm</option>
                    <option value="15x20">15x20 cm</option>
                    <option value="20x30">20x30 cm</option>
                    <option value="custom">Tùy chỉnh mm...</option>
                  </select>
                </div>
              )}
            </div>

            {/* Step 2: Kiểu dàn và số ảnh */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold text-stone-900">Kiểu dàn và số ảnh</span>
              </div>

              {/* Pill Container switch */}
              <div className="border border-stone-200 rounded-full p-1 inline-flex items-center gap-1 w-full mb-3">
                <button
                  type="button"
                  onClick={() => setLayoutMode('single')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-full transition text-center ${
                    layoutMode === 'single'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  Một khổ
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('multi')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-full transition text-center ${
                    layoutMode === 'multi'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  Nhiều khổ chung tờ
                </button>
              </div>

              {layoutMode === 'single' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-800">Số ảnh cần in</span>
                    
                    {/* Stepper with circular minus and plus */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPhotoCount(Math.max(1, photoCount - 1))}
                        className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center font-bold transition active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold text-stone-900 w-6 text-center">{photoCount}</span>
                      <button
                        type="button"
                        onClick={() => setPhotoCount(photoCount + 1)}
                        className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center font-bold transition active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subtitle matching screenshot */}
                  <p className="text-[11px] text-stone-400">
                    Mỗi tờ {paperSizeId} xếp được {slotsPerPage} ô khổ {currentPresetName}. Thêm ảnh sau cũng được.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {multiSizes.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200 text-xs">
                      <span className="font-bold text-stone-500 w-14">Khổ {idx + 1}</span>
                      <select
                        value={item.sizeId}
                        onChange={(e) => handleUpdateMultiSize(item.id, { sizeId: e.target.value })}
                        className="flex-1 bg-white border border-stone-200 rounded-lg py-1 px-2 font-medium"
                      >
                        {availableTemplates.map((tpl) => {
                          const dimStr = `${tpl.photoSize.widthMm}×${tpl.photoSize.heightMm}`;
                          const showDim = !tpl.name.includes(dimStr) && !tpl.name.includes(`${tpl.photoSize.widthMm}x${tpl.photoSize.heightMm}`);
                          return (
                            <option key={`tpl-${tpl.id}`} value={`tpl-${tpl.id}`}>
                              {tpl.name} {showDim ? `(${dimStr} mm)` : ''}
                            </option>
                          );
                        })}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateMultiSize(item.id, { count: Math.max(1, item.count - 1) })}
                          className="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold">{item.count}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateMultiSize(item.id, { count: item.count + 1 })}
                          className="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                      {multiSizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMultiSize(item.id)}
                          className="p-1 text-stone-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddMultiSize}
                    className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 py-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm khổ ảnh</span>
                  </button>
                </div>
              )}

              {/* Tự động xoay ảnh để tiết kiệm giấy (Áp dụng cả Một khổ và Nhiều khổ) */}
              <div className="flex items-center justify-between p-2.5 bg-stone-50 rounded-xl border border-stone-200 mt-2.5">
                <div className="pr-2">
                  <span className="text-xs font-semibold text-stone-700 block">Tự động xoay ảnh để tối ưu phủ đầy trang</span>
                  <p className="text-[11px] text-stone-500">Bật để dàn xen kẽ dọc/ngang tiết kiệm giấy tối đa (Photobooth, Polaroid...)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowRotation}
                    onChange={(e) => setAllowRotation(e.target.checked)}
                    className="w-4 h-4 text-stone-900 rounded focus:ring-stone-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Step 3: Mẫu khung & Khổ in của tiệm */}
            {layoutMode === 'single' && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center">
                      3
                    </span>
                    <span className="text-xs font-bold text-stone-900">Mẫu khung & Khổ in của tiệm</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium">
                    {availableTemplates.length} mẫu sẵn sàng
                  </span>
                </div>

                {/* Grid Mẫu của tiệm: Trực quan, chọn 1 lần ăn ngay khổ + viền + giá */}
                <div className="grid grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1 mb-2.5">
                  {availableTemplates.map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;
                    const wMm = tpl.photoSize?.widthMm || 60;
                    const hMm = tpl.photoSize?.heightMm || 90;
                    const ratio = wMm / hMm;

                    // Fit inside 56×84 px box while preserving aspect ratio (supports tall strips)
                    const maxW = 56, maxH = 84;
                    let cardW: number, cardH: number;
                    if (ratio > maxW / maxH) {
                      cardW = maxW;
                      cardH = Math.max(12, Math.round(maxW / ratio));
                    } else {
                      cardH = maxH;
                      cardW = Math.max(12, Math.round(maxH * ratio));
                    }

                    const isPhotobooth = tpl.subSlotLayout?.startsWith('strip') || tpl.subSlotLayout === 'grid-2x2' || tpl.name.toLowerCase().includes('photobooth');
                    const cuts = tpl.subSlotLayout === 'strip-4' ? 4 
                      : tpl.subSlotLayout === 'strip-3' ? 3 
                      : tpl.subSlotLayout === 'strip-2' ? 2 
                      : tpl.subSlotLayout === 'grid-2x2' ? 4 
                      : (tpl.name.includes('4') ? 4 : (tpl.name.includes('2') ? 2 : 3));

                    const bgColor = tpl.bgHex || (tpl.name.toLowerCase().includes('đen') ? '#18181b' : '#ffffff');
                    const patternCss = getTemplatePatternCss(tpl.borderPattern);

                    const renderCardAperture = () => {
                      if (tpl.customFrameImage) {
                        return (
                          <div
                            className="rounded-xs border border-stone-300 shadow-xs relative overflow-hidden"
                            style={{
                              width: `${cardW}px`,
                              height: `${cardH}px`,
                              backgroundImage: `url(${tpl.customFrameImage})`,
                              backgroundSize: '100% 100%'
                            }}
                          />
                        );
                      }

                      // 1. Photobooth (3 cuts, 4 cuts, 2 cuts, grid-2x2)
                      if (isPhotobooth) {
                        const padTop = Math.max(2, Math.round(cardH * (tpl.borderTopMm || 3) / hMm));
                        const padSides = Math.max(2, Math.round(cardW * (tpl.borderWidthMm || 3) / wMm));
                        const padBottom = Math.max(5, Math.round(cardH * (tpl.polaroidBottomMm || 14) / hMm));

                        return (
                          <div
                            className="border border-stone-300 shadow-xs relative overflow-hidden flex flex-col rounded-xs shrink-0"
                            style={{
                              width: `${cardW}px`,
                              height: `${cardH}px`,
                              backgroundColor: bgColor,
                              paddingLeft: `${padSides}px`,
                              paddingRight: `${padSides}px`,
                              paddingTop: `${padTop}px`,
                              paddingBottom: `${padBottom}px`,
                              boxSizing: 'border-box'
                            }}
                          >
                            <div className={`w-full flex-1 ${tpl.subSlotLayout === 'grid-2x2' ? 'grid grid-cols-2 gap-0.5' : 'flex flex-col justify-between gap-0.5'}`}>
                              {Array.from({ length: cuts }).map((_, idx) => (
                                <div
                                  key={idx}
                                  className="flex-1 bg-[#d6cebf] border border-[#c5bdaf] rounded-2xs flex items-center justify-center overflow-hidden"
                                >
                                  <span className="text-[6.5px] font-bold text-stone-600">#{idx + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      // 2. Custom Pattern (Caro, Scotland, Snow, Candy)
                      if (tpl.borderStyle === 'custom' || patternCss) {
                        const padTop = Math.max(2, Math.round(cardH * (tpl.borderTopMm || 4) / hMm));
                        const padSides = Math.max(2, Math.round(cardW * (tpl.borderWidthMm || 4) / wMm));
                        const padBottom = Math.max(2, Math.round(cardH * (tpl.borderBottomMm || tpl.borderWidthMm || 4) / hMm));

                        return (
                          <div
                            className="border border-stone-300 shadow-xs relative overflow-hidden rounded-xs shrink-0"
                            style={{
                              width: `${cardW}px`,
                              height: `${cardH}px`,
                              background: patternCss || bgColor,
                              paddingLeft: `${padSides}px`,
                              paddingRight: `${padSides}px`,
                              paddingTop: `${padTop}px`,
                              paddingBottom: `${padBottom}px`,
                              boxSizing: 'border-box'
                            }}
                          >
                            <div className="w-full h-full bg-[#d6cebf] border border-[#c5bdaf] rounded-2xs" />
                          </div>
                        );
                      }

                      // 3. Asymmetric (Viền 1 cạnh lề sổ tay)
                      if (tpl.borderStyle === 'asymmetric') {
                        const padLeft = Math.max(6, Math.round(cardW * (tpl.borderLeftMm || 14) / wMm));
                        const padRight = Math.max(2, Math.round(cardW * (tpl.borderRightMm || 3) / wMm));
                        const padTop = Math.max(2, Math.round(cardH * (tpl.borderTopMm || 3) / hMm));
                        const padBottom = Math.max(2, Math.round(cardH * (tpl.borderBottomMm || 3) / hMm));

                        return (
                          <div
                            className="border border-stone-300 shadow-xs relative overflow-hidden rounded-xs shrink-0"
                            style={{
                              width: `${cardW}px`,
                              height: `${cardH}px`,
                              backgroundColor: bgColor,
                              paddingLeft: `${padLeft}px`,
                              paddingRight: `${padRight}px`,
                              paddingTop: `${padTop}px`,
                              paddingBottom: `${padBottom}px`,
                              boxSizing: 'border-box'
                            }}
                          >
                            <div className="w-full h-full bg-[#d6cebf] border border-[#c5bdaf] rounded-2xs" />
                          </div>
                        );
                      }

                      // 4. Polaroid
                      if (tpl.borderStyle === 'polaroid') {
                        const bWmm = tpl.borderWidthMm !== undefined ? tpl.borderWidthMm : 5;
                        const bTopmm = tpl.borderTopMm !== undefined ? tpl.borderTopMm : bWmm;
                        const bBottomMm = tpl.polaroidBottomMm !== undefined ? tpl.polaroidBottomMm : 12;
                        const padSides = Math.max(2, Math.round(cardW * bWmm / wMm));
                        const padTop = Math.max(2, Math.round(cardH * bTopmm / hMm));
                        const padBottom = Math.max(5, Math.round(cardH * (bWmm + bBottomMm) / hMm));

                        return (
                          <div
                            className="border border-stone-300 shadow-xs relative overflow-hidden rounded-xs shrink-0"
                            style={{
                              width: `${cardW}px`,
                              height: `${cardH}px`,
                              backgroundColor: bgColor,
                              paddingLeft: `${padSides}px`,
                              paddingRight: `${padSides}px`,
                              paddingTop: `${padTop}px`,
                              paddingBottom: `${padBottom}px`,
                              boxSizing: 'border-box'
                            }}
                          >
                            <div className="w-full h-full bg-[#d6cebf] border border-[#c5bdaf] rounded-2xs" />
                          </div>
                        );
                      }

                      // 5. Thin border (Viền mỏng 3mm)
                      if (tpl.borderStyle === 'thin') {
                        const bW = Math.max(2, Math.round(cardW * (tpl.borderWidthMm || 3) / wMm));
                        return (
                          <div
                            className="border border-stone-300 shadow-xs relative overflow-hidden rounded-xs shrink-0"
                            style={{
                              width: `${cardW}px`,
                              height: `${cardH}px`,
                              backgroundColor: bgColor,
                              padding: `${bW}px`,
                              boxSizing: 'border-box'
                            }}
                          >
                            <div className="w-full h-full bg-[#d6cebf] border border-[#c5bdaf] rounded-2xs" />
                          </div>
                        );
                      }

                      // 6. None (Không viền / Full bleed)
                      return (
                        <div
                          className="bg-[#d6cebf] border border-[#c4bcac] shadow-xs rounded-2xs flex-shrink-0"
                          style={{ width: `${cardW}px`, height: `${cardH}px` }}
                        />
                      );
                    };

                    return (
                      <div
                        key={tpl.id}
                        onClick={() => handleSelectTemplate(tpl)}
                        className={`rounded-2xl border p-2.5 cursor-pointer transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-2 border-stone-900 bg-white shadow-xs'
                            : 'border-stone-200/90 bg-white hover:border-stone-300'
                        }`}
                      >
                        {/* Checkmark badge */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center z-10 shadow-xs">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}

                        {/* Thumbnail preview — always correct aspect ratio & authentic frame look */}
                        <div className="w-full bg-[#e7e5e4]/50 rounded-xl flex items-center justify-center mb-2 overflow-hidden" style={{ height: '92px' }}>
                          {renderCardAperture()}
                        </div>

                        {/* Template name & Price */}
                        <div className="flex items-center justify-between px-0.5 mt-0.5">
                          <span className="text-xs font-bold text-stone-900 block truncate flex-1" title={tpl.name}>
                            {tpl.name}
                          </span>
                          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/60 shrink-0 ml-1">
                            {(tpl.customPrice || 2000).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Thông tin mẫu đang chọn */}
                <div className="mb-3 p-2.5 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-emerald-950 font-bold">{currentPresetName}</span>
                    <span className="text-emerald-700 font-mono text-[11px]">({customPhotoW}×{customPhotoH} mm)</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-emerald-800 text-[11px]">
                      {selectedTemplate.subSlotLayout === 'strip-4'
                        ? 'Dải 4 ảnh Photobooth'
                        : selectedTemplate.subSlotLayout === 'strip-3'
                        ? 'Dải 3 ảnh Photobooth'
                        : selectedTemplate.subSlotLayout === 'strip-2'
                        ? 'Dải 2 ảnh Photobooth'
                        : selectedTemplate.subSlotLayout === 'grid-2x2'
                        ? 'Lưới 4 ảnh 2×2 Photobooth'
                        : selectedTemplate.borderStyle === 'polaroid' 
                        ? `Polaroid chân ${selectedTemplate.polaroidBottomMm || 12}mm` 
                        : selectedTemplate.borderStyle === 'thin' 
                        ? 'Viền mỏng đều' 
                        : selectedTemplate.borderStyle === 'asymmetric'
                        ? 'Viền 1 cạnh (Lề sổ tay)'
                        : selectedTemplate.borderStyle === 'custom' 
                        ? 'Viền hoa văn' 
                        : 'Không viền (Full bleed)'}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-emerald-800 text-xs block">
                      {currentPricing.unitPrice.toLocaleString('vi-VN')} đ/ảnh
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold block">
                      {currentPricing.tierSummary}
                    </span>
                  </div>
                </div>

                {/* Link Nhập/Đóng khổ tùy chỉnh */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCustomSizeOpen(!isCustomSizeOpen)}
                    className="flex items-center gap-1.5 text-xs font-bold text-stone-800 hover:text-stone-900"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isCustomSizeOpen ? '✎ Đóng khổ tùy chỉnh' : '✎ Nhập khổ tùy chỉnh (mm, cm, inch)'}</span>
                  </button>

                  {isCustomSizeOpen && (
                    <div className="mt-2 p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                      
                      {/* Unit Switch Pill */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-500 font-bold">Đơn vị</span>
                        <div className="flex border border-stone-300 rounded-full overflow-hidden text-[11px] font-bold">
                          {(['mm', 'cm', 'inch'] as const).map(u => (
                            <button
                              key={u}
                              type="button"
                              onClick={() => setCustomUnit(u)}
                              className={`px-3 py-1 transition ${customUnit === u ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 4 Input Fields */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Rộng */}
                        <div>
                          <label className="text-[10px] text-stone-500 font-bold flex items-center gap-1 mb-1">
                            <span className="text-stone-700">↔</span> Rộng
                          </label>
                          <div className="flex items-center bg-white border border-stone-200 rounded-lg overflow-hidden">
                            <input
                              type="number"
                              value={dispW}
                              step={customUnit === 'inch' ? 0.01 : customUnit === 'cm' ? 0.1 : 1}
                              min={1}
                              onChange={(e) => setCustomPhotoWMm(Math.max(1, toMm(parseFloat(e.target.value) || 0, customUnit)))}
                              className="flex-1 p-1.5 text-xs font-bold bg-transparent border-none outline-none w-0"
                            />
                            <span className="pr-2 text-[10px] text-stone-400 font-semibold">{customUnit}</span>
                          </div>
                        </div>

                        {/* Cao */}
                        <div>
                          <label className="text-[10px] text-stone-500 font-bold flex items-center gap-1 mb-1">
                            <span className="text-stone-700">↕</span> Cao
                          </label>
                          <div className="flex items-center bg-white border border-stone-200 rounded-lg overflow-hidden">
                            <input
                              type="number"
                              value={dispH}
                              step={customUnit === 'inch' ? 0.01 : customUnit === 'cm' ? 0.1 : 1}
                              min={1}
                              onChange={(e) => setCustomPhotoHMm(Math.max(1, toMm(parseFloat(e.target.value) || 0, customUnit)))}
                              className="flex-1 p-1.5 text-xs font-bold bg-transparent border-none outline-none w-0"
                            />
                            <span className="pr-2 text-[10px] text-stone-400 font-semibold">{customUnit}</span>
                          </div>
                        </div>

                        {/* Viền đều */}
                        <div>
                          <label className="text-[10px] text-stone-500 font-bold flex items-center gap-1 mb-1">
                            <span className="text-stone-700">▢</span> Viền đều
                          </label>
                          <div className="flex items-center bg-white border border-stone-200 rounded-lg overflow-hidden">
                            <input
                              type="number"
                              value={dispBorder}
                              step={customUnit === 'inch' ? 0.01 : customUnit === 'cm' ? 0.1 : 1}
                              min={0}
                              onChange={(e) => setCustomBorderMm(Math.max(0, toMm(parseFloat(e.target.value) || 0, customUnit)))}
                              className="flex-1 p-1.5 text-xs font-bold bg-transparent border-none outline-none w-0"
                            />
                            <span className="pr-2 text-[10px] text-stone-400 font-semibold">{customUnit}</span>
                          </div>
                        </div>

                        {/* Thêm ở chân */}
                        <div>
                          <label className="text-[10px] text-stone-500 font-bold flex items-center gap-1 mb-1">
                            <span className="text-stone-700">⤓</span> Chân thêm
                          </label>
                          <div className="flex items-center bg-white border border-stone-200 rounded-lg overflow-hidden">
                            <input
                              type="number"
                              value={dispBottom}
                              step={customUnit === 'inch' ? 0.01 : customUnit === 'cm' ? 0.1 : 1}
                              min={0}
                              onChange={(e) => setCustomBottomMm(Math.max(0, toMm(parseFloat(e.target.value) || 0, customUnit)))}
                              className="flex-1 p-1.5 text-xs font-bold bg-transparent border-none outline-none w-0"
                            />
                            <span className="pr-2 text-[10px] text-stone-400 font-semibold">{customUnit}</span>
                          </div>
                        </div>
                      </div>

                      {/* Live Preview Row: mini Polaroid card + text summary */}
                      <div className="flex items-stretch gap-3 py-1">
                        {/* Polaroid mini card preview */}
                        <div className="flex-shrink-0 flex items-center justify-center">
                          {(() => {
                            const scale = 2.2;
                            const cardW = Math.min(60, customPhotoWMm * scale);
                            const cardH = Math.min(90, customPhotoHMm * scale);
                            const brd = customBorderMm * scale;
                            const bot = customBottomMm * scale;
                            const imgW = Math.max(2, cardW - 2 * brd);
                            const imgH = Math.max(2, cardH - 2 * brd - bot);
                            return (
                              <div
                                className="bg-white shadow border border-stone-200 rounded-sm relative flex flex-col overflow-hidden"
                                style={{ width: `${cardW}px`, height: `${cardH}px`, padding: `${brd}px` }}
                              >
                                <div
                                  className="bg-[#d6cebf] rounded-xs flex-shrink-0"
                                  style={{ width: `${imgW}px`, height: `${imgH}px` }}
                                />
                                {bot > 1 && (
                                  <div style={{ height: `${bot}px` }} className="flex items-center justify-center">
                                    <div className="w-4 h-0.5 bg-stone-300 rounded-full" />
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Text summary */}
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-black text-stone-900 leading-tight">
                            {customPhotoWMm}x{customPhotoHMm} mm
                          </p>
                          <p className="text-[11px] text-stone-600 leading-tight">
                            Ảnh {innerW}x{innerH} mm trong viền
                          </p>
                          <p className="text-[11px] text-stone-600 leading-tight">
                            {photosPerSheet} ảnh mỗi tờ A4
                          </p>
                          <p className="text-[10px] text-stone-400 italic leading-tight">
                            Tờ in đổi theo ngay khi bạn nhập.
                          </p>
                        </div>
                      </div>

                      {/* Tên khổ input */}
                      <div>
                        <label className="text-[10px] text-stone-500 font-bold flex items-center gap-1 mb-1">
                          <Tag className="w-3 h-3" /> Tên khổ
                        </label>
                        <div className="flex items-center bg-white border border-stone-200 rounded-lg overflow-hidden gap-1 px-2">
                          <input
                            type="text"
                            value={customSizeName}
                            onChange={(e) => setCustomSizeName(e.target.value)}
                            placeholder="Để trống, app đặt theo kích thước"
                            className="flex-1 py-1.5 text-xs font-semibold bg-transparent border-none outline-none text-stone-800 placeholder:text-stone-300"
                          />
                        </div>
                        <p className="text-[10px] text-stone-400 mt-0.5 ml-0.5">ⓘ Để trống, app đặt tên theo kích thước</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleUseCustomSize}
                          className="flex-1 py-2 bg-stone-900 text-white text-xs font-bold rounded-full hover:bg-stone-700 transition active:scale-95"
                        >
                          Dùng khổ này
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCustomSize}
                          className="flex-1 py-2 bg-white border border-stone-300 text-stone-700 text-xs font-bold rounded-full hover:bg-stone-50 transition active:scale-95"
                        >
                          Lưu thành khổ riêng
                        </button>
                      </div>

                      {/* Usage note if custom is active */}
                      {selectedPhotoPresetId === '__custom__' && (
                        <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 font-semibold flex items-center gap-1.5">
                          <Check className="w-3 h-3" /> Đang dùng khổ tùy chỉnh này
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Chất liệu giấy & Cán màng (Ép plastic) */}
            <div className="pt-3 border-t border-stone-200/80">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center">
                  4
                </span>
                <span className="text-xs font-bold text-stone-900">Chất liệu giấy & Ép plastic / Cán màng</span>
              </div>

              {/* Chất liệu giấy */}
              <div className="mb-3">
                <div className="text-[11px] font-bold text-stone-600 mb-1.5 flex items-center justify-between">
                  <span>Chất liệu giấy in ảnh:</span>
                  <span className="text-[10px] text-stone-400 font-normal">Cùng đơn giá</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaperFinish('glossy')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                      paperFinish === 'glossy'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span>Giấy bóng (Glossy)</span>
                    {paperFinish === 'glossy' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperFinish('silk')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                      paperFinish === 'silk'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span>Giấy lụa (Silk/Satin)</span>
                    {paperFinish === 'silk' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>
                </div>
              </div>

              {/* Ép plastic / Cán màng */}
              <div className="mb-2">
                <div className="text-[11px] font-bold text-stone-600 mb-1.5 flex items-center justify-between">
                  <span>Ép plastic / Cán màng bảo vệ:</span>
                  <span className="text-[10px] text-stone-400 font-normal">
                    {orderQty >= 50 ? 'Mốc ≥ 50 ảnh (ưu đãi)' : 'Mốc < 50 ảnh'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLamination('none')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition text-center ${
                      lamination === 'none'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="truncate">Không cán</div>
                    <div className={`text-[10px] font-normal ${lamination === 'none' ? 'text-stone-300' : 'text-stone-400'}`}>0 đ</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLamination('plastic_matte')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition text-center ${
                      lamination === 'plastic_matte'
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="truncate">Ép plastic / Cán màng</div>
                    <div className={`text-[10px] font-normal ${lamination === 'plastic_matte' ? 'text-amber-300 font-bold' : 'text-stone-500'}`}>
                      +{orderQty >= 50 ? '300' : '500'} đ/ảnh
                    </div>
                  </button>
                </div>
              </div>

              {/* Ghi chú cán màng */}
              <div className="p-2.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-[11px] text-amber-900 flex items-start gap-2 mb-3">
                <span className="shrink-0 text-sm">💡</span>
                <div>
                  <strong>Lưu ý nhỏ:</strong> Chỉ nên chọn cán màng trên nền giấy bóng để màu sắc và độ bám dính đạt chuẩn nhất.
                </div>
              </div>

              {/* Bảng tính đơn giá theo mốc số lượng & tổng tiền */}
              <div className="p-3 bg-stone-100/90 rounded-2xl border border-stone-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Đơn giá in ({currentPricing.tierSummary}):</span>
                  <span className="font-bold text-stone-900">{currentPricing.baseUnitPrice.toLocaleString('vi-VN')} đ/ảnh</span>
                </div>
                {currentPricing.laminationSurcharge > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-stone-600">Phụ phí cán màng:</span>
                    <span className="font-bold text-amber-700">+{currentPricing.laminationSurcharge.toLocaleString('vi-VN')} đ/ảnh</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-stone-900 block">
                      Tổng tiền tạm tính:
                    </span>
                    <span className="text-[10px] text-stone-500">
                      Đơn giá: {currentPricing.unitPrice.toLocaleString('vi-VN')} đ × {orderQty} ảnh
                    </span>
                  </div>
                  <span className="text-base font-black text-emerald-700">
                    {currentPricing.totalPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: "Xem trước" Panel */}
          <div className={`${mobileTab === 'preview' ? 'flex' : 'hidden'} md:flex w-full md:w-1/2 bg-[#ededec] rounded-3xl p-4 md:p-5 flex-col shrink-0 min-h-0 overflow-y-auto overscroll-contain`}>

            {/* Header: Xem trước + Pagination */}
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-xs font-bold text-stone-800">Xem trước</span>
              <div className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold">
                <button
                  disabled={previewPageIndex === 0}
                  onClick={() => setPreviewPageIndex(Math.max(0, previewPageIndex - 1))}
                  className="disabled:opacity-30 hover:text-stone-900"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold">
                  Tờ {previewPageIndex + 1}/{layoutResult.totalPages}
                </span>
                <button
                  disabled={previewPageIndex >= layoutResult.totalPages - 1}
                  onClick={() => setPreviewPageIndex(Math.min(layoutResult.totalPages - 1, previewPageIndex + 1))}
                  className="disabled:opacity-30 hover:text-stone-900"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Paper Preview — flex-1 so it fills all remaining space */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-1">
              {(() => {
                // Paper dimensions in mm
                const paperPreset = paperSizeId === 'A4' ? { w: 210, h: 297 }
                  : paperSizeId === 'A5' ? { w: 148, h: 210 }
                  : paperSizeId === '10x15' ? { w: 100, h: 150 }
                  : paperSizeId === 'A3' ? { w: 297, h: 420 }
                  : { w: customPaperW, h: customPaperH };
                const aspect = paperPreset.w / paperPreset.h;

                const paperW = previewPage?.paperWidth || paperPreset.w;
                const paperH = previewPage?.paperHeight || paperPreset.h;

                // Generous sizing to fill the right column nicely
                const maxW = 380, maxH = 500;
                let pW = maxW, pH = maxW / aspect;
                if (pH > maxH) { pH = maxH; pW = maxH * aspect; }
                const scale = pW / paperW;

                return (
                  <>
                    <div
                      className="bg-white rounded-xs shadow-md border border-stone-200/80 relative shrink-0 transition-all overflow-hidden"
                      style={{ width: `${pW}px`, height: `${pH}px` }}
                    >
                      {previewPage && previewPage.placedPhotos.map((slot) => {
                        const slotX = slot.x * scale;
                        const slotY = slot.y * scale;
                        const slotW = slot.width * scale;
                        const slotH = slot.height * scale;
                        const resolveLabel = (lbl: string): string => {
                          if (lbl.startsWith('tpl-')) {
                            const tplId = lbl.replace('tpl-', '');
                            const tpl = availableTemplates.find(t => t.id === tplId);
                            if (tpl) return tpl.name;
                          }
                          const foundPreset = PHOTO_SIZE_PRESETS.find(p => p.id === lbl);
                          if (foundPreset) return foundPreset.name;
                          return lbl || currentPresetName;
                        };
                        const labelText = slot.label ? resolveLabel(slot.label) : currentPresetName;

                        const isSubStrip = slot.subSlotLayout && slot.subSlotLayout !== 'single';
                        const cuts = slot.subSlotLayout === 'strip-4' ? 4 
                          : slot.subSlotLayout === 'strip-3' ? 3 
                          : slot.subSlotLayout === 'strip-2' ? 2 
                          : slot.subSlotLayout === 'grid-2x2' ? 4 : 1;

                        const patternCss = getTemplatePatternCss(slot.borderPattern);
                        const bgColor = slot.bgHex || '#ffffff';

                        // Physical borders in mm
                        let bTop = slot.borderTopMm !== undefined ? slot.borderTopMm : (slot.borderStyle === 'polaroid' ? 5 : (slot.borderStyle === 'thin' ? 3 : 0));
                        let bSide = slot.borderWidthMm !== undefined ? slot.borderWidthMm : (slot.borderStyle === 'polaroid' ? 5 : (slot.borderStyle === 'thin' ? 3 : 0));
                        let bBottom = slot.polaroidBottomMm !== undefined ? slot.polaroidBottomMm : (slot.borderStyle === 'polaroid' ? 12 : 0);
                        let bLeft = bSide;
                        let bRight = bSide;

                        if (slot.borderStyle === 'asymmetric') {
                          bLeft = slot.borderLeftMm !== undefined ? slot.borderLeftMm : 14;
                          bRight = slot.borderRightMm !== undefined ? slot.borderRightMm : 3;
                          bTop = slot.borderTopMm !== undefined ? slot.borderTopMm : 3;
                          bBottom = slot.borderBottomMm !== undefined ? slot.borderBottomMm : 3;
                        } else if (slot.borderStyle === 'none') {
                          bTop = bBottom = bLeft = bRight = 0;
                        }

                        // Padding in pixels on the sheet preview, taking slot.rotated into account
                        let pTop = 0, pBottom = 0, pLeft = 0, pRight = 0;
                        if (slot.borderStyle !== 'none') {
                          if (slot.rotated) {
                            // Rotated 90 deg: original top -> left, original bottom (chân đáy) -> right, original sides -> top & bottom
                            pLeft = Math.max(1, Math.round(bTop * scale));
                            pRight = Math.max(2, Math.round((bSide + bBottom) * scale));
                            pTop = Math.max(1, Math.round(bSide * scale));
                            pBottom = Math.max(1, Math.round(bSide * scale));
                          } else {
                            pTop = Math.max(1, Math.round(bTop * scale));
                            pBottom = Math.max(2, Math.round((bSide + bBottom) * scale));
                            pLeft = Math.max(1, Math.round(bLeft * scale));
                            pRight = Math.max(1, Math.round(bRight * scale));
                          }
                        }

                        if (isSubStrip) {
                          return (
                            <div
                              key={slot.slotId}
                              className="absolute border border-stone-300 rounded-xs select-none overflow-hidden shadow-2xs"
                              style={{
                                left: `${slotX}px`,
                                top: `${slotY}px`,
                                width: `${slotW}px`,
                                height: `${slotH}px`,
                                backgroundColor: bgColor,
                                background: patternCss || bgColor,
                                paddingLeft: `${pLeft}px`,
                                paddingRight: `${pRight}px`,
                                paddingTop: `${pTop}px`,
                                paddingBottom: `${pBottom}px`,
                                boxSizing: 'border-box'
                              }}
                            >
                              <div className={`w-full h-full ${slot.subSlotLayout === 'grid-2x2' ? 'grid grid-cols-2 gap-0.5' : (slot.rotated ? 'flex flex-row justify-between gap-0.5' : 'flex flex-col justify-between gap-0.5')}`}>
                                {Array.from({ length: cuts }).map((_, idx) => (
                                  <div
                                    key={idx}
                                    className="flex-1 bg-[#d6cebf] border border-[#c5bdaf] rounded-2xs flex items-center justify-center overflow-hidden"
                                  >
                                    <span className="text-[7.5px] font-bold text-stone-600">#{idx + 1}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        const fontSize = Math.max(8, Math.min(13, Math.min(slotW * 0.14, slotH * 0.22)));
                        return (
                          <div
                            key={slot.slotId}
                            className="absolute border border-stone-300 rounded-xs select-none overflow-hidden shadow-2xs flex items-center justify-center"
                            style={{
                              left: `${slotX}px`,
                              top: `${slotY}px`,
                              width: `${slotW}px`,
                              height: `${slotH}px`,
                              backgroundColor: bgColor,
                              background: patternCss || bgColor,
                              paddingLeft: `${pLeft}px`,
                              paddingRight: `${pRight}px`,
                              paddingTop: `${pTop}px`,
                              paddingBottom: `${pBottom}px`,
                              boxSizing: 'border-box'
                            }}
                          >
                            <div className="w-full h-full bg-[#d6cebf] border border-[#c5bdaf] rounded-2xs flex items-center justify-center text-center p-0.5 overflow-hidden">
                              <span
                                className="font-bold text-stone-700 leading-tight select-none truncate px-1"
                                style={{ fontSize: `${fontSize}px` }}
                              >
                                {labelText}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sub-label */}
                    <div className="mt-2 text-center shrink-0">
                      <span className="text-xs text-stone-700 font-bold">
                        {selectedPhotoPresetId === '__custom__'
                          ? `Tờ 1: ${photosPerSheet} ô, dùng ${usedPercent}% giấy`
                          : `Tờ 1: ${slotsPerPage} ô, dùng ${previewPage?.photoPercent ?? 0}% giấy`
                        }
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>



            {/* Bottom Stats 3 Cards & Progress Bar matching Screenshot */}
            <div className="space-y-2.5 pt-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-3 rounded-2xl shadow-2xs text-center border border-stone-200/60">
                  <span className="text-lg font-black text-stone-900 block leading-tight">
                    {layoutMode === 'single' ? photoCount : layoutResult.totalSlots}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">ảnh</span>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-2xs text-center border border-stone-200/60">
                  <span className="text-lg font-black text-stone-900 block leading-tight">
                    {selectedPhotoPresetId === '__custom__'
                      ? Math.ceil(photoCount / photosPerSheet)
                      : layoutResult.totalPages}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">tờ {paperSizeId}</span>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-2xs text-center border border-stone-200/60">
                  <span className="text-lg font-black text-stone-900 block leading-tight">
                    {selectedPhotoPresetId === '__custom__' ? (100 - usedPercent) : layoutResult.wastePercent}%
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">phí giấy</span>
                </div>
              </div>


              {/* Progress bar and summary line matching screenshot */}
              <div>
                <div className="w-full bg-stone-300/80 h-2 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="bg-stone-900 h-full rounded-full transition-all duration-300"
                    style={{ width: `${selectedPhotoPresetId === '__custom__' ? usedPercent : layoutResult.photoPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-stone-600 leading-tight">
                  {selectedPhotoPresetId === '__custom__'
                    ? `Ảnh chiếm ${usedPercent}% giấy, phần trống bỏ đi ${100 - usedPercent}%. ${usedPercent >= 75 ? 'Dàn khá chặt.' : usedPercent >= 50 ? 'Dàn vừa phải.' : 'Còn nhiều giấy trống.'}`
                    : layoutResult.summaryText
                  }
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-4 md:px-7 py-3 md:py-4 pb-[max(env(safe-area-inset-bottom),22px)] border-t border-stone-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              className="text-stone-400 hover:text-stone-600 transition"
              title="Trợ giúp"
            >
              <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="text-xs">
              <span className="hidden sm:inline text-stone-400 font-medium">Tạm tính ({orderQty} ảnh): </span>
              <span className="text-stone-900 font-black">{currentPricing.totalPrice.toLocaleString('vi-VN')} đ</span>
              <span className="hidden sm:inline text-stone-400 font-mono text-[11px] ml-1.5">({currentPricing.unitPrice.toLocaleString('vi-VN')} đ/ảnh)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 md:px-5 py-2 text-xs font-bold text-stone-700 hover:text-stone-900 transition"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="px-5 md:px-6 py-2 md:py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-full shadow-md transition active:scale-95 shrink-0"
            >
              Tạo đơn
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
