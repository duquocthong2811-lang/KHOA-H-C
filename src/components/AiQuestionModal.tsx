import React, { useState } from 'react';
import { Sparkles, X, Check, Loader2, BookOpen, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { generateAiQuestions, bulkSaveQuestions } from '../utils/api';
import { Question, CognitiveLevel, QuestionType, TopicConfig } from '../types';

interface AiQuestionModalProps {
  topics: TopicConfig[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AiQuestionModal: React.FC<AiQuestionModalProps> = ({
  topics,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [topicId, setTopicId] = useState<string>('chud_1');
  const [lessonName, setLessonName] = useState<string>('');
  const [sourceText, setSourceText] = useState<string>('');
  const [cognitiveLevel, setCognitiveLevel] = useState<string>('mixed');
  const [questionType, setQuestionType] = useState<string>('mixed');
  const [count, setCount] = useState<number>(5);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [generatedList, setGeneratedList] = useState<Omit<Question, 'id' | 'createdAt'>[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [saving, setSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentTopic = topics.find((t) => t.id === topicId) || topics[0];

  const handleInsertSampleDoc = () => {
    if (topicId === 'chud_1') {
      setLessonName('Bài 3: Sự biến đổi hóa học của chất');
      setSourceText(
        `Nội dung SGK Khoa học 5: Sự biến đổi hóa học là sự biến đổi từ chất này thành chất khác. Ví dụ: Đốt que diêm cháy thành than và khói; Đinh sắt để ngoài không khí ẩm bị gỉ sét màu nâu đỏ; Đun đường chuyển từ màu trắng sang màu nâu đen đắng khét; Nước cốt chanh cho vào sữa đậu nành tạo kết tủa. Lưu ý: Nước đá tan thành nước lỏng hoặc nước lỏng bốc hơi chỉ là sự biến đổi trạng thái (vật lí), không phải biến đổi hóa học.`
      );
    } else if (topicId === 'chud_2') {
      setLessonName('Bài 7: Sử dụng năng lượng điện an toàn và tiết kiệm');
      setSourceText(
        `Nội dung SGK Khoa học 5: Dòng điện mang năng lượng điện. Điện được sản xuất từ nhà máy nhiệt điện, thủy điện, điện gió, điện mặt trời. Dây đồng dẫn điện tốt bọc nhựa cách điện. Khi sử dụng điện: Tuyệt đối không dùng tay ướt cắm phích cắm; Không sờ vào dây điện hở; Tắt các thiết bị khi ra khỏi phòng. Điều hòa nên đặt 26-28 độ C kết hợp quạt nhẹ.`
      );
    } else if (topicId === 'chud_4') {
      setLessonName('Bài 14: Vi khuẩn có ích và vi khuẩn có hại');
      setSourceText(
        `Nội dung SGK Khoa học 5: Vi khuẩn vô cùng nhỏ bé, quan sát qua kính hiển vi. Vi khuẩn có ích: Vi khuẩn lactic lên men đường sữa thành sữa chua đông đặc thơm ngon ở nhiệt độ 40-45 độ C; vi khuẩn nốt sần rễ đậu cố định đạm làm màu mỡ đất; vi khuẩn hoại sinh phân hủy rác lá cây. Vi khuẩn có hại: Gây ôi thiu thức ăn, ngộ độc thức ăn, bệnh tả, kiết lị, sâu răng. Phòng ngừa: Ăn chín uống sôi, rửa tay 6 bước xà phòng.`
      );
    } else {
      setLessonName('Chương trình Khoa học lớp 5');
      setSourceText(
        `Tài liệu SGK & SGV Khoa học 5 Trường Tiểu học Lương Thế Vinh biên soạn. Yêu cầu bám sát chuẩn kiến thức kĩ năng, rèn luyện tư duy thực tiễn khoa học cho học sinh.`
      );
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await generateAiQuestions({
        topicId,
        topicTitle: currentTopic.title,
        lessonName,
        sourceText,
        cognitiveLevel,
        questionType,
        count
      });

      if (res.notice) {
        setErrorMsg(res.notice);
      }
      if (res.questions && res.questions.length > 0) {
        setGeneratedList(res.questions);
        setSelectedIndices(res.questions.map((_: unknown, i: number) => i)); // Default select all
      } else if (!res.notice) {
        setErrorMsg('Không thể tạo câu hỏi từ dữ liệu này. Vui lòng thử lại với nội dung cụ thể hơn.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi gọi Trợ lí AI');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSaveToBank = async (approveImmediately: boolean) => {
    try {
      setSaving(true);
      const toSave = generatedList
        .filter((_, idx) => selectedIndices.includes(idx))
        .map((q) => ({
          ...q,
          approved: approveImmediately
        }));

      if (toSave.length === 0) {
        alert('Vui lòng chọn ít nhất một câu hỏi để lưu.');
        return;
      }

      await bulkSaveQuestions(toSave);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Lỗi khi lưu câu hỏi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base md:text-lg">
                Trợ lí AI Biên Soạn Câu Hỏi Khoa Học 5
              </h3>
              <p className="text-xs text-blue-100">
                Tự động tạo câu hỏi từ SGK, SGV • Kiểm tra trùng lặp và phân loại 3 mức độ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
          {generatedList.length === 0 ? (
            /* Config & Input Stage */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chủ đề môn học (6 chủ đề cốt lõi):
                  </label>
                  <select
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="chud_1">Chủ đề 1: Chất</option>
                    <option value="chud_2">Chủ đề 2: Năng lượng</option>
                    <option value="chud_3">Chủ đề 3: Thực vật và động vật</option>
                    <option value="chud_4">Chủ đề 4: Vi khuẩn</option>
                    <option value="chud_5">Chủ đề 5: Con người và Sức khỏe</option>
                    <option value="chud_6">Chủ đề 6: Sinh vật và môi trường</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên bài học hoặc nội dung trọng tâm:
                  </label>
                  <input
                    type="text"
                    value={lessonName}
                    onChange={(e) => setLessonName(e.target.value)}
                    placeholder="VD: Bài 3: Sự biến đổi hóa học, Bài 7: An toàn điện..."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mức độ nhận thức:
                  </label>
                  <select
                    value={cognitiveLevel}
                    onChange={(e) => setCognitiveLevel(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mixed">Hỗn hợp (50% Nhận biết, 30% Kết nối, 20% Vận dụng)</option>
                    <option value="nhan_biet">Chỉ Nhận biết (50% cơ cấu đề)</option>
                    <option value="ket_noi">Chỉ Kết nối (30% cơ cấu đề)</option>
                    <option value="van_dung">Chỉ Vận dụng (20% cơ cấu đề)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dạng câu hỏi:
                  </label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="mixed">Đa dạng cả 4 dạng câu hỏi</option>
                    <option value="multiple_choice">Trắc nghiệm (3 đáp án A, B, C)</option>
                    <option value="matching">Ghép nối 2 cột</option>
                    <option value="fill_in_the_blank">Điền từ vào chỗ trống</option>
                    <option value="ordering">Sắp xếp thứ tự các bước</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số lượng câu cần sinh:
                  </label>
                  <select
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value, 10))}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={3}>3 câu hỏi</option>
                    <option value={5}>5 câu hỏi (Khuyên dùng)</option>
                    <option value={8}>8 câu hỏi</option>
                    <option value={10}>10 câu hỏi</option>
                  </select>
                </div>
              </div>

              {/* Source Text Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nội dung trích đoạn từ SGK / SGV Khoa học 5 (tùy chọn):</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleInsertSampleDoc}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                  >
                    <span>Nạp mẫu trích đoạn SGK</span>
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Dán nội dung bài học, tài liệu bồi dưỡng giáo viên, hoặc các câu hỏi mẫu để AI phân tích và tự động tạo các câu hỏi chuẩn xác tương đương..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-2xl p-3 focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 Nếu để trống, Trợ lí AI sẽ tự động tra cứu chuẩn kiến thức kĩ năng GDPT Khoa học 5 hiện hành.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          ) : (
            /* Review Generated Questions Stage */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Trợ lí AI đã sinh <strong>{generatedList.length} câu hỏi</strong>. Thầy vui lòng xem xét, chọn các câu đạt yêu cầu để lưu vào ngân hàng.
                  </span>
                </div>
                <button
                  onClick={() => setGeneratedList([])}
                  className="font-bold underline text-emerald-900 hover:text-emerald-700 text-xs ml-2"
                >
                  Tạo lượt khác
                </button>
              </div>

              <div className="space-y-3">
                {generatedList.map((q, idx) => {
                  const isChecked = selectedIndices.includes(idx);
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/20'
                          : 'border-slate-200 bg-white opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(idx)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="font-bold text-xs text-slate-500">Câu {idx + 1}</span>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
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
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                            {q.type === 'multiple_choice'
                              ? 'Trắc nghiệm A,B,C'
                              : q.type === 'matching'
                              ? 'Ghép nối'
                              : q.type === 'fill_in_the_blank'
                              ? 'Điền từ'
                              : 'Sắp xếp thứ tự'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{q.source}</span>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-800 mt-2">{q.content}</h4>

                      {/* Display by type */}
                      {q.type === 'multiple_choice' && q.options && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 text-xs">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = oIdx === q.correctOptionIndex;
                            return (
                              <div
                                key={oIdx}
                                className={`p-2 rounded-xl border flex items-center space-x-2 ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="font-bold">{['A', 'B', 'C'][oIdx]}.</span>
                                <span>{opt}</span>
                                {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto" />}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'matching' && q.matchingPairs && (
                        <div className="mt-2 space-y-1 text-xs">
                          {q.matchingPairs.map((pair, pIdx) => (
                            <div key={pIdx} className="flex items-center space-x-2 text-slate-700">
                              <span className="font-semibold bg-blue-50 px-2 py-1 rounded">
                                {pair.left}
                              </span>
                              <span>➔</span>
                              <span className="font-semibold bg-emerald-50 text-emerald-800 px-2 py-1 rounded">
                                {pair.right}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'fill_in_the_blank' && (
                        <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl space-y-1">
                          <p className="font-medium italic">{q.blankTemplate}</p>
                          <p className="text-[11px] text-slate-500">
                            Đáp án: <strong className="text-emerald-700">{q.blankAnswers?.join(', ')}</strong> • Từ cho sẵn: {q.blankOptions?.join(', ')}
                          </p>
                        </div>
                      )}

                      {q.type === 'ordering' && q.orderingItems && (
                        <div className="mt-2 text-xs space-y-1 text-slate-700">
                          {q.orderingItems.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px]">
                                {itemIdx + 1}
                              </span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Explanation */}
                      <div className="mt-2.5 text-xs text-slate-500 bg-amber-50/50 border border-amber-100 p-2 rounded-xl">
                        💡 <strong className="text-amber-800">Giải thích:</strong> {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
          >
            Đóng
          </button>

          {generatedList.length === 0 ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-2 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Trợ lí AI đang phân tích & biên soạn...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Bắt đầu tạo câu hỏi AI</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleSaveToBank(false)}
                disabled={saving || selectedIndices.length === 0}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition"
              >
                Lưu nháp ({selectedIndices.length} câu)
              </button>
              <button
                type="button"
                onClick={() => handleSaveToBank(true)}
                disabled={saving || selectedIndices.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center space-x-1.5 transition"
              >
                <Check className="w-4 h-4" />
                <span>Duyệt & Lưu chính thức ({selectedIndices.length} câu)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
