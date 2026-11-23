import JSZip from 'jszip';
import fileSaver from 'file-saver';
const saveAs = (fileSaver as any).saveAs || fileSaver;
import { SheetLayout, PaperConfig, LayoutConfig, PhotoItem } from '../../types';
import { renderSheetToCanvas } from '../canvas/canvasRenderer';

export type ExportDpi = 150 | 300 | 600;

export interface ImageExportOptions {
  pages: SheetLayout[];
  paperConfig: PaperConfig;
  layoutConfig: LayoutConfig;
  photosMap: Map<string, PhotoItem>;
  dpi: ExportDpi;
  pageIndexToExport?: number; // if undefined, export all pages as ZIP
  zipFilename?: string;
  onProgress?: (percent: number, status: string) => void;
}

/**
 * Computes pixels per mm for a given DPI
 * 1 inch = 25.4 mm
 */
export function getScaleForDpi(dpi: ExportDpi): number {
  return dpi / 25.4;
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve();
    img.onerror = () => resolve(); // continue gracefully even if one image fails
    img.src = url;
  });
}

/**
 * Renders a high-resolution canvas for a single page and returns it as a Blob
 */
export async function renderPageToBlob(
  page: SheetLayout,
  paperConfig: PaperConfig,
  layoutConfig: LayoutConfig,
  photosMap: Map<string, PhotoItem>,
  dpi: ExportDpi
): Promise<Blob> {
  // Pre-load all photos on this page to guarantee they are drawn on canvas
  const photoUrls = page.placedPhotos
    .map(s => s.photoId ? photosMap.get(s.photoId)?.url : null)
    .filter((u): u is string => Boolean(u));
  await Promise.all(photoUrls.map(preloadImage));

  const scale = getScaleForDpi(dpi);
  const canvas = document.createElement('canvas');

  renderSheetToCanvas(
    canvas,
    page,
    paperConfig,
    layoutConfig,
    photosMap,
    {
      scale,
      showMargins: false,
      showCutLines: layoutConfig.cutLineStyle !== 'none'
    }
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/jpeg',
      0.96
    );
  });
}

/**
 * Exports single page or all pages as high resolution JPG / ZIP
 */
export async function exportToJpg(options: ImageExportOptions): Promise<void> {
  const {
    pages,
    paperConfig,
    layoutConfig,
    photosMap,
    dpi,
    pageIndexToExport,
    zipFilename = 'photodesk_in_an_jpg.zip',
    onProgress
  } = options;

  if (pageIndexToExport !== undefined) {
    // Export single page directly
    if (onProgress) onProgress(30, `Đang tạo ảnh trang ${pageIndexToExport + 1} (${dpi} DPI)...`);
    const blob = await renderPageToBlob(
      pages[pageIndexToExport],
      paperConfig,
      layoutConfig,
      photosMap,
      dpi
    );
    if (onProgress) onProgress(90, 'Đang tải file ảnh về máy...');
    saveAs(blob, `photodesk_trang_${pageIndexToExport + 1}_${dpi}dpi.jpg`);
    if (onProgress) onProgress(100, 'Hoàn thành!');
    return;
  }

  // Export all pages into a ZIP archive
  const zip = new JSZip();
  const total = pages.length;

  for (let idx = 0; idx < total; idx++) {
    if (onProgress) {
      const pct = Math.round(10 + (idx / total) * 75);
      onProgress(pct, `Đang kết xuất ảnh trang ${idx + 1}/${total} (${dpi} DPI)...`);
    }

    const blob = await renderPageToBlob(
      pages[idx],
      paperConfig,
      layoutConfig,
      photosMap,
      dpi
    );

    zip.file(`trang_${idx + 1}_${dpi}dpi.jpg`, blob);
  }

  if (onProgress) onProgress(90, 'Đang nén file ZIP in ấn...');
  const zipContent = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      const pct = Math.round(85 + (metadata.percent / 100) * 12);
      onProgress(pct, `Đang nén: ${Math.round(metadata.percent)}%`);
    }
  });

  saveAs(zipContent, zipFilename);
  if (onProgress) onProgress(100, 'Hoàn thành tải gói file in ấn ZIP!');
}
