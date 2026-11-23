import React, { useState } from 'react';
import { Project, OrderStatus } from '../../types';
import { 
  Plus, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Truck, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  Image as ImageIcon,
  FileCheck,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';

interface OrdersDashboardProps {
  projects: Project[];
  statusFilter: OrderStatus | 'all';
  searchQuery: string;
  onOpenNewOrder: () => void;
  onOpenProject: (project: Project) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onChangeProjectStatus: (id: string, status: OrderStatus) => void;
}

export const OrdersDashboard: React.FC<OrdersDashboardProps> = ({
  projects,
  statusFilter,
  searchQuery,
  onOpenNewOrder,
  onOpenProject,
  onDuplicateProject,
  onDeleteProject,
  onChangeProjectStatus
}) => {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const filtered = projects.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.customerName && p.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Calculate quick stats
  const stats = {
    total: projects.length,
    new: projects.filter(p => p.status === 'new').length,
    in_progress: projects.filter(p => p.status === 'in_progress').length,
    printed: projects.filter(p => p.status === 'printed').length,
    delivered: projects.filter(p => p.status === 'delivered').length,
  };

  const statusSteps: { id: OrderStatus; label: string; icon: any }[] = [
    { id: 'new', label: 'Mới', icon: Sparkles },
    { id: 'in_progress', label: 'Đang làm', icon: Clock },
    { id: 'printed', label: 'Đã in', icon: Printer },
    { id: 'delivered', label: 'Đã giao', icon: Truck },
  ];

  const getStatusIndex = (st: OrderStatus) => {
    if (st === 'new') return 0;
    if (st === 'in_progress') return 1;
    if (st === 'printed') return 2;
    if (st === 'delivered') return 3;
    return 1;
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Mới tạo
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Đang xử lý
          </span>
        );
      case 'printed':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
            <Printer className="w-3 h-3 text-purple-600" />
            Đã in xong
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Đã giao
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            Đang xử lý
          </span>
        );
    }
  };

  if (projects.length === 0) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-stone-50 via-white to-stone-50 select-none">
        <div className="max-w-md text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-stone-900 via-stone-800 to-amber-600 text-white flex items-center justify-center mx-auto mb-5 shadow-xl shadow-stone-900/20 border-2 border-white">
            <span className="text-2xl font-black tracking-tight">C</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-800 text-xs font-semibold mb-3">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>Studio Dàn Trang & In Ấn Chuyên Nghiệp</span>
          </div>

          <h1 className="text-2xl font-black text-stone-900 tracking-tight mb-2">
            Chào mừng bạn đến với Caos Studio
          </h1>

          <p className="text-stone-500 text-xs leading-relaxed mb-6 max-w-sm mx-auto">
            Hệ thống tự động xếp ảnh tối ưu giấy, chống hao hụt và xuất file in sắc nét chuẩn xưởng lab chỉ trong 30 giây.
          </p>

          <div className="grid grid-cols-3 gap-2.5 text-left mb-6">
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs">
              <span className="text-xs font-bold text-stone-900 block mb-0.5">⚡ Auto-pack</span>
              <span className="text-[10px] text-stone-500">Tự xoay và ghép kín tờ giấy A4/A5</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs">
              <span className="text-xs font-bold text-stone-900 block mb-0.5">✂️ Cắt chuẩn</span>
              <span className="text-[10px] text-stone-500">Tự vẽ đường viền & đường dao cấn</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs">
              <span className="text-xs font-bold text-stone-900 block mb-0.5">🔒 Riêng tư</span>
              <span className="text-[10px] text-stone-500">Xử lý ngay tại máy, bảo mật ảnh khách</span>
            </div>
          </div>

          <button
            onClick={onOpenNewOrder}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-600 hover:from-black hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-stone-900/15 transition-all duration-200 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tạo đơn in đầu tiên ngay</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-studio-bg overflow-y-auto p-4 md:p-8 select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header & Fast KPI Cards */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg md:text-2xl font-black text-stone-900 tracking-tight">
                Danh sách đơn hàng
              </span>
              <span className="text-xs font-bold bg-stone-900 text-amber-300 px-2 py-0.5 rounded-full">
                {filtered.length} đơn
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Quản lý quy trình sản xuất, kiểm tra tiến độ in ấn và giao hàng tiệm Caos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewOrder}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-600 hover:from-black hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-md shadow-stone-900/15 transition-all duration-200 active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tạo đơn mới</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Status Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-stone-200/80 p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-stone-400 block">Đang sản xuất</span>
              <span className="text-xl font-black text-amber-600">{stats.in_progress}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200/80 p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-stone-400 block">Đã in xong</span>
              <span className="text-xl font-black text-purple-600">{stats.printed}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              <Printer className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200/80 p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-stone-400 block">Đã giao khách</span>
              <span className="text-xl font-black text-emerald-600">{stats.delivered}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <Truck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200/80 p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-stone-400 block">Tổng số đơn</span>
              <span className="text-xl font-black text-stone-900">{stats.total}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-400">
            Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
            {filtered.map(proj => {
              const currentStep = getStatusIndex(proj.status);
              const previewPhotos = proj.photos.slice(0, 4);

              return (
                <div
                  key={proj.id}
                  onMouseEnter={() => setHoveredCardId(proj.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  onClick={() => onOpenProject(proj)}
                  className="bg-white rounded-2xl border border-stone-200/90 hover:border-amber-400/80 p-4 shadow-2xs hover:shadow-lg hover:shadow-stone-900/5 transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Top Header Card */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold bg-stone-900 text-amber-300 px-2 py-0.5 rounded uppercase tracking-wider">
                          {proj.paperConfig.sizeId}
                        </span>
                        <span className="text-[11px] font-semibold text-stone-500">
                          {proj.layoutConfig.mode === 'single' ? (proj.layoutConfig.photoPresetId || 'Khổ chuẩn') : 'Nhiều khổ'}
                        </span>
                      </div>
                      {getStatusBadge(proj.status)}
                    </div>

                    {/* Order Title */}
                    <h3 className="text-sm font-bold text-stone-900 group-hover:text-amber-700 transition line-clamp-1 mb-1">
                      {proj.name}
                    </h3>

                    {/* Customer Info */}
                    <div className="flex items-center gap-1 text-[11px] text-stone-600 mb-3">
                      <User className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">
                        {proj.customerName ? (
                          <>Khách: <strong className="text-stone-800">{proj.customerName}</strong></>
                        ) : (
                          <span className="text-stone-400 italic">Khách vãng lai</span>
                        )}
                      </span>
                    </div>

                    {/* Photo Thumbnails Stack / Visual Preview */}
                    <div className="bg-stone-50 rounded-xl p-2.5 mb-3 border border-stone-100 flex items-center justify-between">
                      {previewPhotos.length > 0 ? (
                        <div className="flex items-center -space-x-2 overflow-hidden">
                          {previewPhotos.map((p, idx) => (
                            <img
                              key={p.id || idx}
                              src={p.url}
                              alt=""
                              className="w-9 h-9 rounded-lg object-cover border-2 border-white shadow-xs shrink-0 bg-stone-200"
                            />
                          ))}
                          {proj.photos.length > 4 && (
                            <div className="w-9 h-9 rounded-lg bg-stone-800 text-amber-300 text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs shrink-0">
                              +{proj.photos.length - 4}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-stone-400 text-xs">
                          <ImageIcon className="w-4 h-4" />
                          <span>Chưa nạp ảnh</span>
                        </div>
                      )}

                      <div className="text-right pl-2 shrink-0">
                        <span className="text-xs font-bold text-stone-800 block">
                          {proj.pages.length} tờ in
                        </span>
                        <span className="text-[10px] text-stone-400 block">
                          {proj.photos.length} ảnh
                        </span>
                      </div>
                    </div>

                    {/* Visual 4-Step Status Progress Bar */}
                    <div className="space-y-1 mb-3 pt-1">
                      <div className="flex items-center justify-between text-[10px] text-stone-400 px-0.5">
                        {statusSteps.map((s, idx) => {
                          const isPassed = idx <= currentStep;
                          const isCurrent = idx === currentStep;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onChangeProjectStatus(proj.id, s.id);
                              }}
                              className={`flex items-center gap-0.5 transition-colors ${
                                isCurrent 
                                  ? 'font-bold text-amber-700' 
                                  : isPassed 
                                    ? 'font-medium text-stone-700' 
                                    : 'text-stone-300 hover:text-stone-500'
                              }`}
                            >
                              <span>{s.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Line Bar with Dots */}
                      <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden flex relative">
                        <div 
                          className="h-full bg-gradient-to-r from-stone-900 to-amber-500 transition-all duration-300 rounded-full"
                          style={{ width: `${((currentStep + 1) / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Date & Quick Actions */}
                  <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                    <span className="text-[10px] text-stone-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString('vi-VN')}
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* Duplicate Button */}
                      <button
                        onClick={() => onDuplicateProject(proj.id)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition active:scale-90"
                        title="Nhân bản đơn hàng này"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Bạn có chắc muốn xóa đơn "${proj.name}"?\nToàn bộ ảnh và thiết lập của đơn sẽ bị xóa khỏi bộ nhớ.`)) {
                            onDeleteProject(proj.id);
                          }
                        }}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition active:scale-90"
                        title="Xóa đơn hàng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Open Editor Button */}
                      <button
                        onClick={() => onOpenProject(proj)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-stone-100 group-hover:bg-stone-900 group-hover:text-amber-300 text-stone-700 rounded-lg text-xs font-semibold transition active:scale-95 ml-1"
                      >
                        <span>Mở</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
