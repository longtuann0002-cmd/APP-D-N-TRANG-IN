import React from 'react';
import { Search, Plus, User, Sparkles, Database } from 'lucide-react';
import { OrderStatus } from '../../types';

interface TopBarProps {
  currentStatusFilter: OrderStatus | 'all';
  onSelectStatusFilter: (status: OrderStatus | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewOrder: () => void;
  onOpenAuth: () => void;
  statusCounts: Record<OrderStatus | 'all', number>;
  isSupabaseConnected: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentStatusFilter,
  onSelectStatusFilter,
  searchQuery,
  onSearchChange,
  onOpenNewOrder,
  onOpenAuth,
  statusCounts,
  isSupabaseConnected
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
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm đơn hoặc tên khách..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-56 pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition"
          />
        </div>

        <button
          onClick={onOpenNewOrder}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo đơn mới</span>
        </button>

        <button
          onClick={onOpenAuth}
          className="p-1.5 border border-stone-200 hover:border-stone-300 rounded-lg bg-stone-50 hover:bg-stone-100 transition flex items-center gap-1 text-stone-700"
          title="Tài khoản & Kết nối Supabase"
        >
          <User className="w-4 h-4 text-stone-600" />
          {isSupabaseConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          )}
        </button>
      </div>
    </header>
  );
};
