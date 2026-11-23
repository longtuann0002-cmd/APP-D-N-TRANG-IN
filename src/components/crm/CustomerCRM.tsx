import React, { useState } from 'react';
import { Customer } from '../../types';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MessageCircle, 
  Trash2, 
  Edit3, 
  X,
  CreditCard,
  FileText,
  Clock
} from 'lucide-react';

interface CustomerCRMProps {
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onCreateOrderForCustomer: (customer: Customer) => void;
}

export const CustomerCRM: React.FC<CustomerCRMProps> = ({
  customers,
  onSaveCustomer,
  onDeleteCustomer,
  onCreateOrderForCustomer
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'regular' | 'debt'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New customer form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    socialLink: '',
    notes: ''
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery);
    if (!matchesSearch) return false;
    if (filterType === 'debt') return c.debtAmount > 0;
    if (filterType === 'regular') return c.totalOrders >= 2;
    return true;
  });

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newCustomer: Customer = {
      id: 'cust-' + Date.now(),
      name: formData.name,
      phone: formData.phone,
      socialLink: formData.socialLink,
      notes: formData.notes,
      totalOrders: 0,
      totalAmount: 0,
      paidAmount: 0,
      debtAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSaveCustomer(newCustomer);
    setSelectedCustomerId(newCustomer.id);
    setIsAddModalOpen(false);
    setFormData({ name: '', phone: '', socialLink: '', notes: '' });
  };

  return (
    <div className="flex-1 h-full flex bg-studio-bg overflow-hidden select-none">
      
      {/* Left Sidebar: Customer List */}
      <div className="w-80 h-full bg-white border-r border-studio-border flex flex-col shrink-0">
        <div className="p-4 border-b border-stone-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900">Danh bạ khách hàng ({customers.length})</span>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm khách</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tên hoặc số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                filterType === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Tất cả ({customers.length})
            </button>
            <button
              onClick={() => setFilterType('regular')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                filterType === 'regular' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Khách quen
            </button>
            <button
              onClick={() => setFilterType('debt')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                filterType === 'debt' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Còn nợ
            </button>
          </div>
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
          {filteredCustomers.length === 0 ? (
            <div className="p-6 text-center text-stone-400 text-xs">
              Chưa có khách hàng nào khớp tìm kiếm
            </div>
          ) : (
            filteredCustomers.map(cust => {
              const isSelected = selectedCustomer?.id === cust.id;
              return (
                <div
                  key={cust.id}
                  onClick={() => setSelectedCustomerId(cust.id)}
                  className={`p-3.5 cursor-pointer transition flex items-center justify-between ${
                    isSelected ? 'bg-stone-100/80 border-l-3 border-stone-900' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold text-stone-900 block truncate">{cust.name}</span>
                    <span className="text-[11px] text-stone-400 block">{cust.phone || 'Chưa có SĐT'}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-stone-500 block">{cust.totalOrders} đơn</span>
                    {cust.debtAmount > 0 && (
                      <span className="text-[10px] font-bold text-red-600 block">Nợ {cust.debtAmount.toLocaleString('vi-VN')}đ</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Customer Details */}
      {selectedCustomer ? (
        <div className="flex-1 h-full flex flex-col overflow-y-auto p-8">
          
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-studio-border shadow-xs mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-base font-bold text-stone-800">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-stone-900">{selectedCustomer.name}</h2>
                    {selectedCustomer.totalOrders >= 2 ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Khách quen</span>
                    ) : (
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Khách mới</span>
                    )}
                  </div>
                  <span className="text-xs text-stone-400">Tham gia từ {new Date(selectedCustomer.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${selectedCustomer.name}"?\nThao tác này không thể hoàn tác.`)) {
                      onDeleteCustomer(selectedCustomer.id);
                    }
                  }}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Xóa khách"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onCreateOrderForCustomer(selectedCustomer)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-98 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo đơn cho khách</span>
                </button>
              </div>
            </div>

            {/* Quick Contact Links */}
            <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
              {selectedCustomer.phone && (
                <a
                  href={`tel:${selectedCustomer.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg border border-stone-200 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-stone-500" />
                  <span>Gọi {selectedCustomer.phone}</span>
                </a>
              )}
              {selectedCustomer.socialLink && (
                <a
                  href={selectedCustomer.socialLink.startsWith('http') ? selectedCustomer.socialLink : `https://${selectedCustomer.socialLink}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Nhắn Zalo / Facebook</span>
                </a>
              )}
            </div>
          </div>

          {/* Stats 4 Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-xs text-stone-400 block mb-1">Số đơn đã đặt</span>
              <span className="text-xl font-bold text-stone-900">{selectedCustomer.totalOrders} đơn</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-xs text-stone-400 block mb-1">Tổng tiền đặt</span>
              <span className="text-xl font-bold text-stone-900">{selectedCustomer.totalAmount.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-xs text-stone-400 block mb-1">Đã thu</span>
              <span className="text-xl font-bold text-emerald-600">{selectedCustomer.paidAmount.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-xs text-stone-400 block mb-1">Còn nợ</span>
              <span className={`text-xl font-bold ${selectedCustomer.debtAmount > 0 ? 'text-red-600' : 'text-stone-800'}`}>
                {selectedCustomer.debtAmount.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex-1">
            <h3 className="text-sm font-bold text-stone-900 mb-2">Ghi chú sở thích của khách</h3>
            <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200 leading-relaxed">
              {selectedCustomer.notes || 'Chưa có ghi chú đặc biệt cho khách hàng này.'}
            </p>
          </div>

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Users className="w-12 h-12 text-stone-300 mb-2" />
          <h3 className="text-base font-bold text-stone-800">Nhớ khách quen, mở lại đơn cũ trong 1 giây</h3>
          <p className="text-xs text-stone-400 max-w-sm mt-1">Lưu tên, số điện thoại, Zalo của khách. Mỗi khách có đủ đơn, ảnh, tiền đã thu và đơn chưa giao.</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm khách đầu tiên</span>
          </button>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-stone-900">Thêm khách mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Tên khách</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Chị Lan (Studio)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="0912 345 678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Zalo hoặc Facebook</label>
                <input
                  type="text"
                  placeholder="zalo.me/0912345678"
                  value={formData.socialLink}
                  onChange={(e) => setFormData({ ...formData, socialLink: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Ghi chú</label>
                <textarea
                  rows={3}
                  placeholder="Hay in polaroid, thích viền trắng..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Thêm khách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
