import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fileSaver from 'file-saver';
const saveAs = (fileSaver as any).saveAs || fileSaver;
import { SheetLayout, PaperConfig, LayoutConfig, PhotoItem } from '../../types';
import { getSafeCutLineSegments } from '../canvas/canvasRenderer';

// 1 mm = 72 / 25.4 points ≈ 2.83464567 pt
export const MM_TO_PT = 72 / 25.4;

export function hexToPdfRgb(hexStr?: string) {
  if (!hexStr || !hexStr.startsWith('#')) return rgb(1, 1, 1);
  const hex = hexStr.replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16) / 255;
    const g = parseInt(hex[1] + hex[1], 16) / 255;
    const b = parseInt(hex[2] + hex[2], 16) / 255;
    return rgb(r, g, b);
  }
  if (hex.length >= 6) {
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }
  return rgb(1, 1, 1);
}

export interface PdfExportOptions {
  pages: SheetLayout[];
  paperConfig: PaperConfig;
  layoutConfig: LayoutConfig;
  photosMap: Map<string, PhotoItem>;
  pageIndexToExport?: number; // if undefined, export all pages
  filename?: string;
  printDirectly?: boolean;
  onProgress?: (percent: number, status: string) => void;
}

function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
    img.src = url;
  });
}

async function renderPhotoToJpeg(
  photo: PhotoItem, 
  widthPx: number, 
  heightPx: number, 
  defaultCropMode: 'fill' | 'fit',
  rotationOffset: number = 0
): Promise<string | null> {
  if (!photo.url) return null;
  try {
    const img = await loadHtmlImage(photo.url);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(widthPx));
    canvas.height = Math.max(1, Math.round(heightPx));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const totalRotation = ((photo.rotation || 0) + rotationOffset) % 360;
    const isFlipped = !!photo.flipHorizontal;
    const cropSettings = photo.cropSettings;
    const effectiveCropMode = cropSettings?.mode || photo.cropMode || defaultCropMode || 'fill';
    const userScale = cropSettings?.scale !== undefined ? cropSettings.scale : 1.0;
    const offsetXPercent = cropSettings?.offsetX || 0;
    const offsetYPercent = cropSettings?.offsetY || 0;

    ctx.save();

    // Apply photo filters
    const filters = photo.filters;
    let filterStr = '';
    if (filters) {
      if (filters.brightness) filterStr += ` brightness(${100 + filters.brightness}%)`;
      if (filters.contrast) filterStr += ` contrast(${100 + filters.contrast}%)`;
      if (filters.saturation) filterStr += ` saturate(${100 + filters.saturation}%)`;
      if (filters.preset === 'bw') filterStr += ' grayscale(100%)';
      else if (filters.preset === 'vintage') filterStr += ' sepia(60%) contrast(110%)';
      else if (filters.preset === 'warm') filterStr += ' sepia(30%) hue-rotate(-10deg)';
      else if (filters.preset === 'cool') filterStr += ' hue-rotate(20deg) saturate(90%)';
    }
    if (filterStr) {
      ctx.filter = filterStr.trim();
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);

    if (isFlipped) {
      ctx.scale(-1, 1);
    }

    if (totalRotation !== 0) {
      ctx.rotate((totalRotation * Math.PI) / 180);
    }

    const isSideways = totalRotation === 90 || totalRotation === 270;
    const localSlotW = isSideways ? canvas.height : canvas.width;
    const localSlotH = isSideways ? canvas.width : canvas.height;

    let baseScale = 1;
    if (effectiveCropMode === 'fit') {
      baseScale = Math.min(localSlotW / imgW, localSlotH / imgH);
    } else {
      baseScale = Math.max(localSlotW / imgW, localSlotH / imgH);
    }

    const finalScale = baseScale * userScale;
    const drawW = imgW * finalScale;
    const drawH = imgH * finalScale;
    const drawX = -drawW / 2 + (offsetXPercent / 100) * localSlotW;
    const drawY = -drawH / 2 + (offsetYPercent / 100) * localSlotH;

    ctx.drawImage(img, 0, 0, imgW, imgH, drawX, drawY, drawW, drawH);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (err) {
    console.warn('Failed to render photo to JPEG for PDF:', err);
    return null;
  }
}

