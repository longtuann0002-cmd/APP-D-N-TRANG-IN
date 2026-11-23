import { PhotoItem } from '../../types';

// Creates 14 demo photo items with high-resolution SVG data URLs so the app has instant real preview
export function getDemoPhotos(): PhotoItem[] {
  const titles = [
    'Hội nghị Khởi nghiệp',
    'Diễn giả Khai mạc',
    'Toạ đàm Ban Lãnh đạo',
    'Đoàn Đại biểu Cấp cao',
    'Lễ Trao giải Doanh nghiệp',
    'Thuyết trình Chiến lược',
    'Gian hàng Triển lãm',
    'Hội thảo Chuyên đề',
    'Vinh danh Top 10',
    'Giao lưu Khách mời',
    'Trao hoa Kỷ niệm',
    'Tập thể Cán bộ',
    'Đội ngũ Sáng lập',
    'Sân khấu Bế mạc'
  ];

  const colors = [
    ['#1e3a8a', '#3b82f6'],
    ['#064e3b', '#10b981'],
    ['#701a75', '#d946ef'],
    ['#831843', '#f43f5e'],
    ['#7c2d12', '#f97316'],
    ['#14532d', '#22c55e'],
    ['#1e1b4b', '#6366f1'],
    ['#0f172a', '#64748b'],
    ['#4a044e', '#c026d3'],
    ['#134e4a', '#14b8a6'],
    ['#713f12', '#eab308'],
    ['#172554', '#2563eb'],
    ['#2e1065', '#9333ea'],
    ['#1c1917', '#78716c'],
  ];

  return titles.map((title, i) => {
    const [c1, c2] = colors[i % colors.length];
    const isLand = i % 2 === 0;
    const w = isLand ? 1200 : 900;
    const h = isLand ? 900 : 1200;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>
        <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}" />
          <stop offset="100%" stop-color="${c2}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad${i})" />
      <circle cx="${w/2}" cy="${h/2 - 60}" r="${w/5}" fill="rgba(255,255,255,0.15)" />
      <text x="${w/2}" y="${h/2 - 20}" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="#ffffff" text-anchor="middle">${i + 1}. ${title}</text>
      <text x="${w/2}" y="${h/2 + 40}" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.8)" text-anchor="middle">PhotoDesk Studio Pro</text>
      <rect x="${w/2 - 120}" y="${h/2 + 80}" width="240" height="40" rx="20" fill="rgba(255,255,255,0.25)" />
      <text x="${w/2}" y="${h/2 + 106}" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">300 DPI</text>
    </svg>`;

    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

    return {
      id: `demo-photo-${i + 1}`,
      url,
      originalName: `anh_su_kien_${i + 1}.jpg`,
      widthPx: w,
      heightPx: h,
      aspect: w / h,
      rotation: 0,
      sizeBytes: 2450000,
      status: 'ready' as const
    };
  });
}
