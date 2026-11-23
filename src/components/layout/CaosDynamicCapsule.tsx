import React from 'react';
import { 
  Layers, 
  LayoutTemplate, 
  Users, 
  Tag, 
  Plus, 
  Sparkles, 
  ArrowLeft, 
  Image as ImageIcon, 
  FolderDown,
  Sliders
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface CaosDynamicCapsuleProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  orderCount?: number;
  onOpenNewOrder: () => void;
  // Editor mode props
  inEditorMode?: boolean;
  onBackToOrders?: () => void;
  onOpenMobilePhotos?: () => void;
  onOpenMobileSettings?: () => void;
  onQuickAutoLayout?: () => void;
  onOpenExportModal?: () => void;
  photosCount?: number;
  hasActiveModal?: boolean;
}

export const CaosDynamicCapsule: React.FC<CaosDynamicCapsuleProps> = ({
  activeTab,
  onSelectTab,
  orderCount = 0,
  onOpenNewOrder,
  inEditorMode = false,
  onBackToOrders,
  onOpenMobilePhotos,
  onOpenMobileSettings,
  onQuickAutoLayout,
  onOpenExportModal,
  photosCount = 0,
  hasActiveModal = false
}) => {
  // Hide bottom bar completely whenever any modal is open
  if (hasActiveModal) {
    return null;
  }

  // ==========================================
  // MODE 1: STUDIO EDITOR TOOLBAR (Mobile)
  // ==========================================
  if (inEditorMode) {
    return (
      <nav
        aria-label="Editor Mobile Action Bar"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-stone-950/98 backdrop-blur-2xl border-t border-white/15 shadow-[0_-12px_40px_rgba(0,0,0,0.6)] pt-2.5 pb-[max(env(safe-area-inset-bottom),26px)] px-3 select-none"
      >
        <div className="flex items-center justify-between gap-1 max-w-md mx-auto">
          {/* Back to Orders */}
          <button
            type="button"
            onClick={onBackToOrders}
            className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-stone-300 hover:text-white active:scale-95 transition min-h-[44px]"
            title="Về danh sách đơn hàng"
          >
            <ArrowLeft className="w-5 h-5 mb-0.5 text-stone-300" />
            <span className="text-[10px] font-semibold">Đơn hàng</span>
          </button>

          {/* Kho ảnh Sheet Pill */}
          <button
            type="button"
            onClick={onOpenMobilePhotos}
            className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-stone-300 hover:text-white active:scale-95 transition min-h-[44px] relative"
            title="Mở kho ảnh"
          >
            <div className="relative">
              <ImageIcon className="w-5 h-5 mb-0.5 text-amber-400" />
              {photosCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-stone-950 text-[9px] font-black px-1.5 py-0.2 rounded-full leading-tight">
                  {photosCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold text-white">Kho ảnh</span>
          </button>

          {/* Cài đặt in Sheet Pill */}
          {onOpenMobileSettings && (
            <button
              type="button"
              onClick={onOpenMobileSettings}
              className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-stone-300 hover:text-white active:scale-95 transition min-h-[44px]"
              title="Thiết lập khổ giấy & viền"
            >
              <Sliders className="w-5 h-5 mb-0.5 text-stone-300" />
              <span className="text-[10px] font-semibold">Cài đặt</span>
            </button>
          )}

          {/* Dàn tự động */}
          <button
            type="button"
            onClick={onQuickAutoLayout}
            className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-amber-400 hover:text-amber-300 active:scale-95 transition min-h-[44px]"
            title="Tự động sắp xếp ảnh tối ưu"
          >
            <Sparkles className="w-5 h-5 mb-0.5 text-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold">Auto</span>
          </button>

          {/* Xuất file */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-md shadow-amber-500/30 active:scale-95 transition shrink-0 min-h-[44px]"
            title="Xuất file in PDF hoặc JPG"
          >
            <FolderDown className="w-4 h-4 stroke-[2.5]" />
            <span>Xuất</span>
          </button>
        </div>
      </nav>
    );
  }

  // ==========================================
  // MODE 2: DASHBOARD MAIN NAVIGATION (Mobile)
  // ==========================================
  return (
    <nav
      aria-label="Main Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-stone-950/98 backdrop-blur-2xl border-t border-white/15 shadow-[0_-12px_40px_rgba(0,0,0,0.6)] pt-2.5 pb-[max(env(safe-area-inset-bottom),26px)] px-3 select-none"
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Tab 1: Đơn hàng */}
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition active:scale-95 min-h-[44px] ${
            activeTab === 'orders' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className="relative">
            <Layers className={`w-5 h-5 mb-0.5 ${activeTab === 'orders' ? 'text-amber-400 stroke-[2.5]' : 'text-stone-400'}`} />
            {orderCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-stone-950 text-[9px] font-black px-1.5 rounded-full leading-tight">
                {orderCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Đơn hàng</span>
        </button>

        {/* Tab 2: Kho mẫu */}
        <button
          type="button"
          onClick={() => onSelectTab('templates')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition active:scale-95 min-h-[44px] ${
            activeTab === 'templates' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <LayoutTemplate className={`w-5 h-5 mb-0.5 ${activeTab === 'templates' ? 'text-amber-400 stroke-[2.5]' : 'text-stone-400'}`} />
          <span className="text-[10px]">Kho mẫu</span>
        </button>

        {/* Center: + Tạo đơn (Elevated CTA) */}
        <div className="px-1 shrink-0">
          <button
            type="button"
            onClick={onOpenNewOrder}
            className="w-12 h-12 -mt-5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 flex flex-col items-center justify-center shadow-lg shadow-amber-500/40 border-2 border-stone-950 active:scale-90 transition-transform"
            title="Tạo đơn in mới"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
          <span className="block text-center text-[9px] font-bold text-amber-400 mt-0.5">Tạo đơn</span>
        </div>

        {/* Tab 3: Khách hàng */}
        <button
          type="button"
          onClick={() => onSelectTab('customers')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition active:scale-95 min-h-[44px] ${
            activeTab === 'customers' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Users className={`w-5 h-5 mb-0.5 ${activeTab === 'customers' ? 'text-amber-400 stroke-[2.5]' : 'text-stone-400'}`} />
          <span className="text-[10px]">Khách</span>
        </button>

        {/* Tab 4: Bảng giá */}
        <button
          type="button"
          onClick={() => onSelectTab('pricing')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition active:scale-95 min-h-[44px] ${
            activeTab === 'pricing' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Tag className={`w-5 h-5 mb-0.5 ${activeTab === 'pricing' ? 'text-amber-400 stroke-[2.5]' : 'text-stone-400'}`} />
          <span className="text-[10px]">Bảng giá</span>
        </button>
      </div>
    </nav>
  );
};
