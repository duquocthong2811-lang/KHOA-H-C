import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Key,
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  School,
  User,
  BookOpen
} from 'lucide-react';
import { fetchTeacherConfig, updateTeacherSecurity, restoreDatabaseApi } from '../utils/api';

export const AppSettings: React.FC = () => {
  const [teacher, setTeacher] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeacherConfig().then((cfg) => {
      setTeacher(cfg);
      if (cfg.pin) setPin(cfg.pin);
    });
  }, []);

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Mật khẩu mới và xác nhận mật khẩu không khớp nhau.' });
      return;
    }

    try {
      setLoading(true);
      await updateTeacherSecurity(pin, newPassword || undefined);
      setMsg({ type: 'success', text: 'Đã cập nhật mã PIN và bảo mật thành công!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Lỗi khi cập nhật' });
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = () => {
    window.location.href = '/api/database/export';
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (confirm('Thầy có chắc chắn muốn phục hồi dữ liệu từ file này? Dữ liệu hiện tại sẽ được thay thế.')) {
          await restoreDatabaseApi(json);
          alert('Phục hồi dữ liệu thành công! Trang sẽ được làm mới.');
          window.location.reload();
        }
      } catch (err: any) {
        alert('File không hợp lệ: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
          Cài Đặt Hệ Thống & Bảo Mật
        </h2>
        <p className="text-xs text-slate-500">
          Quản lý mã PIN giáo viên, thông tin trường lớp và sao lưu/phục hồi cơ sở dữ liệu
        </p>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center space-x-2 border ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{msg.text}</span>
        </div>
      )}

      {/* Teacher Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-800 flex items-center space-x-2">
          <User className="w-4 h-4 text-blue-600" />
          <span>Thông tin Giáo viên phụ trách</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block mb-1">Giáo viên phụ trách</span>
            <strong className="text-slate-800 text-sm">{teacher?.fullName || 'Dư Quốc Thông'}</strong>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block mb-1">Đơn vị công tác</span>
            <strong className="text-slate-800 text-sm">{teacher?.school || 'Trường Tiểu học Lương Thế Vinh'}</strong>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-slate-400 block mb-1">Môn học phụ trách</span>
            <strong className="text-slate-800 text-sm">{teacher?.subject || 'Khoa học lớp 5'}</strong>
          </div>
        </div>
      </div>

      {/* Security Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-800 flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Mã PIN & Mật khẩu Quản trị</span>
        </h3>
        <p className="text-xs text-slate-500">
          Mã PIN dùng để đăng nhập nhanh vào trang Giáo viên mà không cần nhập mật khẩu dài.
        </p>

        <form onSubmit={handleUpdateSecurity} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mã PIN nhanh (6 số):
            </label>
            <input
              type="text"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="VD: 123456"
              className="w-full text-base font-black tracking-widest bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mật khẩu mới (để trống nếu không muốn đổi):
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới..."
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
            />
          </div>

          {newPassword && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Xác nhận mật khẩu mới:
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition"
          >
            {loading ? 'Đang cập nhật...' : 'Lưu cài đặt bảo mật'}
          </button>
        </form>
      </div>

      {/* Database Backup & Restore */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-800 flex items-center space-x-2">
          <Database className="w-4 h-4 text-purple-600" />
          <span>Sao Lưu & Phục Hồi Dữ Liệu Toàn Diện</span>
        </h3>
        <p className="text-xs text-slate-500">
          Tải về toàn bộ cơ sở dữ liệu bao gồm 11 chủ đề, toàn bộ ngân hàng câu hỏi và toàn bộ lịch sử bài làm của học sinh dưới dạng file JSON.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleBackup}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Tải file Sao Lưu (Backup JSON)</span>
          </button>

          <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-2 cursor-pointer transition">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Phục hồi từ file JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
