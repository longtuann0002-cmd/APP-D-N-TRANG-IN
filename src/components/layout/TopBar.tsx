import React from 'react';
import { Search, Plus, User, Sparkles, Database, LogIn, Cloud } from 'lucide-react';
import { OrderStatus } from '../../types';
import { UserProfile } from '../../core/storage/supabaseClient';

interface TopBarProps {
  currentStatusFilter: OrderStatus | 'all';
  onSelectStatusFilter: (status: OrderStatus | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewOrder: () => void;
  onOpenAuth: () => void;
  statusCounts: Record<OrderStatus | 'all', number>;
  isSupabaseConnected: boolean;
  currentUser: UserProfile | null;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentStatusFilter,
  onSelectStatusFilter,
  searchQuery,
  onSearchChange,
  onOpenNewOrder,
  onOpenAuth,
  statusCounts,
  isSupabaseConnected,
  currentUser
}) => {
  const tabs: { id: OrderStatus | 'all'; label: string }[] = [
    { id: 'processing', label: 'Đang xử lý' },
    { id: 'new', label: 'Mới' },
    { id: 'in_progress', label: 'Đang làm' },
    { id: 'printed', label: 'Đã in' },
    { id: 'delivered', label: 'Đã giao' },
    { id: 'all', label: 'Tất cả' },
  ];

  return (
    <header className="h-14 bg-white border-b border-studio-border px-5 flex items-center justify-between gap-4 z-20">
      {/* Status filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => {
          const isSelected = currentStatusFilter === tab.id;
          const count = statusCounts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectStatusFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                isSelected
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100/80 text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-stone-800 text-stone-200' : 'bg-stone-200/80 text-stone-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right controls: search + action button + profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm đơn hoặc tên khách..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-52 pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-full text-xs placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-orange-500/30 focus:bg-white transition"
          />
        </div>

        <button
          onClick={onOpenNewOrder}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-full shadow-xs transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo đơn mới</span>
        </button>

        {/* Profile / Login Button */}
        {currentUser ? (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 pl-1.5 pr-3 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200/90 rounded-full transition active:scale-95 text-stone-800 group"
            title={`Tài khoản: ${currentUser.fullName} (${currentUser.email})`}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-stone-900 to-orange-500 flex items-center justify-center text-white text-[11px] font-bold shadow-xs">
              {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'C'}
            </div>
            <span className="text-xs font-bold truncate max-w-[110px] text-stone-800">
              {currentUser.fullName}
            </span>
            <span 
              className={`w-2 h-2 rounded-full shrink-0 ${
                currentUser.isCloud ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
              title={currentUser.isCloud ? 'Đã liên kết Cloud Supabase' : 'Lưu trữ Cục Bộ'}
            />
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200/80 rounded-full text-xs font-bold text-orange-700 transition active:scale-95 shadow-xs"
            title="Đăng nhập tài khoản tiệm"
          >
            <LogIn className="w-3.5 h-3.5 text-orange-600" />
            <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </header>
  );
};
