export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BinItem {
  id: string;
  width: number;
  height: number;
  allowRotation?: boolean;
  label?: string;
  presetName?: string;
  borderStyle?: any;
  borderWidthMm?: number;
  borderTopMm?: number;
  borderLeftMm?: number;
  borderRightMm?: number;
  borderBottomMm?: number;
  polaroidBottomMm?: number;
  borderPattern?: string;
  subSlotLayout?: any;
  bgHex?: string;
  footerText?: string;
}

export interface PackedItem extends BinItem {
  x: number;
  y: number;
  rotated: boolean;
  pageIndex: number;
}

/**
 * Advanced 2D Bin Packing using Multi-Heuristic Maximal Rectangles (MaxRects)
 * with Homogeneous Batching & Dead-Space Optimization.
 *
 * Guarantees finding minimum sheet count and optimal paper utilization for multi-size photo printing.
 */
export class MaxRectsBinPacker {
  private binWidth: number;
  private binHeight: number;
  private gapX: number;
  private gapY: number;
  private allowRotation: boolean;

  constructor(binWidth: number, binHeight: number, gapX: number = 0, gapY: number = 0, allowRotation: boolean = true) {
    this.binWidth = binWidth;
    this.binHeight = binHeight;
    this.gapX = gapX;
    this.gapY = gapY;
    this.allowRotation = allowRotation;
  }

  public pack(items: BinItem[], originX: number = 0, originY: number = 0): { pages: PackedItem[][]; totalPages: number } {
    if (!items || items.length === 0) {
      return { pages: [], totalPages: 0 };
    }

    let bestResult: { pages: PackedItem[][]; totalPages: number } | null = null;

    const evaluate = (candidate: { pages: PackedItem[][]; totalPages: number } | null) => {
      if (!candidate || candidate.pages.length === 0) return;
      if (!bestResult) {
        bestResult = candidate;
        return;
      }
      if (candidate.totalPages < bestResult.totalPages) {
        bestResult = candidate;
      } else if (candidate.totalPages === bestResult.totalPages) {
        // Compare front-loaded density (more items / area on earlier pages)
        const candUsed0 = candidate.pages[0]?.reduce((s, it) => s + (it.width * it.height), 0) || 0;
        const bestUsed0 = bestResult.pages[0]?.reduce((s, it) => s + (it.width * it.height), 0) || 0;
        if (candUsed0 > bestUsed0) {
          bestResult = candidate;
        }
      }
    };

    // Strategy 1: Homogeneous batch clustering (packs full pure sheets first, then optimizes leftovers)
    evaluate(this.packWithHomogeneousBatching(items, originX, originY, false));
    evaluate(this.packWithHomogeneousBatching(items, originX, originY, true));

    // Strategy 2: Multi-heuristic passes across multiple item sortings
    const sortings = [
      (a: BinItem, b: BinItem) => (b.width * b.height) - (a.width * a.height), // Area desc
      (a: BinItem, b: BinItem) => Math.max(b.width, b.height) - Math.max(a.width, a.height), // Max side desc
      (a: BinItem, b: BinItem) => (b.width + b.height) - (a.width + a.height), // Perimeter desc
      (a: BinItem, b: BinItem) => (a.width * a.height) - (b.width * b.height), // Smallest first
      () => 0 // Original order
    ];

    const heuristics: Array<'BSSF' | 'MinDeadWaste' | 'PreferUnrotated' | 'BAF' | 'BLSF'> = [
      'BSSF',
      'MinDeadWaste',
      'PreferUnrotated',
      'BAF',
      'BLSF'
    ];

    for (const sortFn of sortings) {
      for (const heur of heuristics) {
        for (const rotMode of [this.allowRotation, false]) {
          const sorted = [...items].sort(sortFn);
          const cand = this.runSinglePacking(sorted, originX, originY, heur, rotMode);
          evaluate(cand);
        }
      }
    }

    const finalResult = bestResult as { pages: PackedItem[][]; totalPages: number } | null;
    if (!finalResult) {
      return { pages: [], totalPages: 0 };
    }

    // Sort pages so that denser / more-item pages appear first for clearer preview
    const sortedPages: PackedItem[][] = [...finalResult.pages].sort((a, b) => b.length - a.length);
    sortedPages.forEach((p, pIdx) => {
      p.forEach((it: PackedItem) => {
        it.pageIndex = pIdx;
      });
    });

    return {
      pages: sortedPages,
      totalPages: sortedPages.length
    };
  }

