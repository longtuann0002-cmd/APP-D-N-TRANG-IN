import { PaperSizeId, PaperDimensions, PhotoSizePreset, TemplateItem, PriceSetting } from '../types';

export const PAPER_PRESETS: Record<PaperSizeId, { name: string; dimensions: PaperDimensions; popular?: boolean }> = {
  'A4': {
    name: 'A4',
    dimensions: { widthMm: 210, heightMm: 297 },
    popular: true
  },
  'A3': {
    name: 'A3',
    dimensions: { widthMm: 297, heightMm: 420 }
  },
  'A5': {
    name: 'A5',
    dimensions: { widthMm: 148, heightMm: 210 },
    popular: true
  },
  '10x15': {
    name: '10x15 cm (4x6")',
    dimensions: { widthMm: 100, heightMm: 150 },
    popular: true
  },
  '13x18': {
    name: '13x18 cm (5x7")',
    dimensions: { widthMm: 130, heightMm: 180 }
  },
  '15x20': {
    name: '15x20 cm (6x8")',
    dimensions: { widthMm: 150, heightMm: 200 }
  },
  '20x30': {
    name: '20x30 cm (8x12")',
    dimensions: { widthMm: 200, heightMm: 300 }
  },
  'custom': {
    name: 'Khổ tùy chỉnh',
    dimensions: { widthMm: 210, heightMm: 297 }
  }
};

export const PHOTO_SIZE_PRESETS: PhotoSizePreset[] = [
  { id: '6x9', name: '6×9 cm', widthMm: 60, heightMm: 90, category: 'standard', badge: 'Từ 1.8k' },
  { id: '5.5x8.5', name: '5.5×8.5 cm (Polaroid mini)', widthMm: 55, heightMm: 85, category: 'polaroid', badge: 'Trending' },
  { id: '5x7', name: '5×7 cm', widthMm: 50, heightMm: 70, category: 'standard', badge: 'Từ 1.3k' },
  { id: '7.5x10', name: '7.5×10 cm', widthMm: 75, heightMm: 100, category: 'standard', badge: 'Từ 2.5k' },
  { id: '8.6x10.8', name: '8.6×10.8 cm (Polaroid Square)', widthMm: 86, heightMm: 108, category: 'polaroid', badge: 'Từ 2.8k' },
  { id: '10x15', name: '10×15 cm (4×6")', widthMm: 100, heightMm: 150, category: 'standard', badge: 'Từ 4k' },
  { id: '13x18', name: '13×18 cm (5×7")', widthMm: 130, heightMm: 180, category: 'standard', badge: 'Từ 9k' },
  { id: '15x21', name: '15×21 cm (A5)', widthMm: 150, heightMm: 210, category: 'standard', badge: 'Từ 11k' },
  { id: '5x15', name: 'Photoscript 5×15 (3-4 ảnh)', widthMm: 50, heightMm: 150, category: 'standard', badge: 'Từ 1.3k' },
  { id: '10x15-strip', name: 'Photoscript 10×15 (4-6 ảnh)', widthMm: 100, heightMm: 150, category: 'standard', badge: 'Từ 2.8k' },
  { id: '3x4', name: 'Thẻ 3×4', widthMm: 30, heightMm: 40, category: 'id_card', badge: 'Ảnh thẻ' },
  { id: '4x6', name: 'Thẻ 4×6', widthMm: 40, heightMm: 60, category: 'id_card', badge: 'Hộ chiếu' },
];

