/**
 * Normalizes seller input to make intent matching reliable.
 * Handles: case, punctuation, common typos, Roman-Urdu.
 */
export class TextNormalizer {
  // Common Roman-Urdu → English mappings
  private static readonly URDU_MAP: Record<string, string> = {
    kitna: 'how much',
    kitne: 'how many',
    bika: 'sold',
    bikri: 'sales',
    kya: 'what',
    kaun: 'which',
    mera: 'my',
    meri: 'my',
    sabse: 'most',
    zyada: 'more',
    kam: 'less',
    maal: 'product',
    customer: 'customer',
    grahak: 'customer',
    order: 'order',
    paisa: 'revenue',
    aaj: 'today',
    kal: 'yesterday',
    hafta: 'week',
    mahina: 'month',
    saal: 'year',
  };

  // Common typo fixes
  private static readonly TYPO_MAP: Record<string, string> = {
    produts: 'products',
    prducts: 'products',
    custmers: 'customers',
    custmer: 'customer',
    revnue: 'revenue',
    salses: 'sales',
    saels: 'sales',
    odrers: 'orders',
    oder: 'order',
    bestsellling: 'best selling',
    sells: 'sales',
  };

  // Plural → singular for key words
  private static readonly PLURAL_MAP: Record<string, string> = {
    products: 'product',
    items: 'product',
    customers: 'customer',
    clients: 'customer',
    buyers: 'customer',
    orders: 'order',
    sales: 'sale',
    stocks: 'stock',
  };

  static normalize(input: string): string {
    if (!input) return '';

    let text = input.toLowerCase().trim();
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/[^\w\s\-]/g, ' ');

    for (const [typo, fix] of Object.entries(this.TYPO_MAP)) {
      text = text.replace(new RegExp(`\\b${typo}\\b`, 'g'), fix);
    }

    for (const [urdu, english] of Object.entries(this.URDU_MAP)) {
      text = text.replace(new RegExp(`\\b${urdu}\\b`, 'g'), english);
    }

    for (const [plural, singular] of Object.entries(this.PLURAL_MAP)) {
      text = text.replace(new RegExp(`\\b${plural}\\b`, 'g'), singular);
    }

    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  static extractPeriod(text: string): 'today' | 'yesterday' | 'week' | 'month' | 'year' {
    if (/\b(today|aaj|aj)\b/.test(text)) return 'today';
    if (/\b(yesterday|kal)\b/.test(text)) return 'yesterday';
    if (/\b(week|hafta|7 days|last 7)\b/.test(text)) return 'week';
    if (/\b(month|mahina|30 days|last 30)\b/.test(text)) return 'month';
    if (/\b(year|saal|365 days|annual)\b/.test(text)) return 'year';
    return 'month';
  }

  static extractNumber(text: string, defaultVal: number = 5): number {
    const match = text.match(/\b(\d+)\b/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > 0 && num <= 100) return num;
    }
    return defaultVal;
  }
}