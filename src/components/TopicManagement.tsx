import React, { useState, useEffect } from 'react';
import {
  Layers,
  Clock,
  BookOpen,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { fetchTopics, updateTopic, fetchQuestions } from '../utils/api';
import { TopicConfig, Question } from '../types';

interface TopicManagementProps {
  onNavigateToQr: (topicId?: string) => void;
  onNavigateToStudentView: (topicId?: string) => void;
}

export const TopicManagement: React.FC<TopicManagementProps> = ({
  onNavigateToQr,
  onNavigateToStudentView
}) => {
  const [topics, setTopics] = useState<TopicConfig[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing duration modal
  const [editingTopic, setEditingTopic] = useState<TopicConfig | null>(null);
  const [editDuration, setEditDuration] = useState<number>(30);
  const [editQuestionCount, setEditQuestionCount] = useState<number>(30);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tList, qList] = await Promise.all([fetchTopics(), fetchQuestions()]);
      setTopics(tList);
      setQuestions(qList);
    } catch (err) {
      console.error('Error loading topics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEdit = (t: TopicConfig) => {
    setEditingTopic(t);
    setEditDuration(t.durationMinutes);
    setEditQuestionCount(t.questionCount);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;
    try {
      await updateTopic(editingTopic.id, editDuration, editQuestionCount);
      setEditingTopic(null);
      loadData();
    } catch (err: any) {
      alert('Lỗi cập nhật: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
            Quản Lý 11 Chủ Đề & Đề Kiểm Tra Chuẩn
          </h2>
          <p className="text-xs text-slate-500">
            Cấu hình thời gian làm bài, kiểm tra độ sẵn sàng của ngân hàng câu hỏi theo ma trận 50% - 30% - 20%
          </p>
        </div>
      </div>

      {/* Topics Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {topics.map((topic) => {
            // Check questions available from source topics
            const availableQuestions = questions.filter(
              (q) => q.approved && topic.sourceTopics.includes(q.topicId)
            );
            const nbCount = availableQuestions.filter((q) => q.cognitiveLevel === 'nhan_biet').length;
            const knCount = availableQuestions.filter((q) => q.cognitiveLevel === 'ket_noi').length;
            const vdCount = availableQuestions.filter((q) => q.cognitiveLevel === 'van_dung').length;

            const targetNb = Math.round(topic.questionCount * 0.5);
            const targetKn = Math.round(topic.questionCount * 0.3);
            const targetVd = topic.questionCount - targetNb - targetKn;

            const isEnough =
              nbCount >= targetNb && knCount >= targetKn && vdCount >= targetVd;

            return (
              <div
                key={topic.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center">
                      {topic.order}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>{topic.durationMinutes} phút</span>
                      </span>
                      <button
                        onClick={() => handleOpenEdit(topic)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-lg transition"
                        title="Điều chỉnh thời gian thi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-800 mb-1 leading-snug">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                    {topic.description}
                  </p>

                  {/* Specification Box */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs space-y-2 mb-4">
                    <div className="flex justify-between items-center text-slate-600 font-bold">
                      <span>Quy mô đề:</span>
                      <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-black">
                        {topic.questionCount} câu hỏi
                      </span>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-200/60 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nhận biết (50%):</span>
                        <span className={nbCount >= targetNb ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                          Có {nbCount} / Cần {targetNb} câu
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kết nối (30%):</span>
                        <span className={knCount >= targetKn ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                          Có {knCount} / Cần {targetKn} câu
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Vận dụng (20%):</span>
                        <span className={vdCount >= targetVd ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                          Có {vdCount} / Cần {targetVd} câu
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Bottom Buttons */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-1.5 text-xs">
                    {isEnough ? (
                      <span className="text-emerald-700 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ngân hàng sẵn sàng (đủ số câu)</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Cần bổ sung thêm câu</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onNavigateToQr(topic.id)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2 px-2.5 rounded-xl flex items-center justify-center space-x-1 transition"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Xem Mã QR</span>
                    </button>
                    <button
                      onClick={() => onNavigateToStudentView(topic.id)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 px-2.5 rounded-xl flex items-center justify-center space-x-1 transition"
                    >
                      <span>Làm bài thử</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Duration Modal */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-800 mb-1">
              Điều chỉnh thời gian làm bài
            </h3>
            <p className="text-xs text-slate-500 mb-4">{editingTopic.title}</p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thời gian làm bài (Phút):
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={editDuration}
                  onChange={(e) => setEditDuration(parseInt(e.target.value, 10))}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Mặc định 30 phút. Đối với đề 70 câu ôn tập cuối năm, Thầy có thể tăng lên 40, 45 hoặc 60 phút nếu cần.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số lượng câu hỏi trong đề:
                </label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={editQuestionCount}
                  onChange={(e) => setEditQuestionCount(parseInt(e.target.value, 10))}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTopic(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
