import React, { useState, useRef } from 'react';
import { X, Upload, RotateCcw, Check, Sparkles, Image as ImageIcon } from 'lucide-react';

export interface ShopInfo {
  name: string;
  tagline: string;
  logoUrl?: string;
}

interface EditLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopInfo: ShopInfo;
  onSave: (info: ShopInfo) => void;
}

export const EditLogoModal: React.FC<EditLogoModalProps> = ({
  isOpen,
  onClose,
  shopInfo,
  onSave
}) => {
  const [name, setName] = useState(shopInfo.name || 'Caos');
  const [tagline, setTagline] = useState(shopInfo.tagline || 'Print');
  const [logoUrl, setLogoUrl] = useState(shopInfo.logoUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh logo dưới 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setLogoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave({
      name: name.trim() || 'Caos',
      tagline: tagline.trim() || 'Print',
      logoUrl: logoUrl.trim()
    });
    onClose();
  };

  const handleReset = () => {
    setName('Caos');
    setTagline('Print');
    setLogoUrl('');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none overscroll-contain animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92dvh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-stone-900 tracking-tight">Tùy chỉnh Logo & Tên Tiệm</h2>
              <p className="text-[11px] text-stone-500">Thay đổi thương hiệu hiển thị trên app</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Live Preview Card */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">Xem trước trên thanh tiêu đề</label>
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-stone-900 via-stone-800 to-orange-500 flex items-center justify-center text-white font-extrabold text-base shadow-sm overflow-hidden shrink-0 border border-stone-800">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span>{name.charAt(0).toUpperCase() || 'C'}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-stone-950 text-base tracking-tight">{name || 'Caos'}</span>
                    <span className="text-[9px] bg-stone-900 text-orange-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                      {tagline || 'Print'}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 block">Tiệm In & Dàn Trang Tự Động</span>
                </div>
              </div>
            </div>
          </div>

          {/* Logo Image Upload */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">Hình ảnh Logo</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 transition active:scale-98"
              >
                <Upload className="w-4 h-4 text-orange-600" />
                <span>{logoUrl ? 'Chọn ảnh khác...' : 'Tải lên ảnh logo'}</span>
              </button>

              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition active:scale-95"
                >
                  Xóa ảnh
                </button>
              )}
            </div>
            <p className="text-[10px] text-stone-400 mt-1">Định dạng PNG, JPG, SVG hoặc WebP (khuyến nghị ảnh vuông &lt; 2MB)</p>
          </div>

          {/* Shop Name & Tagline Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Tên tiệm</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Caos, Studio Ánh Sao..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Nhãn phụ (Tagline)</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="VD: Print, Lab, Photo..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-stone-600 hover:text-stone-900 text-xs font-bold rounded-xl transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold rounded-xl transition active:scale-95"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-orange-500/25 transition active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
