import React, { useMemo, useState } from 'react';
import { Project, Customer, OrderStatus } from '../../types';
import { calculateOrderPrice } from '../../core/pricing/pricingEngine';
import { storageManager } from '../../core/storage/storageManager';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Sparkles
} from 'lucide-react';

interface SalesAnalyticsProps {
  projects: Project[];
  customers: Customer[];
}

function getProjectAmount(p: Project): number {
  const paperFinish = p.paperFinish || p.layoutConfig.paperFinish || 'glossy';
  const lamination = p.lamination || p.layoutConfig.lamination || 'none';

  if (p.layoutConfig.mode === 'multi' && p.layoutConfig.multiSizes && p.layoutConfig.multiSizes.length > 0) {
    return p.layoutConfig.multiSizes.reduce((sum, m) => {
      const res = calculateOrderPrice({
        widthMm: m.widthMm,
        heightMm: m.heightMm,
        quantity: m.count || 1,
        paperFinish,
        lamination,
        nameOrId: m.sizeId || m.name
      });
      return sum + res.totalPrice;
    }, 0);
  }

  const totalSlots = p.pages.reduce((acc, pg) => acc + pg.placedPhotos.length, 0);
  const slotsCount = totalSlots > 0 ? totalSlots : (p.totalPhotosCount || p.photos.length);
  if (slotsCount === 0) return 0;

  const allTemplates = storageManager.getTemplates();
  const matchingTpl = allTemplates.find(t =>
    t.id === p.layoutConfig.photoPresetId?.replace('tpl-', '') ||
    t.name === p.layoutConfig.photoPresetId
  );

  return calculateOrderPrice({
    widthMm: p.layoutConfig.customWidthMm,
    heightMm: p.layoutConfig.customHeightMm,
    quantity: slotsCount,
    paperFinish,
    lamination,
    nameOrId: p.layoutConfig.photoPresetId,
    subSlotLayout: p.layoutConfig.subSlotLayout,
    customOverridePrice: p.layoutConfig.customPrice || matchingTpl?.customPrice,
    priceTiers: matchingTpl?.priceTiers
  }).totalPrice;
}

const STATUS_LABELS: Record<OrderStatus, { label: string; className: string }> = {
  new: { label: 'Mới', className: 'text-sky-700 bg-sky-50' },
  processing: { label: 'Đang xử lý', className: 'text-orange-700 bg-orange-50' },
  in_progress: { label: 'Đang làm', className: 'text-orange-700 bg-orange-50' },
  printed: { label: 'Đã in', className: 'text-emerald-700 bg-emerald-50' },
  delivered: { label: 'Đã giao', className: 'text-emerald-700 bg-emerald-50' }
};

export const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({
  projects,
  customers
}) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');

  const filteredProjects = useMemo(() => {
    if (timeRange === 'all') return projects;
    const now = new Date();
    return projects.filter(p => {
      const created = new Date(p.createdAt);
      if (Number.isNaN(created.getTime())) return false;
      if (timeRange === 'week') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return created >= sevenDaysAgo;
      }
      // month
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    });
  }, [projects, timeRange]);

  const totalRevenue = filteredProjects.reduce((sum, p) => sum + getProjectAmount(p), 0);
  const totalPaid = timeRange === 'all'
    ? customers.reduce((sum, c) => sum + (c.paidAmount || 0), 0)
    : Math.min(totalRevenue, customers.reduce((sum, c) => sum + (c.paidAmount || 0), 0));
  const totalDebt = timeRange === 'all'
    ? customers.reduce((sum, c) => sum + (c.debtAmount || 0), 0)
    : Math.max(0, totalRevenue - totalPaid);
  const totalOrders = filteredProjects.length;
  const totalPhotos = filteredProjects.reduce((sum, p) => sum + (p.totalPhotosCount || p.photos.length || 0), 0);

  // Real 7-day revenue trend for current week (Mon..Sun)
  const weeklyData = useMemo(() => {
    const days = [
      { day: 'T2', amount: 0, orders: 0 },
      { day: 'T3', amount: 0, orders: 0 },
      { day: 'T4', amount: 0, orders: 0 },
      { day: 'T5', amount: 0, orders: 0 },
      { day: 'T6', amount: 0, orders: 0 },
      { day: 'T7', amount: 0, orders: 0 },
      { day: 'CN', amount: 0, orders: 0 },
    ];
    const now = new Date();
    const startOfWeek = new Date(now);
    const currentDay = now.getDay(); // 0 (Sun) .. 6 (Sat)
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    for (const p of projects) {
      const created = new Date(p.createdAt);
      if (Number.isNaN(created.getTime())) continue;
      if (created >= startOfWeek && created < endOfWeek) {
        const idx = created.getDay() === 0 ? 6 : created.getDay() - 1;
        days[idx].amount += getProjectAmount(p);
        days[idx].orders += 1;
      }
    }
    return days;
  }, [projects]);

  const maxAmount = Math.max(...weeklyData.map(d => d.amount), 0);

  return (
    <div 
      className="safe-area-top-page flex-1 h-full bg-studio-bg overflow-y-auto p-4 md:p-8 pb-28 md:pb-8 md:pt-8 select-none"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl md:text-2xl font-black text-stone-900 tracking-tight">
                Báo cáo Doanh số & Hiệu suất
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-stone-900 text-orange-400 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
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
            <span className="text-[10px] font-semibold text-stone-400 flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3 text-emerald-600" /> {totalOrders} đơn trong kỳ
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
            <span className={`text-[10px] font-semibold block mt-1 ${totalDebt > 0 ? 'text-orange-600' : 'text-stone-400'}`}>
              {totalDebt > 0 ? 'Cần đối soát' : 'Không có công nợ'}
            </span>
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
                <BarChart3 className="w-4 h-4 text-orange-500" />
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
                const heightPercent = maxAmount > 0 ? Math.max(4, Math.round((d.amount / maxAmount) * 100)) : 4;
                const isMax = maxAmount > 0 && d.amount === maxAmount;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[9px] md:text-[10px] font-bold text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.amount > 0 ? `${(d.amount / 1000).toFixed(0)}k` : '0đ'}
                    </span>
                    <div 
                      className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 group-hover:brightness-110 shadow-2xs ${
                        isMax 
                          ? 'bg-gradient-to-t from-stone-900 to-orange-500' 
                          : d.amount > 0
                          ? 'bg-stone-300 hover:bg-stone-400'
                          : 'bg-stone-100'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className={`text-[11px] font-bold ${isMax ? 'text-orange-600' : 'text-stone-400'}`}>
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
              projects.slice(0, 5).map(p => {
                const statusInfo = STATUS_LABELS[p.status] || { label: 'Mới', className: 'text-stone-600 bg-stone-100' };
                return (
                  <div key={p.id} className="py-3 flex items-center justify-between hover:bg-stone-50/60 px-2 rounded-xl transition">
                    <div className="pr-2">
                      <span className="font-bold text-stone-900 block truncate max-w-xs">{p.name}</span>
                      <span className="text-[11px] text-stone-400">
                        {new Date(p.createdAt).toLocaleDateString('vi-VN')} • {p.totalPhotosCount || p.photos.length} ảnh • {p.paperConfig.sizeId}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-stone-900 block">
                        {getProjectAmount(p).toLocaleString('vi-VN')}đ
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
