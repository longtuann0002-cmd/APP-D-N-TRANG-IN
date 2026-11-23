import React from 'react';
import { 
  Layers, 
  LayoutTemplate, 
  Users, 
  Tag, 
  Plus, 
  FolderDown, 
  Sparkles,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface MobileTabBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  orderCount?: number;
  onOpenNewOrder: () => void;
  // In editor mode
  inEditorMode?: boolean;
  onBackToOrders?: () => void;
  onOpenMobilePhotos?: () => void;
  onOpenMobileSettings?: () => void;
  onQuickAutoLayout?: () => void;
  onOpenExportModal?: () => void;
  photosCount?: number;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
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
  photosCount = 0
}) => {
  // If in Editor mode, show iOS Editor Action Bar
  if (inEditorMode) {
    return (
      <nav 
        aria-label="Editor Mobile Toolbar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/92 backdrop-blur-xl border-t border-stone-200/90 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 px-3 md:hidden shadow-[0_-6px_25px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-center justify-between gap-1 max-w-md mx-auto">
          {/* Back to Orders */}
          <button
            onClick={onBackToOrders}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-stone-600 hover:text-stone-900 active:scale-95 transition"
          >
            <ArrowLeft className="w-5 h-5 text-stone-700 mb-0.5" />
            <span className="text-[10px] font-semibold">Đơn hàng</span>
          </button>

          {/* Kho ảnh drawer */}
          <button
            onClick={onOpenMobilePhotos}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-stone-700 hover:text-stone-950 active:scale-95 transition relative"
          >
            <div className="relative">
              <ImageIcon className="w-5 h-5 text-stone-800 mb-0.5" />
              {photosCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-stone-900 text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center leading-tight">
                  {photosCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Kho ảnh</span>
          </button>

          {/* Quick Auto Layout */}
          <button
            onClick={onQuickAutoLayout}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-amber-700 bg-amber-50 border border-amber-200/60 active:scale-95 transition shadow-2xs"
          >
            <Sparkles className="w-5 h-5 text-amber-600 mb-0.5" />
            <span className="text-[10px] font-bold">Dàn tự động</span>
          </button>

          {/* Cài đặt in / Xuất in */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-xl shadow-md shadow-stone-900/20 active:scale-95 transition"
          >
            <FolderDown className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-bold">Xuất in</span>
          </button>
        </div>
      </nav>
    );
  }

  // Standard iOS Bottom Navigation Tab Bar
  const navTabs = [
    { id: 'orders' as ActiveTab, label: 'Đơn in', icon: Layers, badge: orderCount },
    { id: 'templates' as ActiveTab, label: 'Mẫu khung', icon: LayoutTemplate },
    { id: 'customers' as ActiveTab, label: 'Khách hàng', icon: Users },
    { id: 'pricing' as ActiveTab, label: 'Bảng giá', icon: Tag },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/92 backdrop-blur-xl border-t border-stone-200/90 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 px-4 md:hidden shadow-[0_-6px_25px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        {navTabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 active:scale-90 transition-transform ${
                isActive ? 'text-stone-950 font-bold' : 'text-stone-500 hover:text-stone-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-stone-950 stroke-[2.4]' : 'text-stone-500'}`} />
                {!!tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-extrabold px-1 rounded-full min-w-[14px] text-center leading-tight">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* Center Floating Plus Action Button */}
        <div className="flex-shrink-0 px-2 -mt-5">
          <button
            onClick={onOpenNewOrder}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-stone-950 via-stone-800 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-stone-950/30 active:scale-90 active:rotate-45 transition-all border-2 border-white"
            title="Tạo đơn mới"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {navTabs.slice(2, 4).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 active:scale-90 transition-transform ${
                isActive ? 'text-stone-950 font-bold' : 'text-stone-500 hover:text-stone-800 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-stone-950 stroke-[2.4]' : 'text-stone-500'}`} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
