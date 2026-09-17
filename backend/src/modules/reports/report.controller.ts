import { Request, Response } from 'express';
import { ReportService } from './report.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { apiResponse } from '../../lib/apiResponse';
import { reportQuerySchema } from './report.types';

export class ReportController {
  exportReport(arg0: string, exportReport: any) {
      throw new Error('Method not implemented.');
  }
  getReturnedOrdersReport(arg0: string, getReturnedOrdersReport: any) {
      throw new Error('Method not implemented.');
  }
  getCancelledOrdersReport(arg0: string, getCancelledOrdersReport: any) {
      throw new Error('Method not implemented.');
  }
  constructor(private reportService: ReportService) {}

  // GET /api/v1/reports/revenue
  getRevenueReport = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const validatedQuery = reportQuerySchema.parse(req.query);
    const result = await this.reportService.getRevenueReport(businessId, validatedQuery);
    return apiResponse.success(res, 200, 'Revenue report fetched', result);
  });

  // GET /api/v1/reports/orders
  getOrdersReport = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const validatedQuery = reportQuerySchema.parse(req.query);
    const result = await this.reportService.getOrdersReport(businessId, validatedQuery);
    return apiResponse.success(res, 200, 'Orders report fetched', result);
  });

  // GET /api/v1/reports/products
  getProductsReport = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const validatedQuery = reportQuerySchema.parse(req.query);
    const result = await this.reportService.getProductsReport(businessId, validatedQuery);
    return apiResponse.success(res, 200, 'Products report fetched', result);
  });

  // GET /api/v1/reports/customers
  getCustomersReport = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const validatedQuery = reportQuerySchema.parse(req.query);
    const result = await this.reportService.getCustomersReport(businessId, validatedQuery);
    return apiResponse.success(res, 200, 'Customers report fetched', result);
  });

  // GET /api/v1/reports/top-products
  getTopProducts = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const { limit, period } = req.query;
    const result = await this.reportService.getTopProducts(
      businessId,
      Number(limit) || 10,
      period as string || 'month'
    );
    return apiResponse.success(res, 200, 'Top products fetched', result);
  });

  // GET /api/v1/reports/top-customers
  getTopCustomers = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const { limit, period } = req.query;
    const result = await this.reportService.getTopCustomers(
      businessId,
      Number(limit) || 10,
      period as string || 'month'
    );
    return apiResponse.success(res, 200, 'Top customers fetched', result);
  });

  // GET /api/v1/reports/order-status
  getOrderStatusReport = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const result = await this.reportService.getOrderStatusReport(businessId);
    return apiResponse.success(res, 200, 'Order status report fetched', result);
  });

  // GET /api/v1/reports/dashboard
  getDashboardReport = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const result = await this.reportService.getDashboardReport(businessId);
    return apiResponse.success(res, 200, 'Dashboard report fetched', result);
  });
}