export const TEMPLATES_DATA: TemplateItem[] = [
  {
    id: 'polaroid-classic',
    name: 'Polaroid trắng',
    description: 'Viền trắng cổ điển 54×86mm, chân đáy 12mm viết ghi chú',
    photoSize: { widthMm: 54, heightMm: 86 },
    borderStyle: 'polaroid',
    borderWidthMm: 5,
    borderTopMm: 5,
    polaroidBottomMm: 12,
    subSlotLayout: 'single',
    customPrice: 2000,
    laminationPrice: 1000,
    isPro: false,
    category: 'polaroid',
    bgHex: '#ffffff'
  },
  {
    id: 'polaroid-black',
    name: 'Polaroid đen huyền bí',
    description: 'Viền đen sang trọng huyền ảo, chân dày 12mm',
    photoSize: { widthMm: 54, heightMm: 86 },
    borderStyle: 'polaroid',
    borderWidthMm: 5,
    borderTopMm: 5,
    polaroidBottomMm: 12,
    subSlotLayout: 'single',
    customPrice: 2000,
    laminationPrice: 1000,
    isPro: false,
    category: 'polaroid',
    bgHex: '#18181b'
  },
  {
    id: 'thin-border',
    name: 'Viền mỏng 3mm',
    description: 'Viền trắng 3mm đều 4 cạnh tạo cảm giác nhẹ nhàng tinh tế',
    photoSize: { widthMm: 60, heightMm: 90 },
    borderStyle: 'thin',
    borderWidthMm: 3,
    borderTopMm: 3,
    polaroidBottomMm: 0,
    subSlotLayout: 'single',
    customPrice: 2000,
    laminationPrice: 1000,
    isPro: false,
    category: 'free',
    bgHex: '#ffffff'
  },
  {
    id: 'no-border',
    name: 'Không viền (Full bleed)',
    description: 'Ảnh tràn 4 cạnh 100%, in sắc nét không lề trắng',
    photoSize: { widthMm: 60, heightMm: 90 },
    borderStyle: 'none',
    borderWidthMm: 0,
    borderTopMm: 0,
    polaroidBottomMm: 0,
    subSlotLayout: 'single',
    customPrice: 2000,
    laminationPrice: 1000,
    isPro: false,
    category: 'free'
  },
  {
    id: 'asymmetric-notebook',
    name: 'Viền 1 cạnh (Lề sổ tay)',
    description: 'Lề trái rộng 14mm đóng ghim / xỏ lò xo, 3 cạnh mỏng 3mm',
    photoSize: { widthMm: 60, heightMm: 90 },
    borderStyle: 'asymmetric',
    borderLeftMm: 14,
    borderRightMm: 3,
    borderTopMm: 3,
    borderBottomMm: 3,
    subSlotLayout: 'single',
    customPrice: 2000,
    laminationPrice: 1000,
    isPro: false,
    category: 'free',
    bgHex: '#fefefe'
  },
  {
    id: 'photobooth-3strip',
    name: 'Photobooth 3 ảnh dọc',
    description: 'Dải 3 ảnh dọc kèm chân logo sự kiện, kích thước 50×150mm',
    photoSize: { widthMm: 50, heightMm: 150 },
    borderStyle: 'polaroid',
    borderWidthMm: 3,
    borderTopMm: 3,
    polaroidBottomMm: 15,
    subSlotLayout: 'strip-3',
    customPrice: 2500,
    laminationPrice: 1000,
    isPro: false,
    category: 'photobooth',
    bgHex: '#ffffff'
  },
  {
    id: 'photobooth-4strip',
    name: 'Photobooth 4 ảnh Hàn Quốc',
    description: 'Dải 4 ảnh dọc chuẩn Life4Cuts nền đen, kích thước 50×150mm',
    photoSize: { widthMm: 50, heightMm: 150 },
    borderStyle: 'polaroid',
    borderWidthMm: 3,
    borderTopMm: 3,
    polaroidBottomMm: 16,
    subSlotLayout: 'strip-4',
    customPrice: 3000,
    laminationPrice: 1000,
    isPro: false,
    category: 'photobooth',
    bgHex: '#18181b'
  },
  {
    id: 'photobooth-grid2x2',
    name: 'Lưới Photobooth 2×2 Pastel',
    description: 'Khung 4 ảnh vuông dạng lưới 2 hàng 2 cột, kích thước 60×90mm',
    photoSize: { widthMm: 60, heightMm: 90 },
    borderStyle: 'polaroid',
    borderWidthMm: 3,
    borderTopMm: 3,
    polaroidBottomMm: 10,
    subSlotLayout: 'grid-2x2',
    customPrice: 2500,
    laminationPrice: 1000,
    isPro: false,
    category: 'photobooth',
    bgHex: '#fce7f3'
  },
  {
    id: 'polaroid-square-8x10',
    name: 'Polaroid Square 8.6×10.8',
    description: 'Khổ vuông lớn chuẩn Polaroid Square, chân dày 14mm',
    photoSize: { widthMm: 86, heightMm: 108 },
    borderStyle: 'polaroid',
    borderWidthMm: 5,
    borderTopMm: 5,
    polaroidBottomMm: 14,
    subSlotLayout: 'single',
    customPrice: 3000,
    laminationPrice: 1000,
    isPro: false,
    category: 'polaroid',
    bgHex: '#ffffff'
  },
  {
    id: 'print-10x15',
    name: 'Ảnh 10×15 cm (4×6")',
    description: 'Khổ ảnh tiêu chuẩn album gia đình, sắc nét',
    photoSize: { widthMm: 100, heightMm: 150 },
    borderStyle: 'none',
    subSlotLayout: 'single',
    customPrice: 5000,
    laminationPrice: 1000,
    isPro: false,
    category: 'free'
  },
  {
    id: 'print-13x18',
    name: 'Ảnh 13×18 cm (5×7")',
    description: 'Khổ ảnh để bàn lồng khung kính sang trọng',
    photoSize: { widthMm: 130, heightMm: 180 },
    borderStyle: 'none',
    subSlotLayout: 'single',
    customPrice: 10000,
    laminationPrice: 1500,
    isPro: false,
    category: 'free'
  },
  {
    id: 'print-15x21',
    name: 'Ảnh 15×21 cm (A5)',
    description: 'Khổ ảnh lớn kỷ yếu / phong cảnh / ảnh tiệc',
    photoSize: { widthMm: 150, heightMm: 210 },
    borderStyle: 'none',
    subSlotLayout: 'single',
    customPrice: 12000,
    laminationPrice: 2000,
    isPro: false,
    category: 'free'
  },
  {
    id: 'print-5x7',
    name: 'Ảnh mini 5×7 cm',
    description: 'Khổ mini bỏ ví hoặc ốp lưng điện thoại',
    photoSize: { widthMm: 50, heightMm: 70 },
    borderStyle: 'none',
    subSlotLayout: 'single',
    customPrice: 2000,
    laminationPrice: 1000,
    isPro: false,
    category: 'free'
  },
  {
    id: 'photoscript-10x15',
    name: 'Photoscript 10×15 (4-6 ảnh)',
    description: 'Khung lưới 4 đến 6 ảnh dạng photobooth cỡ lớn 100×150mm',
    photoSize: { widthMm: 100, heightMm: 150 },
    borderStyle: 'polaroid',
    borderWidthMm: 4,
    borderTopMm: 4,
    polaroidBottomMm: 14,
    subSlotLayout: 'grid-2x2',
    customPrice: 4000,
    laminationPrice: 1000,
    isPro: false,
    category: 'photobooth',
    bgHex: '#ffffff'
  },
  {
    id: 'caro-red-green',
    name: 'Ca rô thoi đỏ xanh',
    description: 'Họa tiết caro lễ hội ấm áp',
    photoSize: { widthMm: 60, heightMm: 90 },
    borderStyle: 'custom',
    customPrice: 2000,
    laminationPrice: 1000,
    isPro: false,
    category: 'seasonal',
    borderPattern: 'caro-red-green'
  },
  {
    id: 'scotland-red',
    name: 'Kẻ Scotland đỏ',
    description: 'Kẻ sọc caro phong cách Scotland cổ điển',
    photoSize: { widthMm: 60, heightMm: 90 },
    borderStyle: 'custom',
    customPrice: 2000,
    laminationPrice: 1000,
    isPro: false,
    category: 'seasonal',
    borderPattern: 'scotland-red'
  },
  {
    id: 'scotland-pine',
    name: 'Kẻ Scotland xanh thông',
    description: 'Sọc xanh thông tuyết mùa đông',
    photoSize: { widthMm: 60, heightMm: 90 },
    borderStyle: 'custom',
    customPrice: 2000,
    laminationPrice: 1000,
    isPro: false,
    category: 'seasonal',
    borderPattern: 'scotland-pine'
  },
  {
    id: 'candy-cane',
    name: 'Sọc kẹo gậy chéo',
    description: 'Sọc kẹo xoắn đỏ trắng Giáng sinh',
    photoSize: { widthMm: 60, heightMm: 90 },
    borderStyle: 'custom',
    customPrice: 2000,
    laminationPrice: 1000,
    isPro: false,
    category: 'seasonal',
    borderPattern: 'candy-cane'
  },
  {
    id: 'snow-dots-red',
    name: 'Chấm bi trắng nền đỏ',
    description: 'Chấm tuyết nhỏ xinh xắn nổi bật',
    photoSize: { widthMm: 60, heightMm: 90 },
    borderStyle: 'custom',
    customPrice: 2000,
    laminationPrice: 1000,
    isPro: false,
    category: 'seasonal',
    borderPattern: 'snow-dots-red'
  },
  {
    id: 'snow-night-blue',
    name: 'Tuyết rơi đêm xanh',
    description: 'Nền xanh navy sâu thẳm điểm xuyết bông tuyết',
    photoSize: { widthMm: 60, heightMm: 90 },
    borderStyle: 'custom',
    customPrice: 2000,
    laminationPrice: 1000,
    isPro: false,
    category: 'seasonal',
    borderPattern: 'snow-night-blue'
  },
  {
    id: 'pine-tree-cream',
    name: 'Be cây thông xanh lá nhạt',
    description: 'Cây thông tinh tế trên nền be trang nhã',
    photoSize: { widthMm: 60, heightMm: 90 },
    borderStyle: 'custom',
    isPro: false,
    category: 'seasonal',
    borderPattern: 'pine-tree-cream'
  },
  {
    id: 'gold-sparkle-cream',
    name: 'Kem chấm vàng lấp lánh',
    description: 'Họa tiết ánh kim sang trọng cho sự kiện',
    photoSize: { widthMm: 60, heightMm: 90 },
    borderStyle: 'custom',
    isPro: false,
    category: 'seasonal',
    borderPattern: 'gold-sparkle-cream'
  }
];

