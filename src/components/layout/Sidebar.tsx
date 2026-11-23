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
  Database
} from 'lucide-react';

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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  orderCount = 0,
  collapsed,
  onToggleCollapse,
  onOpenCalibration,
  onOpenAuth,
  isSupabaseConnected
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
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab('orders')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-stone-900 via-stone-800 to-amber-600 flex items-center justify-center text-white font-extrabold shadow-sm shadow-stone-900/30">
              <span className="text-base tracking-tighter">C</span>
            </div>
            {!collapsed && (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-stone-900 tracking-tight">Caos</span>
                <span className="text-[10px] bg-stone-900 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Print</span>
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
        {/* Studio Info card */}
        {!collapsed && (
          <div className="bg-stone-50 border border-stone-200/80 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-0.5">
              <span>PhotoDesk Studio</span>
              <span className="text-[10px] text-emerald-600 font-bold">Mở khóa 100%</span>
            </div>
            <p className="text-[10px] text-stone-500">Đầy đủ tính năng in ấn & xuất PDF/JPG</p>
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
