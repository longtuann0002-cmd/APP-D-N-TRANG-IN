import React, { useState } from 'react';
import { SheetLayout, PaperConfig, LayoutConfig, PhotoItem } from '../../types';
import { exportToPdf } from '../../core/export/pdfExporter';
import { exportToJpg, ExportDpi } from '../../core/export/imageExporter';
import { X, FileDown, Image, Check, AlertCircle, Sparkles, Printer } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: SheetLayout[];
  currentPageIndex: number;
  paperConfig: PaperConfig;
  layoutConfig: LayoutConfig;
  photosMap: Map<string, PhotoItem>;
  projectName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  pages,
  currentPageIndex,
  paperConfig,
  layoutConfig,
  photosMap,
  projectName
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'jpg'>('pdf');
  const [scope, setScope] = useState<'all' | 'current'>('all');
  const [dpi, setDpi] = useState<ExportDpi>(300);
  const [includeCutLines, setIncludeCutLines] = useState<boolean>(true);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setProgressPercent(5);
    setProgressStatus('Đang chuẩn bị dữ liệu xuất in...');
    setErrorMessage(null);

    const safeName = (projectName || 'PhotoDesk_In_An').replace(/[/\\?%*:|"<>]/g, '_');
    const targetPageIndex = scope === 'current' ? currentPageIndex : undefined;

    const effectiveLayoutConfig = {
      ...layoutConfig,
      cutLineStyle: includeCutLines ? layoutConfig.cutLineStyle : ('none' as const)
    };

    try {
      if (exportFormat === 'pdf') {
        await exportToPdf({
          pages,
          paperConfig,
          layoutConfig: effectiveLayoutConfig,
          photosMap,
          pageIndexToExport: targetPageIndex,
          filename: `${safeName}_${scope === 'current' ? `trang_${currentPageIndex + 1}` : 'toan_bo'}.pdf`,
          onProgress: (pct, status) => {
            setProgressPercent(pct);
            setProgressStatus(status);
          }
        });
      } else {
        await exportToJpg({
          pages,
          paperConfig,
          layoutConfig: effectiveLayoutConfig,
          photosMap,
          dpi,
          pageIndexToExport: targetPageIndex,
          zipFilename: `${safeName}_${dpi}dpi.zip`,
          onProgress: (pct, status) => {
            setProgressPercent(pct);
            setProgressStatus(status);
          }
        });
      }

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Export error:', err);
      setIsExporting(false);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi xuất file.');
    }
  };

  const handleDirectPrint = async () => {
    setIsExporting(true);
    setProgressPercent(5);
    setProgressStatus('Đang tạo trang in chuẩn vật lý mm...');
    setErrorMessage(null);

    const safeName = (projectName || 'PhotoDesk_In_An').replace(/[/\\?%*:|"<>]/g, '_');
    const targetPageIndex = scope === 'current' ? currentPageIndex : undefined;

    const effectiveLayoutConfig = {
      ...layoutConfig,
      cutLineStyle: includeCutLines ? layoutConfig.cutLineStyle : ('none' as const)
    };

    try {
      await exportToPdf({
        pages,
        paperConfig,
        layoutConfig: effectiveLayoutConfig,
        photosMap,
        pageIndexToExport: targetPageIndex,
        filename: `${safeName}_${scope === 'current' ? `trang_${currentPageIndex + 1}` : 'toan_bo'}.pdf`,
        printDirectly: true,
        onProgress: (pct, status) => {
          setProgressPercent(pct);
          setProgressStatus(status);
        }
      });

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Direct print error:', err);
      setIsExporting(false);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi gửi lệnh in.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg max-h-[92dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-stone-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-stone-900">Xuất file in ấn chuyên nghiệp</h2>
              <span className="text-[11px] text-stone-400">Chuẩn kích thước vật lý mm và DPI sắc nét</span>
            </div>
          </div>
          <button 
            disabled={isExporting} 
            onClick={onClose} 
            className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 sm:space-y-5 text-xs">
          
          {/* Format selection: PDF vs JPG */}
          <div>
            <label className="font-semibold text-stone-800 block mb-2">Định dạng file xuất</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setExportFormat('pdf')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                  exportFormat === 'pdf'
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${exportFormat === 'pdf' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-700'}`}>
                  <FileDown className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block">Tài liệu PDF</span>
                  <span className="text-[10px] opacity-75">Kích thước vật lý tuyệt đối, in trực tiếp</span>
                </div>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => setExportFormat('jpg')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                  exportFormat === 'jpg'
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${exportFormat === 'jpg' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-700'}`}>
                  <Image className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold block">Ảnh JPG (DPI cao)</span>
                  <span className="text-[10px] opacity-75">300 - 600 DPI, nén ZIP toàn bộ trang</span>
                </div>
              </button>
            </div>
          </div>

          {/* Export Scope: All vs Current */}
          <div>
            <label className="font-semibold text-stone-800 block mb-2">Phạm vi trang in</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setScope('all')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                  scope === 'all'
                    ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900 font-bold text-stone-900'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                Tất cả các trang ({pages.length} tờ)
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setScope('current')}
                className={`py-2 px-3 rounded-lg border text-center font-medium transition ${
                  scope === 'current'
                    ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900 font-bold text-stone-900'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                }`}
              >
                Chỉ trang đang xem (Tờ {currentPageIndex + 1})
              </button>
            </div>
          </div>

          {/* DPI Selection (if JPG) */}
          {exportFormat === 'jpg' && (
            <div>
              <label className="font-semibold text-stone-800 block mb-2">Độ phân giải in ấn (DPI)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 150 as ExportDpi, label: '150 DPI', sub: 'Xem nhanh / Proofing' },
                  { value: 300 as ExportDpi, label: '300 DPI', sub: 'Chuẩn in tiệm ảnh' },
                  { value: 600 as ExportDpi, label: '600 DPI', sub: 'Fine Art / Siêu nét' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    disabled={isExporting}
                    onClick={() => setDpi(item.value)}
                    className={`p-2 rounded-xl border text-center transition ${
                      dpi === item.value
                        ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900 font-bold text-stone-900'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span className="block font-bold">{item.label}</span>
                    <span className="text-[9px] text-stone-400 block">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cut Lines Option (if PDF) */}
          {exportFormat === 'pdf' && (
            <label className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-200 cursor-pointer">
              <div>
                <span className="font-semibold text-stone-800 block">Đường cắt & Vạch xén (Cut marks)</span>
                <span className="text-[10px] text-stone-400">Giúp thợ cắt dùng dao xén thẳng hàng chính xác</span>
              </div>
              <input
                type="checkbox"
                checked={includeCutLines}
                onChange={(e) => setIncludeCutLines(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </label>
          )}

          {/* Progress bar during export */}
          {isExporting && (
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                <span>{progressStatus}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-600 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 pb-[max(env(safe-area-inset-bottom),14px)] bg-stone-50 border-t border-stone-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            className="px-3 py-2 text-stone-500 hover:text-stone-800 font-semibold text-xs disabled:opacity-40 text-center sm:text-left"
          >
            Đóng
          </button>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExport}
              className="px-4 py-2.5 sm:py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-bold text-xs rounded-xl transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-2xs"
              title="Tải file PDF hoặc ảnh về máy tính để lưu trữ"
            >
              <FileDown className="w-4 h-4 text-stone-600" />
              <span>{isExporting ? 'Đang xuất...' : exportFormat === 'pdf' ? 'Tải file PDF' : 'Tải gói ảnh JPG'}</span>
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDirectPrint}
              className="px-5 py-2.5 sm:py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5"
              title="Gửi trực tiếp đến máy in hệ thống (Canon, Epson, Brother...) không cần tải file"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>{isExporting ? 'Đang gửi...' : 'In trực tiếp'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
