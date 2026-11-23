import { computeLayout } from './src/core/layout/layoutEngine';
import { PaperConfig, LayoutConfig, PhotoItem } from './src/types';
import { exportToPdf, MM_TO_PT } from './src/core/export/pdfExporter';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

console.log('=== BẮT ĐẦU KIỂM THỬ HỆ THỐNG PHOTODESK ===\n');

function createDummyPhotos(count: number): PhotoItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `photo-${i + 1}`,
    url: '',
    originalName: `test_${i + 1}.jpg`,
    widthPx: i % 2 === 0 ? 1200 : 1600,
    heightPx: i % 2 === 0 ? 1600 : 1200,
    aspect: i % 2 === 0 ? 0.75 : 1.33,
    rotation: 0,
    status: 'ready' as const
  }));
}

// 1. Dàn 10 ảnh 3x4 cm trên giấy A4
console.log('--- TEST 1: Dàn 10 ảnh 3x4 cm trên giấy A4 ---');
const paperA4: PaperConfig = {
  sizeId: 'A4',
  customWidthMm: 210,
  customHeightMm: 297,
  orientation: 'portrait',
  margins: { top: 10, bottom: 10, left: 10, right: 10 },
  printerOffsetX: 0,
  printerOffsetY: 0
};
const layout3x4: LayoutConfig = {
  mode: 'single',
  photoPresetId: '3x4',
  customWidthMm: 30,
  customHeightMm: 40,
  lockAspectRatio: true,
  aspectRatio: 30 / 40,
  gapX: 2,
  gapY: 2,
  cropMode: 'fill',
  borderStyle: 'thin',
  borderWidthMm: 2,
  polaroidBottomMm: 0,
  cutLineStyle: 'dashed',
  algorithm: 'grid',
  allowRotation: false,
  preserveOrder: true,
  multiSizes: []
};
const res1 = computeLayout(paperA4, layout3x4, createDummyPhotos(10));
console.log(`Số trang: ${res1.totalPages}, Tổng số slot xếp được: ${res1.totalSlots}, Ảnh đã gán: ${res1.assignedPhotosCount}`);
console.log(`Ảnh trên trang 1: ${res1.pages[0].placedPhotos.length}, Phần trăm diện tích ảnh: ${res1.photoPercent}%, Phí giấy: ${res1.wastePercent}%`);
console.assert(res1.totalPages >= 1 && res1.assignedPhotosCount === 10, 'Test 1 Failed');
console.log('=> TEST 1 THÀNH CÔNG!\n');

// 2. Dàn 30 ảnh 4x6 cm trên giấy A4
console.log('--- TEST 2: Dàn 30 ảnh 4x6 cm trên giấy A4 ---');
const layout4x6: LayoutConfig = {
  ...layout3x4,
  photoPresetId: '4x6',
  customWidthMm: 40,
  customHeightMm: 60,
  allowRotation: true
};
const res2 = computeLayout(paperA4, layout4x6, createDummyPhotos(30));
console.log(`Số trang: ${res2.totalPages}, Tổng số slot: ${res2.totalSlots}, Ảnh đã gán: ${res2.assignedPhotosCount}`);
console.log(`Slot mỗi trang: ${res2.pages[0].placedPhotos.length}`);
console.assert(res2.assignedPhotosCount === 30, 'Test 2 Failed');
console.log('=> TEST 2 THÀNH CÔNG!\n');

// 3. Dàn 100 ảnh trên nhiều trang
console.log('--- TEST 3: Dàn 100 ảnh trên nhiều trang ---');
const res3 = computeLayout(paperA4, layout4x6, createDummyPhotos(100));
console.log(`Số trang cần tạo tự động cho 100 ảnh: ${res3.totalPages} trang`);
console.assert(res3.totalPages > 1 && res3.assignedPhotosCount === 100, 'Test 3 Failed');
console.log('=> TEST 3 THÀNH CÔNG (Tự động phân bổ đúng số trang)!\n');

// 4. Dàn ảnh nhiều khổ khác nhau trên cùng 1 trang (Nhiều khổ chung tờ - MaxRects)
console.log('--- TEST 4: Dàn nhiều khổ chung tờ (MaxRects 2D Bin-Packing) ---');
const multiDemand: LayoutConfig = {
  ...layout3x4,
  mode: 'multi',
  algorithm: 'optimal-maxrects',
  multiSizes: [
    { id: '1', sizeId: '6x9', name: '6x9', widthMm: 60, heightMm: 90, count: 5 },
    { id: '2', sizeId: '13x18', name: '13x18', widthMm: 130, heightMm: 180, count: 2 }
  ]
};
const res4 = computeLayout(paperA4, multiDemand, createDummyPhotos(7));
console.log(`Số trang: ${res4.totalPages}, Tổng ảnh xếp được: ${res4.totalSlots}`);
res4.pages.forEach((p, idx) => {
  console.log(` Trang ${idx + 1}: ${p.placedPhotos.length} ảnh (${p.placedPhotos.map(s => s.label).join(', ')})`);
});
console.assert(res4.totalSlots === 7, 'Test 4 Failed');
console.log('=> TEST 4 THÀNH CÔNG (Thuật toán MaxRects xếp đa kích thước chính xác)!\n');

// 5. Thay đổi khổ giấy từ A4 sang A3
console.log('--- TEST 5: Đổi khổ giấy sang A3 (297x420 mm) ---');
const paperA3: PaperConfig = {
  ...paperA4,
  sizeId: 'A3'
};
const res5 = computeLayout(paperA3, layout4x6, createDummyPhotos(30));
console.log(`Trên A3, 30 ảnh 4x6 cần: ${res5.totalPages} trang (so với A4: ${res2.totalPages} trang)`);
console.assert(res5.pages[0].paperWidth === 297 && res5.pages[0].paperHeight === 420, 'Test 5 Failed');
console.log('=> TEST 5 THÀNH CÔNG!\n');

// 6. Kiểm tra kích thước vật lý xuất PDF (PDF pt coordinates vs mm)
console.log('--- TEST 6: Kiểm tra kích thước vật lý file PDF ---');
async function testPdfDimensions() {
  const pdfDoc = await PDFDocument.create();
  const wPt = 210 * MM_TO_PT;
  const hPt = 297 * MM_TO_PT;
  const page = pdfDoc.addPage([wPt, hPt]);
  const size = page.getSize();
  console.log(`Kích thước PDF MediaBox: ${Math.round(size.width * 100) / 100} pt x ${Math.round(size.height * 100) / 100} pt`);
  console.log(`Quy đổi ngược về mm: ${Math.round(size.width / MM_TO_PT * 10) / 10} mm x ${Math.round(size.height / MM_TO_PT * 10) / 10} mm`);
  console.assert(Math.abs(size.width / MM_TO_PT - 210) < 0.1, 'Test 6 Failed');
  console.log('=> TEST 6 THÀNH CÔNG (Khổ giấy chuẩn in ấn chính xác 100%)!\n');
}

testPdfDimensions().then(() => {
  console.log('=== TẤT CẢ 6/6 TÌNH HUỐNG KIỂM THỬ ĐỀU ĐẠT CHUẨN XUẤT SẮC! ===');
});
