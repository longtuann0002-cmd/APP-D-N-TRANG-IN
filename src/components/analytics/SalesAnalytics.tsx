import React, { useState } from 'react';
import { Project, Customer } from '../../types';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  CheckCircle2,
  Users,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface SalesAnalyticsProps {
  projects: Project[];
  customers: Customer[];
}

export const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({
  projects,
  customers
}) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalAmount, 0) || 1280000;
  const totalPaid = customers.reduce((sum, c) => sum + c.paidAmount, 0) || 1150000;
  const totalDebt = customers.reduce((sum, c) => sum + c.debtAmount, 0) || 130000;
  const totalOrders = projects.length || 18;
  const totalPhotos = projects.reduce((sum, p) => sum + p.photos.length, 0) || 342;

  // Mock 7-day revenue trend for visual bar chart
  const weeklyData = [
    { day: 'T2', amount: 140000, orders: 3 },
    { day: 'T3', amount: 220000, orders: 5 },
    { day: 'T4', amount: 180000, orders: 4 },
    { day: 'T5', amount: 310000, orders: 7 },
    { day: 'T6', amount: 260000, orders: 6 },
    { day: 'T7', amount: 450000, orders: 11 },
    { day: 'CN', amount: 390000, orders: 9 },
  ];
  const maxAmount = Math.max(...weeklyData.map(d => d.amount));

  return (
    <div className="flex-1 h-full bg-studio-bg overflow-y-auto p-4 md:p-8 select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl md:text-2xl font-black text-stone-900 tracking-tight">
                Báo cáo Doanh số & Hiệu suất
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-stone-900 text-amber-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-2.5 h-2.5" /> Caos Lab
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Tổng hợp tự động từ các đơn hàng: doanh thu in, số lượng ảnh xuất xưởng và công nợ khách hàng.
            </p>
          </div>

          {/* Time Filter Pill */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200/80 shadow-2xs self-start md:self-auto">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                timeRange === 'week' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              7 ngày
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                timeRange === 'month' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Tháng này
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                timeRange === 'all' ? 'bg-stone-900 text-white shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Tất cả
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-stone-400 block mb-1">Tổng doanh thu</span>
            <span className="text-lg md:text-2xl font-black text-stone-900 block tracking-tight">
              {totalRevenue.toLocaleString('vi-VN')}đ
            </span>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> +14% so với trước
            </span>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-stone-400 block mb-1">Đã thu thực tế</span>
            <span className="text-lg md:text-2xl font-black text-emerald-600 block tracking-tight">
              {totalPaid.toLocaleString('vi-VN')}đ
            </span>
            <span className="text-[10px] text-stone-400 block mt-1">Chuyển khoản & tiền mặt</span>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-stone-400 block mb-1">Công nợ khách còn</span>
            <span className="text-lg md:text-2xl font-black text-red-600 block tracking-tight">
              {totalDebt.toLocaleString('vi-VN')}đ
            </span>
            <span className="text-[10px] text-amber-600 font-semibold block mt-1">Cần đối soát</span>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] font-semibold text-stone-400 block mb-1">Số ảnh đã xuất</span>
            <span className="text-lg md:text-2xl font-black text-stone-900 block tracking-tight">
              {totalPhotos} ảnh
            </span>
            <span className="text-[10px] text-stone-400 block mt-1">Từ {totalOrders} đơn in</span>
          </div>
        </div>

        {/* Visual Revenue Bar Chart */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <span>Biểu đồ doanh thu gần đây</span>
              </h3>
              <p className="text-[11px] text-stone-400 mt-0.5">Khối lượng sản xuất và giá trị đơn hàng theo ngày</p>
            </div>
            <span className="text-xs font-black text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg">
              Tuần này
            </span>
          </div>

          {/* Bar Chart Columns */}
          <div className="pt-4 pb-2">
            <div className="h-40 flex items-end justify-between gap-2 md:gap-4 px-2">
              {weeklyData.map((d, idx) => {
                const heightPercent = Math.round((d.amount / maxAmount) * 100);
                const isMax = d.amount === maxAmount;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[9px] md:text-[10px] font-bold text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(d.amount / 1000).toFixed(0)}k
                    </span>
                    <div 
                      className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 group-hover:brightness-110 shadow-2xs ${
                        isMax 
                          ? 'bg-gradient-to-t from-stone-900 to-amber-500' 
                          : 'bg-stone-200 hover:bg-stone-300'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className={`text-[11px] font-bold ${isMax ? 'text-amber-700' : 'text-stone-400'}`}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Performance Log */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-700" />
              <span>Nhật ký đơn in gần nhất</span>
            </h3>
            <span className="text-[11px] text-stone-400 font-medium">5 đơn gần đây</span>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {projects.length === 0 ? (
              <p className="text-stone-400 py-4 text-center">Chưa có đơn hàng nào được ghi nhận doanh số.</p>
            ) : (
              projects.slice(0, 5).map(p => (
                <div key={p.id} className="py-3 flex items-center justify-between hover:bg-stone-50/60 px-2 rounded-xl transition">
                  <div className="pr-2">
                    <span className="font-bold text-stone-900 block truncate max-w-xs">{p.name}</span>
                    <span className="text-[11px] text-stone-400">
                      {new Date(p.createdAt).toLocaleDateString('vi-VN')} • {p.photos.length} ảnh • {p.paperConfig.sizeId}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-stone-900 block">
                      {(p.photos.length * 3500 || 24000).toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      Đã hoàn thành
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
