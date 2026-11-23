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
  FolderDown
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
  onQuickAutoLayout?: () => void;
  onOpenExportModal?: () => void;
  photosCount?: number;
}

export const CaosDynamicCapsule: React.FC<CaosDynamicCapsuleProps> = ({
  activeTab,
  onSelectTab,
  orderCount = 0,
  onOpenNewOrder,
  inEditorMode = false,
  onBackToOrders,
  onOpenMobilePhotos,
  onQuickAutoLayout,
  onOpenExportModal,
  photosCount = 0
}) => {
  // ==========================================
  // MODE 1: STUDIO EDITOR CAPSULE
  // ==========================================
  if (inEditorMode) {
    return (
      <div className="fixed bottom-[max(env(safe-area-inset-bottom),14px)] left-1/2 -translate-x-1/2 z-50 md:hidden pointer-events-auto max-w-[92vw]">
        <div 
          className="flex items-center gap-1.5 p-1.5 rounded-full border border-stone-700/80 shadow-[0_16px_50px_rgba(0,0,0,0.65)] text-white backdrop-blur-2xl"
          style={{ backgroundColor: 'rgba(20, 18, 16, 0.95)' }}
        >
          {/* Back to Orders */}
          <button
            onClick={onBackToOrders}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center transition border border-white/10 shrink-0"
            title="Về danh sách đơn"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>

          {/* Divider */}
          <div className="w-[1px] h-4 bg-white/20 shrink-0" />

          {/* Kho ảnh Sheet Pill */}
          <button
            onClick={onOpenMobilePhotos}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition border border-white/10 text-xs font-semibold shrink-0"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>Kho ảnh</span>
            {photosCount > 0 && (
              <span className="bg-amber-500 text-stone-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ml-0.5">
                {photosCount}
              </span>
            )}
          </button>

          {/* Dàn tự động */}
          <button
            onClick={onQuickAutoLayout}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 active:scale-95 transition text-xs font-bold shrink-0"
            title="Tự động xếp tối ưu"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto</span>
          </button>

          {/* Xuất file */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs shadow-md shadow-amber-500/30 active:scale-95 transition shrink-0"
          >
            <FolderDown className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Xuất</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // MODE 2: DASHBOARD SPATIAL CAPSULE
  // ==========================================
  const navTabs = [
    { id: 'orders' as ActiveTab, label: 'Đơn', icon: Layers, badge: orderCount },
    { id: 'templates' as ActiveTab, label: 'Mẫu', icon: LayoutTemplate },
    { id: 'customers' as ActiveTab, label: 'Khách', icon: Users },
    { id: 'pricing' as ActiveTab, label: 'Giá', icon: Tag },
  ];

  return (
    <div className="fixed bottom-[max(env(safe-area-inset-bottom),14px)] left-1/2 -translate-x-1/2 z-50 md:hidden pointer-events-auto max-w-[94vw]">
      <div 
        className="flex items-center gap-1 p-1.5 rounded-full border border-stone-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.7)] text-white backdrop-blur-2xl"
        style={{ backgroundColor: 'rgba(18, 17, 16, 0.95)' }}
      >
        {/* Brand Mark */}
        <div className="flex items-center gap-1 pl-2.5 pr-1 py-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="font-black text-xs tracking-tight text-white">
            Caos
          </span>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-white/20 mx-0.5 shrink-0" />

        {/* Nav Tabs */}
        <div className="flex items-center gap-0.5">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center justify-center h-8 px-2 rounded-full transition-all active:scale-90 ${
                  isActive
                    ? 'bg-white/20 text-amber-300 font-bold border border-white/25 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
                title={tab.label}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400 stroke-[2.5]' : 'text-stone-300'}`} />
                <span className={`text-[11px] ml-1 font-semibold ${isActive ? 'text-white font-bold' : 'text-stone-300'}`}>
                  {tab.label}
                </span>
                {!!tab.badge && tab.badge > 0 && (
                  <span className="ml-1 bg-amber-500 text-stone-950 text-[9px] font-black px-1 rounded-full leading-tight">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Create Button */}
        <button
          onClick={onOpenNewOrder}
          className="flex items-center gap-1 pl-2 pr-2.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md shadow-amber-500/40 active:scale-90 transition-transform ml-0.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Tạo</span>
        </button>
      </div>
    </div>
  );
};
