import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Project, 
  Customer, 
  PriceSetting, 
  PrinterCalibration, 
  OrderStatus, 
  PhotoItem,
  PaperConfig,
  LayoutConfig,
  PhotoCropSettings,
  PhotoFilterSettings
} from './types';
import { storageManager } from './core/storage/storageManager';
import { computeLayout } from './core/layout/layoutEngine';
import { isSupabaseConfigured } from './core/storage/supabaseClient';
import { getDemoPhotos } from './core/image/samplePhotos';
import { restoreProjectPhotos } from './core/image/imageProcessor';
import { deletePhotoBlob, clearProjectBlobs } from './core/storage/indexedDbStorage';
import { calculateOrderPrice } from './core/pricing/pricingEngine';

// Components
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { EditorTopBar } from './components/layout/EditorTopBar';
import { OrdersDashboard } from './components/orders/OrdersDashboard';
import { NewOrderModal } from './components/wizard/NewOrderModal';
import { InteractiveCanvas } from './components/canvas/InteractiveCanvas';
import type { InteractiveCanvasHandle } from './components/canvas/InteractiveCanvas';
import { PhotoLibrarySidebar } from './components/media/PhotoLibrarySidebar';
import { PrintSettingsAccordion } from './components/settings/PrintSettingsAccordion';
import { TemplateGallery } from './components/templates/TemplateGallery';
import { CustomerCRM } from './components/crm/CustomerCRM';
import { PricingManager } from './components/pricing/PricingManager';
import { SalesAnalytics } from './components/analytics/SalesAnalytics';
import { PrinterCalibrationModal } from './components/calibration/PrinterCalibrationModal';
import { AuthModal } from './components/auth/AuthModal';
import { ExportModal } from './components/export/ExportModal';
import { PhotoCropAdjustModal } from './components/media/PhotoCropAdjustModal';
import { PhotoFilterModal } from './components/media/PhotoFilterModal';
import { CaosDynamicCapsule } from './components/layout/CaosDynamicCapsule';

