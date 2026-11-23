import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Edit3, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Crop, 
  FlipHorizontal, 
  FileText, 
  Columns2, 
  LayoutGrid, 
  Undo2, 
  Redo2, 
  User, 
  Maximize2,
  Check, 
  ChevronLeft,
  ChevronRight,
  Plus,
  X
} from 'lucide-react';
import { OrderStatus, Customer } from '../../types';

interface EditorTopBarProps {
  orderName: string;
  onRenameOrder: (newName: string) => void;
  orderStatus: OrderStatus;
  onChangeStatus: (status: OrderStatus) => void;
  customerName?: string;
  customers: Customer[];
  onSelectCustomer: (customerId: string) => void;
  onAddNewCustomer?: (customer: Customer) => void;
  onUnlinkCustomer?: () => void;
  onBackToOrders: () => void;
  
  // Page navigation
  currentPageIndex: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onFitToScreen: () => void;

  // Canvas zoom & view modes
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onToggleAllPagesView: () => void;
  showAllPagesView: boolean;
  isLandscape: boolean;
  onToggleOrientation: () => void;

  // Selected photo actions
  hasSelectedPhoto: boolean;
  onRotateSelectedPhoto: () => void;
  onFlipSelectedPhoto: () => void;
  onToggleCropSelectedPhoto: () => void;
  
  // History & actions
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  saveIndicator: boolean;
  totalPrice?: number;
}

