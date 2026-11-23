import React from 'react';
import { Project, OrderStatus } from '../../types';
import { Plus, FolderOpen, Copy, Trash2, Calendar, FileText, CheckCircle2, Clock } from 'lucide-react';

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
  const filtered = projects.filter(p => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.customerName && p.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Mới</span>;
      case 'in_progress':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Đang làm</span>;
      case 'printed':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Đã in</span>;
      case 'delivered':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Đã giao</span>;
      default:
        return <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Đang xử lý</span>;
    }
  };

  if (projects.length === 0) {
    // Matching PicDesk Screenshot 1: Empty state
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-studio-bg select-none canvas-grid-pattern">
        <div className="max-w-md text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100/80 text-red-700 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            <span>Bắt đầu ngay</span>
          </div>

          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mb-3">
            Chưa có đơn nào
          </h1>

          <p className="text-stone-500 text-xs leading-relaxed mb-6">
            Tạo đơn đầu tiên trong dưới 1 phút. Thả ảnh khách vào, bấm Dàn & Xuất là có file in.
          </p>

          <div className="flex items-center justify-center gap-4 text-[11px] text-stone-600 font-medium mb-8">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Tự xếp, tự xoay chiều
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Có đường cắt
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ảnh khách không rời máy
            </span>
          </div>

          <button
            onClick={onOpenNewOrder}
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-stone-900/10 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đơn mới</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-studio-bg overflow-y-auto p-8 select-none">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">Danh sách đơn in ({filtered.length})</h2>
            <p className="text-xs text-stone-500 mt-0.5">Quản lý các dự án dàn trang và trạng thái đơn hàng của tiệm.</p>
          </div>
          <button
            onClick={onOpenNewOrder}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo đơn mới</span>
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-400">
            Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(proj => (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj)}
                className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      {proj.paperConfig.sizeId} • {proj.layoutConfig.mode === 'single' ? proj.layoutConfig.photoPresetId : 'Nhiều khổ'}
                    </span>
                    {getStatusBadge(proj.status)}
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 group-hover:text-brand-600 transition mb-1 truncate">
                    {proj.name}
                  </h3>

                  {proj.customerName && (
                    <span className="text-[11px] text-stone-500 block mb-2">
                      Khách: <strong>{proj.customerName}</strong>
                    </span>
                  )}

                  {/* Summary badges */}
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-4">
                    <span>{proj.photos.length} ảnh đã nạp</span>
                    <span>•</span>
                    <span>{proj.pages.length} tờ {proj.paperConfig.sizeId}</span>
                  </div>
                </div>

                {/* Footer and Actions */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                  <span className="text-[10px]">
                    {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString('vi-VN')}
                  </span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={proj.status}
                      onChange={(e) => onChangeProjectStatus(proj.id, e.target.value as OrderStatus)}
                      className="text-[10px] font-bold bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5 focus:outline-none"
                    >
                      <option value="new">Mới</option>
                      <option value="in_progress">Đang làm</option>
                      <option value="printed">Đã in</option>
                      <option value="delivered">Đã giao</option>
                    </select>

                    <button
                      onClick={() => onDuplicateProject(proj.id)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition"
                      title="Nhân bản đơn"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Bạn có chắc chắn muốn xóa đơn "${proj.name}"?\nToàn bộ hình ảnh và dữ liệu của đơn này sẽ bị xóa khỏi bộ nhớ.`)) {
                          onDeleteProject(proj.id);
                        }
                      }}
                      className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Xóa đơn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
