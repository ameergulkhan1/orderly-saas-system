import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { apiResponse } from '../../lib/apiResponse';
import { 
  createPaymentSchema, 
  updatePaymentSchema, 
  paymentQuerySchema,
  recordPaymentSchema
} from './payment.validation';

export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  getPayments = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const validatedQuery = paymentQuerySchema.parse({ query: req.query });
    const result = await this.paymentService.getPayments(businessId, validatedQuery.query);
    return apiResponse.success(res, 200, 'Payments fetched successfully', result);
  });

  getPaymentSummary = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const result = await this.paymentService.getPaymentSummary(businessId);
    return apiResponse.success(res, 200, 'Payment summary fetched successfully', result);
  });

  getPaymentMethodsBreakdown = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const result = await this.paymentService.getPaymentMethodsBreakdown(businessId);
    return apiResponse.success(res, 200, 'Payment methods breakdown fetched successfully', result);
  });

  getOrderPayments = asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.orderId as string;
    const businessId = (req as any).user.businessId;
    const result = await this.paymentService.getOrderPayments(orderId, businessId);
    return apiResponse.success(res, 200, 'Order payments fetched successfully', result);
  });

  getPaymentById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const result = await this.paymentService.getPaymentById(id, businessId);
    return apiResponse.success(res, 200, 'Payment fetched successfully', result);
  });

  // ✅ FIXED: Convert paidAt string to Date
  recordPayment = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const validatedData = recordPaymentSchema.parse({ body: req.body });
    
    // Convert paidAt from string to Date if provided
    const paymentData = {
      ...validatedData.body,
      paidAt: validatedData.body.paidAt ? new Date(validatedData.body.paidAt) : undefined
    };
    
    const result = await this.paymentService.recordPayment(businessId, paymentData);
    return apiResponse.success(res, 201, 'Payment recorded successfully', result);
  });

  createPayment = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const validatedData = createPaymentSchema.parse({ body: req.body });
    const { orderId, ...paymentData } = validatedData.body;
    const result = await this.paymentService.createPaymentForOrder(orderId, businessId, paymentData);
    return apiResponse.success(res, 201, 'Payment created successfully', result);
  });

  updatePayment = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const validatedData = updatePaymentSchema.parse({ body: req.body });
    const result = await this.paymentService.updatePayment(id, businessId, validatedData.body);
    return apiResponse.success(res, 200, 'Payment updated successfully', result);
  });
}