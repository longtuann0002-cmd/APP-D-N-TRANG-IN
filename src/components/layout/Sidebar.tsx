import React from 'react';
import { 
  Layers, 
  LayoutTemplate, 
  Users, 
  Tag, 
  BarChart3, 
  Printer, 
  Settings, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Database,
  Cloud,
  CloudOff
} from 'lucide-react';
import { UserProfile } from '../../core/storage/supabaseClient';

export type ActiveTab = 'orders' | 'editor' | 'templates' | 'customers' | 'pricing' | 'analytics' | 'calibration';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  orderCount?: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCalibration: () => void;
  onOpenAuth: () => void;
  isSupabaseConnected: boolean;
  shopInfo?: { name: string; tagline: string; logoUrl?: string };
  onOpenEditLogo?: () => void;
  currentUser?: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  orderCount = 0,
  collapsed,
  onToggleCollapse,
  onOpenCalibration,
  onOpenAuth,
  isSupabaseConnected,
  shopInfo,
  onOpenEditLogo,
  currentUser
}) => {
  const menuItems = [
    { id: 'orders' as ActiveTab, label: 'Đơn hàng', icon: Layers, badge: orderCount > 0 ? orderCount : undefined },
    { id: 'templates' as ActiveTab, label: 'Template', icon: LayoutTemplate },
    { id: 'customers' as ActiveTab, label: 'Khách hàng', icon: Users },
    { id: 'pricing' as ActiveTab, label: 'Bảng giá', icon: Tag },
    { id: 'analytics' as ActiveTab, label: 'Doanh số', icon: BarChart3 },
  ];

  return (
    <aside 
      className={`hidden md:flex h-screen bg-studio-sidebar border-r border-studio-border flex-col justify-between transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Top Logo */}
      <div>
        <div className="h-14 flex items-center px-4 border-b border-studio-border/60">
          <div 
            className="flex items-center gap-2.5 cursor-pointer group" 
            onClick={onOpenEditLogo || (() => onSelectTab('orders'))}
            title="Nhấn để đổi logo & tên tiệm"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-stone-900 via-stone-800 to-orange-500 flex items-center justify-center text-white font-extrabold shadow-sm shadow-stone-900/30 overflow-hidden shrink-0">
              {shopInfo?.logoUrl ? (
                <img src={shopInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-base tracking-tighter">{shopInfo?.name?.charAt(0).toUpperCase() || 'C'}</span>
              )}
            </div>
            {!collapsed && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-stone-900 tracking-tight">{shopInfo?.name || 'Caos'}</span>
                <span className="text-[10px] bg-stone-900 text-orange-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                  {shopInfo?.tagline || 'Print'}
                </span>
                <span className="text-stone-300 group-hover:text-stone-700 text-xs">✏️</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-stone-900 shadow-sm border border-stone-200/80 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-600' : 'text-stone-500'}`} />
                {!collapsed && (
                  <div className="flex items-center justify-between w-full">
                    <span>{item.label}</span>
                    <div className="flex items-center gap-1.5">
                      {item.badge !== undefined && (
                        <span className="text-xs bg-stone-200 text-stone-700 px-1.5 py-0.2 rounded-full font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-2 border-t border-studio-border/60 space-y-2">
        {/* Studio Info / User card */}
        {!collapsed && (
          <div 
            onClick={onOpenAuth}
            className="bg-stone-50 hover:bg-stone-100/90 border border-stone-200/80 rounded-xl p-2.5 cursor-pointer transition group shadow-2xs"
            title="Nhấn để xem thông tin tài khoản"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-0.5">
              <span className="truncate max-w-[105px]">
                {currentUser ? currentUser.fullName : 'Caos Studio'}
              </span>
              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${
                currentUser 
                  ? (currentUser.isCloud ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700') 
                  : 'bg-stone-200 text-stone-600'
              }`}>
                {currentUser ? (currentUser.isCloud ? 'Cloud' : 'Offline') : 'Chưa đăng nhập'}
              </span>
            </div>
            <p className="text-[10px] text-stone-500 truncate">
              {currentUser ? currentUser.email : 'Nhấn để đăng nhập tiệm'}
            </p>
          </div>
        )}

        {/* Action icons */}
        <div className={`flex items-center pt-1 ${collapsed ? 'flex-col gap-1' : 'justify-between'}`}>
          <button
            onClick={onOpenCalibration}
            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-md transition"
            title="Căn lề máy in"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAuth}
            className={`p-1.5 rounded-md transition flex items-center gap-1 ${
              isSupabaseConnected 
                ? 'text-emerald-600 hover:bg-emerald-50' 
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
            title={isSupabaseConnected ? 'Đã kết nối Supabase Cloud' : 'Chế độ lưu trữ Offline / Cấu hình Cloud'}
          >
            <Database className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-md transition"
            title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
