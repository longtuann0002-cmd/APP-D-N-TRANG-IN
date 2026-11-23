import React, { useRef, useState } from 'react';
import { 
  Upload, 
  Trash2, 
  RotateCw, 
  CheckSquare, 
  Square, 
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { PhotoItem } from '../../types';
import { processUploadedFile } from '../../core/image/imageProcessor';

interface PhotoManagerDrawerProps {
  photos: PhotoItem[];
  onAddPhotos: (newPhotos: PhotoItem[]) => void;
  onRemovePhoto: (id: string) => void;
  onBatchRemovePhotos: (ids: string[]) => void;
  onRotatePhoto: (id: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const PhotoManagerDrawer: React.FC<PhotoManagerDrawerProps> = ({
  photos,
  onAddPhotos,
  onRemovePhoto,
  onBatchRemovePhotos,
  onRotatePhoto,
  isExpanded,
  onToggleExpand
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles: File[] = [];
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (validTypes.includes(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name)) {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) {
      setErrorMessage('Vui lòng chọn file ảnh hợp lệ (JPG, JPEG, PNG, WEBP).');
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgress(10);

    const processed: PhotoItem[] = [];
    for (let i = 0; i < validFiles.length; i++) {
      try {
        const item = await processUploadedFile(validFiles[i]);
        processed.push(item);
        setUploadProgress(Math.round(((i + 1) / validFiles.length) * 90));
      } catch (err: any) {
        console.error('Error processing photo:', err);
      }
    }

    onAddPhotos(processed);
    setUploadProgress(100);
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
    }, 400);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(photos.map(p => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    onBatchRemovePhotos(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleDragStartPhoto = (e: React.DragEvent, photoId: string) => {
    e.dataTransfer.setData('text/plain', photoId);
    e.dataTransfer.setData('application/photodesk-photo', photoId);
  };

  return (
    <div className={`bg-white border-t border-studio-border transition-all duration-300 z-20 flex flex-col ${
      isExpanded ? 'h-52' : 'h-12'
    }`}>
      {/* Top Header Bar */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-stone-100 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-900 hover:text-brand-600 transition"
          >
            <ImageIcon className="w-4 h-4 text-brand-600" />
            <span>Kho ảnh dự án ({photos.length})</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-stone-400" /> : <ChevronUp className="w-3.5 h-3.5 text-stone-400" />}
          </button>

          {isExpanded && photos.length > 0 && (
            <div className="flex items-center gap-2 border-l border-stone-200 pl-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900"
              >
                {selectedIds.size === photos.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-brand-600" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-stone-400" />
                )}
                <span>Chọn tất cả</span>
              </button>

              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 bg-red-50 px-2 py-0.5 rounded transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa ({selectedIds.size})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Upload Action */}
        <div className="flex items-center gap-2">
          {errorMessage && (
            <div className="flex items-center gap-1 text-[11px] text-red-600">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMessage}</span>
            </div>
          )}

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
            className="flex items-center gap-1.5 px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition active:scale-95 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? `Đang tải (${uploadProgress}%)...` : 'Tải thêm ảnh'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar when uploading */}
      {isUploading && (
        <div className="w-full bg-stone-100 h-1">
          <div
            className="bg-brand-600 h-full transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Scrollable Photos Strip */}
      {isExpanded && (
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="flex-1 p-3 overflow-x-auto flex items-center gap-3 bg-stone-50/50"
        >
          {photos.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 h-full border-2 border-dashed border-stone-200 hover:border-brand-400 rounded-xl flex flex-col items-center justify-center cursor-pointer transition p-4 text-center group"
            >
              <Upload className="w-6 h-6 text-stone-400 group-hover:text-brand-600 mb-1 transition" />
              <p className="text-xs font-semibold text-stone-700">Kéo thả ảnh vào đây hoặc bấm để chọn ảnh</p>
              <p className="text-[10px] text-stone-400">Hỗ trợ JPG, JPEG, PNG, WEBP. Tự động dàn trang tối ưu.</p>
            </div>
          ) : (
            <>
              {/* Quick Dropzone thumbnail */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-32 shrink-0 border-2 border-dashed border-stone-300 hover:border-brand-500 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-white transition text-stone-400 hover:text-brand-600"
              >
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-semibold">+ Thêm</span>
              </div>

              {photos.map((photo) => {
                const isSelected = selectedIds.has(photo.id);
                return (
                  <div
                    key={photo.id}
                    draggable
                    onDragStart={(e) => handleDragStartPhoto(e, photo.id)}
                    className={`w-28 h-32 shrink-0 bg-white rounded-lg border p-1.5 flex flex-col justify-between shadow-2xs relative group transition-all cursor-grab active:cursor-grabbing ${
                      isSelected ? 'border-brand-600 ring-2 ring-brand-400' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {/* Top overlay controls */}
                    <div className="flex items-center justify-between z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectOne(photo.id);
                        }}
                        className="text-stone-400 hover:text-brand-600"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-brand-600" />
                        ) : (
                          <Square className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                        )}
                      </button>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRotatePhoto(photo.id);
                          }}
                          className="p-1 text-stone-500 hover:text-stone-900 bg-white/80 rounded"
                          title="Xoay ảnh 90°"
                        >
                          <RotateCw className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemovePhoto(photo.id);
                          }}
                          className="p-1 text-red-500 hover:text-red-700 bg-white/80 rounded"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Image Preview Thumbnail */}
                    <div className="w-full flex-1 overflow-hidden rounded bg-stone-100 flex items-center justify-center my-1">
                      <img
                        src={photo.url}
                        alt={photo.originalName}
                        className="max-w-full max-h-full object-contain transition-transform"
                        style={{
                          transform: `rotate(${photo.rotation || 0}deg)`
                        }}
                      />
                    </div>

                    {/* Footer Info */}
                    <div className="text-[10px] text-stone-500 flex items-center justify-between px-0.5">
                      <span className="truncate max-w-[50px] font-medium" title={photo.originalName}>
                        {photo.originalName}
                      </span>
                      <span className="text-[9px] text-stone-400">
                        {photo.widthPx}x{photo.heightPx}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};
