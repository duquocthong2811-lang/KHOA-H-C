import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  X,
  Award,
  BookOpen
} from 'lucide-react';
import { fetchSubmissions, fetchTopics } from '../utils/api';
import { exportSubmissionsToExcel, exportSubmissionsToCsv } from '../utils/export';
import { StudentSubmission, TopicConfig, Question } from '../types';

export const StudentList: React.FC = () => {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [topics, setTopics] = useState<TopicConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchName, setSearchName] = useState<string>('');
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterTopic, setFilterTopic] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Selected for Detail Modal
  const [selectedSub, setSelectedSub] = useState<StudentSubmission | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subs, tList] = await Promise.all([
        fetchSubmissions({
          studentName: searchName || undefined,
          className: filterClass || undefined,
          topicId: filterTopic || undefined,
          status: filterStatus || undefined
        }),
        fetchTopics()
      ]);
      setSubmissions(subs);
      setTopics(tList);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchName, filterClass, filterTopic, filterStatus]);

  // Group attempts by student name to see repeat attempts
  const studentAttemptsMap: Record<string, StudentSubmission[]> = {};
  submissions.forEach((s) => {
    const key = `${s.studentName}_${s.className}`;
    if (!studentAttemptsMap[key]) studentAttemptsMap[key] = [];
    studentAttemptsMap[key].push(s);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
            Danh Sách Học Sinh Tham Gia & Bài Làm Chi Tiết
          </h2>
          <p className="text-xs text-slate-500">
            Theo dõi từng lượt làm bài, tự động xếp hạng điểm số từ cao xuống thấp và bảo lưu lịch sử thi
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportSubmissionsToExcel(submissions)}
            disabled={submissions.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel (.xlsx)</span>
          </button>
          <button
            onClick={() => exportSubmissionsToCsv(submissions)}
            disabled={submissions.length === 0}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-3 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Tìm theo họ tên học sinh..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Class Filter */}
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700"
        >
          <option value="">Tất cả các lớp</option>
          <option value="5/1">Lớp 5/1</option>
          <option value="5/2">Lớp 5/2</option>
          <option value="5/3">Lớp 5/3</option>
          <option value="5/4">Lớp 5/4</option>
          <option value="5/5">Lớp 5/5</option>
          <option value="5/6">Lớp 5/6</option>
        </select>

        {/* Topic Filter */}
        <select
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700"
        >
          <option value="">Tất cả chủ đề</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="completed">Đã nộp bài</option>
          <option value="auto_submitted">Hết giờ tự động nộp</option>
        </select>

        {(searchName || filterClass || filterTopic || filterStatus) && (
          <button
            onClick={() => {
              setSearchName('');
              setFilterClass('');
              setFilterTopic('');
              setFilterStatus('');
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-2">📋</p>
            <h3 className="font-extrabold text-slate-700 text-base">Chưa có bài làm nào</h3>
            <p className="text-xs text-slate-400 mt-1">
              Học sinh quét mã QR hoặc mở đường link đề thi để bắt đầu làm bài. Kết quả sẽ hiển thị ngay tại đây.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center">STT</th>
                  <th className="py-3 px-3">Họ và tên</th>
                  <th className="py-3 px-3 text-center">Lớp</th>
                  <th className="py-3 px-3">Trường</th>
                  <th className="py-3 px-3">Chủ đề</th>
                  <th className="py-3 px-3 text-center text-emerald-700">Đúng</th>
                  <th className="py-3 px-3 text-center text-rose-700">Sai</th>
                  <th className="py-3 px-3 text-center text-slate-400">Chưa làm</th>
                  <th className="py-3 px-3 text-center">Điểm số</th>
                  <th className="py-3 px-3 text-center">Thời gian</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub, idx) => {
                  const mins = Math.floor(sub.durationSeconds / 60);
                  const secs = sub.durationSeconds % 60;
                  const timeStr = `${mins}p${secs < 10 ? '0' : ''}${secs}s`;
                  const studentKey = `${sub.studentName}_${sub.className}`;
                  const repeatCount = studentAttemptsMap[studentKey]?.length || 1;

                  return (
                    <tr key={sub.id} className="hover:bg-blue-50/40 transition">
                      <td className="py-3 px-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setSelectedSub(sub)}
                          className="font-extrabold text-slate-800 hover:text-blue-600 text-left flex items-center space-x-1.5"
                        >
                          <span>{sub.studentName}</span>
                          {repeatCount > 1 && (
                            <span
                              className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-full"
                              title={`Học sinh này đã làm ${repeatCount} lượt`}
                            >
                              x{repeatCount}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">
                        {sub.className}
                      </td>
                      <td className="py-3 px-3 text-slate-500 truncate max-w-[150px]">
                        {sub.schoolName}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {sub.topicTitle}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600">
                        {sub.correctCount}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-rose-500">
                        {sub.wrongCount}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400">
                        {sub.unansweredCount}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-black px-2.5 py-1 rounded-xl text-xs inline-block shadow-xs ${
                            sub.score >= 9
                              ? 'bg-emerald-600 text-white'
                              : sub.score >= 8
                              ? 'bg-blue-600 text-white'
                              : sub.score >= 6.5
                              ? 'bg-indigo-100 text-indigo-800'
                              : sub.score >= 5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sub.score} <span className="text-[10px] opacity-75">/10</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-600">
                        {timeStr}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {sub.status === 'completed' ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            <span>Đã nộp bài</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Tự nộp hết giờ</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedSub(sub)}
                          className="bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 p-1.5 rounded-lg transition"
                          title="Xem bài làm chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Student Submission Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  Bài làm chi tiết
                </span>
                <h3 className="font-extrabold text-lg mt-1">{selectedSub.studentName}</h3>
                <p className="text-xs text-blue-100">
                  Lớp {selectedSub.className} • {selectedSub.schoolName} • {selectedSub.topicTitle}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-2xl font-black text-amber-300">{selectedSub.score} <span className="text-xs text-white">/ 10</span></p>
                  <p className="text-[11px] text-blue-100">
                    Đúng {selectedSub.correctCount}/{selectedSub.totalQuestions} câu
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSub(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Questions review body */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-around text-xs text-slate-600 font-semibold border border-slate-200/60">
                <span>⏱️ Thời gian: <strong>{Math.floor(selectedSub.durationSeconds / 60)} phút {selectedSub.durationSeconds % 60} giây</strong></span>
                <span>📅 Thời điểm nộp: <strong>{new Date(selectedSub.submittedAt).toLocaleString('vi-VN')}</strong></span>
                <span>📌 Trạng thái: <strong className="text-blue-700">{selectedSub.status === 'completed' ? 'Chủ động nộp' : 'Tự nộp khi hết giờ'}</strong></span>
              </div>

              <div className="space-y-4">
                {(selectedSub.questionsSnapshot || []).map((q, idx) => {
                  const ans = selectedSub.answers?.find((a) => a.questionId === q.id);
                  const isCorrect = ans?.isCorrect;
                  const isUnanswered =
                    ans?.selectedOptionIndex === undefined &&
                    !ans?.userBlankAnswers?.length &&
                    !ans?.userMatchingPairs?.length &&
                    !ans?.userOrder?.length;

                  return (
                    <div
                      key={q.id || idx}
                      className={`p-4 rounded-2xl border text-xs ${
                        isCorrect
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : isUnanswered
                          ? 'border-slate-200 bg-slate-50'
                          : 'border-rose-300 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-600">Câu {idx + 1}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              q.cognitiveLevel === 'nhan_biet'
                                ? 'bg-blue-100 text-blue-700'
                                : q.cognitiveLevel === 'ket_noi'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {q.cognitiveLevel === 'nhan_biet'
                              ? 'Nhận biết'
                              : q.cognitiveLevel === 'ket_noi'
                              ? 'Kết nối'
                              : 'Vận dụng'}
                          </span>
                        </div>

                        <span
                          className={`font-black text-xs px-2.5 py-0.5 rounded-full ${
                            isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : isUnanswered
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isCorrect ? '✓ Đúng' : isUnanswered ? '○ Chưa trả lời' : '✗ Sai'}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-800 mb-2">{q.content}</h4>

                      {/* Multiple choice view */}
                      {q.type === 'multiple_choice' && q.options && (
                        <div className="space-y-1.5 mb-2">
                          {q.options.map((opt, oIdx) => {
                            const isChosenByStudent = ans?.selectedOptionIndex === oIdx;
                            const isTrueCorrect = oIdx === q.correctOptionIndex;

                            return (
                              <div
                                key={oIdx}
                                className={`p-2 rounded-xl flex items-center justify-between border ${
                                  isTrueCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                    : isChosenByStudent
                                    ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                <span>
                                  {['A', 'B', 'C'][oIdx]}. {opt}
                                </span>
                                <div>
                                  {isChosenByStudent && (
                                    <span className="text-[10px] font-bold mr-2 text-blue-700">
                                      [Em chọn]
                                    </span>
                                  )}
                                  {isTrueCorrect && (
                                    <span className="text-[10px] font-bold text-emerald-700">
                                      [Đáp án đúng]
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation */}
                      <div className="text-slate-500 bg-white/80 p-2.5 rounded-xl border border-slate-200/60 mt-2">
                        💡 <strong className="text-amber-800">Giải thích:</strong> {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSub(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
