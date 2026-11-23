import {
  SheetLayout,
  PlacedPhoto,
  LayoutConfig,
  PaperConfig,
  PhotoItem
} from '../../types';

export interface RenderOptions {
  scale: number; // pixels per mm
  showMargins?: boolean;
  showCutLines?: boolean;
  selectedSlotId?: string | null;
  hoveredSlotId?: string | null;
  dragOverSlotId?: string | null;
}

// Cache loaded images
const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(url: string, onLoaded?: () => void): HTMLImageElement | null {
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    imageCache.set(url, img);
    if (onLoaded) onLoaded();
  };
  img.src = url;
  return null;
}

export interface SubCellRect {
  index: number;
  subKey: string;
  x: number; // mm
  y: number; // mm
  width: number; // mm
  height: number; // mm
}

/**
 * Computes exact physical (mm) aperture and coordinates for sub-cells in a slot.
 */
export function getSlotSubCells(
  slot: PlacedPhoto,
  layoutConfig: LayoutConfig
): SubCellRect[] {
  let effectiveBorderStyle = slot.borderStyle;
  if (!effectiveBorderStyle && (slot.presetName || slot.label)) {
    const name = (slot.presetName || slot.label || '').toLowerCase();
    if (name.includes('polaroid')) effectiveBorderStyle = 'polaroid';
    else if (name.includes('viền mỏng') || name.includes('photobooth')) effectiveBorderStyle = 'thin';
    else if (name.includes('không viền')) effectiveBorderStyle = 'none';
  }
  if (!effectiveBorderStyle) effectiveBorderStyle = layoutConfig.borderStyle || 'none';

  let innerX = slot.x;
  let innerY = slot.y;
  let innerW = slot.width;
  let innerH = slot.height;

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
      innerX = slot.x + topMm;
      innerY = slot.y + sideMm;
      innerW = Math.max(10, slot.width - (topMm + bottomMm));
      innerH = Math.max(10, slot.height - 2 * sideMm);
    } else {
      innerX = slot.x + sideMm;
      innerY = slot.y + topMm;
      innerW = Math.max(10, slot.width - 2 * sideMm);
      innerH = Math.max(10, slot.height - (topMm + bottomMm));
    }
  } else if (effectiveBorderStyle === 'thin') {
    const sideMm = slot.borderWidthMm !== undefined ? slot.borderWidthMm : 3;
    const topMm = slot.borderTopMm !== undefined ? slot.borderTopMm : sideMm;
    if (slot.rotated) {
      innerX = slot.x + topMm;
      innerY = slot.y + sideMm;
      innerW = Math.max(10, slot.width - 2 * topMm);
      innerH = Math.max(10, slot.height - 2 * sideMm);
    } else {
      innerX = slot.x + sideMm;
      innerY = slot.y + topMm;
      innerW = Math.max(10, slot.width - 2 * sideMm);
      innerH = Math.max(10, slot.height - 2 * topMm);
    }
  } else if (effectiveBorderStyle === 'asymmetric') {
    const leftMm = slot.borderLeftMm !== undefined ? slot.borderLeftMm : (layoutConfig.borderLeftMm !== undefined ? layoutConfig.borderLeftMm : 14);
    const rightMm = slot.borderRightMm !== undefined ? slot.borderRightMm : (layoutConfig.borderRightMm !== undefined ? layoutConfig.borderRightMm : 3);
    const topMm = slot.borderTopMm !== undefined ? slot.borderTopMm : (layoutConfig.borderTopMm !== undefined ? layoutConfig.borderTopMm : 3);
    const bottomMm = slot.borderBottomMm !== undefined ? slot.borderBottomMm : (layoutConfig.borderBottomMm !== undefined ? layoutConfig.borderBottomMm : 3);

    if (slot.rotated) {
      innerX = slot.x + topMm;
      innerY = slot.y + rightMm;
      innerW = Math.max(10, slot.width - (topMm + bottomMm));
      innerH = Math.max(10, slot.height - (leftMm + rightMm));
    } else {
      innerX = slot.x + leftMm;
      innerY = slot.y + topMm;
      innerW = Math.max(10, slot.width - (leftMm + rightMm));
      innerH = Math.max(10, slot.height - (topMm + bottomMm));
    }
  } else if (effectiveBorderStyle === 'custom') {
    const sideMm = slot.borderWidthMm !== undefined ? slot.borderWidthMm : (layoutConfig.borderWidthMm || 4);
    const topMm = slot.borderTopMm !== undefined ? slot.borderTopMm : (layoutConfig.borderTopMm !== undefined ? layoutConfig.borderTopMm : sideMm);
    const bottomMm = slot.polaroidBottomMm !== undefined ? slot.polaroidBottomMm : (slot.borderBottomMm !== undefined ? slot.borderBottomMm : topMm);

    if (slot.rotated) {
      innerX = slot.x + topMm;
      innerY = slot.y + sideMm;
      innerW = Math.max(10, slot.width - (topMm + bottomMm));
      innerH = Math.max(10, slot.height - 2 * sideMm);
    } else {
      innerX = slot.x + sideMm;
      innerY = slot.y + topMm;
      innerW = Math.max(10, slot.width - 2 * sideMm);
      innerH = Math.max(10, slot.height - (topMm + bottomMm));
    }
  }

  const subLayout = slot.subSlotLayout || layoutConfig.subSlotLayout || 'single';
  const subGapMm = 1.5;
  const result: SubCellRect[] = [];

  if (slot.rotated) {
    if (subLayout === 'strip-3') {
      const cellW = (innerW - 2 * subGapMm) / 3;
      for (let i = 0; i < 3; i++) {
        result.push({ index: i, subKey: `${slot.slotId}__sub__${i}`, x: innerX + i * (cellW + subGapMm), y: innerY, width: cellW, height: innerH });
      }
    } else if (subLayout === 'strip-4') {
      const cellW = (innerW - 3 * subGapMm) / 4;
      for (let i = 0; i < 4; i++) {
        result.push({ index: i, subKey: `${slot.slotId}__sub__${i}`, x: innerX + i * (cellW + subGapMm), y: innerY, width: cellW, height: innerH });
      }
    } else if (subLayout === 'strip-2') {
      const cellW = (innerW - subGapMm) / 2;
      for (let i = 0; i < 2; i++) {
        result.push({ index: i, subKey: `${slot.slotId}__sub__${i}`, x: innerX + i * (cellW + subGapMm), y: innerY, width: cellW, height: innerH });
      }
    } else if (subLayout === 'grid-2x2') {
      const cellW = (innerW - subGapMm) / 2;
      const cellH = (innerH - subGapMm) / 2;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const idx = r * 2 + c;
          result.push({ index: idx, subKey: `${slot.slotId}__sub__${idx}`, x: innerX + c * (cellW + subGapMm), y: innerY + r * (cellH + subGapMm), width: cellW, height: cellH });
        }
      }
    } else {
      result.push({ index: 0, subKey: slot.slotId, x: innerX, y: innerY, width: innerW, height: innerH });
    }
  } else {
    if (subLayout === 'strip-3') {
      const cellH = (innerH - 2 * subGapMm) / 3;
      for (let i = 0; i < 3; i++) {
        result.push({ index: i, subKey: `${slot.slotId}__sub__${i}`, x: innerX, y: innerY + i * (cellH + subGapMm), width: innerW, height: cellH });
      }
    } else if (subLayout === 'strip-4') {
      const cellH = (innerH - 3 * subGapMm) / 4;
      for (let i = 0; i < 4; i++) {
        result.push({ index: i, subKey: `${slot.slotId}__sub__${i}`, x: innerX, y: innerY + i * (cellH + subGapMm), width: innerW, height: cellH });
      }
    } else if (subLayout === 'strip-2') {
      const cellH = (innerH - subGapMm) / 2;
      for (let i = 0; i < 2; i++) {
        result.push({ index: i, subKey: `${slot.slotId}__sub__${i}`, x: innerX, y: innerY + i * (cellH + subGapMm), width: innerW, height: cellH });
      }
    } else if (subLayout === 'grid-2x2') {
      const cellW = (innerW - subGapMm) / 2;
      const cellH = (innerH - subGapMm) / 2;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const idx = r * 2 + c;
          result.push({ index: idx, subKey: `${slot.slotId}__sub__${idx}`, x: innerX + c * (cellW + subGapMm), y: innerY + r * (cellH + subGapMm), width: cellW, height: cellH });
        }
      }
    } else {
      result.push({ index: 0, subKey: slot.slotId, x: innerX, y: innerY, width: innerW, height: innerH });
    }
  }

  return result;
}

