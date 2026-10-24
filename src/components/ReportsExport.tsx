import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  Filter,
  CheckSquare,
  Square,
  Award,
  Users,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { fetchSubmissions, fetchTopics, fetchStatistics } from '../utils/api';
import { exportSubmissionsToExcel, exportSubmissionsToCsv } from '../utils/export';
import { StudentSubmission, TopicConfig } from '../types';

export const ReportsExport: React.FC = () => {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [topics, setTopics] = useState<TopicConfig[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters for report
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Selected Columns to export
  const [exportCols, setExportCols] = useState({
    stt: true,
    studentName: true,
    className: true,
    schoolName: true,
    topicTitle: true,
    score: true,
    correctCount: true,
    wrongCount: true,
    unansweredCount: true,
    totalQuestions: true,
    duration: true,
    status: true,
    submittedAt: true
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [subs, tList, st] = await Promise.all([
        fetchSubmissions({
          topicId: selectedTopic || undefined,
          className: selectedClass || undefined
        }),
        fetchTopics(),
        fetchStatistics({
          topicId: selectedTopic || undefined,
          className: selectedClass || undefined
        })
      ]);
      setSubmissions(subs);
      setTopics(tList);
      setStats(st);
    } catch (err) {
      console.error('Failed to load export data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedTopic, selectedClass]);

  const toggleCol = (key: keyof typeof exportCols) => {
    setExportCols((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportExcel = () => {
    const filename = `Bao_Cao_KhoaHoc5_${selectedClass || 'ToanTruong'}_${selectedTopic || 'TatCa'}.xlsx`;
    exportSubmissionsToExcel(submissions, filename);
  };

  const handleExportCsv = () => {
    const filename = `Bao_Cao_KhoaHoc5_${selectedClass || 'ToanTruong'}_${selectedTopic || 'TatCa'}.csv`;
    exportSubmissionsToCsv(submissions, filename);
  };

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const topicName = topics.find((t) => t.id === selectedTopic)?.title || 'Tất cả 11 chủ đề';
    const className = selectedClass || 'Tất cả các lớp khối 5';
    const nowStr = new Date().toLocaleString('vi-VN');

    const rowsHtml = submissions
      .map(
        (s, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${s.studentName}</strong></td>
        <td style="text-align: center;">${s.className}</td>
        <td>${s.schoolName}</td>
        <td>${s.topicTitle}</td>
        <td style="text-align: center; font-weight: bold; color: #1e40af;">${s.score}</td>
        <td style="text-align: center; color: #059669;">${s.correctCount}</td>
        <td style="text-align: center; color: #dc2626;">${s.wrongCount}</td>
        <td style="text-align: center;">${s.unansweredCount}</td>
        <td style="text-align: center;">${Math.floor(s.durationSeconds / 60)}p${s.durationSeconds % 60}s</td>
        <td style="text-align: center;">${s.status === 'completed' ? 'Đã nộp bài' : 'Tự nộp hết giờ'}</td>
      </tr>
    `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Báo Cáo Kết Quả Kiểm Tra - Khoa Học 5</title>
          <style>
            body {
              font-family: 'Times New Roman', Times, serif;
              padding: 30px;
              color: #111827;
              line-height: 1.4;
            }
            .header-table { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
            .header-table td { vertical-align: top; }
            .school-header { text-align: center; font-weight: bold; font-size: 14px; }
            .motto { text-align: center; font-weight: bold; font-size: 14px; }
            .title { text-align: center; font-size: 20px; font-weight: bold; margin: 25px 0 10px 0; text-transform: uppercase; color: #1e3a8a; }
            .meta { text-align: center; font-style: italic; font-size: 13px; margin-bottom: 25px; }
            .stat-box {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 25px;
              display: flex;
              justify-content: space-around;
              font-size: 13px;
            }
            table.data {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            table.data th, table.data td {
              border: 1px solid #334155;
              padding: 6px 8px;
            }
            table.data th {
              background-color: #f1f5f9;
              font-weight: bold;
              text-align: center;
            }
            .signature {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              font-size: 14px;
            }
            .sign-box { text-align: center; width: 250px; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td class="school-header" style="width: 45%;">
                TRƯỜNG TIỂU HỌC LƯƠNG THẾ VINH<br/>
                TỔ CHUYÊN MÔN KHỐI 5<br/>
                ----------------------
              </td>
              <td class="motto" style="width: 55%;">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/>
                Độc lập - Tự do - Hạnh phúc<br/>
                ----------------------
              </td>
            </tr>
          </table>

          <div class="title">BÁO CÁO TỔNG HỢP KẾT QUẢ KIỂM TRA MÔN KHOA HỌC LỚP 5</div>
          <div class="meta">
            Hệ thống: "THÔNG THÁI CÙNG THẦY THÔNG" • Đơn vị: ${className} • Phạm vi: ${topicName}<br/>
            Thời điểm xuất báo cáo: ${nowStr}
          </div>

          <div class="stat-box">
            <div>Tổng số lượt làm bài: <strong>${submissions.length}</strong></div>
            <div>Điểm trung bình: <strong>${stats?.avgScore || 0} / 10</strong></div>
            <div>Điểm cao nhất: <strong>${stats?.maxScore || 0}</strong></div>
            <div>Điểm thấp nhất: <strong>${stats?.minScore || 0}</strong></div>
            <div>Tỉ lệ đúng: <strong>${stats?.correctRate || 0}%</strong></div>
          </div>

          <table class="data">
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ và tên học sinh</th>
                <th>Lớp</th>
                <th>Trường</th>
                <th>Chủ đề</th>
                <th>Điểm</th>
                <th>Đúng</th>
                <th>Sai</th>
                <th>Chưa làm</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="signature">
            <div class="sign-box">
              <p><strong>HIỆU TRƯỞNG DUYỆT</strong></p>
              <br/><br/><br/>
            </div>
            <div class="sign-box">
              <p><em>Ngày ..... tháng ..... năm 2026</em></p>
              <p><strong>GIÁO VIÊN BÁO CÁO</strong></p>
              <br/><br/><br/>
              <p><strong>Dư Quốc Thông</strong></p>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
          Báo Cáo & Xuất Dữ Liệu Thực Tế
        </h2>
        <p className="text-xs text-slate-500">
          Kết xuất báo cáo Excel (.xlsx), CSV, In PDF chuẩn form Trường Tiểu học Lương Thế Vinh - GV Dư Quốc Thông
        </p>
      </div>

      {/* Filter and Option Selection Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
        <h3 className="font-extrabold text-sm text-slate-800 flex items-center space-x-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>1. Lựa chọn phạm vi báo cáo</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phạm vi Chủ đề / Đợt kiểm tra:
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5"
            >
              <option value="">Tất cả 11 chủ đề</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.questionCount} câu)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lớp học sinh:
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5"
            >
              <option value="">Toàn khối 5</option>
              <option value="5/1">Lớp 5/1</option>
              <option value="5/2">Lớp 5/2</option>
              <option value="5/3">Lớp 5/3</option>
              <option value="5/4">Lớp 5/4</option>
              <option value="5/5">Lớp 5/5</option>
              <option value="5/6">Lớp 5/6</option>
            </select>
          </div>
        </div>

        {/* Column Selectors */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            2. Tùy chọn các cột hiển thị khi xuất:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
            {Object.entries({
              stt: 'Số thứ tự (STT)',
              studentName: 'Họ và tên học sinh',
              className: 'Lớp',
              schoolName: 'Trường Tiểu học',
              topicTitle: 'Tên chủ đề',
              score: 'Điểm số (Thang 10)',
              correctCount: 'Số câu đúng',
              wrongCount: 'Số câu sai',
              unansweredCount: 'Số câu chưa làm',
              totalQuestions: 'Tổng số câu',
              duration: 'Thời gian làm bài',
              status: 'Trạng thái nộp',
              submittedAt: 'Thời điểm nộp'
            }).map(([key, label]) => {
              const checked = exportCols[key as keyof typeof exportCols];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleCol(key as keyof typeof exportCols)}
                  className={`flex items-center space-x-2 p-2 rounded-xl border text-left transition ${
                    checked
                      ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-semibold">
            Đang chọn xuất dữ liệu thực của <strong>{submissions.length} bài làm</strong>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              disabled={submissions.length === 0}
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center space-x-1.5 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Xuất định dạng CSV</span>
            </button>

            <button
              onClick={handlePrintPdf}
              disabled={submissions.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition"
            >
              <Printer className="w-4 h-4 text-indigo-200" />
              <span>In Báo Cáo / Lưu PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={submissions.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>Xuất Báo Cáo Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Snippet */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
        <h3 className="font-extrabold text-sm text-slate-800 mb-3">
          Xem trước bảng dữ liệu sẽ xuất:
        </h3>
        <div className="overflow-x-auto max-h-64 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="p-2">STT</th>
                <th className="p-2">Học sinh</th>
                <th className="p-2">Lớp</th>
                <th className="p-2">Chủ đề</th>
                <th className="p-2">Điểm</th>
                <th className="p-2">Đúng</th>
                <th className="p-2">Sai</th>
                <th className="p-2">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.slice(0, 15).map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-2 text-slate-400">{idx + 1}</td>
                  <td className="p-2 font-bold text-slate-800">{s.studentName}</td>
                  <td className="p-2">{s.className}</td>
                  <td className="p-2">{s.topicTitle}</td>
                  <td className="p-2 font-extrabold text-blue-700">{s.score}</td>
                  <td className="p-2 text-emerald-600 font-bold">{s.correctCount}</td>
                  <td className="p-2 text-rose-500 font-bold">{s.wrongCount}</td>
                  <td className="p-2 text-slate-500">{Math.floor(s.durationSeconds / 60)}p</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {submissions.length > 15 && (
          <p className="text-[11px] text-slate-400 mt-2 text-right">
            ...và {submissions.length - 15} học sinh khác sẽ được xuất đầy đủ vào file.
          </p>
        )}
      </div>
    </div>
  );
};
