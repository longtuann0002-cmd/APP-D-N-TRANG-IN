import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { 
  RotateCw,
  FlipHorizontal,
  Crop,
  Sparkles,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus
} from 'lucide-react';
import { SheetLayout, PaperConfig, LayoutConfig, PhotoItem, PlacedPhoto } from '../../types';
import { renderSheetToCanvas, getSlotSubCells } from '../../core/canvas/canvasRenderer';

export interface InteractiveCanvasHandle {
  fitToScreen: () => void;
  scrollToPage: (idx: number) => void;
}

interface InteractiveCanvasProps {
  pages: SheetLayout[];
  currentPageIndex: number;
  onSelectPageIndex: (index: number) => void;
  paperConfig: PaperConfig;
  layoutConfig: LayoutConfig;
  photosMap: Map<string, PhotoItem>;
  selectedSlotId: string | null;
  onSelectSlot: (slotId: string | null) => void;
  onDropPhotoOnSlot: (slotId: string, photoId: string) => void;
  onRotatePhotoInSlot: (slotId: string) => void;
  onFlipPhotoInSlot?: (slotId: string) => void;
  onToggleCropPhotoInSlot?: (slotId: string) => void;
  onAdjustCropInSlot?: (slotId: string) => void;
  onAdjustFilterInSlot?: (slotId: string) => void;
  onRemovePhotoFromSlot?: (slotId: string) => void;
  scale?: number;
  onChangeScale?: (newScale: number) => void;
  // Controlled all-pages view from EditorTopBar
  showAllPagesView?: boolean;
  onCloseAllPagesView?: () => void;
  onOpenMobilePhotos?: () => void;
}

interface PageCanvasProps {
  page: SheetLayout;
  pageIndex: number;
  isActive: boolean;
  scale: number;
  paperConfig: PaperConfig;
  layoutConfig: LayoutConfig;
  photosMap: Map<string, PhotoItem>;
  selectedSlotId: string | null;
  hoveredSlotId: string | null;
  dragOverSlotId: string | null;
  onSelectPage: (idx: number) => void;
  onSelectSlot: (slotId: string | null) => void;
  onHoverSlot: (slotId: string | null) => void;
  onDragOverSlot: (slotId: string | null) => void;
  onDropPhoto: (slotId: string, photoId: string) => void;
  onScrollToPage?: (idx: number) => void;
}

