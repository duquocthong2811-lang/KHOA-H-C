import React, { useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Layers,
  QrCode,
  Users,
  BarChart3,
  FileSpreadsheet,
  Settings,
  GraduationCap,
  LogOut,
  Menu,
  X,
  BookOpenCheck,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export type TeacherTab =
  | 'dashboard'
  | 'questions'
  | 'topics'
  | 'qrcodes'
  | 'students'
  | 'statistics'
  | 'reports'
  | 'settings';

interface TeacherLayoutProps {
  currentTab: TeacherTab;
  onSelectTab: (tab: TeacherTab) => void;
  onLogout: () => void;
  onOpenStudentView: () => void;
  children: React.ReactNode;
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  onOpenStudentView,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Trang tổng quan', icon: LayoutDashboard, badge: null },
    { id: 'questions', label: 'Ngân hàng câu hỏi AI', icon: Sparkles, badge: 'Thông minh' },
    { id: 'topics', label: 'Quản lý 11 chủ đề', icon: Layers, badge: null },
    { id: 'qrcodes', label: 'Mã QR tham gia', icon: QrCode, badge: '11 mã' },
    { id: 'students', label: 'Danh sách học sinh', icon: Users, badge: null },
    { id: 'statistics', label: 'Kết quả & Thống kê', icon: BarChart3, badge: null },
    { id: 'reports', label: 'Báo cáo, xuất dữ liệu', icon: FileSpreadsheet, badge: 'Excel' },
    { id: 'settings', label: 'Cài đặt ứng dụng', icon: Settings, badge: null }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <header className="md:hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow">
            🦉
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-tight tracking-wide">THẦY THÔNG</h1>
            <p className="text-xs text-blue-100">Khoa học 5 • Lương Thế Vinh</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenStudentView}
            className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 shadow"
            title="Thử làm bài học sinh"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Học sinh</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out shadow-sm ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Branding */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-blue-700 via-indigo-700 to-sky-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/30">
              🦉
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-full inline-block mb-1">
                Khu vực Giáo viên
              </span>
              <h1 className="font-extrabold text-lg leading-tight tracking-tight">THÔNG THÁI CÙNG THẦY THÔNG</h1>
              <p className="text-xs text-blue-100 font-medium">GV: Dư Quốc Thông</p>
              <p className="text-[11px] text-blue-200">Trường TH Lương Thế Vinh</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Hệ thống quản lí
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id as TeacherTab);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 space-y-2">
          <button
            onClick={() => {
              onOpenStudentView();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-2.5 px-3 rounded-xl shadow-sm transition text-xs"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Khu vực Học sinh (Quét/Làm bài)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 text-slate-600 hover:bg-red-50 hover:text-red-700 font-semibold py-2 px-3 rounded-xl transition text-xs border border-transparent hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Khóa trang quản trị (Đăng xuất)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen overflow-x-hidden p-4 md:p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/50 z-20 backdrop-blur-xs"
        />
      )}
    </div>
  );
};
