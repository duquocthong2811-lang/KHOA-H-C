import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  BookOpen,
  PieChart as PieIcon,
  Filter,
  Download,
  ArrowUpRight,
  Clock,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { fetchStatistics, fetchTopics } from '../utils/api';
import { exportSubmissionsToExcel } from '../utils/export';
import { TopicConfig } from '../types';

interface TeacherDashboardProps {
  onNavigateTab: (tab: any) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<any>(null);
  const [topics, setTopics] = useState<TopicConfig[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, topicsData] = await Promise.all([
        fetchStatistics({ topicId: selectedTopic, className: selectedClass }),
        fetchTopics()
      ]);
      setStats(statsData);
      setTopics(topicsData);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTopic, selectedClass]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const {
    totalAttempts = 0,
    uniqueStudents = 0,
    completedCount = 0,
    autoSubmittedCount = 0,
    completionRate = 100,
    avgScore = 0,
    maxScore = 0,
    minScore = 0,
    correctRate = 0,
    brackets = { poor: 0, average: 0, good: 0, veryGood: 0, excellent: 0 },
    topicCounts = {},
    cognitiveLevels = {
      nhan_biet: { percent: 0, correct: 0, total: 0 },
      ket_noi: { percent: 0, correct: 0, total: 0 },
      van_dung: { percent: 0, correct: 0, total: 0 }
    }
  } = stats || {};

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none select-none text-9xl">
          🔬
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
              Môn Khoa học lớp 5
            </span>
            <span className="bg-white/10 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
              Trường Tiểu học Lương Thế Vinh
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
            Chào mừng Thầy Dư Quốc Thông! 👋
          </h2>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Hệ thống đang sẵn sàng phục vụ 11 đề ôn tập và kiểm tra trực tuyến. Dữ liệu học sinh được cập nhật thời gian thực, tự động phân tích phổ điểm và độ phân hóa theo chuẩn 50% Nhận biết, 30% Kết nối, 20% Vận dụng.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => onNavigateTab('qrcodes')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-lg transition"
            >
              <span>Xem 11 Mã QR học sinh</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('questions')}
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 backdrop-blur-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Trợ lí AI tạo câu hỏi</span>
            </button>
            <button
              onClick={() => onNavigateTab('students')}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 backdrop-blur-sm transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Xem danh sách học sinh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-slate-700 font-bold text-sm">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Bộ lọc dữ liệu:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả 11 chủ đề</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả các lớp</option>
            <option value="5/1">Lớp 5/1</option>
            <option value="5/2">Lớp 5/2</option>
            <option value="5/3">Lớp 5/3</option>
            <option value="5/4">Lớp 5/4</option>
            <option value="5/5">Lớp 5/5</option>
            <option value="5/6">Lớp 5/6</option>
          </select>

          {(selectedTopic || selectedClass) && (
            <button
              onClick={() => {
                setSelectedTopic('');
                setSelectedClass('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Tổng học sinh tham gia</p>
            <p className="text-2xl font-black text-slate-800">{uniqueStudents}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {totalAttempts} lượt làm bài ghi nhận
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Điểm trung bình</p>
            <p className="text-2xl font-black text-emerald-600">{avgScore} <span className="text-xs text-slate-400 font-normal">/ 10</span></p>
            <p className="text-[11px] text-slate-400 mt-1">
              Cao: <strong className="text-emerald-700">{maxScore}</strong> • Thấp: <strong className="text-rose-600">{minScore}</strong>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Tỉ lệ trả lời đúng</p>
            <p className="text-2xl font-black text-blue-600">{correctRate}%</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Tỉ lệ sai: <strong className="text-slate-600">{Math.max(0, Math.round((100 - correctRate) * 10) / 10)}%</strong>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Tỉ lệ hoàn thành bài</p>
            <p className="text-2xl font-black text-teal-600">{completionRate}%</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Chủ động nộp: {completedCount} • Hết giờ nộp: {autoSubmittedCount}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-800">Biểu đồ phân bố điểm số (Phổ điểm)</h3>
              <p className="text-xs text-slate-400">Số lượng học sinh theo từng khoảng điểm thang 10</p>
            </div>
            <BarChart2 className="w-5 h-5 text-blue-600" />
          </div>

          <div className="space-y-3.5 pt-2">
            {[
              { label: 'Xuất sắc (9.0 - 10.0)', count: brackets.excellent, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
              { label: 'Giỏi (8.0 - 8.9)', count: brackets.veryGood, color: 'bg-blue-500', textColor: 'text-blue-700' },
              { label: 'Khá (6.5 - 7.9)', count: brackets.good, color: 'bg-indigo-500', textColor: 'text-indigo-700' },
              { label: 'Trung bình (5.0 - 6.4)', count: brackets.average, color: 'bg-amber-500', textColor: 'text-amber-700' },
              { label: 'Cần cố gắng (< 5.0)', count: brackets.poor, color: 'bg-rose-500', textColor: 'text-rose-700' }
            ].map((b, i) => {
              const maxVal = Math.max(1, totalAttempts);
              const percentage = Math.round((b.count / maxVal) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600">{b.label}</span>
                    <span className={b.textColor}>
                      {b.count} lượt ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${b.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cognitive Level Analysis Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-800">Kết quả theo mức độ nhận thức</h3>
              <p className="text-xs text-slate-400">Tỉ lệ trả lời đúng theo chuẩn cơ cấu đề 50% - 30% - 20%</p>
            </div>
            <PieIcon className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-center">
            {/* Nhận biết */}
            <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Cơ cấu 50%
                </span>
                <h4 className="font-bold text-xs text-slate-700 mt-2">Nhận biết</h4>
                <p className="text-2xl font-black text-blue-700 my-2">
                  {cognitiveLevels.nhan_biet.percent}%
                </p>
              </div>
              <p className="text-[11px] text-slate-500">
                Đúng {cognitiveLevels.nhan_biet.correct}/{cognitiveLevels.nhan_biet.total} câu
              </p>
            </div>

            {/* Kết nối */}
            <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Cơ cấu 30%
                </span>
                <h4 className="font-bold text-xs text-slate-700 mt-2">Kết nối</h4>
                <p className="text-2xl font-black text-amber-700 my-2">
                  {cognitiveLevels.ket_noi.percent}%
                </p>
              </div>
              <p className="text-[11px] text-slate-500">
                Đúng {cognitiveLevels.ket_noi.correct}/{cognitiveLevels.ket_noi.total} câu
              </p>
            </div>

            {/* Vận dụng */}
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Cơ cấu 20%
                </span>
                <h4 className="font-bold text-xs text-slate-700 mt-2">Vận dụng</h4>
                <p className="text-2xl font-black text-emerald-700 my-2">
                  {cognitiveLevels.van_dung.percent}%
                </p>
              </div>
              <p className="text-[11px] text-slate-500">
                Đúng {cognitiveLevels.van_dung.correct}/{cognitiveLevels.van_dung.total} câu
              </p>
            </div>
          </div>

          <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-600 flex items-start space-x-2">
            <span className="text-blue-600 font-bold text-base leading-none">💡</span>
            <p>
              Học sinh cần tăng cường rèn luyện các bài toán thực tiễn ở mức độ <strong>Vận dụng</strong> và khả năng giải thích nguyên nhân khoa học ở mức <strong>Kết nối</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Participation by 11 Topics Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-800">Thống kê theo 11 chủ đề & đề ôn tập</h3>
            <p className="text-xs text-slate-400">Số lượt tham gia và điểm số trung bình của từng bài</p>
          </div>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>Xuất toàn bộ báo cáo</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">STT</th>
                <th className="py-3 px-3">Chủ đề / Đề kiểm tra</th>
                <th className="py-3 px-3">Quy chuẩn</th>
                <th className="py-3 px-3">Lượt làm bài</th>
                <th className="py-3 px-3">Điểm TB</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topics.map((t, index) => {
                const topicStat = topicCounts[t.id] || { count: 0, avgScore: 0 };
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-bold text-slate-400">{index + 1}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {t.title}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                        {t.questionCount} câu • {t.durationMinutes} phút
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {topicStat.count} lượt
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-black px-2.5 py-1 rounded-lg text-xs inline-block ${
                          topicStat.avgScore >= 8
                            ? 'bg-emerald-50 text-emerald-700'
                            : topicStat.avgScore >= 6.5
                            ? 'bg-blue-50 text-blue-700'
                            : topicStat.avgScore > 0
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {topicStat.avgScore > 0 ? `${topicStat.avgScore} / 10` : 'Chưa có'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedTopic(t.id);
                          onNavigateTab('students');
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        Xem bài làm
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
