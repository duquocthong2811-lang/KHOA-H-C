import React, { useState } from 'react';
import { Lock, X, Key, ShieldCheck, Loader2 } from 'lucide-react';
import { teacherLogin } from '../utils/api';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, teacher: any) => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [pinOrPassword, setPinOrPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinOrPassword.trim()) {
      setErr('Vui lòng nhập mã PIN hoặc mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      setErr('');
      const data = await teacherLogin(pinOrPassword.trim());
      onLoginSuccess(data.token, data.teacher);
      onClose();
    } catch (error: any) {
      setErr(error.message || 'Mật khẩu hoặc mã PIN không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPin = (num: string) => {
    if (pinOrPassword.length < 6) {
      setPinOrPassword((prev) => prev + num);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs font-['Nunito',sans-serif]">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800">Khu Vực Giáo Viên</h3>
              <p className="text-[11px] text-slate-400">Thầy Dư Quốc Thông</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {err && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center">
              {err}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 text-center mb-1.5">
              Nhập Mã PIN Giáo viên (Mặc định: 123456)
            </label>
            <input
              type="password"
              value={pinOrPassword}
              onChange={(e) => setPinOrPassword(e.target.value)}
              placeholder="••••••"
              className="w-full text-center text-2xl font-black tracking-widest bg-slate-50 border border-slate-300 rounded-2xl py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              required
            />
          </div>

          {/* Keypad for touch mobile */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  if (k === 'C') setPinOrPassword('');
                  else if (k === '⌫') setPinOrPassword((prev) => prev.slice(0, -1));
                  else handleQuickPin(k);
                }}
                className="h-11 bg-slate-100 hover:bg-blue-100 active:bg-blue-200 text-slate-800 font-black text-sm rounded-xl transition"
              >
                {k}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-md transition flex items-center justify-center space-x-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <span>Đăng nhập trang Quản trị</span>
            )}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center">
          Mã PIN hoặc mật khẩu: <strong>123456</strong> hoặc <strong>thongthaythong2025</strong>
        </p>
      </div>
    </div>
  );
};
