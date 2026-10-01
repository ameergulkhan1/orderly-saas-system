export interface AIChatRequest {
  message: string;
}

export interface AIChatResponse {
  message: string;
  intent: string;
  toolUsed?: string;
  data?: any;
}

export type ToolName =
  | 'getSalesSummary'
  | 'getTopProducts'
  | 'getLowStockProducts'
  | 'getPendingOrders'
  | 'getCustomerStats'
  | 'getRevenueSummary'
  | 'getHelp';

export type Period = 'today' | 'yesterday' | 'week' | 'month' | 'year';

export interface Intent {
  tool: ToolName;
  args: Record<string, any>;
  confidence: number;
}

export interface ToolContext {
  businessId: string;
  userId: string;
}

export interface ToolResult {
  success: boolean;
  data: any;
  error?: string;
}