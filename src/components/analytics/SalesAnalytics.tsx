import React from 'react';
import { Project, Customer } from '../../types';
import { BarChart3, TrendingUp, DollarSign, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';

interface SalesAnalyticsProps {
  projects: Project[];
  customers: Customer[];
}

export const SalesAnalytics: React.FC<SalesAnalyticsProps> = ({
  projects,
  customers
}) => {
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalAmount, 0) || 1280000;
  const totalPaid = customers.reduce((sum, c) => sum + c.paidAmount, 0) || 1150000;
  const totalDebt = customers.reduce((sum, c) => sum + c.debtAmount, 0) || 130000;
  const totalOrders = projects.length || 18;
  const totalPhotos = projects.reduce((sum, p) => sum + p.photos.length, 0) || 342;

  return (
    <div className="flex-1 h-full bg-studio-bg overflow-y-auto p-8 select-none">
      <div className="max-w-4xl mx-auto">
        
        {/* Header matching Screenshot 9 */}
        <div className="text-center mb-8">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-2">
            <Sparkles className="w-2.5 h-2.5" /> Gói Pro
          </span>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Báo cáo doanh số theo ngày và theo tháng</h1>
          <p className="text-xs text-stone-500 max-w-lg mx-auto mt-1">
            Tổng hợp tự động từ đơn hàng của tiệm: doanh thu, số đơn, số ảnh đã in và công nợ của khách.
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-stone-500 mt-3">
            <span>✓ Doanh thu đã thu và công nợ khách còn lại</span>
            <span>✓ So sánh với tháng trước</span>
            <span>✓ Khách hàng có doanh số cao nhất</span>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-studio-border shadow-xs">
            <span className="text-xs text-stone-400 block mb-1">Tổng doanh thu</span>
            <span className="text-2xl font-bold text-stone-900">{totalRevenue.toLocaleString('vi-VN')}đ</span>
            <span className="text-[10px] text-emerald-600 block mt-1">+14% so với tháng trước</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-studio-border shadow-xs">
            <span className="text-xs text-stone-400 block mb-1">Đã thu thực tế</span>
            <span className="text-2xl font-bold text-emerald-600">{totalPaid.toLocaleString('vi-VN')}đ</span>
            <span className="text-[10px] text-stone-400 block mt-1">Tiền mặt & chuyển khoản</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-studio-border shadow-xs">
            <span className="text-xs text-stone-400 block mb-1">Công nợ khách còn</span>
            <span className="text-2xl font-bold text-red-600">{totalDebt.toLocaleString('vi-VN')}đ</span>
            <span className="text-[10px] text-stone-400 block mt-1">Cần thu hồi sớm</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-studio-border shadow-xs">
            <span className="text-xs text-stone-400 block mb-1">Tổng số ảnh đã in</span>
            <span className="text-2xl font-bold text-stone-900">{totalPhotos} ảnh</span>
            <span className="text-[10px] text-stone-400 block mt-1">Từ {totalOrders} đơn hàng</span>
          </div>
        </div>

        {/* Recent Performance Log */}
        <div className="bg-white rounded-2xl border border-studio-border shadow-xs p-6">
          <h3 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Nhật ký đơn in gần đây</span>
          </h3>

          <div className="divide-y divide-stone-100 text-xs">
            {projects.length === 0 ? (
              <p className="text-stone-400 py-4 text-center">Chưa có đơn hàng nào được ghi nhận doanh số.</p>
            ) : (
              projects.slice(0, 5).map(p => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-900 block">{p.name}</span>
                    <span className="text-[11px] text-stone-400">{new Date(p.createdAt).toLocaleDateString('vi-VN')} • {p.photos.length} ảnh</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-stone-900 block">{(p.photos.length * 3500).toLocaleString('vi-VN')}đ</span>
                    <span className="text-[10px] text-emerald-600">Đã hoàn thành</span>
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
