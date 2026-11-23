import React, { useRef, useState, useMemo } from 'react';
import { PhotoItem } from '../../types';
import { Plus, RotateCw, Trash2, Upload, Sparkles, Crop, Sliders, ChevronDown, Zap, AlertTriangle } from 'lucide-react';
import { processUploadedFile } from '../../core/image/imageProcessor';

interface PhotoLibrarySidebarProps {
  photos: PhotoItem[];
  totalSlotsNeeded: number;
  onAddPhotos: (newPhotos: PhotoItem[]) => void;
  onRemovePhoto: (id: string) => void;
  onRotatePhoto: (id: string) => void;
  selectedPhotoId: string | null;
  onSelectPhoto: (id: string | null) => void;
  onAdjustPhotoCrop?: (photo: PhotoItem) => void;
  onAdjustPhotoFilter?: (photo: PhotoItem) => void;
  onChangeCopiesCount?: (photoId: string, count: number) => void;
  onRemoveFromSlots?: (photoId: string) => void;
  assignedSlotsCountMap?: Map<string, number>;
  slotDimensionsMm?: { width: number; height: number };
  onQuickAutoLayout?: () => void;
}

export const PhotoLibrarySidebar: React.FC<PhotoLibrarySidebarProps> = ({
  photos,
  totalSlotsNeeded,
  onAddPhotos,
  onRemovePhoto,
  onRotatePhoto,
  selectedPhotoId,
  onSelectPhoto,
  onAdjustPhotoCrop,
  onAdjustPhotoFilter,
  onChangeCopiesCount,
  onRemoveFromSlots,
  assignedSlotsCountMap,
  slotDimensionsMm = { width: 54, height: 86 },
  onQuickAutoLayout
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'duplicate' | 'unused'>('all');

  // Compute duplicate photos (photos assigned to > 1 slot)
  const duplicatePhotos = useMemo(() => {
    return photos.filter(p => {
      const usedCount = assignedSlotsCountMap?.get(p.id) || 0;
      return usedCount > 1;
    });
  }, [photos, assignedSlotsCountMap]);

  // Compute unused photos (photos not yet placed in any slot)
  const unusedPhotos = useMemo(() => {
    return photos.filter(p => {
      const usedCount = assignedSlotsCountMap?.get(p.id) || 0;
      return usedCount === 0;
    });
  }, [photos, assignedSlotsCountMap]);

  // Active photos based on current filter
  const displayedPhotos = useMemo(() => {
    if (filterTab === 'duplicate') return duplicatePhotos;
    if (filterTab === 'unused') return unusedPhotos;
    return photos;
  }, [filterTab, photos, duplicatePhotos, unusedPhotos]);

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles: File[] = [];
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (validTypes.includes(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name)) {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    const processed: PhotoItem[] = [];
    for (let i = 0; i < validFiles.length; i++) {
      try {
        const item = await processUploadedFile(validFiles[i]);
        processed.push(item);
      } catch (err) {
        console.error('Error processing photo:', err);
      }
    }

    onAddPhotos(processed);
    setIsUploading(false);
  };

  const handleDragStart = (e: React.DragEvent, photoId: string) => {
    e.dataTransfer.setData('text/plain', photoId);
    e.dataTransfer.setData('application/photodesk-photo', photoId);
  };

  return (
    <aside className="w-[260px] h-full bg-white border-r border-studio-border flex flex-col shrink-0 select-none z-10">
      {/* Header: 2 rows — avoids overflow/wrapping */}
      <div className="px-3 pt-2.5 pb-2 border-b border-stone-100 space-y-1.5">
        {/* Row 1: "Kho ảnh [n]" left + "+ Thêm ảnh" right */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-stone-900 text-xs tracking-tight">Kho ảnh</span>
            <span className="text-[11px] font-bold bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded-full leading-none">
              {photos.length}
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
              }
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1 px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
            <span>{isUploading ? 'Đang tải...' : 'Thêm ảnh'}</span>
          </button>
        </div>

        {/* Row 2: status text left + "Dán nhanh" right */}
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-stone-500 font-medium">
            Đã nạp {photos.length} ảnh • Cần {totalSlotsNeeded || 0} ô
          </p>
          {onQuickAutoLayout && photos.length > 0 && (
            <button
              type="button"
              onClick={onQuickAutoLayout}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg transition active:scale-95"
              title="Tự động dàn toàn bộ ảnh vào các ô trống trên tờ in"
            >
              <Zap className="w-3 h-3" />
              <span>Dàn nhanh</span>
            </button>
          )}
        </div>

        {/* Row 3: Quick Filter Tabs (Tất cả / Trùng / Chưa dùng) */}
        {photos.length > 0 && (
          <div className="flex items-center gap-1 pt-1.5 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                filterTab === 'all' 
                  ? 'bg-stone-900 text-white' 
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Tất cả ({photos.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('duplicate')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
                filterTab === 'duplicate' 
                  ? 'bg-amber-600 text-white' 
                  : duplicatePhotos.length > 0
                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold border border-amber-200'
                    : 'text-stone-400 hover:bg-stone-100'
              }`}
              title="Xem danh sách các ảnh đang in trùng từ 2 ô trở lên"
            >
              <span>Trùng</span>
              {duplicatePhotos.length > 0 && (
                <span className={`px-1 py-0.2 rounded-full text-[10px] font-bold leading-none ${
                  filterTab === 'duplicate' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-900'
                }`}>
                  {duplicatePhotos.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('unused')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                filterTab === 'unused' 
                  ? 'bg-stone-900 text-white' 
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Chưa dùng ({unusedPhotos.length})
            </button>
          </div>
        )}
      </div>

      {/* 2-Column Photo Grid matching Screenshot */}
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
          }
        }}
        className="flex-1 p-2.5 overflow-y-auto"
      >
        {photos.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-64 border-2 border-dashed border-stone-200 hover:border-brand-400 rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition group"
          >
            <Upload className="w-6 h-6 text-stone-400 group-hover:text-brand-600 mb-2 transition" />
            <span className="text-xs font-bold text-stone-700">Chưa có ảnh nào</span>
            <span className="text-[10px] text-stone-400 mt-1">Bấm để tải hoặc kéo thả ảnh vào đây</span>
          </div>
        ) : displayedPhotos.length === 0 ? (
          <div className="h-48 border border-stone-200 rounded-xl flex flex-col items-center justify-center p-4 text-center text-stone-500">
            <span className="text-xs font-semibold">
              {filterTab === 'duplicate' ? 'Không có ảnh nào đang in trùng ô.' : 'Toàn bộ ảnh đã được gán vào ô.'}
            </span>
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className="mt-2 text-[11px] text-brand-600 hover:underline font-bold"
            >
              Xem tất cả ảnh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {displayedPhotos.map((photo, idx) => {
              const isSelected = selectedPhotoId === photo.id;
              const usedCount = assignedSlotsCountMap?.get(photo.id) || 0;
              const isUsed = usedCount > 0;
              const isDuplicate = usedCount > 1;
              return (
                <div
                  key={photo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, photo.id)}
                  onClick={() => onSelectPhoto(isSelected ? null : photo.id)}
                  className={`aspect-3/4 rounded-lg overflow-hidden border relative group cursor-grab active:cursor-grabbing transition-all bg-stone-100 flex items-center justify-center shadow-2xs ${
                    isSelected 
                      ? 'ring-2 ring-brand-500 border-brand-500' 
                      : isDuplicate
                        ? 'border-amber-500 ring-2 ring-amber-400/50 bg-amber-50/20'
                        : isUsed 
                          ? 'border-emerald-400' 
                          : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.originalName}
                    className={`w-full h-full object-cover transition-transform ${isUsed ? 'brightness-90' : ''}`}
                    style={{
                      transform: `rotate(${photo.rotation || 0}deg) ${photo.flipHorizontal ? 'scaleX(-1)' : ''}`
                    }}
                  />

                  {/* Duplicate or Used badge */}
                  {isDuplicate ? (
                    <div className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                      <span>⚠️ Trùng ×{usedCount}</span>
                    </div>
                  ) : isUsed ? (
                    <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                      <span>✓ Đã dùng</span>
                    </div>
                  ) : null}

                  {/* Circular sequence badge (1), (2), (3)... matching PicDesk screenshot */}
                  <div className="absolute bottom-1.5 left-1.5 w-5 h-5 rounded-full bg-stone-900/90 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {idx + 1}
                  </div>

                  {/* Quick hover action buttons */}
                  <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition bg-stone-900/70 p-0.5 rounded backdrop-blur-2xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRotatePhoto(photo.id);
                      }}
                      className="p-1 text-white hover:text-amber-400 rounded transition"
                      title="Xoay 90°"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemovePhoto(photo.id);
                      }}
                      className="p-1 text-white hover:text-red-400 rounded transition"
                      title="Xóa ảnh"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Panel: Ảnh đang chọn (matching PicDesk screenshot) */}
      {(() => {
        const selectedPhoto = selectedPhotoId ? photos.find(p => p.id === selectedPhotoId) : null;
        if (!selectedPhoto) return null;

        const assignedCount = assignedSlotsCountMap?.get(selectedPhoto.id) || 0;
        // Calculate DPI at this slot size: (px / (mm / 25.4))
        const slotWInches = (slotDimensionsMm.width || 54) / 25.4;
        const calculatedDpi = Math.round(selectedPhoto.widthPx / slotWInches);

        return (
          <div className="border-t border-stone-200 bg-stone-50/90 p-3 flex flex-col gap-2 shrink-0 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Ảnh đang chọn</span>
              <button
                onClick={() => onSelectPhoto(null)}
                className="text-[11px] text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-stone-900 truncate" title={selectedPhoto.originalName}>
                {selectedPhoto.originalName}
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">
                {selectedPhoto.widthPx}x{selectedPhoto.heightPx} px • {calculatedDpi}dpi ở khổ này
              </p>
            </div>

            {assignedCount > 1 && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Ảnh đang in trùng ở <strong>{assignedCount} ô</strong> trên tờ</span>
              </div>
            )}

            {/* Số bản (số ô) stepper matching screenshot */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-stone-700 font-medium">Số bản (số ô)</span>
              <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-2 py-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => onChangeCopiesCount?.(selectedPhoto.id, Math.max(1, (selectedPhoto.copiesCount || 1) - 1))}
                  className="w-4 h-4 flex items-center justify-center text-stone-600 hover:text-stone-900 font-bold text-sm"
                >
                  -
                </button>
                <span className="text-xs font-bold text-stone-800 min-w-4 text-center">
                  {selectedPhoto.copiesCount || 1}
                </span>
                <button
                  type="button"
                  onClick={() => onChangeCopiesCount?.(selectedPhoto.id, (selectedPhoto.copiesCount || 1) + 1)}
                  className="w-4 h-4 flex items-center justify-center text-stone-600 hover:text-stone-900 font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Trạng thái nằm ở ô & Bỏ khỏi tờ */}
            <div className="flex items-center justify-between text-[11px] text-stone-500 py-0.5">
              <span>Đang nằm ở: <strong className="text-stone-800">{assignedCount} ô</strong></span>
              {assignedCount > 0 && onRemoveFromSlots && (
                <button
                  type="button"
                  onClick={() => onRemoveFromSlots(selectedPhoto.id)}
                  className="text-stone-600 hover:text-red-600 font-medium hover:underline text-[11px]"
                >
                  Bỏ khỏi tờ
                </button>
              )}
            </div>

            {/* Chỉnh ảnh button */}
            {onAdjustPhotoFilter && (
              <button
                type="button"
                onClick={() => onAdjustPhotoFilter(selectedPhoto)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Chỉnh ảnh</span>
              </button>
            )}

            {/* Action buttons row: Căn trong khung, Xoay, Xóa */}
            <div className="flex items-center gap-1.5">
              {onAdjustPhotoCrop && (
                <button
                  type="button"
                  onClick={() => onAdjustPhotoCrop(selectedPhoto)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-stone-200 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold rounded-lg transition shadow-2xs"
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>Căn trong khung</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onRotatePhoto(selectedPhoto.id)}
                className="p-1.5 border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 rounded-lg transition"
                title="Xoay 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onRemovePhoto(selectedPhoto.id)}
                className="p-1.5 border border-stone-200 bg-white hover:bg-red-50 text-stone-500 hover:text-red-600 rounded-lg transition"
                title="Xóa khỏi kho"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}
    </aside>
  );
};