export function App() {
  // Navigation (mặc định vào giao diện chính Đơn hàng khi mở app hoặc F5)
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Tự động ẩn gọn Sidebar ở tất cả các mục khác, chỉ mở rộng ra khi ở mục Đơn hàng
  useEffect(() => {
    if (activeTab === 'orders') {
      setSidebarCollapsed(false);
    } else {
      setSidebarCollapsed(true);
    }
  }, [activeTab]);

  // App Data
  const [projects, setProjects] = useState<Project[]>(() => {
    const list = storageManager.getProjects();
    if (list.length > 0) return list;

    // Seed default demo project matching the user's uploaded screenshot: "Đơn 20/11 11:40"
    const demoPhotos = getDemoPhotos();
    const paperCfg: PaperConfig = {
      sizeId: 'A4',
      customWidthMm: 210,
      customHeightMm: 297,
      orientation: 'portrait',
      margins: { top: 5, bottom: 5, left: 5, right: 5 },
      printerOffsetX: 0,
      printerOffsetY: 0
    };
    const layoutCfg: LayoutConfig = {
      mode: 'single',
      photoPresetId: 'polaroid-mini',
      customWidthMm: 54,
      customHeightMm: 86,
      lockAspectRatio: true,
      aspectRatio: 54 / 86,
      gapX: 0,
      gapY: 0,
      cropMode: 'fill',
      borderStyle: 'polaroid',
      borderWidthMm: 5,
      polaroidBottomMm: 12,
      cutLineStyle: 'solid', // Đường cắt bệt
      algorithm: 'grid',
      allowRotation: false,
      preserveOrder: true,
      multiSizes: []
    };

    const res = computeLayout(paperCfg, layoutCfg, demoPhotos);
    const initialProject: Project = {
      id: 'demo-order-2011',
      name: 'Đơn 20/11 11:40',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photos: demoPhotos,
      paperConfig: paperCfg,
      layoutConfig: layoutCfg,
      pages: res.pages,
      totalPhotosCount: res.totalSlots
    };

    storageManager.saveProject(initialProject);
    return [initialProject];
  });

  const [activeProject, setActiveProject] = useState<Project | null>(() => {
    return projects[0] || null;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => storageManager.getCustomers());
  const [priceSettings, setPriceSettings] = useState<PriceSetting[]>(() => storageManager.getPriceSettings());
  const [printerCalibration, setPrinterCalibration] = useState<PrinterCalibration>(() => storageManager.getPrinterCalibration());

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [customerForNewOrder, setCustomerForNewOrder] = useState<Customer | null>(null);
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [cropModalPhoto, setCropModalPhoto] = useState<PhotoItem | null>(null);
  const [filterModalPhoto, setFilterModalPhoto] = useState<PhotoItem | null>(null);
  // Mobile: Kho ảnh & Cài đặt bottom sheets
  const [isMobilePhotosOpen, setIsMobilePhotosOpen] = useState(false);
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);

  // Editor specific state
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  
  // Unified zoom scale across EditorTopBar and InteractiveCanvas (2.2 ≈ 100%)
  const [canvasScale, setCanvasScale] = useState(2.2);
  const zoomPercent = Math.round((canvasScale / 2.2) * 100);
  const handleZoomIn = () => setCanvasScale(prev => Math.min(6.0, Math.round((prev + 0.3) * 10) / 10));
  const handleZoomOut = () => setCanvasScale(prev => Math.max(0.8, Math.round((prev - 0.3) * 10) / 10));
  const handleZoomReset = () => setCanvasScale(2.2);

  // All-pages grid view toggle (controlled in App, shared between EditorTopBar & canvas)
  const [showAllPagesView, setShowAllPagesView] = useState(false);

  // Ref to InteractiveCanvas — used for fitToScreen from EditorTopBar
  const canvasRef = useRef<InteractiveCanvasHandle>(null);
  const handleFitToScreen = () => canvasRef.current?.fitToScreen();

  const [saveIndicator, setSaveIndicator] = useState(false);

  // Dynamic price calculation for editor header badge based on tiered pricing and lamination
  const estimatedOrderPrice = useMemo(() => {
    if (!activeProject) return 0;

    const paperFinish = activeProject.paperFinish || activeProject.layoutConfig.paperFinish || 'glossy';
    const lamination = activeProject.lamination || activeProject.layoutConfig.lamination || 'none';

    // If multi mode with configured multiSizes list, sum up each size's tiered price
    if (activeProject.layoutConfig.mode === 'multi' && activeProject.layoutConfig.multiSizes && activeProject.layoutConfig.multiSizes.length > 0) {
      let total = 0;
      for (const m of activeProject.layoutConfig.multiSizes) {
        const itemResult = calculateOrderPrice({
          widthMm: m.widthMm,
          heightMm: m.heightMm,
          quantity: m.count || 1,
          paperFinish,
          lamination,
          nameOrId: m.sizeId || m.name
        });
        total += itemResult.totalPrice;
      }
      return total;
    }

    // Single mode: calculate based on total configured slots on sheets
    const totalSlots = activeProject.pages.reduce((acc, pg) => acc + pg.placedPhotos.length, 0);
    const slotsCount = totalSlots > 0 ? totalSlots : (activeProject.totalPhotosCount || activeProject.photos.length);
    if (slotsCount === 0) return 0;

    // Find matching template customPrice
    const allTemplates = storageManager.getTemplates();
    const matchingTpl = allTemplates.find(t => 
      t.id === activeProject.layoutConfig.photoPresetId?.replace('tpl-', '') ||
      t.name === activeProject.layoutConfig.photoPresetId
    );
    const customOverridePrice = activeProject.layoutConfig.customPrice || matchingTpl?.customPrice;

    const result = calculateOrderPrice({
      widthMm: activeProject.layoutConfig.customWidthMm,
      heightMm: activeProject.layoutConfig.customHeightMm,
      quantity: slotsCount,
      paperFinish,
      lamination,
      nameOrId: activeProject.layoutConfig.photoPresetId,
      subSlotLayout: activeProject.layoutConfig.subSlotLayout,
      customOverridePrice,
      priceTiers: matchingTpl?.priceTiers
    });
    return result.totalPrice;
  }, [activeProject]);

  // Restore photos from IndexedDB if page was reloaded or project was reopened
  useEffect(() => {
    if (activeProject && activeProject.photos.length > 0) {
      restoreProjectPhotos(activeProject.photos).then(restored => {
        const hasChanged = restored.some((p, i) => p.url !== activeProject.photos[i]?.url);
        if (hasChanged) {
          setActiveProject(prev => prev ? { ...prev, photos: restored } : null);
        }
      });
    }
  }, [activeProject?.id]);

  // Undo / Redo history stack
  const [history, setHistory] = useState<Project[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Check Supabase connection state
  const [supabaseConnected, setSupabaseConnected] = useState(() => isSupabaseConfigured());

  // Map of loaded photos for fast canvas lookup
  const photosMap = useMemo(() => {
    const map = new Map<string, PhotoItem>();
    if (activeProject) {
      activeProject.photos.forEach(p => map.set(p.id, p));
    }
    return map;
  }, [activeProject?.photos]);

  // Count how many slots each photo occupies across all pages
  const assignedSlotsCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    if (activeProject) {
      for (const page of activeProject.pages) {
        for (const slot of page.placedPhotos) {
          if (slot.subPhotos && slot.subPhotos.length > 0) {
            for (const pid of slot.subPhotos) {
              if (pid) {
                counts.set(pid, (counts.get(pid) || 0) + 1);
              }
            }
          } else if (slot.photoId) {
            counts.set(slot.photoId, (counts.get(slot.photoId) || 0) + 1);
          }
        }
      }
    }
    return counts;
  }, [activeProject?.pages]);

  // Status counts for topbar
  const statusCounts = useMemo(() => {
    const counts: Record<OrderStatus | 'all', number> = {
      all: projects.length,
      processing: 0,
      new: 0,
      in_progress: 0,
      printed: 0,
      delivered: 0
    };
    projects.forEach(p => {
      if (counts[p.status] !== undefined) counts[p.status]++;
    });
    return counts;
  }, [projects]);

  // Push to undo history
  const pushHistory = (proj: Project) => {
    setHistory(prev => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, JSON.parse(JSON.stringify(proj))];
    });
    setHistoryIndex(prev => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevProj = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setActiveProject(JSON.parse(JSON.stringify(prevProj)));
      storageManager.saveProject(prevProj);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextProj = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setActiveProject(JSON.parse(JSON.stringify(nextProj)));
      storageManager.saveProject(nextProj);
    }
  };

  // Re-calculate layout when project configs change (preserving existing slot assignments)
  const triggerLayoutRecalculation = (
    paperCfg: PaperConfig, 
    layoutCfg: LayoutConfig, 
    _photos: PhotoItem[],
    currentProj: Project
  ) => {
    const paperWithOffset = {
      ...paperCfg,
      printerOffsetX: printerCalibration.offsetX || 0,
      printerOffsetY: printerCalibration.offsetY || 0
    };

    // Snapshot: collect currently assigned slots (by sequential order)
    // Only include slots that HAD a photoId — new empty slots will not be refilled
    const previousAssignments: { slotIndex: number; photoId: string }[] = [];
    let slotGlobalIdx = 0;
    currentProj.pages.forEach(page => {
      page.placedPhotos.forEach(slot => {
        if (slot.photoId) {
          previousAssignments.push({ slotIndex: slotGlobalIdx, photoId: slot.photoId });
        }
        slotGlobalIdx++;
      });
    });
    const prevTotalSlots = slotGlobalIdx; // how many slots existed before

    const result = computeLayout(paperWithOffset, layoutCfg, []);

    // Build a set of "previously filled slot indices" for quick lookup
    // We refill only slot positions that were ALREADY filled in the previous layout
    const prevFilledByIndex = new Map<number, string>();
    previousAssignments.forEach(({ slotIndex, photoId }) => {
      prevFilledByIndex.set(slotIndex, photoId);
    });

    // Map new slots: match by position index — new extra slots beyond prevTotalSlots stay empty
    let newSlotIdx = 0;
    const preservedPages = result.pages.map(page => ({
      ...page,
      placedPhotos: page.placedPhotos.map(slot => {
        const idx = newSlotIdx++;
        // Only restore photo if this slot index was previously filled
        if (idx < prevTotalSlots && prevFilledByIndex.has(idx)) {
          return { ...slot, photoId: prevFilledByIndex.get(idx) };
        }
        // New slots (beyond old count) stay empty — show as demo frames
        return { ...slot, photoId: undefined };
      })
    }));

    const updated: Project = {
      ...currentProj,
      paperConfig: paperWithOffset,
      layoutConfig: layoutCfg,
      photos: currentProj.photos,
      pages: preservedPages,
      totalPhotosCount: result.totalSlots,
      updatedAt: new Date().toISOString()
    };

    setActiveProject(updated);
    storageManager.saveProject(updated);
    setProjects(storageManager.getProjects());
    pushHistory(updated);

    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1500);
  };

  // Quick auto layout button action ("⚡ Dàn nhanh") - packs all library photos into frames
  const handleQuickAutoLayout = () => {
    if (!activeProject || activeProject.photos.length === 0) return;

    const paperWithOffset = {
      ...activeProject.paperConfig,
      printerOffsetX: printerCalibration.offsetX || 0,
      printerOffsetY: printerCalibration.offsetY || 0
    };

    const result = computeLayout(paperWithOffset, activeProject.layoutConfig, activeProject.photos);

    const updated: Project = {
      ...activeProject,
      paperConfig: paperWithOffset,
      pages: result.pages,
      totalPhotosCount: result.totalSlots,
      updatedAt: new Date().toISOString()
    };

    setActiveProject(updated);
    storageManager.saveProject(updated);
    setProjects(storageManager.getProjects());
    pushHistory(updated);

    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1500);
  };

  // Create Project handler
  const handleCreateProject = (project: Project) => {
    storageManager.saveProject(project);
    setProjects(storageManager.getProjects());
    setActiveProject(project);
    setCurrentPageIndex(0);
    setHistory([JSON.parse(JSON.stringify(project))]);
    setHistoryIndex(0);
    setActiveTab('editor');
  };

  // Open Project handler
  const handleOpenProject = (project: Project) => {
    setActiveProject(project);
    setCurrentPageIndex(0);
    setHistory([JSON.parse(JSON.stringify(project))]);
    setHistoryIndex(0);
    setActiveTab('editor');
  };

  // Duplicate Project handler
  const handleDuplicateProject = (id: string) => {
    const copy = storageManager.duplicateProject(id);
    if (copy) {
      setProjects(storageManager.getProjects());
    }
  };

  // Delete Project handler
  const handleDeleteProject = (id: string) => {
    const target = projects.find(p => p.id === id);
    if (target) {
      clearProjectBlobs(target.photos.map(p => p.id));
      target.photos.forEach(p => {
        if (p.url && p.url.startsWith('blob:')) URL.revokeObjectURL(p.url);
      });
    }
    storageManager.deleteProject(id);
    setProjects(storageManager.getProjects());
    if (activeProject?.id === id) {
      setActiveProject(null);
      setActiveTab('orders');
    }
  };

  // Change project status handler
  const handleChangeProjectStatus = (id: string, status: OrderStatus) => {
    const list = storageManager.getProjects();
    const target = list.find(p => p.id === id);
    if (target) {
      target.status = status;
      storageManager.saveProject(target);
      setProjects(storageManager.getProjects());
      if (activeProject?.id === id) {
        setActiveProject({ ...activeProject, status });
      }
    }
  };

  // Add photos to active project photo library WITHOUT auto-placing them into frames
  const handleAddPhotos = (newPhotos: PhotoItem[]) => {
    if (!activeProject) return;
    const combinedPhotos = [...activeProject.photos, ...newPhotos];

    const updated: Project = {
      ...activeProject,
      photos: combinedPhotos,
      updatedAt: new Date().toISOString()
    };

    setActiveProject(updated);
    storageManager.saveProject(updated);
    setProjects(storageManager.getProjects());
    pushHistory(updated);
  };

  // Remove photo from active project & clean up memory
  const handleRemovePhoto = (photoId: string) => {
    if (!activeProject) return;
    const target = activeProject.photos.find(p => p.id === photoId);
    if (target?.url && target.url.startsWith('blob:')) {
      URL.revokeObjectURL(target.url);
    }
    deletePhotoBlob(photoId);

    const remaining = activeProject.photos.filter(p => p.id !== photoId);
    const updatedPages = activeProject.pages.map(page => ({
      ...page,
      placedPhotos: page.placedPhotos.map(slot => {
        if (slot.photoId === photoId) {
          const { photoId: _, ...rest } = slot;
          return rest;
        }
        return slot;
      })
    }));

    const updatedProject = {
      ...activeProject,
      photos: remaining,
      pages: updatedPages
    };

    setActiveProject(updatedProject);
    storageManager.saveProject(updatedProject);
  };

  // Rotate photo 90 degrees
  const handleRotatePhoto = (photoId: string) => {
    if (!activeProject) return;
    const updatedPhotos = activeProject.photos.map(p => {
      if (p.id === photoId) {
        return { ...p, rotation: ((p.rotation || 0) + 90) % 360 };
      }
      return p;
    });

    const updatedProject = {
      ...activeProject,
      photos: updatedPhotos
    };

    setActiveProject(updatedProject);
    storageManager.saveProject(updatedProject);
  };

  // Flip photo horizontally
  const handleFlipPhoto = (photoId: string) => {
    if (!activeProject) return;
    const updatedPhotos = activeProject.photos.map(p => {
      if (p.id === photoId) {
        return { ...p, flipHorizontal: !p.flipHorizontal };
      }
      return p;
    });

    const updatedProject = {
      ...activeProject,
      photos: updatedPhotos
    };

    setActiveProject(updatedProject);
    storageManager.saveProject(updatedProject);
  };

  // Toggle crop mode for photo (fill vs fit)
  const handleToggleCropPhoto = (photoId: string) => {
    if (!activeProject) return;
    const updatedPhotos = activeProject.photos.map(p => {
      if (p.id === photoId) {
        const currentMode = p.cropMode || activeProject.layoutConfig.cropMode || 'fill';
        const nextMode: 'fill' | 'fit' = currentMode === 'fill' ? 'fit' : 'fill';
        return { ...p, cropMode: nextMode };
      }
      return p;
    });

    const updatedProject = {
      ...activeProject,
      photos: updatedPhotos
    };

    setActiveProject(updatedProject);
    storageManager.saveProject(updatedProject);
  };

  // Helper to resolve photo ID from slot identifier (supports baseSlotId or baseSlotId__sub__index)
  const getPhotoIdFromSlotIdentifier = (slotIdentifier: string): string | undefined => {
    if (!activeProject) return undefined;
    const currentPage = activeProject.pages[currentPageIndex] || activeProject.pages[0];
    if (!currentPage) return undefined;
    const isSub = slotIdentifier.includes('__sub__');
    const baseId = isSub ? slotIdentifier.split('__sub__')[0] : slotIdentifier;
    const subIdx = isSub ? parseInt(slotIdentifier.split('__sub__')[1], 10) : null;
    const slot = currentPage.placedPhotos.find(s => s.slotId === baseId);
    if (!slot) return undefined;
    if (subIdx !== null && slot.subPhotos) {
      return slot.subPhotos[subIdx];
    }
    return slot.photoId;
  };

  // Rotate selected photo
  const handleRotateSelectedPhoto = () => {
    if (selectedPhotoId) {
      handleRotatePhoto(selectedPhotoId);
    } else if (selectedSlotId) {
      const pid = getPhotoIdFromSlotIdentifier(selectedSlotId);
      if (pid) handleRotatePhoto(pid);
    }
  };

  // Flip selected photo
  const handleFlipSelectedPhoto = () => {
    if (selectedPhotoId) {
      handleFlipPhoto(selectedPhotoId);
    } else if (selectedSlotId) {
      const pid = getPhotoIdFromSlotIdentifier(selectedSlotId);
      if (pid) handleFlipPhoto(pid);
    }
  };

  // Toggle crop for selected photo
  const handleToggleCropSelectedPhoto = () => {
    if (selectedPhotoId) {
      handleToggleCropPhoto(selectedPhotoId);
    } else if (selectedSlotId) {
      const pid = getPhotoIdFromSlotIdentifier(selectedSlotId);
      if (pid) handleToggleCropPhoto(pid);
    }
  };

  // Rotate photo assigned to slot
  const handleRotatePhotoInSlot = (slotId: string) => {
    const pid = getPhotoIdFromSlotIdentifier(slotId);
    if (pid) handleRotatePhoto(pid);
  };

  // Flip photo assigned to slot
  const handleFlipPhotoInSlot = (slotId: string) => {
    const pid = getPhotoIdFromSlotIdentifier(slotId);
    if (pid) handleFlipPhoto(pid);
  };

  // Toggle crop mode for photo in slot
  const handleToggleCropPhotoInSlot = (slotId: string) => {
    const pid = getPhotoIdFromSlotIdentifier(slotId);
    if (pid) handleToggleCropPhoto(pid);
  };

  // Remove photo from slot (supports sub-slot address)
  const handleRemovePhotoFromSlot = (slotId: string) => {
    if (!activeProject) return;
    const isSub = slotId.includes('__sub__');
    const baseId = isSub ? slotId.split('__sub__')[0] : slotId;
    const subIdx = isSub ? parseInt(slotId.split('__sub__')[1], 10) : null;

    const updatedPages = activeProject.pages.map(page => ({
      ...page,
      placedPhotos: page.placedPhotos.map(slot => {
        if (slot.slotId === baseId) {
          if (subIdx !== null && slot.subPhotos) {
            const nextSub = [...slot.subPhotos];
            nextSub[subIdx] = undefined;
            const firstActive = nextSub.find((id): id is string => !!id);
            const { photoId: _oldPid, ...rest } = slot;
            return {
              ...rest,
              subPhotos: nextSub,
              ...(firstActive ? { photoId: firstActive } : {})
            };
          }
          const { photoId, subPhotos, ...rest } = slot;
          return rest;
        }
        return slot;
      })
    }));

    const updatedProject = {
      ...activeProject,
      pages: updatedPages
    };

    setActiveProject(updatedProject);
    storageManager.saveProject(updatedProject);
  };

  // Save crop settings from modal
  const handleSavePhotoCrop = (photoId: string, cropSettings: PhotoCropSettings, applyToAll?: boolean) => {
    if (!activeProject) return;
    const updatedPhotos = activeProject.photos.map(p => {
      if (p.id === photoId || applyToAll) {
        return { 
          ...p, 
          cropSettings, 
          cropMode: (cropSettings.mode === 'fit' ? 'fit' : 'fill') as 'fit' | 'fill'
        };
      }
      return p;
    });

    const updatedProject = {
      ...activeProject,
      photos: updatedPhotos
    };

    setActiveProject(updatedProject);
    storageManager.saveProject(updatedProject);
  };

  // Save color/filter adjustments from modal
  const handleSavePhotoFilter = (photoId: string, filters: PhotoFilterSettings, applyToAll?: boolean) => {
    if (!activeProject) return;
    const updatedPhotos = activeProject.photos.map(p => {
      if (p.id === photoId || applyToAll) {
        return { ...p, filters };
      }
      return p;
    });

    const updatedProject = {
      ...activeProject,
      photos: updatedPhotos
    };

    setActiveProject(updatedProject);
    storageManager.saveProject(updatedProject);
  };

  // Change copies count for photo
  const handleChangeCopiesCount = (photoId: string, count: number) => {
    if (!activeProject) return;
    const targetCount = Math.max(1, count);
    const updatedPhotos = activeProject.photos.map(p => {
      if (p.id === photoId) {
        return { ...p, copiesCount: targetCount };
      }
      return p;
    });

    let currentAssigned = 0;
    activeProject.pages.forEach(p => p.placedPhotos.forEach(s => {
      if (s.photoId === photoId) currentAssigned++;
    }));

    let updatedPages = activeProject.pages;
    if (targetCount > currentAssigned) {
      let needed = targetCount - currentAssigned;
      updatedPages = updatedPages.map(page => ({
        ...page,
        placedPhotos: page.placedPhotos.map(slot => {
          if (!slot.photoId && needed > 0) {
            needed--;
            return { ...slot, photoId };
          }
          return slot;
        })
      }));
    } else if (targetCount < currentAssigned) {
      let excess = currentAssigned - targetCount;
      updatedPages = updatedPages.map(page => ({
        ...page,
        placedPhotos: [...page.placedPhotos].reverse().map(slot => {
          if (slot.photoId === photoId && excess > 0) {
            excess--;
            const { photoId: _pid, ...rest } = slot;
            return rest;
          }
          return slot;
        }).reverse()
      }));
    }

    const updatedProject = {
      ...activeProject,
      photos: updatedPhotos,
      pages: updatedPages
    };

    setActiveProject(updatedProject);
    storageManager.saveProject(updatedProject);
  };

  // Remove photo from all placed slots on all pages (Bỏ khỏi tờ)
  const handleRemovePhotoFromAllSlots = (photoId: string) => {
    if (!activeProject) return;
    const updatedPages = activeProject.pages.map(page => ({
      ...page,
      placedPhotos: page.placedPhotos.map(slot => {
        if (slot.subPhotos && slot.subPhotos.length > 0) {
          const nextSub = slot.subPhotos.map(id => id === photoId ? undefined : id);
          const firstActive = nextSub.find((id): id is string => !!id);
          const { photoId: _pid, ...rest } = slot;
          return {
            ...rest,
            subPhotos: nextSub,
            ...(firstActive ? { photoId: firstActive } : {})
          };
        } else if (slot.photoId === photoId) {
          const { photoId: _pid, ...rest } = slot;
          return rest;
        }
        return slot;
      })
    }));

    const updatedProject = {
      ...activeProject,
      pages: updatedPages
    };

    setActiveProject(updatedProject);
    storageManager.saveProject(updatedProject);
  };

  // Adjust crop for photo in slot
  const handleAdjustCropInSlot = (slotId: string) => {
    const pid = getPhotoIdFromSlotIdentifier(slotId);
    if (pid && activeProject) {
      const photo = activeProject.photos.find(p => p.id === pid);
      if (photo) setCropModalPhoto(photo);
    }
  };

  // Adjust filter for photo in slot
  const handleAdjustFilterInSlot = (slotId: string) => {
    const pid = getPhotoIdFromSlotIdentifier(slotId);
    if (pid && activeProject) {
      const photo = activeProject.photos.find(p => p.id === pid);
      if (photo) setFilterModalPhoto(photo);
    }
  };

  // Drag and drop photo onto slot (supports sub-slot address: baseSlotId__sub__index)
  const handleDropPhotoOnSlot = (slotIdentifier: string, photoId: string) => {
    if (!activeProject) return;
    const isSub = slotIdentifier.includes('__sub__');
    const baseSlotId = isSub ? slotIdentifier.split('__sub__')[0] : slotIdentifier;
    const subIdx = isSub ? parseInt(slotIdentifier.split('__sub__')[1], 10) : null;

    const updatedPages = activeProject.pages.map(page => ({
      ...page,
      placedPhotos: page.placedPhotos.map(slot => {
        if (slot.slotId === baseSlotId) {
          const subCount = slot.subSlotLayout === 'strip-4' || slot.subSlotLayout === 'grid-2x2' ? 4
            : slot.subSlotLayout === 'strip-3' ? 3
            : slot.subSlotLayout === 'strip-2' ? 2 : 1;

          if (subCount > 1) {
            const subPhotos = [...(slot.subPhotos || [])];
            while (subPhotos.length < subCount) {
              subPhotos.push(undefined);
            }
            const targetIdx = subIdx !== null ? subIdx : subPhotos.findIndex(p => !p);
            const actualIdx = targetIdx >= 0 && targetIdx < subCount ? targetIdx : 0;
            subPhotos[actualIdx] = photoId;
            return {
              ...slot,
              subPhotos,
              photoId: subPhotos[0] || photoId
            };
          } else {
            return { ...slot, photoId };
          }
        }
        return slot;
      })
    }));

    const updated = {
      ...activeProject,
      pages: updatedPages
    };

    setActiveProject(updated);
    storageManager.saveProject(updated);
    pushHistory(updated);
  };

  // Toggle paper orientation
  const handleToggleOrientation = () => {
    if (!activeProject) return;
    const newOrientation = activeProject.paperConfig.orientation === 'portrait' ? 'landscape' : 'portrait';
    triggerLayoutRecalculation(
      { ...activeProject.paperConfig, orientation: newOrientation },
      activeProject.layoutConfig,
      activeProject.photos,
      activeProject
    );
  };

  const currentPage = activeProject?.pages[currentPageIndex] || activeProject?.pages[0];

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-studio-bg font-sans antialiased text-stone-800">
      
      {/* Left Application Slim Sidebar — Desktop only (hidden on mobile) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'calibration') setIsCalibrationModalOpen(true);
        }}
        orderCount={projects.length}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenCalibration={() => setIsCalibrationModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isSupabaseConnected={supabaseConnected}
      />

      {/* Main Work Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Mobile Brand Header — visible only on mobile when on Orders dashboard */}
        {activeTab === 'orders' && (
          <div className="flex md:hidden items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 bg-white border-b border-stone-200/70">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-stone-900 via-stone-800 to-amber-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
                C
              </div>
              <span className="font-extrabold text-stone-900 text-base tracking-tight">Caos</span>
              <span className="text-[9px] bg-stone-900 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-0.5">Print</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tìm đơn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 pl-3 pr-2 py-1.5 bg-stone-100 border border-stone-200 rounded-full text-xs placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:bg-white transition"
              />
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center active:scale-90 transition"
              >
                <span className="text-sm">👤</span>
              </button>
            </div>
          </div>
        )}

        {/* Desktop Top Navigation Bar (when not in Editor) */}
        {activeTab !== 'editor' && (
          <div className="hidden md:block">
            <TopBar
              currentStatusFilter={statusFilter}
              onSelectStatusFilter={setStatusFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              statusCounts={statusCounts}
              isSupabaseConnected={supabaseConnected}
            />
          </div>
        )}

        {/* Mobile status filter chips (visible in orders tab) */}
        {activeTab === 'orders' && (
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto no-scrollbar py-2 px-4 bg-white border-b border-stone-100">
            {[
              { id: 'all' as const, label: 'Tất cả' },
              { id: 'in_progress' as const, label: 'Đang làm' },
              { id: 'printed' as const, label: 'Đã in' },
              { id: 'new' as const, label: 'Mới' },
              { id: 'delivered' as const, label: 'Đã giao' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition active:scale-95 ${
                  statusFilter === tab.id
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab 1: Orders Dashboard */}
        {activeTab === 'orders' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <OrdersDashboard
              projects={projects}
              statusFilter={statusFilter}
              searchQuery={searchQuery}
              onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
              onOpenProject={handleOpenProject}
              onDuplicateProject={handleDuplicateProject}
              onDeleteProject={handleDeleteProject}
              onChangeProjectStatus={handleChangeProjectStatus}
            />
          </div>
        )}

        {/* Tab 2: Studio Layout Editor Workspace (Exact PicDesk 3-Column Layout) */}
        {activeTab === 'editor' && activeProject && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* TopBar matching screenshot */}
            <EditorTopBar
              orderName={activeProject.name}
              onRenameOrder={(newName) => {
                const updated = { ...activeProject, name: newName };
                setActiveProject(updated);
                storageManager.saveProject(updated);
              }}
              orderStatus={activeProject.status}
              onChangeStatus={(st) => handleChangeProjectStatus(activeProject.id, st)}
              customerName={activeProject.customerName}
              customers={customers}
              onSelectCustomer={(cId) => {
                const cust = customers.find(c => c.id === cId);
                const updated = {
                  ...activeProject,
                  customerId: cust?.id,
                  customerName: cust?.name
                };
                setActiveProject(updated);
                storageManager.saveProject(updated);
                setProjects(storageManager.getProjects());
              }}
              onAddNewCustomer={(cust) => {
                storageManager.saveCustomer(cust);
                setCustomers(storageManager.getCustomers());
                const updated = {
                  ...activeProject,
                  customerId: cust.id,
                  customerName: cust.name
                };
                setActiveProject(updated);
                storageManager.saveProject(updated);
                setProjects(storageManager.getProjects());
              }}
              onUnlinkCustomer={() => {
                const updated = {
                  ...activeProject,
                  customerId: undefined,
                  customerName: undefined
                };
                setActiveProject(updated);
                storageManager.saveProject(updated);
                setProjects(storageManager.getProjects());
              }}
              onBackToOrders={() => setActiveTab('orders')}
              currentPageIndex={currentPageIndex}
              totalPages={activeProject.pages.length}
              onPrevPage={() => {
                const idx = Math.max(0, currentPageIndex - 1);
                setCurrentPageIndex(idx);
                const el = document.getElementById('sheet-page-' + idx);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
              }}
              onNextPage={() => {
                const idx = Math.min(activeProject.pages.length - 1, currentPageIndex + 1);
                setCurrentPageIndex(idx);
                const el = document.getElementById('sheet-page-' + idx);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
              }}
              onFitToScreen={handleFitToScreen}
              zoomPercent={zoomPercent}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onZoomReset={handleZoomReset}
              showAllPagesView={showAllPagesView}
              onToggleAllPagesView={() => setShowAllPagesView(v => !v)}
              isLandscape={activeProject.paperConfig.orientation === 'landscape'}
              onToggleOrientation={handleToggleOrientation}
              hasSelectedPhoto={!!selectedPhotoId || !!selectedSlotId}
              onRotateSelectedPhoto={handleRotateSelectedPhoto}
              onFlipSelectedPhoto={handleFlipSelectedPhoto}
              onToggleCropSelectedPhoto={handleToggleCropSelectedPhoto}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              onUndo={handleUndo}
              onRedo={handleRedo}
              saveIndicator={saveIndicator}
              totalPrice={estimatedOrderPrice}
            />

            {/* 3 Columns Editor Body matching PicDesk */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Column 1: Kho ảnh (Left Sidebar 260px - Desktop Only) */}
              <div className="hidden md:flex h-full">
                <PhotoLibrarySidebar
                  photos={activeProject.photos}
                  totalSlotsNeeded={activeProject.totalPhotosCount}
                  onAddPhotos={handleAddPhotos}
                  onRemovePhoto={handleRemovePhoto}
                  onRotatePhoto={handleRotatePhoto}
                  selectedPhotoId={selectedPhotoId}
                  onSelectPhoto={(photoId) => {
                    if (photoId && selectedSlotId) {
                      handleDropPhotoOnSlot(selectedSlotId, photoId);
                      if (selectedSlotId.includes('__sub__')) {
                        const [baseId, idxStr] = selectedSlotId.split('__sub__');
                        const idx = parseInt(idxStr, 10);
                        const currPage = activeProject.pages[currentPageIndex] || activeProject.pages[0];
                        const slot = currPage?.placedPhotos.find(s => s.slotId === baseId);
                        const subCount = slot?.subSlotLayout === 'strip-4' || slot?.subSlotLayout === 'grid-2x2' ? 4
                          : slot?.subSlotLayout === 'strip-3' ? 3
                          : slot?.subSlotLayout === 'strip-2' ? 2 : 1;

                        if (idx + 1 < subCount) {
                          setSelectedSlotId(`${baseId}__sub__${idx + 1}`);
                        } else {
                          setSelectedSlotId(null);
                        }
                      } else {
                        setSelectedSlotId(null);
                      }
                    } else {
                      setSelectedPhotoId(photoId);
                    }
                  }}
                  onAdjustPhotoCrop={(photo) => setCropModalPhoto(photo)}
                  onAdjustPhotoFilter={(photo) => setFilterModalPhoto(photo)}
                  onChangeCopiesCount={handleChangeCopiesCount}
                  onRemoveFromSlots={handleRemovePhotoFromAllSlots}
                  assignedSlotsCountMap={assignedSlotsCountMap}
                  slotDimensionsMm={{
                    width: activeProject.layoutConfig.customWidthMm || 54,
                    height: activeProject.layoutConfig.customHeightMm || 86
                  }}
                  onQuickAutoLayout={handleQuickAutoLayout}
                />
              </div>

              {/* Column 2: Center Interactive Canvas Viewport */}
              <InteractiveCanvas
                ref={canvasRef}
                pages={activeProject.pages}
                currentPageIndex={currentPageIndex}
                onSelectPageIndex={setCurrentPageIndex}
                paperConfig={activeProject.paperConfig}
                layoutConfig={activeProject.layoutConfig}
                photosMap={photosMap}
                selectedSlotId={selectedSlotId}
                onSelectSlot={(slotId) => {
                  if (slotId && selectedPhotoId) {
                    handleDropPhotoOnSlot(slotId, selectedPhotoId);
                    setSelectedPhotoId(null);
                  } else {
                    setSelectedSlotId(slotId);
                  }
                }}
                onDropPhotoOnSlot={handleDropPhotoOnSlot}
                onRotatePhotoInSlot={handleRotatePhotoInSlot}
                onFlipPhotoInSlot={handleFlipPhotoInSlot}
                onToggleCropPhotoInSlot={handleToggleCropPhotoInSlot}
                onAdjustCropInSlot={handleAdjustCropInSlot}
                onAdjustFilterInSlot={handleAdjustFilterInSlot}
                onRemovePhotoFromSlot={handleRemovePhotoFromSlot}
                scale={canvasScale}
                onChangeScale={setCanvasScale}
                showAllPagesView={showAllPagesView}
                onCloseAllPagesView={() => setShowAllPagesView(false)}
              />

              {/* Column 3: Thiết lập in (Right Accordion Panel 320px - Desktop Only) */}
              <div className="hidden md:flex h-full">
                <PrintSettingsAccordion
                  paperConfig={activeProject.paperConfig}
                  layoutConfig={activeProject.layoutConfig}
                  onChangePaperConfig={(cfg) => {
                    triggerLayoutRecalculation(cfg, activeProject.layoutConfig, activeProject.photos, activeProject);
                  }}
                  onChangeLayoutConfig={(cfg) => {
                    triggerLayoutRecalculation(activeProject.paperConfig, cfg, activeProject.photos, activeProject);
                  }}
                  onQuickAutoLayout={handleQuickAutoLayout}
                  photosCount={activeProject.photos.length}
                  totalPages={activeProject.pages.length}
                  wastePercent={currentPage ? currentPage.wastePercent : 0}
                  onOpenExportModal={() => setIsExportModalOpen(true)}
                />
              </div>

            </div>

          </div>
        )}

        {/* Tab 3: Template Gallery */}
        {activeTab === 'templates' && (
          <div className="flex-1 overflow-y-auto pb-[80px] md:pb-0">
            <TemplateGallery
              onCreateProjectFromTemplate={handleCreateProject}
            />
          </div>
        )}

        {/* Tab 4: Customer CRM */}
        {activeTab === 'customers' && (
          <CustomerCRM
            customers={customers}
            onSaveCustomer={(c) => {
              storageManager.saveCustomer(c);
              setCustomers(storageManager.getCustomers());
            }}
            onDeleteCustomer={(id) => {
              storageManager.deleteCustomer(id);
              setCustomers(storageManager.getCustomers());
            }}
            onCreateOrderForCustomer={(cust) => {
              setCustomerForNewOrder(cust);
              setIsNewOrderModalOpen(true);
            }}
          />
        )}

        {/* Tab 5: Pricing Manager */}
        {activeTab === 'pricing' && (
          <PricingManager
            priceSettings={priceSettings}
            onSavePriceSettings={(settings) => {
              storageManager.savePriceSettings(settings);
              setPriceSettings(storageManager.getPriceSettings());
            }}
            onNavigateToTemplates={() => setActiveTab('templates')}
          />
        )}

        {/* Tab 6: Sales Analytics */}
        {activeTab === 'analytics' && (
          <SalesAnalytics
            projects={projects}
            customers={customers}
          />
        )}

      </div>

      {/* ============================================================ */}
      {/* CAOS DYNAMIC CAPSULE — Floating Spatial Navigation (Mobile)   */}
      {/* ============================================================ */}
      <CaosDynamicCapsule
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'calibration') setIsCalibrationModalOpen(true);
        }}
        orderCount={projects.length}
        onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
        inEditorMode={activeTab === 'editor'}
        onBackToOrders={() => setActiveTab('orders')}
        onOpenMobilePhotos={() => setIsMobilePhotosOpen(true)}
        onOpenMobileSettings={() => setIsMobileSettingsOpen(true)}
        onQuickAutoLayout={handleQuickAutoLayout}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        photosCount={activeProject?.photos.length ?? 0}
      />

      {/* Mobile: Kho ảnh Bottom Sheet (Spatial Dark Glass) */}
      {isMobilePhotosOpen && activeProject && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Scrim */}
          <div
            className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm"
            onClick={() => setIsMobilePhotosOpen(false)}
          />
          {/* Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.25)] max-h-[78dvh] flex flex-col overflow-hidden border-t border-stone-200/60">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-stone-300" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 shrink-0 border-b border-stone-100">
              <div>
                <span className="font-bold text-stone-900 text-base">Kho ảnh</span>
                <span className="ml-2 text-xs text-stone-500 font-medium">
                  {activeProject.photos.length} ảnh
                </span>
              </div>
              <button
                onClick={() => setIsMobilePhotosOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center active:scale-90 transition"
              >
                <span className="text-stone-500 text-sm font-bold">✕</span>
              </button>
            </div>
            {/* PhotoLibrarySidebar inside sheet */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <PhotoLibrarySidebar
                photos={activeProject.photos}
                totalSlotsNeeded={activeProject.totalPhotosCount}
                onAddPhotos={handleAddPhotos}
                onRemovePhoto={handleRemovePhoto}
                onRotatePhoto={handleRotatePhoto}
                selectedPhotoId={selectedPhotoId}
                onSelectPhoto={(photoId) => {
                  if (photoId && selectedSlotId) {
                    handleDropPhotoOnSlot(selectedSlotId, photoId);
                    setSelectedSlotId(null);
                  } else {
                    setSelectedPhotoId(photoId);
                  }
                  setIsMobilePhotosOpen(false);
                }}
                onAdjustPhotoCrop={(photo) => { setCropModalPhoto(photo); setIsMobilePhotosOpen(false); }}
                onAdjustPhotoFilter={(photo) => { setFilterModalPhoto(photo); setIsMobilePhotosOpen(false); }}
                onChangeCopiesCount={handleChangeCopiesCount}
                onRemoveFromSlots={handleRemovePhotoFromAllSlots}
                assignedSlotsCountMap={assignedSlotsCountMap}
                slotDimensionsMm={{
                  width: activeProject.layoutConfig.customWidthMm || 54,
                  height: activeProject.layoutConfig.customHeightMm || 86
                }}
                onQuickAutoLayout={() => { handleQuickAutoLayout(); setIsMobilePhotosOpen(false); }}
              />
            </div>
            {/* Safe area spacer */}
            <div className="h-[max(env(safe-area-inset-bottom),12px)] shrink-0" />
          </div>
        </div>
      )}

      {/* Mobile: Thiết lập in Bottom Sheet */}
      {isMobileSettingsOpen && activeProject && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Scrim */}
          <div
            className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm"
            onClick={() => setIsMobileSettingsOpen(false)}
          />
          {/* Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.25)] max-h-[82dvh] flex flex-col overflow-hidden border-t border-stone-200/60">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1 rounded-full bg-stone-300" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 shrink-0 border-b border-stone-100">
              <div>
                <span className="font-bold text-stone-900 text-base">Thiết lập in & Khổ giấy</span>
              </div>
              <button
                onClick={() => setIsMobileSettingsOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center active:scale-90 transition"
              >
                <span className="text-stone-500 text-sm font-bold">✕</span>
              </button>
            </div>
            {/* PrintSettingsAccordion inside sheet */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <PrintSettingsAccordion
                paperConfig={activeProject.paperConfig}
                layoutConfig={activeProject.layoutConfig}
                onChangePaperConfig={(cfg) => {
                  triggerLayoutRecalculation(cfg, activeProject.layoutConfig, activeProject.photos, activeProject);
                }}
                onChangeLayoutConfig={(cfg) => {
                  triggerLayoutRecalculation(activeProject.paperConfig, cfg, activeProject.photos, activeProject);
                }}
                onQuickAutoLayout={() => {
                  handleQuickAutoLayout();
                  setIsMobileSettingsOpen(false);
                }}
                photosCount={activeProject.photos.length}
                totalPages={activeProject.pages.length}
                wastePercent={currentPage ? currentPage.wastePercent : 0}
                onOpenExportModal={() => {
                  setIsMobileSettingsOpen(false);
                  setIsExportModalOpen(true);
                }}
              />
            </div>
            {/* Safe area spacer */}
            <div className="h-[max(env(safe-area-inset-bottom),12px)] shrink-0" />
          </div>
        </div>
      )}

      {/* New Order Wizard Modal */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => {
          setIsNewOrderModalOpen(false);
          setCustomerForNewOrder(null);
        }}
        onCreateProject={handleCreateProject}
        initialCustomer={customerForNewOrder}
      />

      {/* Printer Calibration Modal */}
      <PrinterCalibrationModal
        isOpen={isCalibrationModalOpen}
        onClose={() => setIsCalibrationModalOpen(false)}
        calibration={printerCalibration}
        onSaveCalibration={(calib) => {
          storageManager.savePrinterCalibration(calib);
          setPrinterCalibration(storageManager.getPrinterCalibration());
        }}
      />

      {/* Supabase & Account Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onConfigChanged={() => {
          setSupabaseConnected(isSupabaseConfigured());
        }}
      />

      {/* Export Modal */}
      {activeProject && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          pages={activeProject.pages}
          currentPageIndex={currentPageIndex}
          paperConfig={activeProject.paperConfig}
          layoutConfig={activeProject.layoutConfig}
          photosMap={photosMap}
          projectName={activeProject.name}
        />
      )}

      {/* Photo Crop Adjustment Modal */}
      {cropModalPhoto && (
        <PhotoCropAdjustModal
          photo={cropModalPhoto}
          slotAspect={
            (activeProject?.layoutConfig.customWidthMm || 54) /
            (activeProject?.layoutConfig.customHeightMm || 86)
          }
          onClose={() => setCropModalPhoto(null)}
          onSave={handleSavePhotoCrop}
          onRotate={handleRotatePhoto}
          onFlip={handleFlipPhoto}
        />
      )}

      {/* Photo Color / Filter Adjustment Modal */}
      {filterModalPhoto && (
        <PhotoFilterModal
          photo={filterModalPhoto}
          onClose={() => setFilterModalPhoto(null)}
          onSave={handleSavePhotoFilter}
        />
      )}

    </div>
  );
}

export default App;
