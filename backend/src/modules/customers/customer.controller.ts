import { Request, Response } from 'express';
import { CustomerService } from './customer.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { apiResponse } from '../../lib/apiResponse';
import { 
  createCustomerSchema, 
  updateCustomerSchema,
  customerQuerySchema 
} from './customer.validation';

export class CustomerController {
  constructor(private customerService: CustomerService) {}

  createCustomer = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    // ✅ Parse from body
    const validatedData = createCustomerSchema.parse({ body: req.body });
    const result = await this.customerService.createCustomer(businessId, validatedData.body);
    return apiResponse.success(res, 201, 'Customer created successfully', result);
  });

  getCustomers = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    // ✅ Parse from query
    const validatedQuery = customerQuerySchema.parse({ query: req.query });
    const result = await this.customerService.getCustomers(businessId, validatedQuery.query);
    return apiResponse.success(res, 200, 'Customers fetched successfully', result);
  });

  getCustomerById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const result = await this.customerService.getCustomerById(id, businessId);
    return apiResponse.success(res, 200, 'Customer fetched successfully', result);
  });

  updateCustomer = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const validatedData = updateCustomerSchema.parse({ body: req.body });
    const result = await this.customerService.updateCustomer(id, businessId, validatedData.body);
    return apiResponse.success(res, 200, 'Customer updated successfully', result);
  });

  deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    await this.customerService.deleteCustomer(id, businessId);
    return apiResponse.success(res, 200, 'Customer archived successfully');
  });

  getCustomerOrders = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await this.customerService.getCustomerOrders(id, businessId, page, limit);
    return apiResponse.success(res, 200, 'Customer orders fetched successfully', result);
  });

  getCustomerStats = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const customer = await this.customerService.getCustomerById(id, businessId);
    return apiResponse.success(res, 200, 'Customer stats fetched successfully', customer.stats);
  });

  searchCustomers = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const query = req.body.query as string;
    const result = await this.customerService.getCustomers(businessId, { search: query });
    return apiResponse.success(res, 200, 'Customers search results fetched successfully', result);
  });
}