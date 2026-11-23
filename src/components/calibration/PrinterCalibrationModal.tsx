import React, { useState } from 'react';
import { PrinterCalibration } from '../../types';
import { Printer, Download, Save, X, Check, HelpCircle } from 'lucide-react';
import fileSaver from 'file-saver';
const saveAs = (fileSaver as any).saveAs || fileSaver;
import { PDFDocument, rgb } from 'pdf-lib';
import { MM_TO_PT } from '../../core/export/pdfExporter';

interface PrinterCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  calibration: PrinterCalibration;
  onSaveCalibration: (calib: PrinterCalibration) => void;
}

export const PrinterCalibrationModal: React.FC<PrinterCalibrationModalProps> = ({
  isOpen,
  onClose,
  calibration,
  onSaveCalibration
}) => {
  const [printerName, setPrinterName] = useState(calibration.printerName || 'Máy in của tiệm');
  const [unprintableMargin, setUnprintableMargin] = useState(calibration.unprintableMarginMm || 0);
  const [testPaperSize, setTestPaperSize] = useState(calibration.testPaperSize || 'A4');
  
  // Measurement inputs
  const [measuredLeftMm, setMeasuredLeftMm] = useState<string>('10');
  const [measuredTopMm, setMeasuredTopMm] = useState<string>('10');

  // Computed offsets
  const [offsetX, setOffsetX] = useState(calibration.offsetX || 0);
  const [offsetY, setOffsetY] = useState(calibration.offsetY || 0);
  const [savedNotice, setSavedNotice] = useState(false);

  // Compute offset: Target reference margin is 10mm
  // If user measures 12mm on left, it means print shifted right by 2mm, so offset = 10 - measured
  const handleCalculateOffset = () => {
    const left = parseFloat(measuredLeftMm) || 10;
    const top = parseFloat(measuredTopMm) || 10;

    const diffX = Math.round((10 - left) * 10) / 10;
    const diffY = Math.round((10 - top) * 10) / 10;

    setOffsetX(diffX);
    setOffsetY(diffY);
  };

  // Generate and download standard 10mm reference calibration sheet PDF
  const handleDownloadCalibrationPdf = async () => {
    const pdfDoc = await PDFDocument.create();
    const paperWPt = 210 * MM_TO_PT;
    const paperHPt = 297 * MM_TO_PT;
    const page = pdfDoc.addPage([paperWPt, paperHPt]);

    const targetMarginPt = 10 * MM_TO_PT; // 10mm exactly
    const boxWPt = paperWPt - 2 * targetMarginPt;
    const boxHPt = paperHPt - 2 * targetMarginPt;

    // Draw reference black rectangle
    page.drawRectangle({
      x: targetMarginPt,
      y: targetMarginPt,
      width: boxWPt,
      height: boxHPt,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2
    });

    // Draw center crosshair
    page.drawLine({
      start: { x: paperWPt / 2 - 20, y: paperHPt / 2 },
      end: { x: paperWPt / 2 + 20, y: paperHPt / 2 },
      color: rgb(0.2, 0.2, 0.2),
      thickness: 1
    });
    page.drawLine({
      start: { x: paperWPt / 2, y: paperHPt / 2 - 20 },
      end: { x: paperWPt / 2, y: paperHPt / 2 + 20 },
      color: rgb(0.2, 0.2, 0.2),
      thickness: 1
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    saveAs(blob, 'PhotoDesk_To_Can_Le_10mm.pdf');
  };

  const handleSave = () => {
    onSaveCalibration({
      id: calibration.id,
      printerName,
      unprintableMarginMm: unprintableMargin,
      offsetX,
      offsetY,
      testPaperSize,
      lastUpdated: new Date().toISOString()
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header matching Screenshot 10 */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-stone-400 text-xs">Cài đặt /</span>
              <span className="text-stone-900 font-semibold text-xs">Máy in</span>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900">Máy in</h2>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Cài đặt</span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Căn lề một lần, mọi tờ in sau đều đúng chỗ. App nhớ cài đặt trên máy tính này.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* Section 1: Thông tin máy in */}
          <div className="bg-stone-50/70 p-5 rounded-2xl border border-stone-200/80 space-y-3">
            <h3 className="font-bold text-stone-900 text-sm">Thông tin máy in</h3>
            <p className="text-stone-400 text-[11px]">Đổi máy in thì cần căn lề lại một lần.</p>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Tên máy in</label>
                <input
                  type="text"
                  value={printerName}
                  onChange={(e) => setPrinterName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg font-medium text-stone-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Lề không in được (mm)</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={unprintableMargin}
                  onChange={(e) => setUnprintableMargin(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg font-medium text-stone-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">Phần mép máy in không in tới</span>
              </div>
            </div>
          </div>

          {/* Section 2: Căn lề một lần */}
          <div className="bg-stone-50/70 p-5 rounded-2xl border border-stone-200/80 space-y-4">
            <h3 className="font-bold text-stone-900 text-sm">Căn lề một lần</h3>
            <ol className="list-decimal list-inside space-y-1 text-stone-600 text-xs">
              <li>In tờ căn lề. Khung đen trên tờ cách mép giấy đúng <strong>10 mm</strong>.</li>
              <li>Đo khoảng cách thật từ mép giấy tới khung ở cạnh trái và cạnh trên.</li>
              <li>Nhập số đo, bấm "Tính độ lệch", rồi lưu.</li>
            </ol>

            {/* Print test sheet action buttons */}
            <div className="flex items-center gap-3 pt-1">
              <select
                value={testPaperSize}
                onChange={(e) => setTestPaperSize(e.target.value)}
                className="p-2 bg-white border border-stone-200 rounded-lg text-xs font-semibold"
              >
                <option value="A4">Khổ giấy: A4</option>
                <option value="A5">Khổ giấy: A5</option>
                <option value="10x15">Khổ giấy: 10x15 cm</option>
              </select>

              <button
                type="button"
                onClick={handleDownloadCalibrationPdf}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg shadow-xs transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In tờ căn lề</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCalibrationPdf}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-100 text-stone-700 font-semibold rounded-lg border border-stone-200 transition"
              >
                <Download className="w-3.5 h-3.5 text-stone-500" />
                <span>Lưu file tờ căn lề</span>
              </button>
            </div>

            {/* Measurement inputs */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-stone-200/80">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Khoảng cách đo ở cạnh trái (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={measuredLeftMm}
                  onChange={(e) => setMeasuredLeftMm(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg font-bold text-stone-900 focus:outline-none"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">Từ mép giấy tới khung đen</span>
              </div>
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Khoảng cách đo ở cạnh trên (mm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={measuredTopMm}
                  onChange={(e) => setMeasuredTopMm(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-lg font-bold text-stone-900 focus:outline-none"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">Từ mép giấy tới khung đen</span>
              </div>
            </div>

            {/* Calculate action */}
            <button
              type="button"
              onClick={handleCalculateOffset}
              className="w-full py-2 bg-stone-200 hover:bg-stone-300 text-stone-900 font-bold rounded-lg transition"
            >
              Tính độ lệch tự động
            </button>

            {/* Result Offset Fields */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="bg-white p-3 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 block mb-0.5">Lệch ngang (X)</span>
                <span className="text-base font-bold text-stone-900 block">{offsetX} mm</span>
                <span className="text-[10px] text-stone-400">Số dương: dời ảnh sang phải</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 block mb-0.5">Lệch dọc (Y)</span>
                <span className="text-base font-bold text-stone-900 block">{offsetY} mm</span>
                <span className="text-[10px] text-stone-400">Số dương: dời ảnh xuống dưới</span>
              </div>
            </div>

            {offsetX === 0 && offsetY === 0 && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] font-semibold text-center">
                ✓ Máy in chuẩn xác (độ lệch bằng 0)
              </div>
            )}
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold text-xs"
          >
            Bỏ thay đổi
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-98 flex items-center gap-1.5"
          >
            {savedNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedNotice ? 'Đã lưu!' : 'Lưu cài đặt máy in'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
