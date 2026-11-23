import {
  PaperConfig,
  LayoutConfig,
  PhotoItem,
  SheetLayout,
  PlacedPhoto,
  SubSlotLayout
} from '../../types';
import { PAPER_PRESETS, PHOTO_SIZE_PRESETS } from '../constants';
import { storageManager } from '../storage/storageManager';
import { MaxRectsBinPacker, BinItem } from './maxRects';

export interface LayoutResult {
  pages: SheetLayout[];
  totalPages: number;
  totalSlots: number;
  assignedPhotosCount: number;
  wastePercent: number;
  photoPercent: number;
  paperWidthMm: number;
  paperHeightMm: number;
  summaryText: string;
}

/**
 * Computes the target physical width and height for a photo given configuration
 */
export function getPhotoDimensionsMm(layoutConfig: LayoutConfig): { widthMm: number; heightMm: number } {
  if (layoutConfig.photoPresetId === 'custom' || layoutConfig.photoPresetId === '__custom__') {
    return {
      widthMm: layoutConfig.customWidthMm || 60,
      heightMm: layoutConfig.customHeightMm || 90
    };
  }

  const preset = PHOTO_SIZE_PRESETS.find(p => p.id === layoutConfig.photoPresetId);
  if (preset) {
    return { widthMm: preset.widthMm, heightMm: preset.heightMm };
  }

  if (layoutConfig.customWidthMm && layoutConfig.customHeightMm) {
    return {
      widthMm: layoutConfig.customWidthMm,
      heightMm: layoutConfig.customHeightMm
    };
  }

  return { widthMm: 60, heightMm: 90 };
}

/**
 * Computes the effective sheet dimensions according to orientation
 */
export function getEffectivePaperDimensions(paperConfig: PaperConfig): { widthMm: number; heightMm: number } {
  let baseW: number;
  let baseH: number;

  if (paperConfig.sizeId === 'custom') {
    baseW = paperConfig.customWidthMm || 210;
    baseH = paperConfig.customHeightMm || 297;
  } else {
    const preset = PAPER_PRESETS[paperConfig.sizeId] || PAPER_PRESETS['A4'];
    baseW = preset.dimensions.widthMm;
    baseH = preset.dimensions.heightMm;
  }

  const minDim = Math.min(baseW, baseH);
  const maxDim = Math.max(baseW, baseH);

  if (paperConfig.orientation === 'landscape') {
    return { widthMm: maxDim, heightMm: minDim };
  } else {
    return { widthMm: minDim, heightMm: maxDim };
  }
}

/**
 * Main Layout Engine: Packs photos into sheets based on grid or optimal bin packing
 */