export async function exportToPdf(options: PdfExportOptions): Promise<void> {
  const {
    pages,
    layoutConfig,
    photosMap,
    pageIndexToExport,
    filename = 'photodesk_in_an.pdf',
    printDirectly = false,
    onProgress
  } = options;

  if (onProgress) onProgress(5, 'Đang khởi tạo tài liệu PDF chuẩn in ấn...');

  const pdfDoc = await PDFDocument.create();

  const pagesToProcess = pageIndexToExport !== undefined 
    ? [pages[pageIndexToExport]] 
    : pages;

  const total = pagesToProcess.length;

  for (let idx = 0; idx < total; idx++) {
    const pageLayout = pagesToProcess[idx];
    if (onProgress) {
      const pct = Math.round(10 + (idx / total) * 80);
      onProgress(pct, `Đang xử lý trang ${idx + 1}/${total}...`);
    }

    const paperWPt = pageLayout.paperWidth * MM_TO_PT;
    const paperHPt = pageLayout.paperHeight * MM_TO_PT;

    const pdfPage = pdfDoc.addPage([paperWPt, paperHPt]);

    // Draw white background
    pdfPage.drawRectangle({
      x: 0,
      y: 0,
      width: paperWPt,
      height: paperHPt,
      color: rgb(1, 1, 1)
    });

    for (const slot of pageLayout.placedPhotos) {
      const slotXPt = slot.x * MM_TO_PT;
      const slotYPt = (pageLayout.paperHeight - slot.y - slot.height) * MM_TO_PT; // invert Y for PDF
      const slotWPt = slot.width * MM_TO_PT;
      const slotHPt = slot.height * MM_TO_PT;

      // Draw border / frame background
      let effectiveBorderStyle = slot.borderStyle;
      if (!effectiveBorderStyle && (slot.presetName || slot.label)) {
        const name = (slot.presetName || slot.label || '').toLowerCase();
        if (name.includes('polaroid')) {
          effectiveBorderStyle = 'polaroid';
        } else if (name.includes('viền mỏng') || name.includes('photobooth')) {
          effectiveBorderStyle = 'thin';
        } else if (name.includes('không viền')) {
          effectiveBorderStyle = 'none';
        }
      }
      if (!effectiveBorderStyle) {
        effectiveBorderStyle = layoutConfig.borderStyle || 'none';
      }

      // 1. Draw slot background
      const slotBgHex = slot.bgHex || layoutConfig.bgHex || (effectiveBorderStyle === 'none' ? 'transparent' : '#ffffff');
      if (slotBgHex !== 'transparent') {
        const bgRgb = hexToPdfRgb(slotBgHex);
        pdfPage.drawRectangle({
          x: slotXPt,
          y: slotYPt,
          width: slotWPt,
          height: slotHPt,
          color: bgRgb
        });
      }

      var innerXPt = slotXPt;
      var innerYPt = slotYPt;
      var innerWPt = slotWPt;
      var innerHPt = slotHPt;

      if (effectiveBorderStyle === 'polaroid') {
        const topMm = slot.borderTopMm !== undefined 
          ? slot.borderTopMm 
          : (layoutConfig.borderTopMm !== undefined ? layoutConfig.borderTopMm : (layoutConfig.borderWidthMm || 5));
        const sideMm = slot.borderWidthMm !== undefined 
          ? slot.borderWidthMm 
          : (layoutConfig.borderWidthMm || 5);
        const bottomMm = slot.polaroidBottomMm !== undefined 
          ? slot.polaroidBottomMm 
          : (layoutConfig.polaroidBottomMm || 12);

        if (slot.rotated) {
          innerXPt = slotXPt + topMm * MM_TO_PT;
          innerYPt = slotYPt + sideMm * MM_TO_PT;
          innerWPt = slotWPt - (topMm + bottomMm) * MM_TO_PT;
          innerHPt = slotHPt - 2 * sideMm * MM_TO_PT;
        } else {
          innerXPt = slotXPt + sideMm * MM_TO_PT;
          innerYPt = slotYPt + bottomMm * MM_TO_PT;
          innerWPt = slotWPt - 2 * sideMm * MM_TO_PT;
          innerHPt = slotHPt - (topMm + bottomMm) * MM_TO_PT;
        }
      } else if (effectiveBorderStyle === 'thin') {
        const sideMm = slot.borderWidthMm !== undefined ? slot.borderWidthMm : 3;
        const topMm = slot.borderTopMm !== undefined ? slot.borderTopMm : sideMm;
        const bottomMm = topMm;

        if (slot.rotated) {
          innerXPt = slotXPt + topMm * MM_TO_PT;
          innerYPt = slotYPt + sideMm * MM_TO_PT;
          innerWPt = slotWPt - 2 * topMm * MM_TO_PT;
          innerHPt = slotHPt - 2 * sideMm * MM_TO_PT;
        } else {
          innerXPt = slotXPt + sideMm * MM_TO_PT;
          innerYPt = slotYPt + bottomMm * MM_TO_PT;
          innerWPt = slotWPt - 2 * sideMm * MM_TO_PT;
          innerHPt = slotHPt - (topMm + bottomMm) * MM_TO_PT;
        }
      } else if (effectiveBorderStyle === 'asymmetric') {
        const leftMm = slot.borderLeftMm !== undefined ? slot.borderLeftMm : (layoutConfig.borderLeftMm !== undefined ? layoutConfig.borderLeftMm : 14);
        const rightMm = slot.borderRightMm !== undefined ? slot.borderRightMm : (layoutConfig.borderRightMm !== undefined ? layoutConfig.borderRightMm : 3);
        const topMm = slot.borderTopMm !== undefined ? slot.borderTopMm : (layoutConfig.borderTopMm !== undefined ? layoutConfig.borderTopMm : 3);
        const bottomMm = slot.borderBottomMm !== undefined ? slot.borderBottomMm : (layoutConfig.borderBottomMm !== undefined ? layoutConfig.borderBottomMm : 3);

        if (slot.rotated) {
          innerXPt = slotXPt + topMm * MM_TO_PT;
          innerYPt = slotYPt + rightMm * MM_TO_PT;
          innerWPt = slotWPt - (topMm + bottomMm) * MM_TO_PT;
          innerHPt = slotHPt - (leftMm + rightMm) * MM_TO_PT;
        } else {
          innerXPt = slotXPt + leftMm * MM_TO_PT;
          innerYPt = slotYPt + bottomMm * MM_TO_PT;
          innerWPt = slotWPt - (leftMm + rightMm) * MM_TO_PT;
          innerHPt = slotHPt - (topMm + bottomMm) * MM_TO_PT;
        }
      } else if (effectiveBorderStyle === 'custom') {
        const sideMm = slot.borderWidthMm !== undefined ? slot.borderWidthMm : (layoutConfig.borderWidthMm || 4);
        const topMm = slot.borderTopMm !== undefined ? slot.borderTopMm : (layoutConfig.borderTopMm !== undefined ? layoutConfig.borderTopMm : sideMm);
        const bottomMm = slot.polaroidBottomMm !== undefined ? slot.polaroidBottomMm : (slot.borderBottomMm !== undefined ? slot.borderBottomMm : topMm);

        if (slot.rotated) {
          innerXPt = slotXPt + topMm * MM_TO_PT;
          innerYPt = slotYPt + sideMm * MM_TO_PT;
          innerWPt = slotWPt - (topMm + bottomMm) * MM_TO_PT;
          innerHPt = slotHPt - 2 * sideMm * MM_TO_PT;
        } else {
          innerXPt = slotXPt + sideMm * MM_TO_PT;
          innerYPt = slotYPt + bottomMm * MM_TO_PT;
          innerWPt = slotWPt - 2 * sideMm * MM_TO_PT;
          innerHPt = slotHPt - (topMm + bottomMm) * MM_TO_PT;
        }
      }

      // Compute sub-cells (Single vs Photobooth Strip vs Grid 2x2)
      const subLayout = slot.subSlotLayout || layoutConfig.subSlotLayout || 'single';
      const subGapPt = 1.5 * MM_TO_PT;
      const pdfCells: { x: number; y: number; w: number; h: number }[] = [];

      if (slot.rotated) {
        if (subLayout === 'strip-3') {
          const cW = (innerWPt - 2 * subGapPt) / 3;
          for (let i = 0; i < 3; i++) {
            pdfCells.push({ x: innerXPt + i * (cW + subGapPt), y: innerYPt, w: cW, h: innerHPt });
          }
        } else if (subLayout === 'strip-4') {
          const cW = (innerWPt - 3 * subGapPt) / 4;
          for (let i = 0; i < 4; i++) {
            pdfCells.push({ x: innerXPt + i * (cW + subGapPt), y: innerYPt, w: cW, h: innerHPt });
          }
        } else if (subLayout === 'strip-2') {
          const cW = (innerWPt - subGapPt) / 2;
          for (let i = 0; i < 2; i++) {
            pdfCells.push({ x: innerXPt + i * (cW + subGapPt), y: innerYPt, w: cW, h: innerHPt });
          }
        } else if (subLayout === 'grid-2x2') {
          const cW = (innerWPt - subGapPt) / 2;
          const cH = (innerHPt - subGapPt) / 2;
          for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
              pdfCells.push({ x: innerXPt + c * (cW + subGapPt), y: innerYPt + r * (cH + subGapPt), w: cW, h: cH });
            }
          }
        } else {
          pdfCells.push({ x: innerXPt, y: innerYPt, w: innerWPt, h: innerHPt });
        }
      } else {
        // Vertical in PDF (note: PDF Y origin is at the bottom, so higher Y is higher on page)
        if (subLayout === 'strip-3') {
          const cH = (innerHPt - 2 * subGapPt) / 3;
          for (let i = 0; i < 3; i++) {
            pdfCells.push({ x: innerXPt, y: innerYPt + (2 - i) * (cH + subGapPt), w: innerWPt, h: cH });
          }
        } else if (subLayout === 'strip-4') {
          const cH = (innerHPt - 3 * subGapPt) / 4;
          for (let i = 0; i < 4; i++) {
            pdfCells.push({ x: innerXPt, y: innerYPt + (3 - i) * (cH + subGapPt), w: innerWPt, h: cH });
          }
        } else if (subLayout === 'strip-2') {
          const cH = (innerHPt - subGapPt) / 2;
          for (let i = 0; i < 2; i++) {
            pdfCells.push({ x: innerXPt, y: innerYPt + (1 - i) * (cH + subGapPt), w: innerWPt, h: cH });
          }
        } else if (subLayout === 'grid-2x2') {
          const cW = (innerWPt - subGapPt) / 2;
          const cH = (innerHPt - subGapPt) / 2;
          for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 2; c++) {
              pdfCells.push({ x: innerXPt + c * (cW + subGapPt), y: innerYPt + (1 - r) * (cH + subGapPt), w: cW, h: cH });
            }
          }
        } else {
          pdfCells.push({ x: innerXPt, y: innerYPt, w: innerWPt, h: innerHPt });
        }
      }

      // Draw photo image in each cell if assigned
      const dpiScale = 300 / 25.4; // px per mm
      for (let cellIdx = 0; cellIdx < pdfCells.length; cellIdx++) {
        const cell = pdfCells[cellIdx];
        const targetPhotoId = slot.subPhotos?.[cellIdx] ?? (cellIdx === 0 ? slot.photoId : undefined);
        const cellPhoto = targetPhotoId ? photosMap.get(targetPhotoId) : null;
        if (!cellPhoto || !cellPhoto.url) continue;

        try {
          const photoWMm = cell.w / MM_TO_PT;
          const photoHMm = cell.h / MM_TO_PT;
          const widthPx = photoWMm * dpiScale;
          const heightPx = photoHMm * dpiScale;

          const jpegDataUrl = await renderPhotoToJpeg(
            cellPhoto, 
            widthPx, 
            heightPx, 
            cellPhoto.cropMode || layoutConfig.cropMode || 'fill',
            slot.rotated ? (layoutConfig.rotationHeadDirection === 'right' ? 90 : 270) : 0
          );

          if (jpegDataUrl) {
            const embeddedImage = await pdfDoc.embedJpg(jpegDataUrl);
            pdfPage.drawImage(embeddedImage, {
              x: cell.x,
              y: cell.y,
              width: cell.w,
              height: cell.h
            });
          }
        } catch (err) {
          console.warn('PDF Embed error for photo in cell:', err);
        }
      }

      // Draw cut line / border guides if enabled
      if (layoutConfig.cutLineStyle === 'solid') {
        pdfPage.drawRectangle({
          x: slotXPt,
          y: slotYPt,
          width: slotWPt,
          height: slotHPt,
          borderColor: rgb(0.35, 0.35, 0.35),
          borderWidth: 0.5
        });
      } else if (layoutConfig.cutLineStyle === 'dashed') {
        pdfPage.drawRectangle({
          x: slotXPt,
          y: slotYPt,
          width: slotWPt,
          height: slotHPt,
          borderColor: rgb(0.35, 0.35, 0.35),
          borderWidth: 0.5,
          borderDashArray: [4, 3]
        });
      } else if (layoutConfig.cutLineStyle === 'cropmarks') {
        const tick = 3 * MM_TO_PT;
        const col = rgb(0.15, 0.15, 0.15);
        // Top-left
        pdfPage.drawLine({ start: { x: slotXPt - tick, y: slotYPt + slotHPt }, end: { x: slotXPt, y: slotYPt + slotHPt }, color: col, thickness: 0.5 });
        pdfPage.drawLine({ start: { x: slotXPt, y: slotYPt + slotHPt }, end: { x: slotXPt, y: slotYPt + slotHPt + tick }, color: col, thickness: 0.5 });
        // Top-right
        pdfPage.drawLine({ start: { x: slotXPt + slotWPt, y: slotYPt + slotHPt }, end: { x: slotXPt + slotWPt + tick, y: slotYPt + slotHPt }, color: col, thickness: 0.5 });
        pdfPage.drawLine({ start: { x: slotXPt + slotWPt, y: slotYPt + slotHPt }, end: { x: slotXPt + slotWPt, y: slotYPt + slotHPt + tick }, color: col, thickness: 0.5 });
        // Bottom-left
        pdfPage.drawLine({ start: { x: slotXPt - tick, y: slotYPt }, end: { x: slotXPt, y: slotYPt }, color: col, thickness: 0.5 });
        pdfPage.drawLine({ start: { x: slotXPt, y: slotYPt - tick }, end: { x: slotXPt, y: slotYPt }, color: col, thickness: 0.5 });
        // Bottom-right
        pdfPage.drawLine({ start: { x: slotXPt + slotWPt, y: slotYPt }, end: { x: slotXPt + slotWPt + tick, y: slotYPt }, color: col, thickness: 0.5 });
        pdfPage.drawLine({ start: { x: slotXPt + slotWPt, y: slotYPt - tick }, end: { x: slotXPt + slotWPt, y: slotYPt }, color: col, thickness: 0.5 });
      }
    }

    // Draw non-destructive guillotine cut lines (extending to edges, avoiding photo interiors)
    if (layoutConfig.cutLineStyle === 'solid') {
      const segments = getSafeCutLineSegments(
        pageLayout.placedPhotos,
        pageLayout.paperWidth,
        pageLayout.paperHeight
      );

      segments.forEach(seg => {
        const x1Pt = seg.x1 * MM_TO_PT;
        const x2Pt = seg.x2 * MM_TO_PT;
        const y1Pt = (pageLayout.paperHeight - seg.y1) * MM_TO_PT;
        const y2Pt = (pageLayout.paperHeight - seg.y2) * MM_TO_PT;

        pdfPage.drawLine({
          start: { x: x1Pt, y: y1Pt },
          end: { x: x2Pt, y: y2Pt },
          color: rgb(0.35, 0.35, 0.35),
          thickness: 0.5
        });
      });
    }
  }

  if (onProgress) onProgress(95, printDirectly ? 'Đang chuẩn bị lệnh in trực tiếp...' : 'Đang lưu file PDF...');
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });

  if (printDirectly) {
    const blobUrl = URL.createObjectURL(blob);
    // Create hidden iframe to trigger browser's native print dialog
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          // Fallback if browser security blocks iframe print
          window.open(blobUrl, '_blank');
        }
      }, 250);

      // Clean up iframe and object URL after print dialog closes
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch {}
        URL.revokeObjectURL(blobUrl);
      }, 120000);
    };

    if (onProgress) onProgress(100, 'Đã mở hộp thoại in của máy in!');
    return;
  }

  saveAs(blob, filename);

  if (onProgress) onProgress(100, 'Hoàn thành xuất file PDF!');
}
