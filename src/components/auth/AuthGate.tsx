import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  LogIn, 
  UserPlus, 
  Sparkles, 
  ShieldCheck, 
  Cloud, 
  CloudOff, 
  Database, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Printer
} from 'lucide-react';
import { 
  UserProfile, 
  isSupabaseConfigured, 
  initSupabase, 
  loginWithSupabase, 
  signUpWithSupabase, 
  loginWithGoogle,
  sanitizeSupabaseUrl
} from '../../core/storage/supabaseClient';

interface AuthGateProps {
  onLoginSuccess: (user: UserProfile) => void;
  shopInfo?: { name: string; tagline: string; logoUrl?: string };
}

export const AuthGate: React.FC<AuthGateProps> = ({
  onLoginSuccess,
  shopInfo
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'cloud'>('login');
  
  // Auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMsg, setAuthMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cloud Config fields
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('photodesk_supabase_url') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('photodesk_supabase_key') || ''
  );
  const [cloudMsg, setCloudMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const connected = isSupabaseConfigured();

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg(null);
    setIsLoading(true);

    if (connected) {
      const res = await loginWithSupabase(email, password);
      setIsLoading(false);
      if (res.error) {
        if (res.error.toLowerCase().includes('invalid login credentials')) {
          setAuthMsg({ 
            type: 'error', 
            text: 'Email hoặc mật khẩu chưa chính xác. Nếu chưa có tài khoản, bạn hãy bấm tab "Đăng ký tiệm" bên cạnh để tạo tài khoản mới ngay!' 
          });
        } else {
          setAuthMsg({ type: 'error', text: 'Đăng nhập thất bại: ' + res.error });
        }
      } else if (res.user) {
        setAuthMsg({ type: 'success', text: `Chào mừng ${res.user.fullName} đã đăng nhập!` });
        setTimeout(() => onLoginSuccess(res.user!), 600);
      }
    } else {
      setIsLoading(false);
      setAuthMsg({ 
        type: 'error', 
        text: 'Chưa kết nối Supabase Cloud. Vui lòng bấm tab Cloud để kiểm tra URL và Key.' 
      });
    }
  };

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg(null);

    if (!connected) {
      setAuthMsg({ 
        type: 'info', 
        text: 'Chưa kết nối Supabase Cloud. Vui lòng cấu hình tab Cloud để đăng ký tài khoản.' 
      });
      return;
    }

    setIsLoading(true);
    const res = await signUpWithSupabase(email, password, fullName);
    setIsLoading(false);

    if (res.error) {
      setAuthMsg({ type: 'error', text: 'Đăng ký thất bại: ' + res.error });
    } else if (res.user) {
      setAuthMsg({ type: 'success', text: 'Tạo tài khoản và đăng nhập thành công!' });
      setTimeout(() => onLoginSuccess(res.user!), 700);
    } else if (res.message) {
      setAuthMsg({ type: 'info', text: res.message });
      // Switch back to login tab after 2.5s
      setTimeout(() => setActiveTab('login'), 2500);
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

  // Save Cloud Credentials
  const handleSaveCloud = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = sanitizeSupabaseUrl(supabaseUrl);
    setSupabaseUrl(cleanUrl);

    if (!cleanUrl || !supabaseKey.trim()) {
      setCloudMsg({ type: 'error', text: 'Vui lòng điền đầy đủ URL và Anon Key.' });
      return;
    }

    const ok = initSupabase(cleanUrl, supabaseKey.trim());
    if (ok) {
      setCloudMsg({ type: 'success', text: 'Đã kết nối thành công với Supabase Cloud!' });
    } else {
      setCloudMsg({ type: 'error', text: 'Kết nối thất bại. Vui lòng kiểm tra lại URL hoặc Key.' });
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-stone-950 flex items-center justify-center p-4 select-none overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-orange-500 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-amber-600 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="pt-8 pb-6 px-6 text-center bg-gradient-to-b from-stone-50 to-white border-b border-stone-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-stone-900 via-stone-800 to-orange-500 text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-orange-500/20 mb-3 border border-stone-800 overflow-hidden">
            {shopInfo?.logoUrl ? (
              <img src={shopInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span>{shopInfo?.name ? shopInfo.name.charAt(0).toUpperCase() : 'C'}</span>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-xl font-black text-stone-950 tracking-tight">
              {shopInfo?.name || 'Caos'}
            </h1>
            <span className="text-[10px] bg-stone-900 text-orange-400 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
              {shopInfo?.tagline || 'Print Studio'}
            </span>
          </div>
          
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
            Hệ thống Quản lý Đơn in & Dàn trang Tự động
          </p>

          {/* Cloud Indicator Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border bg-white shadow-2xs">
            {connected ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">🟢 Cloud Supabase Đã Kết Nối</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-stone-600">🟡 Chế độ Cục Bộ (Bộ nhớ máy)</span>
              </>
            )}
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex p-1 bg-stone-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setAuthMsg(null); }}
              className={`flex-1 py-2 rounded-xl transition ${
                activeTab === 'login' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('signup'); setAuthMsg(null); }}
              className={`flex-1 py-2 rounded-xl transition ${
                activeTab === 'signup' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Đăng ký tiệm
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('cloud'); setCloudMsg(null); }}
              className={`px-3 py-2 rounded-xl transition flex items-center gap-1 shrink-0 ${
                activeTab === 'cloud' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Cloud</span>
            </button>
          </div>
        </div>

        {/* Forms Body */}
        <div className="px-6 pb-6 pt-2 text-xs">
          
          {/* Notification Msg */}
          {authMsg && (
            <div className={`p-3 rounded-2xl mb-3 flex items-center gap-2 ${
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

          {/* TAB 1 & 2: LOGIN / SIGNUP */}
          {activeTab !== 'cloud' ? (
            <form onSubmit={activeTab === 'login' ? handleLogin : handleSignUp} className="space-y-3">
              
              {activeTab === 'signup' && (
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Tên tiệm / Họ tên</label>
                  <input
                    type="text"
                    required
                    placeholder="Tiệm In Caos Studio"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white text-stone-900"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-stone-700 block mb-1">Email tài khoản</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="tiemanh@caosprint.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Mật khẩu</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white text-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-tr from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white font-black text-sm rounded-xl shadow-lg shadow-orange-500/30 active:scale-98 transition flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <span>Đang xử lý...</span>
                ) : activeTab === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Mở khóa vào Tiệm</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Đăng ký tài khoản</span>
                  </>
                )}
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
                className="w-full py-2.5 bg-white hover:bg-stone-50 border border-stone-300 hover:border-stone-400 text-stone-800 font-bold rounded-xl shadow-2xs active:scale-98 transition flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Tiếp tục với tài khoản Google</span>
              </button>

              <p className="text-[10px] text-stone-400 text-center leading-relaxed mt-3">
                Dữ liệu đơn hàng, doanh số và danh bạ khách hàng được bảo vệ an toàn 100%.
              </p>
            </form>
          ) : (

            /* TAB 3: CLOUD CONFIGURATION */
            <form onSubmit={handleSaveCloud} className="space-y-3.5">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl text-stone-700 leading-relaxed text-[11px]">
                <span className="font-bold block text-stone-900 mb-0.5">Kết nối máy chủ Supabase Miễn phí</span>
                Dán URL và Anon Key của bạn để đồng bộ đơn hàng sang iPhone và các máy tính khác.
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Supabase Project URL</label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Supabase Anon Public Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-mono text-[11px]"
                />
              </div>

              {cloudMsg && (
                <div className={`p-2.5 rounded-xl text-[11px] ${
                  cloudMsg.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {cloudMsg.text}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-xs active:scale-98 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Lưu thông số Supabase Cloud</span>
              </button>

              <div className="pt-2 text-center">
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-orange-600 hover:text-orange-700 font-bold"
                >
                  <span>Chưa có dự án Supabase? Tạo miễn phí 100%</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
