import { NextFunction, Request, Response } from 'express';
import { DeliveryService } from './delivery.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { apiResponse } from '../../lib/apiResponse';
import { 
  createDeliverySchema, 
  updateDeliverySchema,
  updateDeliveryStatusSchema,
  deliveryQuerySchema 
} from './delivery.validation';

export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  // POST /api/v1/deliveries
  createDelivery = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const validatedData = createDeliverySchema.parse(req.body);
    const result = await this.deliveryService.createDelivery(businessId, validatedData);
    return apiResponse.success(res, 201, 'Delivery created successfully', result);
  });

  // GET /api/v1/deliveries
  getDeliveries = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const validatedQuery = deliveryQuerySchema.parse(req.query);
    const result = await this.deliveryService.getDeliveries(businessId, validatedQuery);
    return apiResponse.success(res, 200, 'Deliveries fetched successfully', result);
  });

  // GET /api/v1/deliveries/:id
  getDeliveryById = asyncHandler(async (req: Request, res: Response) => {
    // Fix: Ensure id is a string
    const id = req.params.id as string;
    const businessId = req.user.businessId;
    const result = await this.deliveryService.getDeliveryById(id, businessId);
    return apiResponse.success(res, 200, 'Delivery fetched successfully', result);
  });

  // PATCH /api/v1/deliveries/:id
  updateDelivery = asyncHandler(async (req: Request, res: Response) => {
    // Fix: Ensure id is a string
    const id = req.params.id as string;
    const businessId = req.user.businessId;
    const validatedData = updateDeliverySchema.parse(req.body);
    const result = await this.deliveryService.updateDelivery(id, businessId, validatedData);
    return apiResponse.success(res, 200, 'Delivery updated successfully', result);
  });

  // PATCH /api/v1/deliveries/:id/status
  updateDeliveryStatus = asyncHandler(async (req: Request, res: Response) => {
    // Fix: Ensure id is a string
    const id = req.params.id as string;
    const businessId = req.user.businessId;
    const validatedData = updateDeliveryStatusSchema.parse(req.body);
    const result = await this.deliveryService.updateDeliveryStatus(id, businessId, validatedData);
    return apiResponse.success(res, 200, 'Delivery status updated successfully', result);
  });

  // GET /api/v1/deliveries/order/:orderId
  getDeliveryByOrder = asyncHandler(async (req: Request, res: Response) => {
    // Fix: Ensure orderId is a string
    const orderId = req.params.orderId as string;
    const businessId = req.user.businessId;
    const result = await this.deliveryService.getDeliveryByOrder(orderId, businessId);
    return apiResponse.success(res, 200, 'Order delivery fetched successfully', result);
  });

  // POST /api/v1/deliveries/:id/tracking
  updateTracking = asyncHandler(async (req: Request, res: Response) => {
    // Fix: Ensure id is a string
    const id = req.params.id as string;
    const businessId = req.user.businessId;
    const { trackingNumber, courier } = req.body;
    const result = await this.deliveryService.updateTracking(
      id, 
      businessId, 
      trackingNumber, 
      courier
    );
    return apiResponse.success(res, 200, 'Tracking updated successfully', result);
  });

  // GET /api/v1/deliveries/status-summary
  getDeliveryStatusSummary = asyncHandler(async (req: Request, res: Response) => {
    const businessId = req.user.businessId;
    const result = await this.deliveryService.getDeliveryStatusSummary(businessId);
    return apiResponse.success(res, 200, 'Delivery status summary fetched successfully', result);
  });
}
