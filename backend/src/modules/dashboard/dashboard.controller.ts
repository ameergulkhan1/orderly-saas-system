import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { apiResponse } from '../../lib/apiResponse';
// import { HttpError } from '../../lib/httpError';

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  // GET /api/v1/dashboard/stats
  getStats = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const result = await this.dashboardService.getStats(businessId);
    return apiResponse.success(res, 200, 'Dashboard stats fetched successfully', result);
  });

  // GET /api/v1/dashboard/revenue-chart
  getRevenueChart = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const { period } = req.query;
    const result = await this.dashboardService.getRevenueChart(
      businessId,
      period as string || 'week'
    );
    return apiResponse.success(res, 200, 'Revenue chart data fetched', result);
  });

  // GET /api/v1/dashboard/order-status
  getOrderStatusDistribution = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const result = await this.dashboardService.getOrderStatusDistribution(businessId);
    return apiResponse.success(res, 200, 'Order status distribution fetched', result);
  });

  // GET /api/v1/dashboard/low-stock
  getLowStock = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const { limit } = req.query;
    const result = await this.dashboardService.getLowStockItems(
      businessId,
      Number(limit) || 5
    );
    return apiResponse.success(res, 200, 'Low stock items fetched', result);
  });

  // GET /api/v1/dashboard/recent-orders
  getRecentOrders = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const { limit } = req.query;
    const result = await this.dashboardService.getRecentOrders(
      businessId,
      Number(limit) || 5
    );
    return apiResponse.success(res, 200, 'Recent orders fetched', result);
  });

  // GET /api/v1/dashboard/today
  getTodaySummary = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const result = await this.dashboardService.getTodaySummary(businessId);
    return apiResponse.success(res, 200, 'Today summary fetched', result);
  });
}