/**
 * Draws patterned festive border on canvas
 */
function drawPatternBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  patternName: string
) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);

  if (patternName === 'caro-red-green' || patternName === 'scotland-red') {
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
  } else if (patternName === 'candy-cane') {
    ctx.strokeStyle = '#ef4444';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.setLineDash([]);
  } else if (patternName === 'snow-dots-red') {
    ctx.fillStyle = '#fee2e2';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  } else if (patternName === 'snow-night-blue') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

/**
 * Draws wrapped multi-line text for slot label on canvas, preventing overflow
 */
function drawWrappedSlotLabel(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  maxHeight: number
) {
  // Normalize text spacing: e.g. "Polaroid trắng(60×90)" -> "Polaroid trắng (60×90)"
  const normalizedText = rawText.replace(/([^\s])\(/g, '$1 (');

  let fontSize = Math.max(9, Math.min(13, Math.round(maxWidth / 7)));
  ctx.font = `600 ${fontSize}px Inter, sans-serif`;

  const words = normalizedText.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // If any line still overflows maxWidth, scale down font
  const maxLineWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
  if (maxLineWidth > maxWidth && fontSize > 8) {
    fontSize = Math.max(8, Math.floor(fontSize * (maxWidth / maxLineWidth)));
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
  }

  const lineHeight = Math.round(fontSize * 1.35);
  const totalHeight = lines.length * lineHeight;
  const startY = centerY - (totalHeight / 2) + (lineHeight / 2);

  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], centerX, startY + i * lineHeight);
  }
}