export const EditorTopBar: React.FC<EditorTopBarProps> = ({
  orderName,
  onRenameOrder,
  orderStatus,
  onChangeStatus,
  customerName,
  customers,
  onSelectCustomer,
  onAddNewCustomer,
  onUnlinkCustomer,
  onBackToOrders,
  currentPageIndex,
  totalPages,
  onPrevPage,
  onNextPage,
  onFitToScreen,
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleAllPagesView,
  showAllPagesView,
  isLandscape,
  onToggleOrientation,
  hasSelectedPhoto,
  onRotateSelectedPhoto,
  onFlipSelectedPhoto,
  onToggleCropSelectedPhoto,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveIndicator,
  totalPrice
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(orderName);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');

  const handleCreateNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      notes: newCustNotes.trim(),
      totalOrders: 1,
      totalAmount: totalPrice || 0,
      paidAmount: 0,
      debtAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (onAddNewCustomer) {
      onAddNewCustomer(newCust);
    }
    setIsNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustNotes('');
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onRenameOrder(titleInput.trim());
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'in_progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'printed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'in_progress': return 'Đang làm';
      case 'new': return 'Mới';
      case 'printed': return 'Đã in';
      case 'delivered': return 'Đã giao';
      default: return 'Đang xử lý';
    }
  };

  return (
    <header 
      className="relative border-b border-stone-200 px-3 flex items-center justify-between shrink-0 select-none z-30 pt-[max(env(safe-area-inset-top),14px)] pb-2.5 md:py-0 md:h-12 shadow-2xs"
      style={{ 
        backgroundColor: '#ffffff',
        isolation: 'isolate',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'translateZ(0)'
      }}
    >
      
      {/* Left: Back Arrow + Editable Order Name + Status Badge */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <button
          onClick={onBackToOrders}
          className="p-1.5 text-stone-700 hover:text-stone-950 hover:bg-stone-100 rounded-lg transition active:scale-90"
          title="Quay lại danh sách đơn"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
        </button>

        {isEditingTitle ? (
          <input
            type="text"
            autoFocus
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
            className="text-xs font-bold text-stone-900 bg-stone-50 border border-stone-300 rounded px-1.5 py-0.5 focus:outline-none max-w-[110px] sm:max-w-[160px]"
          />
        ) : (
          <div 
            onClick={() => {
              setTitleInput(orderName);
              setIsEditingTitle(true);
            }}
            className="flex items-center gap-1 cursor-pointer hover:bg-stone-50 px-1.5 py-0.5 rounded transition group max-w-[110px] sm:max-w-[160px] md:max-w-none"
          >
            <span className="text-xs md:text-sm font-extrabold text-stone-900 tracking-tight truncate">{orderName}</span>
            <Edit3 className="w-3 h-3 text-stone-400 group-hover:text-stone-700 shrink-0" />
          </div>
        )}

        {/* Status Dropdown Pill matching screenshot */}
        <div className="relative">
          <select
            value={orderStatus}
            onChange={(e) => onChangeStatus(e.target.value as OrderStatus)}
            className={`text-[10px] font-extrabold rounded-full px-2 py-0.5 border cursor-pointer focus:outline-none ${getStatusColor(orderStatus)}`}
          >
            <option value="new">Mới</option>
            <option value="in_progress">Đang làm</option>
            <option value="printed">Đã in</option>
            <option value="delivered">Đã giao</option>
          </select>
        </div>
      </div>

      {/* Center: Page Nav + Zoom + View Controls */}
      <div className="flex items-center gap-1 md:gap-2 bg-stone-100/90 border border-stone-200 rounded-xl px-1.5 md:px-2 py-0.5 md:py-1">
        
        {/* Page navigation: < Tờ X/Y > */}
        <div className="flex items-center gap-0.5 md:gap-1 md:pr-2 md:border-r border-stone-200">
          <button
            disabled={currentPageIndex === 0}
            onClick={onPrevPage}
            className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30 rounded hover:bg-stone-200/50 transition active:scale-90"
            title="Tờ trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-semibold text-stone-700 px-0.5 select-none whitespace-nowrap">
            {currentPageIndex + 1}/{totalPages}
          </span>
          <button
            disabled={currentPageIndex >= totalPages - 1}
            onClick={onNextPage}
            className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30 rounded hover:bg-stone-200/50 transition active:scale-90"
            title="Tờ tiếp"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom controls pill (Desktop only) */}
        <div className="hidden md:flex items-center gap-1 pr-2 border-r border-stone-200">
          <button
            onClick={onZoomOut}
            className="p-1 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-200/50 transition"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomReset}
            className="text-[11px] font-bold text-stone-700 px-1 hover:text-stone-900"
            title="Về 100%"
          >
            {zoomPercent}%
          </button>
          <button
            onClick={onZoomIn}
            className="p-1 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-200/50 transition"
            title="Phóng to"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onFitToScreen}
            className="p-1 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-200/50 transition"
            title="Vừa màn hình (Fit)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Document view layout modes (Desktop only) */}
        <div className="hidden lg:flex items-center gap-0.5 pr-2 border-r border-stone-200">
          <button
            onClick={onToggleOrientation}
            className={`p-1 rounded text-stone-600 hover:bg-stone-200/50 transition ${isLandscape ? 'text-brand-600 font-bold' : ''}`}
            title="Xoay hướng giấy (Dọc/Ngang)"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleAllPagesView}
            className={`p-1 rounded transition ${showAllPagesView ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500 hover:bg-stone-200/50'}`}
            title="Xem tất cả các trang dạng lưới"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Photo manipulation tools (Desktop only) */}
        <div className="hidden sm:flex items-center gap-0.5">
          <button
            onClick={onRotateSelectedPhoto}
            disabled={!hasSelectedPhoto}
            className={`p-1 rounded transition ${
              hasSelectedPhoto 
                ? 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 active:scale-95' 
                : 'text-stone-300 cursor-not-allowed'
            }`}
            title={hasSelectedPhoto ? "Xoay ảnh 90°" : "Chọn 1 ô ảnh để xoay"}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleCropSelectedPhoto}
            disabled={!hasSelectedPhoto}
            className={`p-1 rounded transition ${
              hasSelectedPhoto 
                ? 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 active:scale-95' 
                : 'text-stone-300 cursor-not-allowed'
            }`}
            title={hasSelectedPhoto ? "Cắt ảnh: Đổi Phủ đầy (Fill) / Giữ trọn hình (Fit)" : "Chọn 1 ô ảnh để đổi chế độ cắt"}
          >
            <Crop className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onFlipSelectedPhoto}
            disabled={!hasSelectedPhoto}
            className={`p-1 rounded transition ${
              hasSelectedPhoto 
                ? 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 active:scale-95' 
                : 'text-stone-300 cursor-not-allowed'
            }`}
            title={hasSelectedPhoto ? "Lật ảnh ngang (Flip)" : "Chọn 1 ô ảnh để lật"}
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Right: Gắn khách + Price + Undo/Redo + Fullscreen */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        
        {/* Customer dropdown button (Desktop/tablet only) */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-xs text-stone-700 transition"
          >
            <User className="w-3 h-3 text-stone-400" />
            <span className="font-medium max-w-[90px] truncate">{customerName || 'Gắn khách'}</span>
          </button>

          {isCustomerDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-stone-200 rounded-xl shadow-xl p-1.5 text-xs z-30 animate-in fade-in duration-100">
              <div className="flex items-center justify-between px-2 py-1 border-b border-stone-100 mb-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Khách hàng</span>
                {customerName && onUnlinkCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      onUnlinkCustomer();
                      setIsCustomerDropdownOpen(false);
                    }}
                    className="text-[10px] text-red-500 hover:underline font-semibold"
                  >
                    Bỏ gắn
                  </button>
                )}
              </div>

              {/* Danh sách khách hàng hiện có */}
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {customers.length === 0 ? (
                  <p className="text-[11px] text-stone-400 text-center py-2">Chưa có khách hàng</p>
                ) : (
                  customers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onSelectCustomer(c.id);
                        setIsCustomerDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded-lg font-medium transition flex items-center justify-between ${
                        customerName === c.name 
                          ? 'bg-brand-50 text-brand-700 font-bold' 
                          : 'hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      {customerName === c.name && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                    </button>
                  ))
                )}
              </div>

              {/* Mục thêm khách mới */}
              <div className="border-t border-stone-100 mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomerDropdownOpen(false);
                    setIsNewCustomerModalOpen(true);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-stone-100 text-brand-600 font-bold flex items-center gap-1.5 transition text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm khách mới</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pricing status badge (Desktop/Tablet) */}
        {totalPrice && totalPrice > 0 ? (
          <span 
            className="hidden sm:inline-flex text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs"
            title="Giá ước tính theo số ảnh và cấu hình bảng giá"
          >
            {totalPrice.toLocaleString('vi-VN')} đ
          </span>
        ) : (
          <span className="hidden sm:inline-flex text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
            Chưa báo giá
          </span>
        )}

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-l border-stone-200 pl-1.5">
          <button
            disabled={!canUndo}
            onClick={onUndo}
            className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30 rounded hover:bg-stone-100 transition"
            title="Hoàn tác (Undo)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={!canRedo}
            onClick={onRedo}
            className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30 rounded hover:bg-stone-100 transition"
            title="Làm lại (Redo)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {saveIndicator && (
          <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
            <Check className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Modal: Thêm khách hàng mới & Gắn vào đơn */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-2xs p-4 select-none">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-sm p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-stone-900">Thêm khách hàng mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewCustomer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Tên khách hàng <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Ví dụ: Chị Lan (Studio Ánh Sao)..."
                  autoFocus
                  required
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Số điện thoại:</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="0912 345 678..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Ghi chú:</label>
                <input
                  type="text"
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  placeholder="Thường in polaroid, viền trắng..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newCustName.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  Thêm & Gắn vào đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </header>
  );
};