const SingleSheetView: React.FC<PageCanvasProps> = ({
  page,
  pageIndex,
  isActive,
  scale,
  paperConfig,
  layoutConfig,
  photosMap,
  selectedSlotId,
  hoveredSlotId,
  dragOverSlotId,
  onSelectPage,
  onSelectSlot,
  onHoverSlot,
  onDragOverSlot,
  onDropPhoto,
  onScrollToPage
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const redraw = useCallback(() => {
    if (!canvasRef.current || !page) return;
    renderSheetToCanvas(
      canvasRef.current,
      page,
      paperConfig,
      layoutConfig,
      photosMap,
      {
        scale,
        showMargins: true,
        showCutLines: true,
        selectedSlotId,
        hoveredSlotId,
        dragOverSlotId
      },
      () => {
        if (canvasRef.current && page) {
          renderSheetToCanvas(
            canvasRef.current,
            page,
            paperConfig,
            layoutConfig,
            photosMap,
            { scale, showMargins: true, showCutLines: true, selectedSlotId, hoveredSlotId, dragOverSlotId }
          );
        }
      }
    );
  }, [page, paperConfig, layoutConfig, photosMap, scale, selectedSlotId, hoveredSlotId, dragOverSlotId]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getSlotAtPoint = (clientX: number, clientY: number): string | null => {
    if (!canvasRef.current || !page) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = (clientX - rect.left) / scale;
    const clickY = (clientY - rect.top) / scale;

    for (const slot of page.placedPhotos) {
      if (
        clickX >= slot.x &&
        clickX <= slot.x + slot.width &&
        clickY >= slot.y &&
        clickY <= slot.y + slot.height
      ) {
        const subCells = getSlotSubCells(slot, layoutConfig);
        if (subCells.length > 1) {
          for (const cell of subCells) {
            if (
              clickX >= cell.x &&
              clickX <= cell.x + cell.width &&
              clickY >= cell.y &&
              clickY <= cell.y + cell.height
            ) {
              return cell.subKey;
            }
          }
          return subCells[0].subKey;
        }
        return slot.slotId;
      }
    }
    return null;
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    onSelectPage(pageIndex);
    const slotId = getSlotAtPoint(e.clientX, e.clientY);
    onSelectSlot(slotId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const slotId = getSlotAtPoint(e.clientX, e.clientY);
    if (slotId !== hoveredSlotId) {
      onHoverSlot(slotId);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const slotId = getSlotAtPoint(e.clientX, e.clientY);
    onDragOverSlot(slotId);
  };

  const handleDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const photoId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/photodesk-photo');
    const slotId = getSlotAtPoint(e.clientX, e.clientY);
    onDragOverSlot(null);

    if (slotId && photoId) {
      onSelectPage(pageIndex);
      onDropPhoto(slotId, photoId);
    }
  };

  return (
    <div 
      id={'sheet-page-' + pageIndex}
      className="flex flex-col items-start shrink-0 select-none transition-all"
    >
      {/* Top Page Badge matching PicDesk screenshot */}
      <div className="mb-2">
        <button
          type="button"
          onClick={() => onSelectPage(pageIndex)}
          className={'px-3 py-1 rounded-full text-xs font-bold transition shadow-xs flex items-center gap-1 ' + (
            isActive 
              ? 'bg-stone-900 text-white' 
              : 'bg-white/95 text-stone-700 border border-stone-200 hover:bg-stone-100'
          )}
        >
          <span>Tờ {pageIndex + 1}</span>
        </button>
      </div>

      {/* Sheet White Paper Container */}
      <div 
        className={'shadow-sheet-lg rounded-xs transition-all duration-100 flex items-center justify-center bg-white border ' + (
          isActive ? 'border-stone-400 ring-2 ring-stone-800/10' : 'border-stone-300'
        )}
      >
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          onTouchEnd={(e) => {
            if (e.changedTouches && e.changedTouches.length > 0) {
              const touch = e.changedTouches[0];
              onSelectPage(pageIndex);
              const slotId = getSlotAtPoint(touch.clientX, touch.clientY);
              onSelectSlot(slotId);
            }
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => onHoverSlot(null)}
          onDragOver={handleDragOver}
          onDragLeave={() => onDragOverSlot(null)}
          onDrop={handleDrop}
          className="cursor-pointer touch-manipulation"
        />
      </div>
    </div>
  );
};

export const InteractiveCanvas = forwardRef<InteractiveCanvasHandle, InteractiveCanvasProps>(({
  pages,
  currentPageIndex,
  onSelectPageIndex,
  paperConfig,
  layoutConfig,
  photosMap,
  selectedSlotId,
  onSelectSlot,
  onDropPhotoOnSlot,
  onRotatePhotoInSlot,
  onFlipPhotoInSlot,
  onToggleCropPhotoInSlot,
  onAdjustCropInSlot,
  onAdjustFilterInSlot,
  onRemovePhotoFromSlot,
  scale: externalScale,
  onChangeScale,
  showAllPagesView: externalShowAllPagesView,
  onCloseAllPagesView,
  onOpenMobilePhotos,
}, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const [internalScale, setInternalScale] = useState<number>(2.0);
  const scale = externalScale !== undefined ? externalScale : internalScale;
  const setScale = useCallback((valOrFn: number | ((prev: number) => number)) => {
    const nextVal = typeof valOrFn === 'function' ? valOrFn(scale) : valOrFn;
    if (onChangeScale) {
      onChangeScale(nextVal);
    } else {
      setInternalScale(nextVal);
    }
  }, [scale, onChangeScale]);

  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  // Ref to always read latest isSpacePressed in event handlers (avoids stale closure)
  const isSpacePressedRef = useRef(false);

  // showAllPagesView is controlled externally via prop
  const showAllPagesView = externalShowAllPagesView ?? false;
  const currentPage = pages[currentPageIndex] || pages[0];

  const scrollToPage = useCallback((idx: number) => {
    onSelectPageIndex(idx);
    const el = document.getElementById('sheet-page-' + idx);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [onSelectPageIndex]);

  const fitToScreen = useCallback(() => {
    if (!containerRef.current || !currentPage) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const isMobile = clientWidth < 768;
    const padding = isMobile ? 24 : 80;
    const availW = Math.max(100, clientWidth - padding);
    const availH = Math.max(100, clientHeight - padding);

    // If 2 or more pages on desktop, fit so at least 1-2 pages can be seen comfortably
    const scaleW = availW / (currentPage.paperWidth * (!isMobile && pages.length > 1 ? 1.6 : 1.0));
    const scaleH = availH / currentPage.paperHeight;
    const idealScale = Math.min(scaleW, scaleH);
    setScale(Math.max(0.6, Math.min(4.0, Math.round(idealScale * 10) / 10)));
  }, [currentPage, pages.length, setScale]);

  // Auto fit on mobile mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      fitToScreen();
    }
  }, [fitToScreen]);

  // Expose fitToScreen and scrollToPage to parent via ref
  useImperativeHandle(ref, () => ({
    fitToScreen,
    scrollToPage,
  }), [fitToScreen, scrollToPage]);

  // Mouse wheel zoom listener (smooth zoom in/out with mouse wheel, Shift+wheel for horizontal scroll)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Shift + Wheel = cuộn ngang
      if (e.shiftKey) {
        if (viewportRef.current) {
          viewportRef.current.scrollLeft += e.deltaY;
        }
        return;
      }

      // Lăn chuột = phóng to / thu nhỏ bàn làm việc
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? -0.15 : 0.15;
      setScale(prev => Math.max(0.6, Math.min(6.0, Math.round((prev + zoomDelta) * 10) / 10)));
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [setScale]);

  // Spacebar tracking for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        isSpacePressedRef.current = true;
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse drag & pan canvas — uses ref (not state) for isSpacePressed to avoid stale closure
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    // Track if we actually panned (moved enough to be a drag, not a click)
    const isPanningRef = { current: false };
    // Track actual scroll change to decide if click should be suppressed
    let scrollChangedSignificantly = false;

    const onMouseDown = (e: MouseEvent) => {
      const isMiddle = e.button === 1;
      const isLeft = e.button === 0;
      const target = e.target as HTMLElement;
      // Only block for interactive UI controls
      const isBlockedControl = !!target.closest('button') || !!target.closest('select') || !!target.closest('input');

      if ((isMiddle || isLeft) && !isBlockedControl) {
        isPanningRef.current = false;
        scrollChangedSignificantly = false;
        panStartRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          scrollLeft: el.scrollLeft,
          scrollTop: el.scrollTop
        };
        if (isMiddle) e.preventDefault();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!panStartRef.current) return;
      const dx = e.clientX - panStartRef.current.startX;
      const dy = e.clientY - panStartRef.current.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Only start panning after moving >12px (less jittery, distinguishes click vs intentional drag)
      if (dist > 12) {
        if (!isPanningRef.current) {
          isPanningRef.current = true;
          setIsPanning(true);
        }
        const prevLeft = el.scrollLeft;
        const prevTop = el.scrollTop;
        el.scrollLeft = panStartRef.current.scrollLeft - dx;
        el.scrollTop = panStartRef.current.scrollTop - dy;
        // Only mark as "real pan" if scroll position actually changed (content is scrollable)
        if (Math.abs(el.scrollLeft - prevLeft) > 1 || Math.abs(el.scrollTop - prevTop) > 1) {
          scrollChangedSignificantly = true;
        }
      }
    };

    const onMouseUp = () => {
      // Only suppress the next click if we ACTUALLY scrolled the viewport (not just moved mouse on fixed content)
      if (isPanningRef.current && scrollChangedSignificantly) {
        const suppressClick = (ce: MouseEvent) => {
          ce.stopPropagation();
          ce.preventDefault();
          window.removeEventListener('click', suppressClick, true);
        };
        window.addEventListener('click', suppressClick, true);
      }
      isPanningRef.current = false;
      scrollChangedSignificantly = false;
      setIsPanning(false);
      panStartRef.current = null;
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []); // no dependencies — reads live values via refs

  // Find currently selected slot in any page (supports sub-slot identifiers: e.g. slot-p0-r0-c0__sub__1)
  let selectedSlot: { slot: PlacedPhoto; pageIdx: number } | null = null;
  const isSubSlot = selectedSlotId ? selectedSlotId.includes('__sub__') : false;
  const baseSlotId = isSubSlot ? selectedSlotId!.split('__sub__')[0] : selectedSlotId;
  const subSlotIndex = isSubSlot ? parseInt(selectedSlotId!.split('__sub__')[1], 10) : null;

  if (baseSlotId) {
    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const found = pages[pIdx].placedPhotos.find(s => s.slotId === baseSlotId);
      if (found) {
        selectedSlot = { slot: found, pageIdx: pIdx };
        break;
      }
    }
  }

  const targetPhotoId = (subSlotIndex !== null && selectedSlot?.slot?.subPhotos)
    ? selectedSlot.slot.subPhotos[subSlotIndex]
    : (selectedSlot?.slot?.photoId ?? selectedSlot?.slot?.subPhotos?.[0]);

  const slotPhoto = targetPhotoId ? photosMap.get(targetPhotoId) : null;
  const currentCrop = slotPhoto?.cropSettings?.mode || slotPhoto?.cropMode || layoutConfig.cropMode || 'fill';

  return (
    <div 
      ref={containerRef} 
      className={`flex-1 h-full bg-stone-100/70 relative flex flex-col justify-between overflow-hidden select-none canvas-grid-pattern ${isPanning ? 'cursor-grabbing' : isSpacePressed ? 'cursor-grab' : ''}`}
    >

      {/* Selected Slot Floating Actions */}
      {selectedSlotId && (
        <div className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 md:gap-2 bg-stone-900/95 text-white px-2.5 md:px-3.5 py-1.5 rounded-2xl shadow-2xl text-xs backdrop-blur-md max-w-[94vw] overflow-x-auto no-scrollbar border border-white/10 animate-in fade-in duration-150">
          <span className="shrink-0 whitespace-nowrap">
            Ô: <strong className="text-amber-400">
              {subSlotIndex !== null ? `Ảnh #${subSlotIndex + 1}` : (selectedSlot?.slot?.presetName || selectedSlot?.slot?.label || 'Khung in')}
            </strong>
            {subSlotIndex !== null && (selectedSlot?.slot?.presetName || selectedSlot?.slot?.label) && (
              <span className="text-stone-400 ml-1">({selectedSlot.slot.presetName || selectedSlot.slot.label})</span>
            )}
          </span>
          
          {slotPhoto ? (
            <>
              <div className="h-3.5 w-px bg-stone-700" />
              
              <button
                onClick={() => onRotatePhotoInSlot(selectedSlotId)}
                className="flex items-center gap-1 px-2 py-0.5 bg-stone-800 hover:bg-stone-700 rounded-lg transition text-[11px]"
                title="Xoay ảnh 90°"
              >
                <RotateCw className="w-3 h-3" />
                <span>Xoay</span>
              </button>

              {onFlipPhotoInSlot && (
                <button
                  onClick={() => onFlipPhotoInSlot(selectedSlotId)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-stone-800 hover:bg-stone-700 rounded-lg transition text-[11px]"
                  title="Lật ảnh ngang"
                >
                  <FlipHorizontal className="w-3 h-3" />
                  <span>Lật</span>
                </button>
              )}

              {onAdjustCropInSlot ? (
                <button
                  onClick={() => onAdjustCropInSlot(selectedSlotId)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-brand-600 hover:bg-brand-500 rounded-lg transition text-[11px] font-semibold"
                  title="Căn chỉnh kích thước & vị trí ảnh trong khung"
                >
                  <Crop className="w-3 h-3" />
                  <span>Căn trong khung</span>
                </button>
              ) : onToggleCropPhotoInSlot && (
                <button
                  onClick={() => onToggleCropPhotoInSlot(selectedSlotId)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-stone-800 hover:bg-stone-700 rounded-lg transition text-[11px]"
                  title="Đổi Fill / Fit"
                >
                  <Crop className="w-3 h-3" />
                  <span>{currentCrop === 'fill' ? 'Phủ đầy' : 'Giữ trọn'}</span>
                </button>
              )}

              {onAdjustFilterInSlot && (
                <button
                  onClick={() => onAdjustFilterInSlot(selectedSlotId)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-stone-800 hover:bg-stone-700 rounded-lg transition text-[11px]"
                  title="Chỉnh màu ảnh"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Chỉnh màu</span>
                </button>
              )}

              {onRemovePhotoFromSlot && (
                <button
                  onClick={() => onRemovePhotoFromSlot(selectedSlotId)}
                  className="flex items-center gap-1 px-2 py-0.5 bg-stone-800 hover:bg-red-900/80 text-stone-300 hover:text-red-200 rounded-lg transition text-[11px]"
                  title="Gỡ ảnh khỏi ô này"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Gỡ</span>
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-stone-300 text-[11px] font-medium">Chưa có ảnh</span>
              {onOpenMobilePhotos && (
                <button
                  type="button"
                  onClick={onOpenMobilePhotos}
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-[11px] shadow-xs active:scale-95 transition"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>Chọn ảnh</span>
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => onSelectSlot(null)}
            className="text-stone-400 hover:text-white ml-1 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Central Viewport Area: Side-by-side continuous scrolling matching PicDesk screenshot */}
      {/* NOTE: viewport uses overflow-auto WITHOUT justify-center to avoid left-overflow lock (flex justify-center clips left side) */}
      <div ref={viewportRef} className="flex-1 w-full overflow-auto p-3 md:p-10 scroll-smooth">
        {!showAllPagesView ? (
          <div className="flex items-start gap-10 min-w-max mx-auto pb-36 md:pb-16">
            {pages.map((page, pIdx) => (
              <SingleSheetView
                key={pIdx}
                page={page}
                pageIndex={pIdx}
                isActive={currentPageIndex === pIdx}
                scale={scale}
                paperConfig={paperConfig}
                layoutConfig={layoutConfig}
                photosMap={photosMap}
                selectedSlotId={selectedSlotId}
                hoveredSlotId={hoveredSlotId}
                dragOverSlotId={dragOverSlotId}
                onSelectPage={onSelectPageIndex}
                onSelectSlot={onSelectSlot}
                onHoverSlot={setHoveredSlotId}
                onDragOverSlot={setDragOverSlotId}
                onDropPhoto={onDropPhotoOnSlot}
              />
            ))}
          </div>
        ) : (
          /* Multi-page Grid View modal */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl overflow-y-auto max-h-[75vh] p-4">
            {pages.map((p, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  scrollToPage(idx);
                  if (onCloseAllPagesView) onCloseAllPagesView();
                }}
                className={'bg-white p-3 rounded-xl border shadow-sm cursor-pointer transition hover:scale-102 ' + (
                  currentPageIndex === idx ? 'border-brand-600 ring-2 ring-brand-500' : 'border-stone-200'
                )}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-2">
                  <span>Trang {idx + 1}</span>
                  <span className="text-[10px] text-stone-400">{p.placedPhotos.length} ô</span>
                </div>
                <div 
                  className="bg-stone-50 border border-stone-200 rounded relative overflow-hidden"
                  style={{
                    width: '100%',
                    aspectRatio: '' + p.paperWidth + ' / ' + p.paperHeight
                  }}
                >
                  {p.placedPhotos.map(s => (
                    <div 
                      key={s.slotId}
                      className="absolute border border-stone-300 bg-stone-200 text-[6px] flex items-center justify-center font-bold text-stone-600"
                      style={{
                        left: '' + ((s.x / p.paperWidth) * 100) + '%',
                        top: '' + ((s.y / p.paperHeight) * 100) + '%',
                        width: '' + ((s.width / p.paperWidth) * 100) + '%',
                        height: '' + ((s.height / p.paperHeight) * 100) + '%'
                      }}
                    >
                      {s.photoId ? '✓' : ''}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Sheet Navigation Pill at bottom center matching PicDesk screenshot (Desktop Only) */}
      <div className="hidden md:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-10 items-center gap-2 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-full shadow-md border border-stone-200/90 text-xs">
        <div className="flex items-center gap-1">
          <button
            disabled={currentPageIndex === 0}
            onClick={() => scrollToPage(currentPageIndex - 1)}
            className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30 rounded-full transition"
            title="Trang trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToPage(idx)}
              className={'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition ' + (
                currentPageIndex === idx
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              )}
            >
              {idx + 1}
            </button>
          ))}

          <button
            disabled={currentPageIndex >= pages.length - 1}
            onClick={() => scrollToPage(currentPageIndex + 1)}
            className="p-1 text-stone-500 hover:text-stone-900 disabled:opacity-30 rounded-full transition"
            title="Trang tiếp"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-3 w-[1px] bg-stone-200 mx-1" />

        {/* Paper info */}
        <span className="text-[11px] text-stone-500 font-medium">
          {paperConfig.sizeId} {currentPage?.paperWidth}x{currentPage?.paperHeight} mm
        </span>
      </div>

      {/* Floating help button at bottom-right (Desktop Only) */}
      <div className="hidden md:block absolute bottom-4 right-4 z-10">
        <button
          className="w-9 h-9 rounded-full bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center shadow-lg transition active:scale-95"
          title="Trợ giúp"
        >
          <span className="text-xs font-bold">?</span>
        </button>
      </div>
    </div>
  );
});

InteractiveCanvas.displayName = 'InteractiveCanvas';