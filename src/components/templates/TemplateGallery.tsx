import React, { useState, useEffect } from 'react';
import { TemplateItem, Project } from '../../types';
import { Check, Sparkles, Plus, Edit2, Trash2, Tag, CheckSquare, Square, X } from 'lucide-react';
import { computeLayout } from '../../core/layout/layoutEngine';
import { storageManager } from '../../core/storage/storageManager';
import { TemplateEditorModal } from './TemplateEditorModal';

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

interface TemplateGalleryProps {
  onCreateProjectFromTemplate: (project: Project) => void;
  onModalStateChange?: (isOpen: boolean) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onCreateProjectFromTemplate,
  onModalStateChange
}) => {
  const [templates, setTemplates] = useState<TemplateItem[]>(() => storageManager.getTemplates());
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'free' | 'seasonal' | 'polaroid' | 'photobooth'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem>(() => templates[0] || storageManager.getTemplates()[0]);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);

  // Sync modal state with parent
  useEffect(() => {
    onModalStateChange?.(isEditorModalOpen);
  }, [isEditorModalOpen, onModalStateChange]);

  // Multi-select mode
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sync state if selected template updated
  useEffect(() => {
    const updated = templates.find(t => t.id === selectedTemplate?.id);
    if (updated) {
      setSelectedTemplate(updated);
    } else if (templates.length > 0) {
      setSelectedTemplate(templates[0]);
    }
  }, [templates]);

  const filteredTemplates = templates.filter(t => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'photobooth') {
      return t.category === 'photobooth' || t.subSlotLayout?.startsWith('strip') || t.subSlotLayout === 'grid-2x2';
    }
    if (selectedCategory === 'seasonal') return t.category === 'seasonal';
    if (selectedCategory === 'polaroid') return t.category === 'polaroid';
    if (selectedCategory === 'free' || selectedCategory === 'standard') {
      return t.category !== 'seasonal' && t.category !== 'polaroid' && t.category !== 'photobooth';
    }
    return true;
  });

  // All templates are selectable for deletion (built-in are blacklisted in storage on delete)
  const selectableIds = filteredTemplates.map(t => t.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selectedIds.has(id));

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const handleExitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Xóa ${selectedIds.size} mẫu đã chọn? Hành động này không thể hoàn tác.`)) return;
    selectedIds.forEach(id => storageManager.deleteTemplate(id));
    const refreshed = storageManager.getTemplates();
    setTemplates(refreshed);
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setIsEditorModalOpen(true);
  };

  const handleOpenEditModal = (tpl: TemplateItem) => {
    setEditingTemplate(tpl);
    setIsEditorModalOpen(true);
  };

  const handleSaveTemplate = (saved: TemplateItem) => {
    storageManager.saveTemplate(saved);
    const refreshed = storageManager.getTemplates();
    setTemplates(refreshed);
    setSelectedTemplate(saved);
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa mẫu tùy chỉnh này không?')) {
      storageManager.deleteTemplate(id);
      const refreshed = storageManager.getTemplates();
      setTemplates(refreshed);
    }
  };

  const handleApplyTemplate = () => {
    const paperConfig = {
      sizeId: 'A4' as const,
      customWidthMm: 210,
      customHeightMm: 297,
      orientation: 'portrait' as const,
      margins: { top: 5, bottom: 5, left: 5, right: 5 },
      printerOffsetX: 0,
      printerOffsetY: 0
    };

    const bWidth = selectedTemplate.borderWidthMm !== undefined 
      ? selectedTemplate.borderWidthMm 
      : (selectedTemplate.borderStyle === 'polaroid' ? 5 : 3);
    const bTop = selectedTemplate.borderTopMm !== undefined
      ? selectedTemplate.borderTopMm
      : bWidth;
    const pBottom = selectedTemplate.polaroidBottomMm !== undefined 
      ? selectedTemplate.polaroidBottomMm 
      : (selectedTemplate.borderStyle === 'polaroid' ? 12 : 0);

    const layoutConfig = {
      mode: 'single' as const,
      photoPresetId: selectedTemplate.id.includes('polaroid') ? 'polaroid-mini' : 'custom',
      customWidthMm: selectedTemplate.photoSize.widthMm,
      customHeightMm: selectedTemplate.photoSize.heightMm,
      lockAspectRatio: true,
      aspectRatio: selectedTemplate.photoSize.widthMm / selectedTemplate.photoSize.heightMm,
      gapX: 0,
      gapY: 0,
      cropMode: 'fill' as const,
      borderStyle: selectedTemplate.borderStyle,
      borderWidthMm: bWidth,
      borderTopMm: bTop,
      borderLeftMm: selectedTemplate.borderLeftMm,
      borderRightMm: selectedTemplate.borderRightMm,
      borderBottomMm: selectedTemplate.borderBottomMm,
      polaroidBottomMm: pBottom,
      subSlotLayout: selectedTemplate.subSlotLayout || 'single',
      bgHex: selectedTemplate.bgHex || '#ffffff',
      footerText: selectedTemplate.footerText,
      cutLineStyle: 'solid' as const,
      algorithm: 'grid' as const,
      allowRotation: true,
      preserveOrder: true,
      multiSizes: [],
      borderPattern: selectedTemplate.borderPattern
    };

    const layout = computeLayout(paperConfig, layoutConfig, []);

    const project: Project = {
      id: 'proj-' + Date.now(),
      name: 'Đơn mẫu ' + selectedTemplate.name,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photos: [],
      paperConfig,
      layoutConfig,
      pages: layout.pages,
      totalPhotosCount: layout.totalSlots
    };

    onCreateProjectFromTemplate(project);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-studio-bg overflow-hidden select-none">
      {/* Header — Responsive for Mobile & Desktop */}
      <div 
        className="safe-area-top-header relative z-20 border-b border-studio-border px-4 md:px-8 py-2 md:py-3 md:h-16 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-3"
        style={{ 
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)',
          backgroundColor: '#ffffff',
          isolation: 'isolate',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translateZ(0)'
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Kho mẫu</span>
            <h1 className="text-lg md:text-xl font-bold text-stone-900 tracking-tight">Chọn mẫu, tạo đơn ngay</h1>
          </div>
          <p className="text-[11px] md:text-xs text-stone-500 mt-0.5">Tùy chỉnh độ dày viền mm, hoa văn Giáng sinh và liên kết bảng giá</p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {/* Filter pills — scrollable on mobile */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'all', label: 'Tất cả (' + templates.length + ')' },
              { id: 'polaroid', label: 'Polaroid' },
              { id: 'photobooth', label: 'Photobooth' },
              { id: 'free', label: 'Khổ chuẩn' },
              { id: 'seasonal', label: 'Họa tiết' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={'px-2.5 py-1 text-xs font-semibold rounded-lg transition shrink-0 ' + (
                  selectedCategory === tab.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto md:ml-0">
            {/* Button: Chọn nhiều để xóa */}
            {!isSelectMode ? (
              <button
                onClick={() => setIsSelectMode(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chọn & Xóa</span>
              </button>
            ) : (
              <button
                onClick={handleExitSelectMode}
                className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hủy</span>
              </button>
            )}

            {/* Button: + Tạo mẫu mới */}
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo mẫu mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Delete Action Bar */}
      {isSelectMode && (
        <div className="bg-red-50 border-b border-red-200 px-8 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900"
            >
              {allSelected
                ? <CheckSquare className="w-4 h-4" />
                : <Square className="w-4 h-4" />
              }
              <span>{allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả mẫu tự tạo'}</span>
            </button>
            <span className="text-xs text-red-500">
              Đã chọn: <strong>{selectedIds.size}</strong> mẫu
            </span>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa {selectedIds.size > 0 ? selectedIds.size + ' mẫu đã chọn' : '...'}</span>
          </button>
        </div>
      )}

      {/* Main split */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Templates Cards Grid */}
        <div className="flex-1 p-3 md:p-8 overflow-y-auto pb-36 md:pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {filteredTemplates.map(template => {
              const isSelected = !isSelectMode && selectedTemplate?.id === template.id;
              const isChecked = isSelectMode && selectedIds.has(template.id);

              return (
                <div
                  key={template.id}
                  onClick={() => {
                    if (isSelectMode) {
                      handleToggleSelect(template.id);
                    } else {
                      setSelectedTemplate(template);
                    }
                  }}
                  className={'bg-white rounded-2xl border p-3 flex flex-col items-center transition-all relative group ' + (
                    isSelectMode
                      ? 'cursor-pointer hover:border-red-300 ' + (isChecked ? 'border-red-500 ring-2 ring-red-400 shadow-md' : 'border-stone-200')
                      : 'cursor-pointer hover:scale-102 ' + (isSelected ? 'border-stone-900 ring-2 ring-stone-900 shadow-md' : 'border-stone-200 hover:border-stone-300 shadow-xs')
                  )}
                >
                  {/* Checkbox (select mode) */}
                  {isSelectMode && (
                    <div className={`absolute top-2 left-2 w-5 h-5 rounded flex items-center justify-center transition ${isChecked ? 'bg-red-500 border-red-500' : 'bg-white border-2 border-stone-300'}`}>
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                      {template.isCustom ? 'Tự tạo' : 'Mới'}
                    </span>
                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Visual card representation — correct aspect ratio inside studio contrast well */}
                  <div className="w-full bg-[#f4f2ee] rounded-2xl flex items-center justify-center mb-3 overflow-hidden shadow-inner p-2" style={{ height: '130px' }}>
                    {(() => {
                      const wMm = template.photoSize?.widthMm || 60;
                      const hMm = template.photoSize?.heightMm || 90;
                      const ratio = wMm / hMm;

                      // Fit inside 70×118 px box preserving aspect ratio (supports tall strips)
                      const maxW = 70, maxH = 118;
                      let cW: number, cH: number;
                      if (ratio > maxW / maxH) {
                        cW = maxW; cH = Math.max(12, Math.round(maxW / ratio));
                      } else {
                        cH = maxH; cW = Math.max(12, Math.round(maxH * ratio));
                      }

                      const isPhotobooth = template.subSlotLayout?.startsWith('strip') || template.subSlotLayout === 'grid-2x2' || template.name.toLowerCase().includes('photobooth');
                      const cuts = template.subSlotLayout === 'strip-4' ? 4 
                        : template.subSlotLayout === 'strip-3' ? 3 
                        : template.subSlotLayout === 'strip-2' ? 2 
                        : template.subSlotLayout === 'grid-2x2' ? 4 
                        : (template.name.includes('4') ? 4 : (template.name.includes('2') ? 2 : 3));

                      const bgColor = template.bgHex || (template.name.toLowerCase().includes('đen') ? '#18181b' : '#ffffff');
                      const patternCss = getTemplatePatternCss(template.borderPattern);

                      if (template.customFrameImage) {
                        return (
                          <div
                            className="rounded-xs border border-stone-300 shadow-sm overflow-hidden shrink-0"
                            style={{
                              width: `${cW}px`, height: `${cH}px`,
                              backgroundImage: `url(${template.customFrameImage})`,
                              backgroundSize: '100% 100%'
                            }}
                          />
                        );
                      }

                      // 1. Photobooth (3 cuts, 4 cuts, 2 cuts, grid-2x2)
                      if (isPhotobooth) {
                        const padTop = Math.max(2, Math.round(cH * (template.borderTopMm || 3) / hMm));
                        const padSides = Math.max(2, Math.round(cW * (template.borderWidthMm || 3) / wMm));
                        const padBottom = Math.max(5, Math.round(cH * (template.polaroidBottomMm || 14) / hMm));

                        return (
                          <div
                            className="border border-stone-300 rounded-xs shadow-sm flex flex-col justify-between overflow-hidden shrink-0"
                            style={{
                              width: `${cW}px`,
                              height: `${cH}px`,
                              backgroundColor: bgColor,
                              paddingLeft: `${padSides}px`,
                              paddingRight: `${padSides}px`,
                              paddingTop: `${padTop}px`,
                              paddingBottom: `${padBottom}px`,
                              boxSizing: 'border-box'
                            }}
                          >
                            <div className={`w-full flex-1 ${template.subSlotLayout === 'grid-2x2' ? 'grid grid-cols-2 gap-0.5' : 'flex flex-col justify-between gap-0.5'}`}>
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
                      if (template.borderStyle === 'custom' || patternCss) {
                        const padTop = Math.max(2, Math.round(cH * (template.borderTopMm || 4) / hMm));
                        const padSides = Math.max(2, Math.round(cW * (template.borderWidthMm || 4) / wMm));
                        const padBottom = Math.max(2, Math.round(cH * (template.borderBottomMm || template.borderWidthMm || 4) / hMm));

                        return (
                          <div
                            className="border border-stone-300 rounded-xs shadow-sm overflow-hidden shrink-0"
                            style={{
                              width: `${cW}px`,
                              height: `${cH}px`,
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
                      if (template.borderStyle === 'asymmetric') {
                        const padLeft = Math.max(6, Math.round(cW * (template.borderLeftMm || 14) / wMm));
                        const padRight = Math.max(2, Math.round(cW * (template.borderRightMm || 3) / wMm));
                        const padTop = Math.max(2, Math.round(cH * (template.borderTopMm || 3) / hMm));
                        const padBottom = Math.max(2, Math.round(cH * (template.borderBottomMm || 3) / hMm));

                        return (
                          <div
                            className="border border-stone-300 rounded-xs shadow-sm overflow-hidden shrink-0"
                            style={{
                              width: `${cW}px`,
                              height: `${cH}px`,
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
                      if (template.borderStyle === 'polaroid') {
                        const bWmm = template.borderWidthMm !== undefined ? template.borderWidthMm : 5;
                        const bTopmm = template.borderTopMm !== undefined ? template.borderTopMm : bWmm;
                        const bBottomMm = template.polaroidBottomMm !== undefined ? template.polaroidBottomMm : 12;
                        const padSides = Math.max(2, Math.round(cW * bWmm / wMm));
                        const padTop = Math.max(2, Math.round(cH * bTopmm / hMm));
                        const padBottom = Math.max(6, Math.round(cH * (bWmm + bBottomMm) / hMm));

                        return (
                          <div
                            className="border border-stone-300 rounded-xs shadow-sm overflow-hidden shrink-0"
                            style={{
                              width: `${cW}px`,
                              height: `${cH}px`,
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
                      if (template.borderStyle === 'thin') {
                        const bW = Math.max(2, Math.round(cW * (template.borderWidthMm || 3) / wMm));
                        return (
                          <div
                            className="border border-stone-300 rounded-xs shadow-sm overflow-hidden shrink-0"
                            style={{
                              width: `${cW}px`,
                              height: `${cH}px`,
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
                          className="bg-[#d6cebf] border border-[#c4bcac] shadow-sm rounded-2xs shrink-0"
                          style={{ width: `${cW}px`, height: `${cH}px` }}
                        />
                      );
                    })()}
                  </div>

                  <span className="text-xs font-bold text-stone-900 text-center truncate max-w-full">
                    {template.name}
                  </span>
                  <span className="text-[10px] text-stone-400 text-center truncate max-w-full">
                    {template.description}
                  </span>

                  {/* Price tag */}
                  <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-2 py-0.5 rounded-md mt-1.5 shadow-2xs">
                    {(template.customPrice || 2000).toLocaleString('vi-VN')} đ
                  </span>

                  {/* Quick Edit button on hover */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 bg-stone-900/80 p-0.5 rounded-lg backdrop-blur-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(template);
                      }}
                      className="p-1 text-white hover:text-amber-300 transition"
                      title="Sửa thông số mẫu"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {template.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        className="p-1 text-white hover:text-red-400 transition"
                        title="Xóa mẫu"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Template Inspector (Desktop only) */}
        {selectedTemplate && (
          <div className="hidden md:flex w-80 bg-white border-l border-studio-border p-6 flex-col justify-between shrink-0">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Mẫu đã chọn</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(selectedTemplate)}
                    className="flex items-center gap-1 text-xs font-bold text-stone-800 hover:text-stone-950 underline"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Sửa mẫu</span>
                  </button>
                  {selectedTemplate.isCustom && (
                    <button
                      onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                      className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 underline"
                      title="Xóa mẫu tự tạo"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Visual preview box — dynamic rendering matching selected template */}
              <div className="w-full h-56 bg-[#f4f2ee] border border-stone-200 rounded-2xl flex items-center justify-center p-4 mb-4 overflow-hidden shadow-inner">
                {(() => {
                  const sW = selectedTemplate.photoSize.widthMm || 60;
                  const sH = selectedTemplate.photoSize.heightMm || 90;
                  const sRatio = sW / sH;
                  const inspMaxW = 120, inspMaxH = 180;
                  let inspW: number, inspH: number;
                  if (sRatio > inspMaxW / inspMaxH) {
                    inspW = inspMaxW;
                    inspH = Math.max(20, Math.round(inspMaxW / sRatio));
                  } else {
                    inspH = inspMaxH;
                    inspW = Math.max(20, Math.round(inspMaxH * sRatio));
                  }

                  const isPhotoB = selectedTemplate.subSlotLayout?.startsWith('strip') || selectedTemplate.subSlotLayout === 'grid-2x2' || selectedTemplate.name.toLowerCase().includes('photobooth');
                  const sCuts = selectedTemplate.subSlotLayout === 'strip-4' ? 4 
                    : selectedTemplate.subSlotLayout === 'strip-3' ? 3 
                    : selectedTemplate.subSlotLayout === 'strip-2' ? 2 
                    : selectedTemplate.subSlotLayout === 'grid-2x2' ? 4 
                    : (selectedTemplate.name.includes('4') ? 4 : (selectedTemplate.name.includes('2') ? 2 : 3));

                  const sBg = selectedTemplate.bgHex || (selectedTemplate.name.toLowerCase().includes('đen') ? '#18181b' : '#ffffff');
                  const sPattern = getTemplatePatternCss(selectedTemplate.borderPattern);

                  if (selectedTemplate.customFrameImage) {
                    return (
                      <div
                        className="rounded-lg border border-stone-300 shadow-md relative overflow-hidden shrink-0"
                        style={{
                          width: `${inspW}px`,
                          height: `${inspH}px`,
                          backgroundImage: `url(${selectedTemplate.customFrameImage})`,
                          backgroundSize: '100% 100%'
                        }}
                      />
                    );
                  }

                  if (isPhotoB) {
                    const pT = Math.max(3, Math.round(inspH * (selectedTemplate.borderTopMm || 3) / sH));
                    const pS = Math.max(3, Math.round(inspW * (selectedTemplate.borderWidthMm || 3) / sW));
                    const pB = Math.max(8, Math.round(inspH * (selectedTemplate.polaroidBottomMm || 15) / sH));

                    return (
                      <div
                        className="border border-stone-300 rounded-lg shadow-md flex flex-col justify-between overflow-hidden shrink-0"
                        style={{
                          width: `${inspW}px`,
                          height: `${inspH}px`,
                          backgroundColor: sBg,
                          paddingLeft: `${pS}px`,
                          paddingRight: `${pS}px`,
                          paddingTop: `${pT}px`,
                          paddingBottom: `${pB}px`,
                          boxSizing: 'border-box'
                        }}
                      >
                        <div className={`w-full flex-1 ${selectedTemplate.subSlotLayout === 'grid-2x2' ? 'grid grid-cols-2 gap-1' : 'flex flex-col justify-between gap-1'}`}>
                          {Array.from({ length: sCuts }).map((_, idx) => (
                            <div
                              key={idx}
                              className="flex-1 bg-[#d6cebf] border border-[#c5bdaf] rounded-xs flex items-center justify-center overflow-hidden shadow-2xs"
                            >
                              <span className="text-[9px] font-bold text-stone-600">#{idx + 1}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (selectedTemplate.borderStyle === 'custom' || sPattern) {
                    const pT = Math.max(3, Math.round(inspH * (selectedTemplate.borderTopMm || 4) / sH));
                    const pS = Math.max(3, Math.round(inspW * (selectedTemplate.borderWidthMm || 4) / sW));
                    const pB = Math.max(3, Math.round(inspH * (selectedTemplate.borderBottomMm || selectedTemplate.borderWidthMm || 4) / sH));

                    return (
                      <div
                        className="border border-stone-300 rounded-lg shadow-md overflow-hidden shrink-0"
                        style={{
                          width: `${inspW}px`,
                          height: `${inspH}px`,
                          background: sPattern || sBg,
                          paddingLeft: `${pS}px`,
                          paddingRight: `${pS}px`,
                          paddingTop: `${pT}px`,
                          paddingBottom: `${pB}px`,
                          boxSizing: 'border-box'
                        }}
                      >
                        <div className="w-full h-full bg-[#d6cebf] border border-[#c5bdaf] rounded-xs shadow-2xs" />
                      </div>
                    );
                  }

                  if (selectedTemplate.borderStyle === 'asymmetric') {
                    const pL = Math.max(10, Math.round(inspW * (selectedTemplate.borderLeftMm || 14) / sW));
                    const pR = Math.max(3, Math.round(inspW * (selectedTemplate.borderRightMm || 3) / sW));
                    const pT = Math.max(3, Math.round(inspH * (selectedTemplate.borderTopMm || 3) / sH));
                    const pB = Math.max(3, Math.round(inspH * (selectedTemplate.borderBottomMm || 3) / sH));

                    return (
                      <div
                        className="border border-stone-300 rounded-lg shadow-md overflow-hidden shrink-0"
                        style={{
                          width: `${inspW}px`,
                          height: `${inspH}px`,
                          backgroundColor: sBg,
                          paddingLeft: `${pL}px`,
                          paddingRight: `${pR}px`,
                          paddingTop: `${pT}px`,
                          paddingBottom: `${pB}px`,
                          boxSizing: 'border-box'
                        }}
                      >
                        <div className="w-full h-full bg-[#d6cebf] border border-[#c5bdaf] rounded-xs shadow-2xs" />
                      </div>
                    );
                  }

                  if (selectedTemplate.borderStyle === 'polaroid') {
                    const bW = selectedTemplate.borderWidthMm !== undefined ? selectedTemplate.borderWidthMm : 5;
                    const bT = selectedTemplate.borderTopMm !== undefined ? selectedTemplate.borderTopMm : bW;
                    const bB = selectedTemplate.polaroidBottomMm !== undefined ? selectedTemplate.polaroidBottomMm : 12;
                    const pS = Math.max(3, Math.round(inspW * bW / sW));
                    const pT = Math.max(3, Math.round(inspH * bT / sH));
                    const pB = Math.max(8, Math.round(inspH * (bW + bB) / sH));

                    return (
                      <div
                        className="border border-stone-300 rounded-lg shadow-md overflow-hidden shrink-0"
                        style={{
                          width: `${inspW}px`,
                          height: `${inspH}px`,
                          backgroundColor: sBg,
                          paddingLeft: `${pS}px`,
                          paddingRight: `${pS}px`,
                          paddingTop: `${pT}px`,
                          paddingBottom: `${pB}px`,
                          boxSizing: 'border-box'
                        }}
                      >
                        <div className="w-full h-full bg-[#d6cebf] border border-[#c5bdaf] rounded-xs shadow-2xs" />
                      </div>
                    );
                  }

                  if (selectedTemplate.borderStyle === 'thin') {
                    const pW = Math.max(3, Math.round(inspW * (selectedTemplate.borderWidthMm || 3) / sW));
                    return (
                      <div
                        className="border border-stone-300 rounded-lg shadow-md overflow-hidden shrink-0"
                        style={{
                          width: `${inspW}px`,
                          height: `${inspH}px`,
                          backgroundColor: sBg,
                          padding: `${pW}px`,
                          boxSizing: 'border-box'
                        }}
                      >
                        <div className="w-full h-full bg-[#d6cebf] border border-[#c5bdaf] rounded-xs shadow-2xs" />
                      </div>
                    );
                  }

                  // None (Full bleed)
                  return (
                    <div
                      className="bg-[#d6cebf] border border-[#c5bdaf] rounded-lg shadow-md overflow-hidden shrink-0"
                      style={{ width: `${inspW}px`, height: `${inspH}px` }}
                    />
                  );
                })()}
              </div>

              <h3 className="text-base font-bold text-stone-900">{selectedTemplate.name}</h3>
              <p className="text-xs text-stone-500 mt-1">{selectedTemplate.description}</p>

              {/* Exact Specs in mm */}
              <div className="space-y-2 mt-4 pt-4 border-t border-stone-100 text-xs text-stone-600">
                <div className="flex items-center justify-between">
                  <span>Kích thước khung:</span>
                  <strong className="text-stone-900">{selectedTemplate.photoSize.widthMm} x {selectedTemplate.photoSize.heightMm} mm</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Viền trên (Top):</span>
                  <strong className="text-stone-900">
                    {selectedTemplate.borderTopMm !== undefined 
                      ? selectedTemplate.borderTopMm 
                      : (selectedTemplate.borderWidthMm !== undefined ? selectedTemplate.borderWidthMm : (selectedTemplate.borderStyle === 'polaroid' ? 5 : 3))} mm
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Viền ngang (2 bên):</span>
                  <strong className="text-stone-900">
                    {selectedTemplate.borderWidthMm !== undefined ? selectedTemplate.borderWidthMm : (selectedTemplate.borderStyle === 'polaroid' ? 5 : 3)} mm
                  </strong>
                </div>
                {selectedTemplate.borderStyle === 'polaroid' && (
                  <div className="flex items-center justify-between">
                    <span>Chân đáy Polaroid:</span>
                    <strong className="text-stone-900">
                      {selectedTemplate.polaroidBottomMm !== undefined ? selectedTemplate.polaroidBottomMm : 12} mm
                    </strong>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                  <span className="flex items-center gap-1 font-semibold text-emerald-800">
                    <Tag className="w-3.5 h-3.5" /> Đơn giá in:
                  </span>
                  <strong className="text-emerald-700 font-bold">
                    {(selectedTemplate.customPrice || 2000).toLocaleString('vi-VN')} đ/ảnh
                  </strong>
                </div>
              </div>
            </div>

            <button
              onClick={handleApplyTemplate}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-2 mt-4"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đơn với mẫu này</span>
            </button>
          </div>
        )}

      </div>

      {/* Mobile Floating Action Card when a template is selected */}
      {selectedTemplate && (
        <div className="md:hidden fixed bottom-[calc(max(env(safe-area-inset-bottom),26px)+64px)] left-3 right-3 z-30 bg-stone-950/95 backdrop-blur-xl border border-white/20 p-3 rounded-2xl shadow-2xl text-white flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider block">Mẫu đang chọn</span>
            <span className="font-bold text-xs truncate block text-white">{selectedTemplate.name}</span>
            <span className="text-[10px] text-stone-300 block">
              {selectedTemplate.photoSize.widthMm}×{selectedTemplate.photoSize.heightMm} mm • {selectedTemplate.customPrice?.toLocaleString('vi-VN') || '2.000'}đ/ảnh
            </span>
          </div>
          <button
            onClick={handleApplyTemplate}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Tạo đơn</span>
          </button>
        </div>
      )}

      {/* Template Editor Modal */}
      {isEditorModalOpen && (
        <TemplateEditorModal
          template={editingTemplate}
          onClose={() => setIsEditorModalOpen(false)}
          onSave={handleSaveTemplate}
        />
      )}
    </div>
  );
};