export function computeLayout(
  paperConfig: PaperConfig,
  layoutConfig: LayoutConfig,
  photos: PhotoItem[],
  targetPhotoCountOverride?: number
): LayoutResult {
  const getSubCountFromLayout = (subSlot?: SubSlotLayout): number => {
    if (subSlot === 'strip-4' || subSlot === 'grid-2x2') return 4;
    if (subSlot === 'strip-3') return 3;
    if (subSlot === 'strip-2') return 2;
    return 1;
  };
  const { widthMm: paperW, heightMm: paperH } = getEffectivePaperDimensions(paperConfig);
  const { margins, printerOffsetX, printerOffsetY } = paperConfig;

  const printableX = margins.left + (printerOffsetX || 0);
  const printableY = margins.top + (printerOffsetY || 0);
  const printableW = Math.max(10, paperW - (margins.left + margins.right));
  const printableH = Math.max(10, paperH - (margins.top + margins.bottom));

  const printableArea = {
    x: printableX,
    y: printableY,
    width: printableW,
    height: printableH
  };

  const pages: SheetLayout[] = [];

  // Determine items to place
  if (layoutConfig.mode === 'multi' && layoutConfig.multiSizes && layoutConfig.multiSizes.length > 0) {
    // Multi-size packing mode ("Nhiều khổ chung tờ")
    const binItems: BinItem[] = [];
    const availableTemplates = storageManager.getTemplates();

    for (const demand of layoutConfig.multiSizes) {
      // Tìm template tương ứng để đảm bảo đúng 100% borderStyle và độ dày viền của mẫu tiệm
      const tplId = demand.sizeId ? demand.sizeId.replace('tpl-', '') : '';
      const matchedTpl = availableTemplates.find(t => t.id === tplId || t.name === demand.name);

      const effectiveBorderStyle = demand.borderStyle || matchedTpl?.borderStyle || (
        demand.name.toLowerCase().includes('polaroid') ? 'polaroid' :
        demand.name.toLowerCase().includes('viền mỏng') ? 'thin' :
        demand.name.toLowerCase().includes('photobooth') ? 'thin' :
        demand.name.toLowerCase().includes('không viền') ? 'none' : undefined
      );

      const effectiveBorderWidth = demand.borderWidthMm !== undefined 
        ? demand.borderWidthMm 
        : (matchedTpl?.borderWidthMm !== undefined 
            ? matchedTpl.borderWidthMm 
            : (effectiveBorderStyle === 'polaroid' ? 5 : effectiveBorderStyle === 'thin' ? 3 : 0));

      const effectiveBorderTop = demand.borderTopMm !== undefined
        ? demand.borderTopMm
        : (matchedTpl?.borderTopMm !== undefined ? matchedTpl.borderTopMm : effectiveBorderWidth);

      const effectivePolaroidBottom = demand.polaroidBottomMm !== undefined
        ? demand.polaroidBottomMm
        : (matchedTpl?.polaroidBottomMm !== undefined 
            ? matchedTpl.polaroidBottomMm 
            : (effectiveBorderStyle === 'polaroid' ? 12 : 0));

      const effectivePattern = demand.borderPattern || matchedTpl?.borderPattern;

      const effectiveSubSlot = demand.subSlotLayout || matchedTpl?.subSlotLayout || (
        demand.name.toLowerCase().includes('photobooth 4') ? 'strip-4' :
        demand.name.toLowerCase().includes('photobooth 3') ? 'strip-3' :
        demand.name.toLowerCase().includes('photobooth 2') ? 'strip-2' :
        demand.name.toLowerCase().includes('lưới 2x2') || demand.name.toLowerCase().includes('lưới 2×2') ? 'grid-2x2' : 'single'
      );
      const effectiveBgHex = demand.bgHex || matchedTpl?.bgHex || '#ffffff';
      const effectiveFooterText = demand.footerText || matchedTpl?.footerText;
      const effectiveBorderLeft = demand.borderLeftMm !== undefined ? demand.borderLeftMm : matchedTpl?.borderLeftMm;
      const effectiveBorderRight = demand.borderRightMm !== undefined ? demand.borderRightMm : matchedTpl?.borderRightMm;
      const effectiveBorderBottom = demand.borderBottomMm !== undefined ? demand.borderBottomMm : matchedTpl?.borderBottomMm;

      // Tự động xoay ảnh khi người dùng bật cho phép xoay để tối ưu tiết kiệm diện tích giấy
      const canRotate = demand.allowRotation !== undefined 
        ? demand.allowRotation 
        : layoutConfig.allowRotation;

      for (let c = 0; c < demand.count; c++) {
        binItems.push({
          id: `item-${demand.id}-${c}`,
          width: demand.widthMm,
          height: demand.heightMm,
          allowRotation: canRotate,
          label: demand.name,
          presetName: demand.name,
          borderStyle: effectiveBorderStyle,
          borderWidthMm: effectiveBorderWidth,
          borderTopMm: effectiveBorderTop,
          borderLeftMm: effectiveBorderLeft,
          borderRightMm: effectiveBorderRight,
          borderBottomMm: effectiveBorderBottom,
          polaroidBottomMm: effectivePolaroidBottom,
          borderPattern: effectivePattern,
          subSlotLayout: effectiveSubSlot,
          bgHex: effectiveBgHex,
          footerText: effectiveFooterText
        });
      }
    }

    const packer = new MaxRectsBinPacker(
      printableW,
      printableH,
      layoutConfig.gapX,
      layoutConfig.gapY,
      layoutConfig.allowRotation
    );

    const { pages: packedPages } = packer.pack(binItems, printableX, printableY);

    let photoIdx = 0;
    packedPages.forEach((itemsOnPage, pageIdx) => {
      // Calculate bounding box of placed items to center cleanly on the sheet
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const item of itemsOnPage) {
        if (item.x < minX) minX = item.x;
        if (item.x + item.width > maxX) maxX = item.x + item.width;
        if (item.y < minY) minY = item.y;
        if (item.y + item.height > maxY) maxY = item.y + item.height;
      }

      const clusterW = maxX > minX ? maxX - minX : 0;
      const clusterH = maxY > minY ? maxY - minY : 0;
      const shiftX = clusterW > 0 && clusterW < printableW ? Math.round(((printableW - clusterW) / 2 - (minX - printableX)) * 10) / 10 : 0;
      const shiftY = clusterH > 0 && clusterH < printableH ? Math.round(((printableH - clusterH) / 2 - (minY - printableY)) * 10) / 10 : 0;

      const placedPhotos: PlacedPhoto[] = itemsOnPage.map((item, slotIdx) => {
        const subCount = getSubCountFromLayout(item.subSlotLayout);
        let subPhotos: (string | undefined)[] | undefined = undefined;
        let photoId: string | undefined = undefined;
        if (subCount > 1) {
          subPhotos = [];
          for (let s = 0; s < subCount; s++) {
            const p = photos[photoIdx++];
            subPhotos.push(p?.id);
          }
          photoId = subPhotos.find(id => !!id) || undefined;
        } else {
          const photo = photos[photoIdx++];
          photoId = photo?.id;
        }

        return {
          slotId: `slot-p${pageIdx}-s${slotIdx}`,
          photoId,
          subPhotos,
          x: Math.round((item.x + shiftX) * 10) / 10,
          y: Math.round((item.y + shiftY) * 10) / 10,
          width: item.width,
          height: item.height,
          rotated: item.rotated,
          pageIndex: pageIdx,
          label: item.label,
          presetName: item.presetName,
          borderStyle: item.borderStyle,
          borderWidthMm: item.borderWidthMm,
          borderTopMm: item.borderTopMm,
          borderLeftMm: item.borderLeftMm,
          borderRightMm: item.borderRightMm,
          borderBottomMm: item.borderBottomMm,
          polaroidBottomMm: item.polaroidBottomMm,
          borderPattern: item.borderPattern,
          subSlotLayout: item.subSlotLayout,
          bgHex: item.bgHex,
          footerText: item.footerText
        };
      });

      const usedArea = placedPhotos.reduce((sum, p) => sum + (p.width * p.height), 0);
      const totalArea = paperW * paperH;
      const photoPercent = Math.min(100, Math.round((usedArea / totalArea) * 100));
      const wastePercent = 100 - photoPercent;

      pages.push({
        pageIndex: pageIdx,
        paperWidth: paperW,
        paperHeight: paperH,
        placedPhotos,
        wastePercent,
        photoPercent,
        printableArea
      });
    });
  } else {
    // Single photo size layout mode
    const { widthMm: photoW, heightMm: photoH } = getPhotoDimensionsMm(layoutConfig);
    const gapX = layoutConfig.gapX;
    const gapY = layoutConfig.gapY;

    interface SlotCandidate {
      x: number;
      y: number;
      width: number;
      height: number;
      rotated: boolean;
    }

    interface CandidateLayout {
      name: string;
      count: number;
      slots: SlotCandidate[];
      uprightCount: number;
    }

    const candidates: CandidateLayout[] = [];

    // 1. Pure Upright Grid
    const uprightCols = Math.max(1, Math.floor((printableW + gapX) / (photoW + gapX)));
    const uprightRows = Math.max(1, Math.floor((printableH + gapY) / (photoH + gapY)));
    {
      const totalW = uprightCols * photoW + (uprightCols - 1) * gapX;
      const totalH = uprightRows * photoH + (uprightRows - 1) * gapY;
      const startX = printableX + Math.max(0, (printableW - totalW) / 2);
      const startY = printableY + Math.max(0, (printableH - totalH) / 2);
      const slots: SlotCandidate[] = [];
      for (let r = 0; r < uprightRows; r++) {
        for (let c = 0; c < uprightCols; c++) {
          slots.push({
            x: startX + c * (photoW + gapX),
            y: startY + r * (photoH + gapY),
            width: photoW,
            height: photoH,
            rotated: false
          });
        }
      }
      candidates.push({
        name: 'pure-upright',
        count: slots.length,
        slots,
        uprightCount: slots.length
      });
    }

    // 2. Pure Rotated Grid (if rotation allowed)
    if (layoutConfig.allowRotation) {
      const rotCols = Math.max(1, Math.floor((printableW + gapX) / (photoH + gapX)));
      const rotRows = Math.max(1, Math.floor((printableH + gapY) / (photoW + gapY)));
      const totalW = rotCols * photoH + (rotCols - 1) * gapX;
      const totalH = rotRows * photoW + (rotRows - 1) * gapY;
      const startX = printableX + Math.max(0, (printableW - totalW) / 2);
      const startY = printableY + Math.max(0, (printableH - totalH) / 2);
      const slots: SlotCandidate[] = [];
      for (let r = 0; r < rotRows; r++) {
        for (let c = 0; c < rotCols; c++) {
          slots.push({
            x: startX + c * (photoH + gapX),
            y: startY + r * (photoW + gapY),
            width: photoH,
            height: photoW,
            rotated: true
          });
        }
      }
      candidates.push({
        name: 'pure-rotated',
        count: slots.length,
        slots,
        uprightCount: 0
      });

      // 3. Hybrid: Top Upright + Bottom Rotated
      for (let rUp = 1; rUp <= uprightRows; rUp++) {
        const topW = uprightCols * photoW + (uprightCols - 1) * gapX;
        const topH = rUp * photoH + (rUp - 1) * gapY;
        const remH = printableH - topH - gapY;
        if (remH >= photoW) {
          const botCols = Math.max(1, Math.floor((printableW + gapX) / (photoH + gapX)));
          const botRows = Math.floor((remH + gapY) / (photoW + gapY));
          if (botRows > 0) {
            const botW = botCols * photoH + (botCols - 1) * gapX;
            const botH = botRows * photoW + (botRows - 1) * gapY;
            const clusterH = topH + gapY + botH;
            const startY = printableY + Math.max(0, (printableH - clusterH) / 2);
            const topStartX = printableX + Math.max(0, (printableW - topW) / 2);
            const botStartX = printableX + Math.max(0, (printableW - botW) / 2);

            const slots: SlotCandidate[] = [];
            for (let r = 0; r < rUp; r++) {
              for (let c = 0; c < uprightCols; c++) {
                slots.push({
                  x: topStartX + c * (photoW + gapX),
                  y: startY + r * (photoH + gapY),
                  width: photoW,
                  height: photoH,
                  rotated: false
                });
              }
            }
            const botStartY = startY + topH + gapY;
            for (let r = 0; r < botRows; r++) {
              for (let c = 0; c < botCols; c++) {
                slots.push({
                  x: botStartX + c * (photoH + gapX),
                  y: botStartY + r * (photoW + gapY),
                  width: photoH,
                  height: photoW,
                  rotated: true
                });
              }
            }
            candidates.push({
              name: `hybrid-top-upright-${rUp}`,
              count: slots.length,
              slots,
              uprightCount: uprightCols * rUp
            });
          }
        }
      }

      // 4. Hybrid: Top Rotated + Bottom Upright
      for (let rRot = 1; rRot <= rotRows; rRot++) {
        const topW = rotCols * photoH + (rotCols - 1) * gapX;
        const topH = rRot * photoW + (rRot - 1) * gapY;
        const remH = printableH - topH - gapY;
        if (remH >= photoH) {
          const botCols = uprightCols;
          const botRows = Math.floor((remH + gapY) / (photoH + gapY));
          if (botRows > 0) {
            const botW = botCols * photoW + (botCols - 1) * gapX;
            const botH = botRows * photoH + (botRows - 1) * gapY;
            const clusterH = topH + gapY + botH;
            const startY = printableY + Math.max(0, (printableH - clusterH) / 2);
            const topStartX = printableX + Math.max(0, (printableW - topW) / 2);
            const botStartX = printableX + Math.max(0, (printableW - botW) / 2);

            const slots: SlotCandidate[] = [];
            for (let r = 0; r < rRot; r++) {
              for (let c = 0; c < rotCols; c++) {
                slots.push({
                  x: topStartX + c * (photoH + gapX),
                  y: startY + r * (photoW + gapY),
                  width: photoH,
                  height: photoW,
                  rotated: true
                });
              }
            }
            const botStartY = startY + topH + gapY;
            for (let r = 0; r < botRows; r++) {
              for (let c = 0; c < botCols; c++) {
                slots.push({
                  x: botStartX + c * (photoW + gapX),
                  y: botStartY + r * (photoH + gapY),
                  width: photoW,
                  height: photoH,
                  rotated: false
                });
              }
            }
            candidates.push({
              name: `hybrid-top-rot-${rRot}`,
              count: slots.length,
              slots,
              uprightCount: botCols * botRows
            });
          }
        }
      }

      // 5. Hybrid: Left Upright + Right Rotated
      for (let cUp = 1; cUp <= uprightCols; cUp++) {
        const leftW = cUp * photoW + (cUp - 1) * gapX;
        const leftH = uprightRows * photoH + (uprightRows - 1) * gapY;
        const remW = printableW - leftW - gapX;
        if (remW >= photoH) {
          const rightCols = Math.floor((remW + gapX) / (photoH + gapX));
          const rightRows = Math.max(1, Math.floor((printableH + gapY) / (photoW + gapY)));
          if (rightCols > 0) {
            const rightW = rightCols * photoH + (rightCols - 1) * gapX;
            const rightH = rightRows * photoW + (rightRows - 1) * gapY;
            const clusterW = leftW + gapX + rightW;
            const startX = printableX + Math.max(0, (printableW - clusterW) / 2);
            const leftStartY = printableY + Math.max(0, (printableH - leftH) / 2);
            const rightStartY = printableY + Math.max(0, (printableH - rightH) / 2);

            const slots: SlotCandidate[] = [];
            for (let r = 0; r < uprightRows; r++) {
              for (let c = 0; c < cUp; c++) {
                slots.push({
                  x: startX + c * (photoW + gapX),
                  y: leftStartY + r * (photoH + gapY),
                  width: photoW,
                  height: photoH,
                  rotated: false
                });
              }
            }
            const rightStartX = startX + leftW + gapX;
            for (let r = 0; r < rightRows; r++) {
              for (let c = 0; c < rightCols; c++) {
                slots.push({
                  x: rightStartX + c * (photoH + gapX),
                  y: rightStartY + r * (photoW + gapY),
                  width: photoH,
                  height: photoW,
                  rotated: true
                });
              }
            }
            candidates.push({
              name: `hybrid-left-upright-${cUp}`,
              count: slots.length,
              slots,
              uprightCount: cUp * uprightRows
            });
          }
        }
      }
    }

    // Select candidate with highest count; tie-break by most upright items
    const bestConfig = candidates.reduce((best, curr) => {
      if (curr.count > best.count) return curr;
      if (curr.count === best.count && curr.uprightCount > best.uprightCount) return curr;
      return best;
    }, candidates[0]);

    const slotsPerPage = bestConfig.slots.length;

    const subSlotLayout = layoutConfig.subSlotLayout || (
      layoutConfig.photoPresetId?.toLowerCase().includes('photobooth 4') ? 'strip-4' :
      layoutConfig.photoPresetId?.toLowerCase().includes('photobooth 3') ? 'strip-3' :
      layoutConfig.photoPresetId?.toLowerCase().includes('photobooth 2') ? 'strip-2' : 'single'
    );
    const subCount = getSubCountFromLayout(subSlotLayout);
    const totalSubSlotsPerPage = slotsPerPage * subCount;

    let totalPagesNeeded = 1;
    if (targetPhotoCountOverride !== undefined) {
      totalPagesNeeded = Math.max(1, Math.ceil(targetPhotoCountOverride / slotsPerPage));
    } else if (photos.length > 0) {
      totalPagesNeeded = Math.max(1, Math.ceil(photos.length / totalSubSlotsPerPage));
    }

    let photoCounter = 0;
    for (let pageIdx = 0; pageIdx < totalPagesNeeded; pageIdx++) {
      const placedPhotos: PlacedPhoto[] = [];

      for (let sIdx = 0; sIdx < bestConfig.slots.length; sIdx++) {
        const slot = bestConfig.slots[sIdx];

        let subPhotos: (string | undefined)[] | undefined = undefined;
        let photoId: string | undefined = undefined;
        if (subCount > 1) {
          subPhotos = [];
          for (let s = 0; s < subCount; s++) {
            const p = photos[photoCounter++];
            subPhotos.push(p?.id);
          }
          photoId = subPhotos.find(id => !!id) || undefined;
        } else {
          const photo = photos[photoCounter++];
          photoId = photo?.id;
        }

        placedPhotos.push({
          slotId: `slot-p${pageIdx}-s${sIdx}`,
          photoId,
          subPhotos,
          x: Math.round(slot.x * 10) / 10,
          y: Math.round(slot.y * 10) / 10,
          width: slot.width,
          height: slot.height,
          rotated: slot.rotated,
          pageIndex: pageIdx,
          label: layoutConfig.photoPresetId,
          borderStyle: layoutConfig.borderStyle,
          borderWidthMm: layoutConfig.borderWidthMm,
          borderTopMm: layoutConfig.borderTopMm,
          borderLeftMm: layoutConfig.borderLeftMm,
          borderRightMm: layoutConfig.borderRightMm,
          borderBottomMm: layoutConfig.borderBottomMm,
          polaroidBottomMm: layoutConfig.polaroidBottomMm,
          borderPattern: layoutConfig.borderPattern,
          subSlotLayout: subSlotLayout,
          bgHex: layoutConfig.bgHex || '#ffffff',
          footerText: layoutConfig.footerText
        });
      }

      const usedArea = placedPhotos.reduce((sum, p) => sum + (p.width * p.height), 0);
      const totalArea = paperW * paperH;
      const photoPercent = Math.min(100, Math.round((usedArea / totalArea) * 100));
      const wastePercent = 100 - photoPercent;

      pages.push({
        pageIndex: pageIdx,
        paperWidth: paperW,
        paperHeight: paperH,
        placedPhotos,
        wastePercent,
        photoPercent,
        printableArea
      });
    }
  }

  // Aggregate stats
  const getSlotSubCount = (s: PlacedPhoto) => {
    if (s.subSlotLayout === 'strip-4') return 4;
    if (s.subSlotLayout === 'strip-3') return 3;
    if (s.subSlotLayout === 'strip-2') return 2;
    if (s.subSlotLayout === 'grid-2x2') return 4;
    return 1;
  };

  const totalSlots = pages.reduce(
    (acc, p) => acc + p.placedPhotos.reduce((sAcc, s) => sAcc + getSlotSubCount(s), 0),
    0
  );
  const assignedPhotosCount = pages.reduce(
    (acc, p) => acc + p.placedPhotos.reduce((sAcc, s) => {
      const sub = getSlotSubCount(s);
      if (sub > 1 && s.subPhotos) {
        return sAcc + s.subPhotos.filter(Boolean).length;
      }
      return sAcc + (s.photoId ? 1 : 0);
    }, 0),
    0
  );

  const avgPhotoPercent = pages.length > 0 
    ? Math.round(pages.reduce((acc, p) => acc + p.photoPercent, 0) / pages.length)
    : 0;
  const avgWastePercent = 100 - avgPhotoPercent;

  let densityComment = 'Dàn tối ưu.';
  if (avgWastePercent <= 20) densityComment = 'Dàn rất chặt, tận dụng tối đa giấy.';
  else if (avgWastePercent <= 30) densityComment = 'Dàn khá chặt, ít lãng phí giấy.';
  else densityComment = 'Còn khoảng trống trên giấy.';

  const summaryText = `Ảnh chiếm ${avgPhotoPercent}% giấy, phần trống bỏ đi ${avgWastePercent}%. ${densityComment}`;

  return {
    pages,
    totalPages: pages.length,
    totalSlots,
    assignedPhotosCount,
    wastePercent: avgWastePercent,
    photoPercent: avgPhotoPercent,
    paperWidthMm: paperW,
    paperHeightMm: paperH,
    summaryText
  };
}