export interface CutLineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Computes non-destructive guillotine cut line segments for a sheet.
 * Cut lines extend to the sheet boundaries (0 and paperW/paperH) for knife alignment,
 * but NEVER cut through the interior of any placed photo.
 */
export function getSafeCutLineSegments(
  placedPhotos: PlacedPhoto[],
  paperWidth: number,
  paperHeight: number
): CutLineSegment[] {
  const segments: CutLineSegment[] = [];
  const eps = 0.5; // 0.5mm tolerance

  if (!placedPhotos || placedPhotos.length === 0) return segments;

  // 1. HORIZONTAL CUT LINES
  const rawYList = new Set<number>();
  for (const slot of placedPhotos) {
    rawYList.add(Math.round(slot.y * 10) / 10);
    rawYList.add(Math.round((slot.y + slot.height) * 10) / 10);
  }

  for (const y of rawYList) {
    // Find all slots that penetrate this Y (interior obstacle: slot.y + eps < y < slot.y + slot.height - eps)
    const obstacles = placedPhotos.filter(
      s => s.y + eps < y && y < s.y + s.height - eps
    );

    // Find all slots that have an edge touching this Y
    const touchingSlots = placedPhotos.filter(
      s => Math.abs(s.y - y) <= eps || Math.abs(s.y + s.height - y) <= eps
    );
    if (touchingSlots.length === 0) continue;

    // Sort and merge obstacle intervals along X [s.x, s.x + s.width]
    const obstacleIntervals = obstacles
      .map(s => ({ start: s.x, end: s.x + s.width }))
      .sort((a, b) => a.start - b.start);

    const mergedObstacles: { start: number; end: number }[] = [];
    for (const ob of obstacleIntervals) {
      if (mergedObstacles.length === 0) {
        mergedObstacles.push({ ...ob });
      } else {
        const last = mergedObstacles[mergedObstacles.length - 1];
        if (ob.start <= last.end + eps) {
          last.end = Math.max(last.end, ob.end);
        } else {
          mergedObstacles.push({ ...ob });
        }
      }
    }

    // Free intervals along horizontal line Y where a blade can safely cut
    const freeIntervals: { start: number; end: number }[] = [];
    let currentX = 0;
    for (const ob of mergedObstacles) {
      if (ob.start > currentX + eps) {
        freeIntervals.push({ start: currentX, end: ob.start });
      }
      currentX = Math.max(currentX, ob.end);
    }
    if (currentX < paperWidth - eps) {
      freeIntervals.push({ start: currentX, end: paperWidth });
    }

    // Draw cut segments only for free intervals that contain or touch a slot edge
    for (const free of freeIntervals) {
      const hasSlotEdge = touchingSlots.some(
        s => s.x < free.end + eps && s.x + s.width > free.start - eps
      );
      if (hasSlotEdge) {
        segments.push({
          x1: free.start,
          y1: y,
          x2: free.end,
          y2: y
        });
      }
    }
  }

  // 2. VERTICAL CUT LINES
  const rawXList = new Set<number>();
  for (const slot of placedPhotos) {
    rawXList.add(Math.round(slot.x * 10) / 10);
    rawXList.add(Math.round((slot.x + slot.width) * 10) / 10);
  }

  for (const x of rawXList) {
    // Find all slots that penetrate this X (interior obstacle: slot.x + eps < x < slot.x + slot.width - eps)
    const obstacles = placedPhotos.filter(
      s => s.x + eps < x && x < s.x + s.width - eps
    );

    // Find all slots that have an edge touching this X
    const touchingSlots = placedPhotos.filter(
      s => Math.abs(s.x - x) <= eps || Math.abs(s.x + s.width - x) <= eps
    );
    if (touchingSlots.length === 0) continue;

    // Sort and merge obstacle intervals along Y [s.y, s.y + s.height]
    const obstacleIntervals = obstacles
      .map(s => ({ start: s.y, end: s.y + s.height }))
      .sort((a, b) => a.start - b.start);

    const mergedObstacles: { start: number; end: number }[] = [];
    for (const ob of obstacleIntervals) {
      if (mergedObstacles.length === 0) {
        mergedObstacles.push({ ...ob });
      } else {
        const last = mergedObstacles[mergedObstacles.length - 1];
        if (ob.start <= last.end + eps) {
          last.end = Math.max(last.end, ob.end);
        } else {
          mergedObstacles.push({ ...ob });
        }
      }
    }

    // Free intervals along vertical line X where a blade can safely cut
    const freeIntervals: { start: number; end: number }[] = [];
    let currentY = 0;
    for (const ob of mergedObstacles) {
      if (ob.start > currentY + eps) {
        freeIntervals.push({ start: currentY, end: ob.start });
      }
      currentY = Math.max(currentY, ob.end);
    }
    if (currentY < paperHeight - eps) {
      freeIntervals.push({ start: currentY, end: paperHeight });
    }

    // Draw cut segments only for free intervals that contain or touch a slot edge
    for (const free of freeIntervals) {
      const hasSlotEdge = touchingSlots.some(
        s => s.y < free.end + eps && s.y + s.height > free.start - eps
      );
      if (hasSlotEdge) {
        segments.push({
          x1: x,
          y1: free.start,
          x2: x,
          y2: free.end
        });
      }
    }
  }

  return segments;
}

