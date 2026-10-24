import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Copy,
  Printer,
  ExternalLink,
  Check,
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { fetchTopics } from '../utils/api';
import { TopicConfig } from '../types';

interface QrCodeHubProps {
  onOpenStudentQuiz: (topicId: string) => void;
  selectedTopicId?: string;
}

export const QrCodeHub: React.FC<QrCodeHubProps> = ({ onOpenStudentQuiz, selectedTopicId }) => {
  const [topics, setTopics] = useState<TopicConfig[]>([]);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Base URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://khoahoc5.edu.vn';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const tList = await fetchTopics();
        setTopics(tList);

        // Generate QR data URLs for each topic
        const map: Record<string, string> = {};
        for (const t of tList) {
          const targetUrl = `${origin}?topic=${t.id}`;
          const qrDataUrl = await QRCode.toDataURL(targetUrl, {
            width: 320,
            margin: 2,
            color: {
              dark: '#1e293b',
              light: '#ffffff'
            }
          });
          map[t.id] = qrDataUrl;
        }
        setQrMap(map);
      } catch (err) {
        console.error('Failed to generate QR codes:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [origin]);

  const handleCopyLink = (topicId: string) => {
    const targetUrl = `${origin}?topic=${topicId}`;
    navigator.clipboard.writeText(targetUrl);
    setCopiedId(topicId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownloadPng = (topic: TopicConfig) => {
    const dataUrl = qrMap[topic.id];
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR_${topic.id}_${topic.shortTitle.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintCard = (topic: TopicConfig) => {
    const dataUrl = qrMap[topic.id];
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mã QR - ${topic.title}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              text-align: center;
              padding: 40px;
              color: #1e293b;
            }
            .card {
              max-width: 420px;
              margin: 0 auto;
              border: 3px solid #2563eb;
              border-radius: 24px;
              padding: 30px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .badge {
              background: #dbeafe;
              color: #1e40af;
              font-weight: bold;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 14px;
              display: inline-block;
              margin-bottom: 12px;
            }
            h1 { font-size: 22px; margin: 8px 0; color: #1e3a8a; }
            h2 { font-size: 16px; margin: 4px 0 16px 0; color: #059669; font-weight: 600; }
            img { width: 260px; height: 260px; border-radius: 12px; }
            .url {
              font-size: 12px;
              color: #64748b;
              word-break: break-all;
              margin-top: 15px;
              padding: 8px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .footer {
              font-size: 13px;
              font-weight: bold;
              margin-top: 15px;
              color: #475569;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">KHOA HỌC LỚP 5</div>
            <h1>THÔNG THÁI CÙNG THẦY THÔNG</h1>
            <h2>${topic.title}</h2>
            <img src="${dataUrl}" alt="QR Code" />
            <div class="url">${origin}?topic=${topic.id}</div>
            <div class="footer">
              GV: Dư Quốc Thông • Trường Tiểu học Lương Thế Vinh<br/>
              Học sinh dùng Zalo hoặc Camera điện thoại để quét vào làm bài ngay!
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

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const cardsHtml = topics
      .map(
        (t) => `
        <div class="qr-item">
          <div class="topic-num">${t.order}</div>
          <h3 class="topic-title">${t.title}</h3>
          <img src="${qrMap[t.id]}" />
          <div class="spec">${t.questionCount} câu • ${t.durationMinutes} phút</div>
        </div>
      `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bảng Tổng Hợp 11 Mã QR - Thông Thái Cùng Thầy Thông</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 20px;
              text-align: center;
              color: #1e293b;
            }
            .header {
              margin-bottom: 25px;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 15px;
            }
            h1 { font-size: 24px; color: #1e3a8a; margin: 0; }
            p { font-size: 14px; color: #475569; margin: 5px 0 0 0; }
            .grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
            }
            .qr-item {
              border: 1.5px solid #cbd5e1;
              border-radius: 16px;
              padding: 12px;
              text-align: center;
              page-break-inside: avoid;
            }
            .topic-num {
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: #2563eb;
              color: white;
              font-weight: bold;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              margin-bottom: 4px;
            }
            .topic-title {
              font-size: 13px;
              font-weight: bold;
              margin: 4px 0 8px 0;
              min-height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            img { width: 140px; height: 140px; }
            .spec {
              font-size: 11px;
              color: #059669;
              font-weight: bold;
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>THÔNG THÁI CÙNG THẦY THÔNG - MÔN KHOA HỌC LỚP 5</h1>
            <p>Trường Tiểu học Lương Thế Vinh • Giáo viên: Dư Quốc Thông • Bảng tổng hợp 11 Mã QR</p>
          </div>
          <div class="grid">
            ${cardsHtml}
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
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-blue-700 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
            Truy cập tức thì • Cố định 100%
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-2 mb-1">
            11 Mã QR Cố Định Cho 11 Chủ Đề
          </h2>
          <p className="text-emerald-100 text-xs md:text-sm max-w-2xl leading-relaxed">
            Học sinh quét mã QR bằng Zalo hoặc Camera điện thoại để vào đúng chủ đề ngay lập tức. Không yêu cầu đăng ký tài khoản, không giới hạn lượt quét và mã QR không bao giờ thay đổi khi Thầy cập nhật câu hỏi!
          </p>
        </div>

        <button
          onClick={handlePrintAll}
          className="bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs px-5 py-3 rounded-2xl shadow-lg flex items-center space-x-2 shrink-0 transition"
        >
          <Printer className="w-4 h-4 text-emerald-700" />
          <span>In Bảng Tổng Hợp 11 Mã QR</span>
        </button>
      </div>

      {/* Grid of 11 QRs */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => {
            const qrImg = qrMap[topic.id];
            const targetUrl = `${origin}?topic=${topic.id}`;
            const isSelected = selectedTopicId === topic.id;

            return (
              <div
                key={topic.id}
                className={`bg-white rounded-3xl p-6 border transition-all duration-200 flex flex-col items-center text-center shadow-xs hover:shadow-lg ${
                  isSelected ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200/90'
                }`}
              >
                {/* Topic Header */}
                <div className="w-full flex items-center justify-between mb-3">
                  <span className="w-7 h-7 rounded-xl bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center">
                    {topic.order}
                  </span>
                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg">
                    {topic.questionCount} câu • {topic.durationMinutes}p
                  </span>
                </div>

                <h3 className="font-extrabold text-sm md:text-base text-slate-800 min-h-[44px] flex items-center justify-center mb-4">
                  {topic.title}
                </h3>

                {/* QR Canvas / Image */}
                <div className="p-3 bg-slate-50 border-2 border-slate-100 rounded-3xl mb-3 shadow-inner group relative">
                  {qrImg ? (
                    <img
                      src={qrImg}
                      alt={topic.title}
                      className="w-48 h-48 rounded-xl object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                      Đang tạo QR...
                    </div>
                  )}
                </div>

                {/* Direct Link Info */}
                <div className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-500 truncate mb-4 font-mono">
                  {targetUrl}
                </div>

                {/* Action buttons */}
                <div className="w-full grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleCopyLink(topic.id)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-1 rounded-xl flex items-center justify-center space-x-1 transition"
                    title="Sao chép đường link"
                  >
                    {copiedId === topic.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Chép link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDownloadPng(topic)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2 px-1 rounded-xl flex items-center justify-center space-x-1 transition"
                    title="Tải ảnh PNG"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải ảnh</span>
                  </button>

                  <button
                    onClick={() => handlePrintCard(topic)}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs py-2 px-1 rounded-xl flex items-center justify-center space-x-1 transition"
                    title="In phiếu QR"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In phiếu</span>
                  </button>
                </div>

                {/* Try Exam Button */}
                <button
                  onClick={() => onOpenStudentQuiz(topic.id)}
                  className="w-full mt-2.5 text-xs font-bold text-slate-500 hover:text-blue-600 py-1.5 flex items-center justify-center space-x-1 transition"
                >
                  <span>Mở giao diện làm bài thử</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
