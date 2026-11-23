export type PaperSizeId = 'A3' | 'A4' | 'A5' | '10x15' | '13x18' | '15x20' | '20x30' | 'custom';

export interface PaperDimensions {
  widthMm: number;
  heightMm: number;
}

export type PaperOrientation = 'portrait' | 'landscape' | 'auto';

export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PaperConfig {
  sizeId: PaperSizeId;
  customWidthMm: number;
  customHeightMm: number;
  orientation: PaperOrientation;
  margins: Margins;
  printerOffsetX: number;
  printerOffsetY: number;
}

export type PaperFinishType = 'glossy' | 'silk'; // Giấy bóng | Giấy lụa
export type LaminationType = 'none' | 'plastic_matte' | 'glitter'; // Không cán | Ép plastic bóng/mờ | Kim tuyến

export interface PriceTier {
  minQty: number;
  maxQty?: number; // undefined = vô cực
  unitPrice: number;
}

export type PhotoPresetId = 
  | '2x3' 
  | '3x4' 
  | '4x6' 
  | '5x7' 
  | '6x9' 
  | '5.5x8.5'
  | '7.5x10'
  | '8.6x10.8'
  | '9x13' 
  | '10x15' 
  | '13x18' 
  | '15x21'
  | '5x15'
  | 'polaroid-mini'
  | 'polaroid-square'
  | 'custom';

export interface PhotoSizePreset {
  id: PhotoPresetId | string;
  name: string;
  widthMm: number;
  heightMm: number;
  category?: 'standard' | 'polaroid' | 'id_card';
  badge?: string;
}

export interface MultiSizeDemand {
  id: string;
  sizeId: string;
  name: string;
  widthMm: number;
  heightMm: number;
  count: number;
  borderStyle?: BorderStyle;
  borderWidthMm?: number;
  borderTopMm?: number;
  borderLeftMm?: number;
  borderRightMm?: number;
  borderBottomMm?: number;
  polaroidBottomMm?: number;
  borderPattern?: string;
  allowRotation?: boolean;
  subSlotLayout?: SubSlotLayout;
  bgHex?: string;
  customPrice?: number;
  footerText?: string;
  paperFinish?: PaperFinishType;
  lamination?: LaminationType;
}

export type CropMode = 'fit' | 'fill';
export type BorderStyle = 'none' | 'thin' | 'polaroid' | 'custom' | 'asymmetric';
export type SubSlotLayout = 'single' | 'strip-2' | 'strip-3' | 'strip-4' | 'grid-2x2';
export type CutLineStyle = 'none' | 'solid' | 'dashed' | 'cropmarks';
export type LayoutAlgorithm = 'grid' | 'optimal-maxrects';

export interface LayoutConfig {
  mode: 'single' | 'multi';
  photoPresetId: string;
  customWidthMm: number;
  customHeightMm: number;
  lockAspectRatio: boolean;
  aspectRatio: number;
  gapX: number; // mm
  gapY: number; // mm
  cropMode: CropMode;
  borderStyle: BorderStyle;
  borderWidthMm: number;
  borderTopMm?: number;
  borderLeftMm?: number;
  borderRightMm?: number;
  borderBottomMm?: number;
  polaroidBottomMm: number;
  cutLineStyle: CutLineStyle;
  algorithm: LayoutAlgorithm;
  allowRotation: boolean;
  preserveOrder: boolean;
  multiSizes: MultiSizeDemand[];
  borderPattern?: string;
  rotationHeadDirection?: 'left' | 'right';
  subSlotLayout?: SubSlotLayout;
  bgHex?: string;
  customPrice?: number;
  footerText?: string;
  paperFinish?: PaperFinishType;
  lamination?: LaminationType;
}

export interface PhotoCropSettings {
  mode?: 'fit' | 'fill' | 'custom';
  scale?: number; // 1.0 = 100%, 0.5 to 3.0
  offsetX?: number; // percentage (-50% to +50%)
  offsetY?: number; // percentage (-50% to +50%)
  align?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

export interface PhotoFilterSettings {
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  preset?: 'none' | 'bw' | 'vintage' | 'warm' | 'cool';
}

export interface PhotoItem {
  id: string;
  file?: File;
  url: string;
  originalName: string;
  widthPx: number;
  heightPx: number;
  aspect: number;
  rotation: number; // 0, 90, 180, 270
  flipHorizontal?: boolean;
  cropMode?: 'fit' | 'fill';
  cropSettings?: PhotoCropSettings;
  filters?: PhotoFilterSettings;
  copiesCount?: number;
  sizeBytes?: number;
  status: 'ready' | 'loading' | 'error';
  targetSlotId?: string;
}

export interface PlacedPhoto {
  slotId: string;
  photoId?: string; // photo mapped to this slot
  x: number; // mm from sheet top-left
  y: number; // mm from sheet top-left
  width: number; // mm
  height: number; // mm
  rotated: boolean;
  pageIndex: number;
  label?: string;
  presetName?: string;
  borderStyle?: BorderStyle;
  borderWidthMm?: number;
  borderTopMm?: number;
  borderLeftMm?: number;
  borderRightMm?: number;
  borderBottomMm?: number;
  polaroidBottomMm?: number;
  borderPattern?: string;
  subSlotLayout?: SubSlotLayout;
  bgHex?: string;
  customPrice?: number;
  footerText?: string;
  subPhotos?: (string | undefined)[];
}

export interface SheetLayout {
  pageIndex: number;
  paperWidth: number; // effective mm
  paperHeight: number; // effective mm
  placedPhotos: PlacedPhoto[];
  wastePercent: number;
  photoPercent: number;
  printableArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type OrderStatus = 'processing' | 'new' | 'in_progress' | 'printed' | 'delivered';

export interface Project {
  id: string;
  name: string;
  customerId?: string;
  customerName?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  photos: PhotoItem[];
  paperConfig: PaperConfig;
  layoutConfig: LayoutConfig;
  pages: SheetLayout[];
  totalPhotosCount: number;
  notes?: string;
  paperFinish?: PaperFinishType;
  lamination?: LaminationType;
  manualOverrides?: Record<string, { x: number; y: number; pageIndex: number }>;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  socialLink?: string;
  notes?: string;
  totalOrders: number;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PriceSetting {
  id: string;
  name: string;
  sizeName: string;
  widthMm: number;
  heightMm: number;
  unitPrice: number; // VND
  laminationPrice: number; // VND
  priceTiers?: PriceTier[];
}

export interface PrinterCalibration {
  id: string;
  printerName: string;
  unprintableMarginMm: number;
  offsetX: number; // mm (positive: shift right)
  offsetY: number; // mm (positive: shift down)
  testPaperSize: string;
  lastUpdated: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  description: string;
  photoSize: { widthMm: number; heightMm: number };
  borderStyle: BorderStyle;
  borderWidthMm?: number;
  borderTopMm?: number;
  borderLeftMm?: number;
  borderRightMm?: number;
  borderBottomMm?: number;
  polaroidBottomMm?: number;
  subSlotLayout?: SubSlotLayout;
  bgHex?: string;
  footerText?: string;
  customPrice?: number; // VND per photo
  customFrameImage?: string; // base64 or URL
  isCustom?: boolean;
  isPro: boolean;
  category: 'all' | 'free' | 'seasonal' | 'polaroid' | 'photobooth';
  borderPattern?: string;
  laminationPrice?: number;
  priceTiers?: PriceTier[];
}