/**
 * Renders a full sheet layout onto an HTML5 Canvas
 */
export function renderSheetToCanvas(
  canvas: HTMLCanvasElement,
  page: SheetLayout,
  paperConfig: PaperConfig,
  layoutConfig: LayoutConfig,
  photosMap: Map<string, PhotoItem>,
  options: RenderOptions,
  onImageLoaded?: () => void
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { scale, showMargins = true, showCutLines = true, selectedSlotId, hoveredSlotId, dragOverSlotId } = options;

  // Set physical pixel dimensions
  const dpr = window.devicePixelRatio || 1;
  const canvasW = Math.round(page.paperWidth * scale);
  const canvasH = Math.round(page.paperHeight * scale);

  canvas.width = canvasW * dpr;
  canvas.height = canvasH * dpr;
  canvas.style.width = `${canvasW}px`;
  canvas.style.height = `${canvasH}px`;

  ctx.save();
  ctx.scale(dpr, dpr);

  // 1. Draw sheet background (pure white paper with subtle outer edge)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // 2. Draw printable area / margins guide
  if (showMargins) {
    const mx = page.printableArea.x * scale;
    const my = page.printableArea.y * scale;
    const mw = page.printableArea.width * scale;
    const mh = page.printableArea.height * scale;

    ctx.save();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)'; // light cyan/blue
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, mw, mh);
    ctx.restore();
  }

  // 3. Draw each placed photo slot
  for (const slot of page.placedPhotos) {
    const slotX = slot.x * scale;
    const slotY = slot.y * scale;
    const slotW = slot.width * scale;
    const slotH = slot.height * scale;

    const isSelected = selectedSlotId === slot.slotId;
    const isHovered = hoveredSlotId === slot.slotId;
    const isDragOver = dragOverSlotId === slot.slotId;

    // Calculate inner photo area based on border style
    let innerX = slotX;
    let innerY = slotY;
    let innerW = slotW;
    let innerH = slotH;

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

    // 1. Draw frame/border background color or pattern
    const slotBgHex = slot.bgHex || layoutConfig.bgHex || (effectiveBorderStyle === 'none' ? 'transparent' : '#ffffff');
    if (slotBgHex !== 'transparent') {
      ctx.fillStyle = slotBgHex;
      ctx.fillRect(slotX, slotY, slotW, slotH);
    }

    if (effectiveBorderStyle === 'polaroid') {
      const topBorderMm = slot.borderTopMm !== undefined 
        ? slot.borderTopMm 
        : (layoutConfig.borderTopMm !== undefined ? layoutConfig.borderTopMm : (layoutConfig.borderWidthMm || 5));
      const sideBorderMm = slot.borderWidthMm !== undefined 
        ? slot.borderWidthMm 
        : (layoutConfig.borderWidthMm || 5);
      const bottomBorderMm = slot.polaroidBottomMm !== undefined 
        ? slot.polaroidBottomMm 
        : (layoutConfig.polaroidBottomMm || 12);

      if (slot.rotated) {
        // Khi xoay ảnh để tiết kiệm giấy: Khung viền và chân đế xoay theo thẻ, bảo toàn 100% kích thước mẫu
        innerX = slotX + topBorderMm * scale;
        innerY = slotY + sideBorderMm * scale;
        innerW = Math.max(10, slotW - (topBorderMm + bottomBorderMm) * scale);
        innerH = Math.max(10, slotH - 2 * sideBorderMm * scale);
      } else {
        innerX = slotX + sideBorderMm * scale;
        innerY = slotY + topBorderMm * scale;
        innerW = Math.max(10, slotW - 2 * sideBorderMm * scale);
        innerH = Math.max(10, slotH - (topBorderMm + bottomBorderMm) * scale);
      }
    } else if (effectiveBorderStyle === 'thin') {
      const sideBorderMm = slot.borderWidthMm !== undefined ? slot.borderWidthMm : 3;
      const topBorderMm = slot.borderTopMm !== undefined ? slot.borderTopMm : sideBorderMm;
      
      if (slot.rotated) {
        innerX = slotX + topBorderMm * scale;
        innerY = slotY + sideBorderMm * scale;
        innerW = Math.max(10, slotW - 2 * topBorderMm * scale);
        innerH = Math.max(10, slotH - 2 * sideBorderMm * scale);
      } else {
        innerX = slotX + sideBorderMm * scale;
        innerY = slotY + topBorderMm * scale;
        innerW = Math.max(10, slotW - 2 * sideBorderMm * scale);
        innerH = Math.max(10, slotH - 2 * topBorderMm * scale);
      }
    } else if (effectiveBorderStyle === 'asymmetric') {
      const leftMm = slot.borderLeftMm !== undefined ? slot.borderLeftMm : (layoutConfig.borderLeftMm !== undefined ? layoutConfig.borderLeftMm : 14);
      const rightMm = slot.borderRightMm !== undefined ? slot.borderRightMm : (layoutConfig.borderRightMm !== undefined ? layoutConfig.borderRightMm : 3);
      const topMm = slot.borderTopMm !== undefined ? slot.borderTopMm : (layoutConfig.borderTopMm !== undefined ? layoutConfig.borderTopMm : 3);
      const bottomMm = slot.borderBottomMm !== undefined ? slot.borderBottomMm : (layoutConfig.borderBottomMm !== undefined ? layoutConfig.borderBottomMm : 3);

      if (slot.rotated) {
        innerX = slotX + topMm * scale;
        innerY = slotY + rightMm * scale;
        innerW = Math.max(10, slotW - (topMm + bottomMm) * scale);
        innerH = Math.max(10, slotH - (leftMm + rightMm) * scale);
      } else {
        innerX = slotX + leftMm * scale;
        innerY = slotY + topMm * scale;
        innerW = Math.max(10, slotW - (leftMm + rightMm) * scale);
        innerH = Math.max(10, slotH - (topMm + bottomMm) * scale);
      }
    } else if (effectiveBorderStyle === 'custom') {
      const pattern = slot.borderPattern || layoutConfig.borderPattern;
      if (pattern) {
        drawPatternBorder(ctx, slotX, slotY, slotW, slotH, pattern);
      }
      const sideBorderMm = slot.borderWidthMm !== undefined ? slot.borderWidthMm : (layoutConfig.borderWidthMm || 4);
      const topBorderMm = slot.borderTopMm !== undefined ? slot.borderTopMm : (layoutConfig.borderTopMm !== undefined ? layoutConfig.borderTopMm : sideBorderMm);
      const bottomBorderMm = slot.polaroidBottomMm !== undefined ? slot.polaroidBottomMm : (slot.borderBottomMm !== undefined ? slot.borderBottomMm : topBorderMm);
      
      if (slot.rotated) {
        innerX = slotX + topBorderMm * scale;
        innerY = slotY + sideBorderMm * scale;
        innerW = Math.max(10, slotW - (topBorderMm + bottomBorderMm) * scale);
        innerH = Math.max(10, slotH - 2 * sideBorderMm * scale);
      } else {
        innerX = slotX + sideBorderMm * scale;
        innerY = slotY + topBorderMm * scale;
        innerW = Math.max(10, slotW - 2 * sideBorderMm * scale);
        innerH = Math.max(10, slotH - (topBorderMm + bottomBorderMm) * scale);
      }
    }

    // Sub-slots calculation (Single vs Photobooth Strips vs Grid 2x2)
    const subCells = getSlotSubCells(slot, layoutConfig);

    // Draw each cell
    for (const cell of subCells) {
      const cellX = cell.x * scale;
      const cellY = cell.y * scale;
      const cellW = cell.width * scale;
      const cellH = cell.height * scale;

      const cellPhotoId = slot.subPhotos?.[cell.index] ?? (cell.index === 0 ? slot.photoId : undefined);
      const photo = cellPhotoId ? photosMap.get(cellPhotoId) : null;

      const isCellSelected = selectedSlotId === cell.subKey || (selectedSlotId === slot.slotId && subCells.length === 1);
      const isCellHovered = hoveredSlotId === cell.subKey;
      const isCellDragOver = dragOverSlotId === cell.subKey || (dragOverSlotId === slot.slotId && cell.index === 0);

      if (photo && photo.url) {
        const img = getCachedImage(photo.url, onImageLoaded);
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.save();
          // Clip to cell
          ctx.beginPath();
          ctx.rect(cellX, cellY, cellW, cellH);
          ctx.clip();

          // Background for fit mode or gaps
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(cellX, cellY, cellW, cellH);

          const imgW = img.naturalWidth;
          const imgH = img.naturalHeight;
          const slotRotationOffset = slot.rotated ? (layoutConfig.rotationHeadDirection === 'right' ? 90 : 270) : 0;
          const totalRotation = ((photo.rotation || 0) + slotRotationOffset) % 360;
          const isFlipped = !!photo.flipHorizontal;
          const cropSettings = photo.cropSettings;
          const effectiveCropMode = cropSettings?.mode || photo.cropMode || layoutConfig.cropMode || 'fill';
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

          ctx.translate(cellX + cellW / 2, cellY + cellH / 2);

          if (isFlipped) {
            ctx.scale(-1, 1);
          }

          if (totalRotation !== 0) {
            ctx.rotate((totalRotation * Math.PI) / 180);
          }

          const isSideways = totalRotation === 90 || totalRotation === 270;
          const localSlotW = isSideways ? cellH : cellW;
          const localSlotH = isSideways ? cellW : cellH;

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
          ctx.restore();
        } else {
          // Placeholder while loading
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(cellX, cellY, cellW, cellH);
        }
      } else {
        // Empty slot / sub-slot placeholder
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(cellX, cellY, cellW, cellH);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(cellX + 0.5, cellY + 0.5, cellW - 1, cellH - 1);

        if (subCells.length > 1) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = `bold ${Math.max(8, Math.round(11 * scale / 3.77))}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`Ảnh #${cell.index + 1}`, cellX + cellW / 2, cellY + cellH / 2);
        } else {
          const label = slot.presetName || `${Math.round(slot.width)}×${Math.round(slot.height)} mm`;
          drawWrappedSlotLabel(
            ctx,
            label,
            cellX + cellW / 2,
            cellY + cellH / 2,
            Math.max(20, cellW - 10),
            Math.max(20, cellH - 10)
          );
        }
      }

      // Highlight selected/hovered/drag-over sub-cell
      if (isCellSelected) {
        ctx.save();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = Math.max(2, Math.round(0.7 * scale));
        ctx.strokeRect(cellX + 0.5, cellY + 0.5, cellW - 1, cellH - 1);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.fillRect(cellX, cellY, cellW, cellH);
        ctx.restore();
      } else if (isCellDragOver) {
        ctx.save();
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = Math.max(2, Math.round(0.7 * scale));
        ctx.strokeRect(cellX + 0.5, cellY + 0.5, cellW - 1, cellH - 1);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
        ctx.fillRect(cellX, cellY, cellW, cellH);
        ctx.restore();
      } else if (isCellHovered) {
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cellX + 0.5, cellY + 0.5, cellW - 1, cellH - 1);
        ctx.restore();
      }
    }

    // Draw Footer Text if present (e.g. for Polaroid or Photobooth strips)
    const footer = slot.footerText || layoutConfig.footerText;
    if (footer) {
      const isDark = ['#18181b', '#111111', '#000000', '#1e293b'].includes((slot.bgHex || layoutConfig.bgHex || '').toLowerCase());
      ctx.save();
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(113, 113, 122, 0.85)';
      ctx.font = `bold ${Math.max(7, Math.round(2.6 * scale))}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (slot.rotated) {
        const footerAreaW = (slotX + slotW) - (innerX + innerW);
        if (footerAreaW >= 5 * scale) {
          ctx.save();
          ctx.translate(innerX + innerW + footerAreaW / 2, slotY + slotH / 2);
          ctx.rotate(Math.PI / 2);
          ctx.fillText(footer, 0, 0);
          ctx.restore();
        }
      } else {
        const footerAreaH = (slotY + slotH) - (innerY + innerH);
        if (footerAreaH >= 5 * scale) {
          ctx.fillText(footer, slotX + slotW / 2, innerY + innerH + footerAreaH / 2);
        }
      }
      ctx.restore();
    }

    // 4. Draw cut lines or crop marks
    if (showCutLines && layoutConfig.cutLineStyle !== 'none') {
      ctx.save();
      const cutStrokeWidth = Math.max(1, Math.round(0.18 * scale));

      if (layoutConfig.cutLineStyle === 'dashed') {
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.65)';
        ctx.setLineDash([Math.max(3, Math.round(2 * scale)), Math.max(2, Math.round(1.5 * scale))]);
        ctx.lineWidth = cutStrokeWidth;
        ctx.strokeRect(slotX, slotY, slotW, slotH);
      } else if (layoutConfig.cutLineStyle === 'solid') {
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.55)';
        ctx.lineWidth = cutStrokeWidth;
        ctx.strokeRect(slotX, slotY, slotW, slotH);
      } else if (layoutConfig.cutLineStyle === 'cropmarks') {
        // Professional crop tick marks extending 3mm outside
        const markLen = 3 * scale;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = Math.max(1, Math.round(0.2 * scale));
        // Top-left
        ctx.beginPath();
        ctx.moveTo(slotX - markLen, slotY); ctx.lineTo(slotX, slotY);
        ctx.moveTo(slotX, slotY - markLen); ctx.lineTo(slotX, slotY);
        // Top-right
        ctx.moveTo(slotX + slotW, slotY); ctx.lineTo(slotX + slotW + markLen, slotY);
        ctx.moveTo(slotX + slotW, slotY - markLen); ctx.lineTo(slotX + slotW, slotY);
        // Bottom-left
        ctx.moveTo(slotX - markLen, slotY + slotH); ctx.lineTo(slotX, slotY + slotH);
        ctx.moveTo(slotX, slotY + slotH); ctx.lineTo(slotX, slotY + slotH + markLen);
        // Bottom-right
        ctx.moveTo(slotX + slotW, slotY + slotH); ctx.lineTo(slotX + slotW + markLen, slotY + slotH);
        ctx.moveTo(slotX + slotW, slotY + slotH); ctx.lineTo(slotX + slotW, slotY + slotH + markLen);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Highlight interactive state
    if (isDragOver) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.fillRect(slotX, slotY, slotW, slotH);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(slotX, slotY, slotW, slotH);
    } else if (isSelected) {
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(slotX - 1, slotY - 1, slotW + 2, slotH + 2);
    } else if (isHovered) {
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(slotX, slotY, slotW, slotH);
    }
  }

  // 6. Draw Full-width Non-destructive Guillotine Cut Lines across the sheet
  if (showCutLines && layoutConfig.cutLineStyle === 'solid') {
    ctx.save();
    const cutLineWidth = Math.max(1, Math.round(0.18 * scale));
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.lineWidth = cutLineWidth;

    const segments = getSafeCutLineSegments(page.placedPhotos, page.paperWidth, page.paperHeight);
    for (const seg of segments) {
      ctx.beginPath();
      ctx.moveTo(Math.round(seg.x1 * scale), Math.round(seg.y1 * scale));
      ctx.lineTo(Math.round(seg.x2 * scale), Math.round(seg.y2 * scale));
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.restore();
}
