import { Project, Customer, PriceSetting, PrinterCalibration, TemplateItem } from '../../types';
import { DEFAULT_PRICE_SETTINGS, TEMPLATES_DATA } from '../constants';
import { STUDIO_PRICING_RULES, SizePricingRule } from '../pricing/pricingEngine';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const PROJECTS_KEY = 'photodesk_projects_v1';
const CUSTOMERS_KEY = 'photodesk_customers_v1';
const PRICES_KEY = 'photodesk_prices_v1';
const TIERED_PRICES_KEY = 'photodesk_tiered_prices_v1';
const LAMINATION_PRICES_KEY = 'photodesk_lamination_prices_v1';
const PRINTER_KEY = 'photodesk_printer_calib_v1';
const TEMPLATES_KEY = 'photodesk_templates_v1';
const DELETED_TEMPLATES_KEY = 'photodesk_deleted_templates_v1';

// Initial sample data if completely empty
const SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Chị Lan (Studio Ánh Sao)',
    phone: '0912345678',
    socialLink: 'zalo.me/0912345678',
    notes: 'Hay in polaroid, thích viền trắng, giao hỏa tốc',
    totalOrders: 3,
    totalAmount: 185000,
    paidAmount: 185000,
    debtAmount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cust-2',
    name: 'Anh Tuấn (Tiệm ảnh Kỷ niệm)',
    phone: '0987654321',
    socialLink: 'facebook.com/tuananh',
    notes: 'In ảnh thẻ số lượng lớn, cần đường cắt rõ',
    totalOrders: 5,
    totalAmount: 320000,
    paidAmount: 250000,
    debtAmount: 70000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const storageManager = {
  // --- PROJECTS ---
  getProjects(): Project[] {
    try {
      const data = localStorage.getItem(PROJECTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveProject(project: Project): void {
    const list = this.getProjects();
    const idx = list.findIndex(p => p.id === project.id);
    project.updatedAt = new Date().toISOString();

    if (idx >= 0) {
      list[idx] = project;
    } else {
      list.unshift(project);
    }

    localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
    this._syncKeyToCloud('projects', list);
  },

  deleteProject(id: string): void {
    const list = this.getProjects().filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
    this._syncKeyToCloud('projects', list);
  },

  duplicateProject(id: string): Project | null {
    const list = this.getProjects();
    const original = list.find(p => p.id === id);
    if (!original) return null;

    const copy: Project = {
      ...JSON.parse(JSON.stringify(original)),
      id: 'proj-' + Date.now(),
      name: `${original.name} (Bản sao)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    list.unshift(copy);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
    this._syncKeyToCloud('projects', list);
    return copy;
  },

  // --- CUSTOMERS ---
  getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(CUSTOMERS_KEY);
      if (!data) {
        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(SAMPLE_CUSTOMERS));
        return SAMPLE_CUSTOMERS;
      }
      return JSON.parse(data);
    } catch {
      return SAMPLE_CUSTOMERS;
    }
  },

  saveCustomer(customer: Customer): void {
    const list = this.getCustomers();
    const idx = list.findIndex(c => c.id === customer.id);
    customer.updatedAt = new Date().toISOString();

    if (idx >= 0) {
      list[idx] = customer;
    } else {
      list.unshift(customer);
    }

    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list));
    this._syncKeyToCloud('customers', list);
  },

  deleteCustomer(id: string): void {
    const list = this.getCustomers().filter(c => c.id !== id);
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list));
    this._syncKeyToCloud('customers', list);
  },

  // --- PRICING ---
  getPriceSettings(): PriceSetting[] {
    try {
      const data = localStorage.getItem(PRICES_KEY);
      return data ? JSON.parse(data) : DEFAULT_PRICE_SETTINGS;
    } catch {
      return DEFAULT_PRICE_SETTINGS;
    }
  },

  savePriceSettings(settings: PriceSetting[]): void {
    localStorage.setItem(PRICES_KEY, JSON.stringify(settings));
    this._syncKeyToCloud('prices', settings);
  },

  getTieredPricingRules(): SizePricingRule[] {
    try {
      const data = localStorage.getItem(TIERED_PRICES_KEY);
      return data ? JSON.parse(data) : STUDIO_PRICING_RULES;
    } catch {
      return STUDIO_PRICING_RULES;
    }
  },

  saveTieredPricingRules(rules: SizePricingRule[]): void {
    localStorage.setItem(TIERED_PRICES_KEY, JSON.stringify(rules));
    this._syncKeyToCloud('tiered_prices', rules);
  },

  getLaminationPricingSettings(): {
    plasticMatteUnder50: number;
    plasticMatte50Plus: number;
    glitterUnder50: number;
    glitter50Plus: number;
  } {
    try {
      const data = localStorage.getItem(LAMINATION_PRICES_KEY);
      const defaults = {
        plasticMatteUnder50: 500,
        plasticMatte50Plus: 300,
        glitterUnder50: 1000,
        glitter50Plus: 800
      };
      return data ? { ...defaults, ...JSON.parse(data) } : defaults;
    } catch {
      return {
        plasticMatteUnder50: 500,
        plasticMatte50Plus: 300,
        glitterUnder50: 1000,
        glitter50Plus: 800
      };
    }
  },

  saveLaminationPricingSettings(settings: {
    plasticMatteUnder50: number;
    plasticMatte50Plus: number;
    glitterUnder50: number;
    glitter50Plus: number;
  }): void {
    localStorage.setItem(LAMINATION_PRICES_KEY, JSON.stringify(settings));
    this._syncKeyToCloud('lamination_prices', settings);
  },

  // --- PRINTER CALIBRATION ---
  getPrinterCalibration(): PrinterCalibration {
    try {
      const data = localStorage.getItem(PRINTER_KEY);
      if (data) return JSON.parse(data);
    } catch {}

    return {
      id: 'default-printer',
      printerName: 'Máy in của tiệm',
      unprintableMarginMm: 0,
      offsetX: 0,
      offsetY: 0,
      testPaperSize: 'A4',
      lastUpdated: new Date().toISOString()
    };
  },

  savePrinterCalibration(calib: PrinterCalibration): void {
    calib.lastUpdated = new Date().toISOString();
    localStorage.setItem(PRINTER_KEY, JSON.stringify(calib));
  },

  // --- TEMPLATES ---
  getDeletedTemplateIds(): Set<string> {
    try {
      const data = localStorage.getItem(DELETED_TEMPLATES_KEY);
      return data ? new Set(JSON.parse(data)) : new Set();
    } catch {
      return new Set();
    }
  },

  getTemplates(): TemplateItem[] {
    try {
      const deletedIds = this.getDeletedTemplateIds();
      const data = localStorage.getItem(TEMPLATES_KEY);
      let list: TemplateItem[] = [];

      if (data) {
        const customTemplates: TemplateItem[] = JSON.parse(data);
        // Merge with built-in templates: custom override built-in by ID, then add unique custom ones
        const customMap = new Map(customTemplates.map(t => [t.id, t]));
        const merged = TEMPLATES_DATA
          .filter(t => !deletedIds.has(t.id))
          .map(t => customMap.get(t.id) || t);
        customTemplates.forEach(t => {
          if (!deletedIds.has(t.id) && !merged.some(m => m.id === t.id)) {
            merged.push(t);
          }
        });
        list = merged;
      } else {
        list = TEMPLATES_DATA.filter(t => !deletedIds.has(t.id));
      }

      // Guarantee every template has an active, valid customPrice & laminationPrice
      return list.map(t => {
        const defaultTpl = TEMPLATES_DATA.find(d => d.id === t.id);
        const fallbackPrice = defaultTpl?.customPrice || (t.borderStyle === 'polaroid' ? 2500 : 2000);
        return {
          ...t,
          customPrice: t.customPrice && t.customPrice > 0 ? t.customPrice : fallbackPrice,
          laminationPrice: t.laminationPrice !== undefined ? t.laminationPrice : (defaultTpl?.laminationPrice || 1000)
        };
      });
    } catch {}
    return TEMPLATES_DATA.map(t => ({
      ...t,
      customPrice: t.customPrice || 2000,
      laminationPrice: t.laminationPrice || 1000
    }));
  },

  saveTemplate(template: TemplateItem): void {
    const customList = this.getCustomTemplatesList();
    const idx = customList.findIndex(t => t.id === template.id);
    if (idx >= 0) {
      customList[idx] = template;
    } else {
      customList.unshift(template);
    }
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(customList));
    this._syncKeyToCloud('templates', customList);
  },

  deleteTemplate(id: string): void {
    // Remove from custom list
    const customList = this.getCustomTemplatesList().filter(t => t.id !== id);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(customList));
    // Add to blacklist (handles both built-in and custom templates)
    const deletedIds = this.getDeletedTemplateIds();
    deletedIds.add(id);
    const deletedArray = [...deletedIds];
    localStorage.setItem(DELETED_TEMPLATES_KEY, JSON.stringify(deletedArray));
    this._syncKeyToCloud('templates', customList);
    this._syncKeyToCloud('deleted_templates', deletedArray);
  },

  restoreAllTemplates(): void {
    // Clear blacklist to restore all built-in templates
    localStorage.removeItem(DELETED_TEMPLATES_KEY);
    this._syncKeyToCloud('deleted_templates', []);
  },

  getCustomTemplatesList(): TemplateItem[] {
    try {
      const data = localStorage.getItem(TEMPLATES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // --- SHOP INFO / LOGO ---
  getShopInfo(): { name: string; tagline: string; logoUrl?: string } {
    try {
      const data = localStorage.getItem('caos_studio_shop_info');
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return {
      name: 'Caos',
      tagline: 'Print',
      logoUrl: ''
    };
  },

  saveShopInfo(info: { name: string; tagline: string; logoUrl?: string }): void {
    try {
      localStorage.setItem('caos_studio_shop_info', JSON.stringify(info));
      this._syncKeyToCloud('shop_info', info);
    } catch {}
  },

  // --- CLOUD SYNC (Supabase app_state table) ---

  /** Internal helper: push one key to app_state table */
  _syncKeyToCloud(dataKey: string, value: unknown): void {
    if (!isSupabaseConfigured() || !supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      if (!user) return;
      supabase!.from('app_state').upsert(
        [{ user_id: user.id, data_key: dataKey, data_value: value, updated_at: new Date().toISOString() }],
        { onConflict: 'user_id,data_key' }
      ).then(({ error }) => {
        if (error) console.warn(`Cloud sync [${dataKey}] error:`, error.message);
      });
    });
  },

  /** Pull all data from Supabase and overwrite localStorage */
  async syncFromCloud(): Promise<{ ok: boolean; hasCloudData: boolean; projects: number; customers: number; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { ok: false, hasCloudData: false, projects: 0, customers: 0, error: 'Supabase chưa kết nối' };
    }
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('data_key, data_value');

      if (error) return { ok: false, hasCloudData: false, projects: 0, customers: 0, error: error.message };

      let projectsCount = 0;
      let customersCount = 0;
      const hasCloudData = Array.isArray(data) && data.length > 0;

      if (data) {
        for (const row of data) {
          switch (row.data_key) {
            case 'projects':
              if (Array.isArray(row.data_value)) {
                localStorage.setItem(PROJECTS_KEY, JSON.stringify(row.data_value));
                projectsCount = row.data_value.length;
              }
              break;
            case 'customers':
              if (Array.isArray(row.data_value) && row.data_value.length > 0) {
                localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(row.data_value));
                customersCount = row.data_value.length;
              }
              break;
            case 'templates':
              if (Array.isArray(row.data_value)) {
                localStorage.setItem(TEMPLATES_KEY, JSON.stringify(row.data_value));
              }
              break;
            case 'deleted_templates':
              if (Array.isArray(row.data_value)) {
                localStorage.setItem(DELETED_TEMPLATES_KEY, JSON.stringify(row.data_value));
              }
              break;
            case 'prices':
              if (Array.isArray(row.data_value)) {
                localStorage.setItem(PRICES_KEY, JSON.stringify(row.data_value));
              }
              break;
            case 'tiered_prices':
              if (Array.isArray(row.data_value)) {
                localStorage.setItem(TIERED_PRICES_KEY, JSON.stringify(row.data_value));
              }
              break;
            case 'lamination_prices':
              if (row.data_value && typeof row.data_value === 'object') {
                localStorage.setItem(LAMINATION_PRICES_KEY, JSON.stringify(row.data_value));
              }
              break;
            case 'shop_info':
              if (row.data_value && typeof row.data_value === 'object') {
                localStorage.setItem('caos_studio_shop_info', JSON.stringify(row.data_value));
              }
              break;
          }
        }
      }

      return { ok: true, hasCloudData, projects: projectsCount, customers: customersCount };
    } catch (err: any) {
      return { ok: false, hasCloudData: false, projects: 0, customers: 0, error: err?.message || 'Lỗi không xác định' };
    }
  },

  /** Push all local data up to Supabase (first-time setup or force sync) */
  async pushAllToCloud(): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return false;

      const now = new Date().toISOString();
      const rows = [
        { user_id: user.id, data_key: 'projects', data_value: this.getProjects(), updated_at: now },
        { user_id: user.id, data_key: 'customers', data_value: this.getCustomers(), updated_at: now },
        { user_id: user.id, data_key: 'templates', data_value: this.getCustomTemplatesList(), updated_at: now },
        { user_id: user.id, data_key: 'deleted_templates', data_value: [...this.getDeletedTemplateIds()], updated_at: now },
        { user_id: user.id, data_key: 'prices', data_value: this.getPriceSettings(), updated_at: now },
        { user_id: user.id, data_key: 'tiered_prices', data_value: this.getTieredPricingRules(), updated_at: now },
        { user_id: user.id, data_key: 'lamination_prices', data_value: this.getLaminationPricingSettings(), updated_at: now },
        { user_id: user.id, data_key: 'shop_info', data_value: this.getShopInfo(), updated_at: now }
      ];

      const { error } = await supabase.from('app_state').upsert(rows, { onConflict: 'user_id,data_key' });

      if (error) { console.warn('pushAllToCloud error:', error.message); return false; }
      return true;
    } catch (err) {
      console.warn('pushAllToCloud exception:', err);
      return false;
    }
  }
};

