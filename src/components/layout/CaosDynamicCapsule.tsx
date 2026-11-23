import React, { useState } from 'react';
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
  Sliders,
  ChevronUp,
  X
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
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  // ==========================================
  // MODE 1: STUDIO EDITOR CAPSULE
  // ==========================================
  if (inEditorMode) {
    return (
      <div className="fixed bottom-[max(env(safe-area-inset-bottom),18px)] left-1/2 -translate-x-1/2 z-50 md:hidden pointer-events-auto">
        <div className="flex items-center gap-1.5 p-1.5 bg-stone-950/90 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_16px_50px_rgba(0,0,0,0.55),0_0_1px_rgba(255,255,255,0.3)] text-white">
          
          {/* Back to Orders */}
          <button
            onClick={onBackToOrders}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center transition border border-white/10"
            title="Về danh sách đơn"
          >
            <ArrowLeft className="w-4 h-4 text-stone-300" />
          </button>

          {/* Divider */}
          <div className="w-[1px] h-5 bg-white/15 mx-0.5" />

          {/* Kho ảnh Sheet Pill */}
          <button
            onClick={onOpenMobilePhotos}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 transition border border-white/10"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold tracking-tight">Kho ảnh</span>
            {photosCount > 0 && (
              <span className="bg-amber-500/25 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-amber-500/30">
                {photosCount}
              </span>
            )}
          </button>

          {/* Dàn tự động */}
          <button
            onClick={onQuickAutoLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-600/30 to-amber-500/20 hover:from-amber-600/40 hover:to-amber-500/30 text-amber-300 active:scale-95 transition border border-amber-500/40 shadow-xs"
            title="Tự động xếp tối ưu"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold tracking-tight">Auto</span>
          </button>

          {/* Xuất file */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/30 active:scale-95 transition"
          >
            <FolderDown className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Xuất</span>
          </button>

        </div>
      </div>
    );
  }

  // ==========================================
  // MODE 2: DASHBOARD SPATIAL CAPSULE (Caos Island)
  // ==========================================
  const navTabs = [
    { id: 'orders' as ActiveTab, label: 'Đơn', icon: Layers, badge: orderCount },
    { id: 'templates' as ActiveTab, label: 'Mẫu', icon: LayoutTemplate },
    { id: 'customers' as ActiveTab, label: 'Khách', icon: Users },
    { id: 'pricing' as ActiveTab, label: 'Giá', icon: Tag },
  ];

  return (
    <>
      {/* Floating Spatial Capsule */}
      <div className="fixed bottom-[max(env(safe-area-inset-bottom),18px)] left-1/2 -translate-x-1/2 z-50 md:hidden pointer-events-auto">
        <div className="flex items-center gap-1 p-1.5 bg-stone-950/92 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_2px_rgba(255,255,255,0.35)] text-white">
          
          {/* Brand Mark */}
          <div className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80 animate-ping" />
            <span className="font-extrabold text-xs tracking-tight bg-gradient-to-r from-white via-stone-200 to-amber-300 bg-clip-text text-transparent">
              Caos
            </span>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

          {/* Nav Icons */}
          <div className="flex items-center gap-0.5">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative flex items-center justify-center h-8 px-2.5 rounded-full transition-all active:scale-90 ${
                    isActive
                      ? 'bg-white/20 text-white font-bold shadow-xs border border-white/25'
                      : 'text-stone-400 hover:text-white'
                  }`}
                  title={tab.label}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300 stroke-[2.3]' : 'text-stone-400'}`} />
                  <span className={`text-[11px] ml-1 ${isActive ? 'text-white' : 'text-stone-400'}`}>
                    {tab.label}
                  </span>
                  {!!tab.badge && tab.badge > 0 && (
                    <span className="ml-1 bg-amber-500 text-stone-950 text-[9px] font-extrabold px-1 rounded-full leading-tight">
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
            className="flex items-center gap-1 pl-2.5 pr-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-500/35 active:scale-90 transition-transform ml-1"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Tạo</span>
          </button>

        </div>
      </div>
    </>
  );
};
