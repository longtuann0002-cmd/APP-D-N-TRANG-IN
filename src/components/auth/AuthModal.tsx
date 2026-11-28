import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Key, 
  Check, 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Sparkles, 
  Cloud, 
  CloudOff, 
  ExternalLink,
  ChevronRight,
  Settings2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  initSupabase, 
  isSupabaseConfigured, 
  UserProfile, 
  getCurrentUser, 
  loginWithGoogle, 
  loginWithSupabase, 
  signUpWithSupabase, 
  logoutUser,
  sanitizeSupabaseUrl
} from '../../core/storage/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChanged: (user: UserProfile | null) => void;
  onConfigChanged: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  onConfigChanged
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'supabase'>('login');
  
  // Supabase connection fields
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('photodesk_supabase_url') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('photodesk_supabase_key') || ''
  );
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authMsg, setAuthMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset notifications on tab switch
  useEffect(() => {
    setAuthMsg(null);
    setSupabaseStatusMsg(null);
  }, [activeTab]);

  const connected = isSupabaseConfigured();

  // Save Supabase Configuration
  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setSupabaseStatusMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ Project URL và Anon Public Key.' });
      return;
    }

    const success = initSupabase(supabaseUrl.trim(), supabaseKey.trim());
    if (success) {
      setSupabaseStatusMsg({ type: 'success', text: 'Đã kết nối thành công với Supabase Cloud!' });
      onConfigChanged();
      // If user is currently in demo mode, mark as cloud enabled
      if (currentUser) {
        const updated = { ...currentUser, isCloud: true };
        onUserChanged(updated);
      }
    } else {
      setSupabaseStatusMsg({ type: 'error', text: 'Không thể kết nối. Vui lòng kiểm tra lại URL hoặc Key.' });
    }
  };

  // Disconnect Supabase
  const handleDisconnectSupabase = () => {
    initSupabase('', '');
    setSupabaseUrl('');
    setSupabaseKey('');
    setSupabaseStatusMsg({ type: 'info' as any, text: 'Đã ngắt kết nối Supabase, chuyển sang chế độ lưu trữ cục bộ.' });
    onConfigChanged();
    if (currentUser) {
      onUserChanged({ ...currentUser, isCloud: false });
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg(null);
    setIsLoading(true);

    if (connected) {
      // Connect to real Supabase Cloud
      const result = await loginWithSupabase(email, password);
      setIsLoading(false);
      if (result.error) {
        const errLower = result.error.toLowerCase();
        if (errLower.includes('email not confirmed')) {
          setAuthMsg({ 
            type: 'error', 
            text: 'Tài khoản chưa được kích hoạt. Vui lòng báo Chủ Tiệm vào Supabase bấm "Confirm User" để duyệt tài khoản.' 
          });
        } else if (errLower.includes('invalid login credentials')) {
          setAuthMsg({ 
            type: 'error', 
            text: 'Email hoặc mật khẩu chưa chính xác. Hệ thống nội bộ chỉ dành cho tài khoản được Chủ Tiệm cấp quyền.' 
          });
        } else {
          setAuthMsg({ type: 'error', text: 'Đăng nhập thất bại: ' + result.error });
        }
      } else if (result.user) {
        onUserChanged(result.user);
        setAuthMsg({ type: 'success', text: `Chào mừng ${result.user.fullName} đã đăng nhập!` });
        setTimeout(() => onClose(), 800);
      }
    } else {
      setIsLoading(false);
      setAuthMsg({ 
        type: 'error', 
        text: 'Chưa kết nối Supabase Cloud. Vui lòng kiểm tra tab Cấu hình Cloud.' 
      });
    }
  };

  // Sign up handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg(null);

    if (!connected) {
      setAuthMsg({ 
        type: 'info', 
        text: 'Bạn đang ở chế độ Offline. Bạn có thể sử dụng nút "Dùng thử nhanh 1 chạm" bên dưới, hoặc kết nối Supabase để lưu tài khoản đám mây.' 
      });
      return;
    }

    setIsLoading(true);
    const result = await signUpWithSupabase(email, password, fullName);
    setIsLoading(false);

    if (result.error) {
      setAuthMsg({ type: 'error', text: 'Đăng ký thất bại: ' + result.error });
    } else if (result.user) {
      onUserChanged(result.user);
      setAuthMsg({ type: 'success', text: 'Đăng ký và đăng nhập thành công!' });
      setTimeout(() => onClose(), 900);
    } else if (result.message) {
      setAuthMsg({ type: 'info', text: result.message });
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setAuthMsg(null);
    setIsLoading(true);
    const res = await loginWithGoogle();
    setIsLoading(false);
    if (res.error) {
      setAuthMsg({ type: 'error', text: res.error });
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await logoutUser();
    onUserChanged(null);
    setAuthMsg({ type: 'info', text: 'Đã đăng xuất tài khoản.' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none overscroll-contain animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-stone-200/90 w-full max-w-md max-h-[92dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 overscroll-contain">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-100 flex items-center justify-between shrink-0 bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-stone-900 to-orange-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-orange-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-1.5">
                <span>Tài Khoản Tiệm In</span>
                {currentUser && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                    Đã đăng nhập
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-stone-500">Caos Studio • Bảo mật & Đồng bộ đa thiết bị</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 pb-[max(env(safe-area-inset-bottom),20px)] flex-1 overflow-y-auto text-xs space-y-4">
          
          {/* ======================================================== */}
          {/* CASE 1: ALREADY LOGGED IN -> SHOW USER CARD & CONTROLS  */}
          {/* ======================================================== */}
          {currentUser ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Profile Card */}
              <div className="p-4 rounded-2xl border border-stone-200/90 bg-gradient-to-br from-stone-50 via-white to-orange-50/30 flex items-start gap-3.5 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-stone-900 via-stone-800 to-orange-500 flex items-center justify-center text-white font-extrabold text-lg shadow-md shrink-0">
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-stone-900 text-sm truncate">{currentUser.fullName}</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-stone-900 text-orange-400">
                      {currentUser.role === 'owner' ? 'Chủ tiệm' : 'Thợ in'}
                    </span>
                  </div>
                  <span className="text-stone-500 text-[11px] block truncate mt-0.5">{currentUser.email}</span>
                  
                  {/* Cloud status pill */}
                  <div className="mt-2.5 flex items-center gap-1.5">
                    {currentUser.isCloud ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        <Cloud className="w-3 h-3 text-emerald-600" />
                        Đã liên kết Cloud Supabase
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                        <CloudOff className="w-3 h-3 text-amber-600" />
                        Chế độ Cục bộ (Chưa liên kết Cloud)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Message */}
              {authMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  authMsg.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : authMsg.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  {authMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{authMsg.text}</span>
                </div>
              )}

              {/* Cloud Settings Accordion / Switch */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'supabase' ? 'login' : 'supabase')}
                  className="w-full px-4 py-3 bg-stone-50/80 hover:bg-stone-100/80 text-stone-700 font-semibold flex items-center justify-between text-xs transition"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-stone-600" />
                    <span>Cấu hình kết nối Cloud (Supabase)</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${activeTab === 'supabase' ? 'rotate-90' : ''}`} />
                </button>

                {activeTab === 'supabase' && (
                  <div className="p-4 bg-white border-t border-stone-200 space-y-3">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Supabase Project URL</label>
                      <input
                        type="text"
                        placeholder="https://xyzcompany.supabase.co"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Supabase Anon Public Key</label>
                      <input
                        type="password"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={supabaseKey}
                        onChange={(e) => setSupabaseKey(e.target.value)}
                        className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-mono text-[11px]"
                      />
                    </div>

                    {supabaseStatusMsg && (
                      <div className={`p-2.5 rounded-xl text-[11px] ${
                        supabaseStatusMsg.type === 'success' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {supabaseStatusMsg.text}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      {connected && (
                        <button
                          type="button"
                          onClick={handleDisconnectSupabase}
                          className="text-rose-600 hover:text-rose-700 font-semibold text-xs"
                        >
                          Ngắt kết nối Cloud
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSaveSupabaseConfig}
                        className="ml-auto px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl transition"
                      >
                        Lưu kết nối
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl transition active:scale-98"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition active:scale-98"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>

            </div>
          ) : (

            /* ======================================================== */
            /* CASE 2: NOT LOGGED IN -> SHOW LOGIN / SIGNUP TABS FORM   */
            /* ======================================================== */
            <div className="space-y-4">
              
              {/* Tab Selector */}
              <div className="flex p-1 bg-stone-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 font-bold rounded-xl transition text-center ${
                    activeTab === 'login'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Đăng nhập tiệm
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('supabase')}
                  className={`flex-1 py-2 font-bold rounded-xl transition text-center flex items-center justify-center gap-1.5 ${
                    activeTab === 'supabase'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                  title="Cấu hình kết nối Supabase Cloud"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Cấu hình Cloud</span>
                </button>
              </div>

              {/* Status Message */}
              {authMsg && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  authMsg.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : authMsg.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  {authMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{authMsg.text}</span>
                </div>
              )}

              {/* LOGIN FORM */}
              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="tiemanh@caosprint.vn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white text-xs text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white text-xs text-stone-900"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-gradient-to-tr from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/25 active:scale-98 transition flex items-center justify-center gap-1.5 mt-2"
                  >
                    {isLoading ? (
                      <span className="inline-block animate-spin mr-1">⌛</span>
                    ) : activeTab === 'login' ? (
                      <LogIn className="w-4 h-4" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>{activeTab === 'login' ? 'Đăng nhập vào tiệm' : 'Tạo tài khoản mới'}</span>
                  </button>

                  {/* Google Sign In Option */}
                  <div className="relative my-4 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-stone-200"></div>
                    </div>
                    <span className="relative px-3 bg-white text-[10px] font-extrabold text-stone-400 uppercase tracking-widest">
                      Hoặc đăng nhập với
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-2.5 bg-white hover:bg-stone-50 border border-stone-300 hover:border-stone-400 text-stone-800 font-bold text-xs rounded-xl shadow-2xs active:scale-98 transition flex items-center justify-center gap-2.5"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Tiếp tục với tài khoản Google</span>
                  </button>

                  <p className="text-[10px] text-stone-400 text-center leading-relaxed mt-2">
                    Dữ liệu đơn hàng, doanh số và danh bạ khách hàng được bảo vệ an toàn 100%.
                  </p>
                </form>
              )}

              {/* SUB TAB 3: SUPABASE CONFIGURATION */}
              {activeTab === 'supabase' && (
                <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
                  <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
                    connected ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}>
                    {connected ? <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <Database className="w-5 h-5 text-stone-500 shrink-0 mt-0.5" />}
                    <div>
                      <span className="font-bold block text-xs">
                        {connected ? '🟢 Supabase Cloud Đã Sẵn Sàng' : '🟡 Chế độ Cục Bộ (Offline)'}
                      </span>
                      <span className="text-[11px] opacity-80 leading-relaxed block mt-0.5">
                        {connected 
                          ? 'Dữ liệu đơn hàng, mẫu in và tài khoản được đồng bộ trực tiếp lên máy chủ Supabase miễn phí.' 
                          : 'Dữ liệu đang được lưu tạm trên bộ nhớ trình duyệt máy tính. Kết nối Supabase để đồng bộ sang điện thoại.'}
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
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Supabase Anon Public Key</label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-mono text-[11px]"
                    />
                  </div>

                  {supabaseStatusMsg && (
                    <div className={`p-2.5 rounded-xl text-[11px] ${
                      supabaseStatusMsg.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {supabaseStatusMsg.text}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    {connected && (
                      <button
                        type="button"
                        onClick={handleDisconnectSupabase}
                        className="text-rose-600 hover:text-rose-700 font-semibold text-xs"
                      >
                        Ngắt kết nối
                      </button>
                    )}
                    <button
                      type="submit"
                      className="ml-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-xs transition"
                    >
                      Lưu kết nối
                    </button>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                    <span>Chưa có tài khoản Supabase?</span>
                    <a 
                      href="https://supabase.com" 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
                    >
                      <span>Tạo miễn phí 100%</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </form>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
