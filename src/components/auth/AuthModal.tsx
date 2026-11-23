import React, { useState } from 'react';
import { X, Database, Key, Check, ShieldCheck, LogIn, UserPlus, LogOut, Lock } from 'lucide-react';
import { initSupabase, isSupabaseConfigured, supabase } from '../../core/storage/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'login'>('supabase');
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('photodesk_supabase_url') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('photodesk_supabase_key') || ''
  );
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMsg, setAuthMsg] = useState<string | null>(null);

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const success = initSupabase(supabaseUrl.trim(), supabaseKey.trim());
    if (success) {
      setStatusMsg('Đã kết nối thành công với Supabase!');
    } else {
      setStatusMsg('Đã chuyển về chế độ Offline / LocalStorage.');
    }
    onConfigChanged();
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleDisconnect = () => {
    initSupabase('', '');
    setSupabaseUrl('');
    setSupabaseKey('');
    setStatusMsg('Đã ngắt kết nối Supabase, sử dụng bộ nhớ cục bộ.');
    onConfigChanged();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured() || !supabase) {
      setAuthMsg('Bạn đang ở chế độ Offline. Đã đăng nhập với tài khoản Tiệm Studio mặc định.');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthMsg('Đăng nhập thất bại: ' + error.message);
      } else {
        setAuthMsg('Đăng nhập thành công!');
        setTimeout(() => onClose(), 800);
      }
    } catch (err: any) {
      setAuthMsg('Lỗi: ' + err.message);
    }
  };

  const handleSignUp = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setAuthMsg('Vui lòng kết nối Supabase trước khi đăng ký tài khoản đám mây.');
      return;
    }
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setAuthMsg('Đăng ký thất bại: ' + error.message);
      } else {
        setAuthMsg('Đăng ký thành công! Vui lòng kiểm tra email xác nhận.');
      }
    } catch (err: any) {
      setAuthMsg('Lỗi: ' + err.message);
    }
  };

  const connected = isSupabaseConfigured();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none overscroll-contain">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md max-h-[92dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 overscroll-contain">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-stone-900">Tài khoản & Cơ sở dữ liệu</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Tabs */}
        <div className="flex border-b border-stone-100 bg-stone-50 px-5 sm:px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`pb-2 px-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'supabase'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Cấu hình Supabase
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`pb-2 px-3 text-xs font-bold transition border-b-2 ${
              activeTab === 'login'
                ? 'border-stone-900 text-stone-900'
                : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Đăng nhập / Đăng ký
          </button>
        </div>

        <div className="p-5 sm:p-6 pb-[max(env(safe-area-inset-bottom),20px)] flex-1 overflow-y-auto text-xs space-y-4">
          
          {activeTab === 'supabase' ? (
            <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                connected ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-600'
              }`}>
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold block">
                    {connected ? 'Supabase Đã Kết Nối' : 'Chế độ Cục Bộ (Offline-First)'}
                  </span>
                  <span className="text-[11px] opacity-80">
                    {connected 
                      ? 'Dự án và danh bạ tự động sao lưu đồng bộ lên đám mây.' 
                      : 'Đang lưu trữ dữ liệu an toàn trên trình duyệt của máy tính.'}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Supabase Project URL</label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Supabase Anon Public Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono text-[11px]"
                />
              </div>

              {statusMsg && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-[11px] font-medium text-center">
                  {statusMsg}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {connected && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-red-600 hover:text-red-700 font-semibold"
                  >
                    Ngắt kết nối
                  </button>
                )}
                <button
                  type="submit"
                  className="ml-auto px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg shadow-sm transition"
                >
                  Lưu kết nối
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="tiemanh@photodesk.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Mật khẩu</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {authMsg && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] font-medium text-center">
                  {authMsg}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={handleSignUp}
                  className="flex-1 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 font-semibold rounded-lg"
                >
                  Đăng ký mới
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
