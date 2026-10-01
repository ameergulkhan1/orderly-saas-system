import { ToolName } from './ai.types';

export interface IntentDefinition {
  name: string;
  tool: ToolName;
  keywords: string[];
  phrases?: string[];
  priority: number;
}

export const INTENTS: IntentDefinition[] = [
  {
    name: 'help',
    tool: 'getHelp',
    keywords: ['help', 'hello', 'hi', 'hey', 'salam', 'assalam'],
    priority: 10
  },
  {
    name: 'top_products',
    tool: 'getTopProducts',
    keywords: ['top', 'best', 'popular', 'bestseller', 'highest', 'most', 'winner'],
    phrases: ['top product', 'best selling', 'best seller', 'most sold', 'top selling'],
    priority: 8
  },
  {
    name: 'low_stock',
    tool: 'getLowStockProducts',
    keywords: ['low', 'restock', 'out', 'running', 'empty', 'finish', 'khatam'],
    phrases: ['low stock', 'out of stock', 'running low', 'need restock', 'finish ho gaya'],
    priority: 9
  },
  {
    name: 'pending_orders',
    tool: 'getPendingOrders',
    keywords: ['pending', 'waiting', 'unshipped', 'unsent'],
    phrases: ['pending order', 'waiting order', 'not shipped', 'to ship'],
    priority: 8
  },
  {
    name: 'customer_stats',
    tool: 'getCustomerStats',
    keywords: ['customer', 'buyer', 'client', 'grahak', 'repeat', 'loyal'],
    phrases: ['how many customer', 'my customer', 'repeat customer', 'top customer'],
    priority: 8
  },
  {
    name: 'revenue_summary',
    tool: 'getRevenueSummary',
    keywords: ['revenue', 'earn', 'made', 'income', 'paisa', 'kamai'],
    phrases: ['how much', 'total revenue', 'my revenue'],
    priority: 6
  },
  {
    name: 'sales_summary',
    tool: 'getSalesSummary',
    keywords: ['sale', 'sold', 'bikri', 'bika', 'sell'],
    phrases: ['how much sale', 'total sale', 'my sale', 'how much sold'],
    priority: 7
  }
];

export const VALID_TOOLS: ToolName[] = [
  'getSalesSummary',
  'getTopProducts',
  'getLowStockProducts',
  'getPendingOrders',
  'getCustomerStats',
  'getRevenueSummary',
  'getHelp'
];