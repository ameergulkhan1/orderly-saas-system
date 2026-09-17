import { Request, Response } from 'express';
import { OrderService } from './order.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { apiResponse } from '../../lib/apiResponse';
import { 
  createOrderSchema, 
  updateOrderSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
  cancelOrderSchema
} from './order.validation';

export class OrderController {
  constructor(private orderService: OrderService) {}

  getOrders = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const validatedQuery = orderQuerySchema.parse({ query: req.query });
    const result = await this.orderService.getOrders(businessId, validatedQuery.query);
    return apiResponse.success(res, 200, 'Orders fetched successfully', result);
  });

  createOrder = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const userId = (req as any).user.id;
    const validatedData = createOrderSchema.parse({ body: req.body });
    const result = await this.orderService.createOrder(businessId, userId, validatedData.body);
    return apiResponse.success(res, 201, 'Order created successfully', result);
  });

  getOrderById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const result = await this.orderService.getOrderById(id, businessId);
    return apiResponse.success(res, 200, 'Order fetched successfully', result);
  });

  updateOrder = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const validatedData = updateOrderSchema.parse({ body: req.body });
    const result = await this.orderService.updateOrder(id, businessId, validatedData.body);
    return apiResponse.success(res, 200, 'Order updated successfully', result);
  });

  deleteOrder = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    await this.orderService.deleteOrder(id, businessId);
    return apiResponse.success(res, 200, 'Order cancelled successfully');
  });

  // ✅ FIX: Parse the status directly
  updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const userId = (req as any).user.id;
    
    // The body contains { status, notes }
    const validatedData = updateOrderStatusSchema.parse({ body: req.body });
    const result = await this.orderService.updateOrderStatus(id, businessId, userId, validatedData.body);
    return apiResponse.success(res, 200, 'Order status updated successfully', result);
  });

  cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const userId = (req as any).user.id;
    const validatedData = cancelOrderSchema.parse({ body: req.body });
    const result = await this.orderService.cancelOrder(id, businessId, userId, validatedData.body.reason);
    return apiResponse.success(res, 200, 'Order cancelled successfully', result);
  });

  duplicateOrder = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const userId = (req as any).user.id;
    const result = await this.orderService.duplicateOrder(id, businessId, userId);
    return apiResponse.success(res, 201, 'Order duplicated successfully', result);
  });

  getOrderItems = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const result = await this.orderService.getOrderItems(id, businessId);
    return apiResponse.success(res, 200, 'Order items fetched successfully', result);
  });

  getOrderTimeline = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const result = await this.orderService.getOrderTimeline(id, businessId);
    return apiResponse.success(res, 200, 'Order timeline fetched successfully', result);
  });

  generateInvoice = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const result = await this.orderService.generateInvoice(id, businessId);
    return apiResponse.success(res, 200, 'Invoice generated successfully', result);
  });

  getOrderStatusHistory = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const result = await this.orderService.getOrderStatusHistory(id, businessId);
    return apiResponse.success(res, 200, 'Order status history fetched successfully', result);
  });
}