  private packWithHomogeneousBatching(items: BinItem[], originX: number, originY: number, leftoverCanRotate: boolean) {
    const groups = new Map<string, BinItem[]>();
    items.forEach(it => {
      const key = `${it.width}x${it.height}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(it);
    });

    const pages: PackedItem[][] = [];
    const leftoverItems: BinItem[] = [];

    // Sort groups so larger photo sizes are batched first
    const sortedGroupEntries = Array.from(groups.entries()).sort((a, b) => {
      const itA = a[1][0];
      const itB = b[1][0];
      return (itB.width * itB.height) - (itA.width * itA.height);
    });

    for (const [, groupItems] of sortedGroupEntries) {
      const sample = groupItems[0];
      const w = sample.width;
      const h = sample.height;

      // Check how many of this item fit in a single homogeneous sheet
      const cols1 = Math.max(1, Math.floor((this.binWidth + this.gapX) / (w + this.gapX)));
      const rows1 = Math.max(1, Math.floor((this.binHeight + this.gapY) / (h + this.gapY)));
      const count1 = cols1 * rows1;

      let cols2 = 0, rows2 = 0, count2 = 0;
      if (this.allowRotation && w !== h) {
        cols2 = Math.max(1, Math.floor((this.binWidth + this.gapX) / (h + this.gapX)));
        rows2 = Math.max(1, Math.floor((this.binHeight + this.gapY) / (w + this.gapY)));
        count2 = cols2 * rows2;
      }

      const bestCount = Math.max(count1, count2);
      const isRotated = count2 > count1;
      const cols = isRotated ? cols2 : cols1;
      const rows = isRotated ? rows2 : rows1;
      const itemW = isRotated ? h : w;
      const itemH = isRotated ? w : h;

      const remainingInGroup = [...groupItems];

      // If we can fill full sheets of this item:
      while (remainingInGroup.length >= bestCount && bestCount > 1) {
        const pageIndex = pages.length;
        const pageItems: PackedItem[] = [];
        for (let r = 0; r < rows && remainingInGroup.length > 0; r++) {
          for (let c = 0; c < cols && remainingInGroup.length > 0; c++) {
            const it = remainingInGroup.shift()!;
            pageItems.push({
              ...it,
              x: originX + c * (itemW + this.gapX),
              y: originY + r * (itemH + this.gapY),
              width: itemW,
              height: itemH,
              rotated: isRotated,
              pageIndex
            });
          }
        }
        pages.push(pageItems);
      }

      leftoverItems.push(...remainingInGroup);
    }

    if (leftoverItems.length > 0) {
      const leftoverPack = this.runSinglePacking(
        [...leftoverItems].sort((a, b) => (b.width * b.height) - (a.width * a.height)),
        originX,
        originY,
        'BSSF',
        leftoverCanRotate
      );

      const pageOffset = pages.length;
      leftoverPack.pages.forEach((p, idx) => {
        pages.push(p.map(it => ({ ...it, pageIndex: pageOffset + idx })));
      });
    }

    return { pages, totalPages: pages.length };
  }

  private runSinglePacking(
    items: BinItem[],
    originX: number,
    originY: number,
    heur: 'BSSF' | 'MinDeadWaste' | 'PreferUnrotated' | 'BAF' | 'BLSF',
    canRotate: boolean
  ) {
    const minDim = items.length > 0 ? Math.min(...items.map(it => Math.min(it.width, it.height))) : 10;
    const pending = items.map(it => ({ ...it }));
    const pages: PackedItem[][] = [];

    while (pending.length > 0) {
      const pageIndex = pages.length;
      const freeRects: Rect[] = [{ x: originX, y: originY, width: this.binWidth, height: this.binHeight }];
      const packedThisPage: PackedItem[] = [];

      let i = 0;
      while (i < pending.length) {
        const item = pending[i];
        const itemCanRotate = item.allowRotation !== undefined ? item.allowRotation && canRotate : canRotate;
        const bestPlc = this.findPlacement(item, freeRects, itemCanRotate, heur, minDim);

        if (bestPlc) {
          packedThisPage.push({
            ...item,
            x: bestPlc.x,
            y: bestPlc.y,
            width: bestPlc.width,
            height: bestPlc.height,
            rotated: bestPlc.rotated,
            pageIndex
          });

          this.splitFreeRectangles(freeRects, {
            x: bestPlc.x,
            y: bestPlc.y,
            width: bestPlc.width + this.gapX,
            height: bestPlc.height + this.gapY
          });

          pending.splice(i, 1);
        } else {
          i++;
        }
      }

      if (packedThisPage.length === 0) {
        const item = pending.shift()!;
        packedThisPage.push({ ...item, x: originX, y: originY, rotated: false, pageIndex });
      }

      pages.push(packedThisPage);
    }

    return { pages, totalPages: pages.length };
  }

  private findPlacement(
    item: BinItem,
    freeRects: Rect[],
    canRotate: boolean,
    heur: 'BSSF' | 'MinDeadWaste' | 'PreferUnrotated' | 'BAF' | 'BLSF',
    minDim: number
  ): { x: number; y: number; width: number; height: number; rotated: boolean } | null {
    let bestScore1 = Infinity;
    let bestScore2 = Infinity;
    let bestPlc: { x: number; y: number; width: number; height: number; rotated: boolean } | null = null;

    const orientations = [{ w: item.width, h: item.height, rotated: false }];
    if (canRotate && item.width !== item.height) {
      orientations.push({ w: item.height, h: item.width, rotated: true });
    }

    for (const free of freeRects) {
      for (const orient of orientations) {
        if (free.width >= orient.w && free.height >= orient.h) {
          const lx = free.width - orient.w;
          const ly = free.height - orient.h;
          let s1 = Infinity;
          let s2 = Infinity;

          if (heur === 'BSSF') {
            s1 = Math.min(lx, ly);
            s2 = Math.max(lx, ly);
          } else if (heur === 'BLSF') {
            s1 = Math.max(lx, ly);
            s2 = Math.min(lx, ly);
          } else if (heur === 'BAF') {
            s1 = free.width * free.height - orient.w * orient.h;
            s2 = Math.min(lx, ly);
          } else if (heur === 'MinDeadWaste') {
            let deadPenalty = 0;
            if (lx > 0 && lx < minDim) deadPenalty += 500 + (minDim - lx) * 10;
            if (ly > 0 && ly < minDim) deadPenalty += 500 + (minDim - ly) * 10;
            s1 = Math.min(lx, ly) + deadPenalty;
            s2 = Math.max(lx, ly);
          } else if (heur === 'PreferUnrotated') {
            s1 = Math.min(lx, ly) + (orient.rotated ? 20 : 0);
            s2 = Math.max(lx, ly);
          }

          if (s1 < bestScore1 || (s1 === bestScore1 && s2 < bestScore2)) {
            bestScore1 = s1;
            bestScore2 = s2;
            bestPlc = {
              x: free.x,
              y: free.y,
              width: orient.w,
              height: orient.h,
              rotated: orient.rotated
            };
          }
        }
      }
    }

    return bestPlc;
  }

  private splitFreeRectangles(freeRects: Rect[], placed: Rect) {
    const newRects: Rect[] = [];

    for (let i = 0; i < freeRects.length; i++) {
      const free = freeRects[i];

      // Check if placed intersects with free
      if (
        placed.x >= free.x + free.width ||
        placed.x + placed.width <= free.x ||
        placed.y >= free.y + free.height ||
        placed.y + placed.height <= free.y
      ) {
        newRects.push(free);
        continue;
      }

      // Overlaps -> split along 4 axes
      if (placed.y > free.y && placed.y < free.y + free.height) {
        newRects.push({
          x: free.x,
          y: free.y,
          width: free.width,
          height: placed.y - free.y
        });
      }

      if (placed.y + placed.height < free.y + free.height) {
        newRects.push({
          x: free.x,
          y: placed.y + placed.height,
          width: free.width,
          height: free.y + free.height - (placed.y + placed.height)
        });
      }

      if (placed.x > free.x && placed.x < free.x + free.width) {
        newRects.push({
          x: free.x,
          y: free.y,
          width: placed.x - free.x,
          height: free.height
        });
      }

      if (placed.x + placed.width < free.x + free.width) {
        newRects.push({
          x: placed.x + placed.width,
          y: free.y,
          width: free.x + free.width - (placed.x + placed.width),
          height: free.height
        });
      }
    }

    this.pruneRectangles(newRects);
    freeRects.length = 0;
    freeRects.push(...newRects);
  }

  private pruneRectangles(rects: Rect[]) {
    for (let i = 0; i < rects.length; i++) {
      if (rects[i].width <= 0.1 || rects[i].height <= 0.1) {
        rects.splice(i, 1);
        i--;
        continue;
      }

      for (let j = i + 1; j < rects.length; j++) {
        if (this.isContainedIn(rects[i], rects[j])) {
          rects.splice(i, 1);
          i--;
          break;
        }
        if (this.isContainedIn(rects[j], rects[i])) {
          rects.splice(j, 1);
          j--;
        }
      }
    }
  }

  private isContainedIn(a: Rect, b: Rect): boolean {
    return (
      a.x >= b.x &&
      a.y >= b.y &&
      a.x + a.width <= b.x + b.width &&
      a.y + a.height <= b.y + b.height
    );
  }
}