export const DEFAULT_PRICE_SETTINGS: PriceSetting[] = [
  { id: 'p-3x4', name: 'Ảnh thẻ 3x4', sizeName: '3x4', widthMm: 30, heightMm: 40, unitPrice: 2000, laminationPrice: 1000 },
  { id: 'p-4x6', name: 'Ảnh thẻ 4x6', sizeName: '4x6', widthMm: 40, heightMm: 60, unitPrice: 2500, laminationPrice: 1000 },
  { id: 'p-6x9', name: 'Ảnh lụa 6x9', sizeName: '6x9', widthMm: 60, heightMm: 90, unitPrice: 3000, laminationPrice: 1500 },
  { id: 'p-pol', name: 'Polaroid mini', sizeName: 'Polaroid', widthMm: 54, heightMm: 86, unitPrice: 3500, laminationPrice: 1500 },
  { id: 'p-9x13', name: 'Ảnh 9x13', sizeName: '9x13', widthMm: 90, heightMm: 130, unitPrice: 3500, laminationPrice: 1500 },
  { id: 'p-10x15', name: 'Ảnh 10x15', sizeName: '10x15', widthMm: 100, heightMm: 150, unitPrice: 4000, laminationPrice: 2000 },
  { id: 'p-13x18', name: 'Ảnh 13x18', sizeName: '13x18', widthMm: 130, heightMm: 180, unitPrice: 7000, laminationPrice: 2500 },
  { id: 'p-15x20', name: 'Ảnh 15x20', sizeName: '15x20', widthMm: 150, heightMm: 200, unitPrice: 12000, laminationPrice: 3000 },
  { id: 'p-20x30', name: 'Ảnh 20x30', sizeName: '20x30', widthMm: 200, heightMm: 300, unitPrice: 25000, laminationPrice: 5000 },
];
