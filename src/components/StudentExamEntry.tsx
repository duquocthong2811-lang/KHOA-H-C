import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  BookOpen,
  Wifi,
  Lock,
  Compass
} from 'lucide-react';
import { TopicConfig } from '../types';

interface StudentExamEntryProps {
  topics: TopicConfig[];
  selectedTopicId: string;
  onSelectTopic: (id: string) => void;
  onStartExam: (info: {
    studentName: string;
    className: string;
    schoolName: string;
    topicId: string;
  }) => void;
  onOpenTeacherLogin: () => void;
}

export const StudentExamEntry: React.FC<StudentExamEntryProps> = ({
  topics,
  selectedTopicId,
  onSelectTopic,
  onStartExam,
  onOpenTeacherLogin
}) => {
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('5/1');
  const [schoolName, setSchoolName] = useState('Trường Tiểu học Lương Thế Vinh');
  const [customClass, setCustomClass] = useState('');
  const [err, setErr] = useState('');

  const currentTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setErr('Vui lòng nhập Họ và tên của em.');
      return;
    }

    const finalClass = className === 'custom' ? customClass.trim() : className;
    if (!finalClass) {
      setErr('Vui lòng nhập Lớp của em.');
      return;
    }

    if (!schoolName.trim()) {
      setErr('Vui lòng nhập Tên trường học.');
      return;
    }

    setErr('');
    onStartExam({
      studentName: studentName.trim(),
      className: finalClass,
      schoolName: schoolName.trim(),
      topicId: currentTopic.id
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 via-indigo-600 to-sky-700 flex flex-col justify-between p-4 md:p-8 font-['Nunito',sans-serif]">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow border border-white/30">
            🦉
          </div>
          <div>
            <h1 className="font-black text-lg md:text-xl tracking-tight leading-none">
              THÔNG THÁI CÙNG THẦY THÔNG
            </h1>
            <p className="text-xs text-blue-100 font-semibold mt-0.5">
              Khoa học lớp 5 • Trường Tiểu học Lương Thế Vinh
            </p>
          </div>
        </div>

        <button
          onClick={onOpenTeacherLogin}
          className="text-xs bg-white/10 hover:bg-white/25 text-white font-bold px-3 py-1.5 rounded-xl border border-white/20 flex items-center space-x-1.5 transition"
        >
          <Lock className="w-3.5 h-3.5 text-amber-300" />
          <span>Giáo viên</span>
        </button>
      </header>

      {/* Main Card */}
      <main className="max-w-xl mx-auto w-full my-auto py-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 space-y-6">
          {/* Badge & Topic title */}
          <div className="text-center space-y-2">
            <span className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-700 font-extrabold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider border border-blue-100">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>Đề kiểm tra trực tuyến Khoa học 5</span>
            </span>

            <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
              {currentTopic ? currentTopic.title : 'Đang tải chủ đề...'}
            </h2>

            {currentTopic && (
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {currentTopic.description}
              </p>
            )}

            {/* Topic quick selector if needed */}
            <div className="pt-1">
              <select
                value={selectedTopicId}
                onChange={(e) => onSelectTopic(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    Chuyển đề: {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Test Specs Pill */}
          {currentTopic && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-3.5 flex items-center justify-around text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Số lượng câu</span>
                <strong className="text-blue-700 font-black text-sm">
                  {currentTopic.questionCount} câu hỏi
                </strong>
              </div>
              <div className="w-px h-8 bg-blue-200/60" />
              <div>
                <span className="text-slate-400 block text-[11px]">Thời gian làm bài</span>
                <strong className="text-indigo-700 font-black text-sm">
                  {currentTopic.durationMinutes} phút
                </strong>
              </div>
              <div className="w-px h-8 bg-blue-200/60" />
              <div>
                <span className="text-slate-400 block text-[11px]">Thang điểm</span>
                <strong className="text-emerald-700 font-black text-sm">10.0 điểm</strong>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {err && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                ⚠️ {err}
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Họ và tên của em: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="VD: Nguyễn Văn An, Trần Ngọc Linh..."
                className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                autoFocus
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Lớp: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-2xl px-3 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5/1">Lớp 5/1</option>
                  <option value="5/2">Lớp 5/2</option>
                  <option value="5/3">Lớp 5/3</option>
                  <option value="5/4">Lớp 5/4</option>
                  <option value="5/5">Lớp 5/5</option>
                  <option value="5/6">Lớp 5/6</option>
                  <option value="custom">Lớp khác...</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Trường học:
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-2xl px-3 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {className === 'custom' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhập tên lớp của em:
                </label>
                <input
                  type="text"
                  value={customClass}
                  onChange={(e) => setCustomClass(e.target.value)}
                  placeholder="VD: 5A1, 5B..."
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5"
                  required
                />
              </div>
            )}

            {/* Offline reassurance */}
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start space-x-2 text-xs text-emerald-800">
              <Wifi className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Chế độ ngoại tuyến:</strong> Sau khi bấm bắt đầu, đề thi sẽ được lưu trên thiết bị. Nếu mất mạng trong lúc thi, em vẫn có thể tiếp tục làm bài bình thường; hệ thống sẽ tự động gửi bài khi có mạng trở lại!
              </p>
            </div>

            {/* Start Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-base md:text-lg py-4 px-6 rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 transition transform active:scale-98"
            >
              <span>BẮT ĐẦU LÀM BÀI</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-blue-200 py-3">
        Giáo viên: <strong>Dư Quốc Thông</strong> • Đơn vị: <strong>Trường Tiểu học Lương Thế Vinh</strong>
        <br />
        Chúc các em làm bài thật tốt và khám phá nhiều kiến thức khoa học bổ ích! ✨
      </footer>
    </div>
  );
};
