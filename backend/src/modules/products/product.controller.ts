import { Request, Response } from 'express';
import { ProductService } from './product.service';
import { asyncHandler } from '../../lib/asyncHandler';
import { apiResponse } from '../../lib/apiResponse';
import { 
  createProductSchema, 
  updateProductSchema,
  productQuerySchema 
} from './product.validation';

export class ProductController {
  constructor(private productService: ProductService) {}

  createProduct = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const validatedData = createProductSchema.parse({ body: req.body });
    const result = await this.productService.createProduct(businessId, validatedData.body);
    return apiResponse.success(res, 201, 'Product created successfully', result);
  });

  getProducts = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const validatedQuery = productQuerySchema.parse({ query: req.query });
    const result = await this.productService.getProducts(businessId, validatedQuery.query);
    return apiResponse.success(res, 200, 'Products fetched successfully', result);
  });

  getProductById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const result = await this.productService.getProductById(id, businessId);
    return apiResponse.success(res, 200, 'Product fetched successfully', result);
  });

  updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const validatedData = updateProductSchema.parse({ body: req.body });
    const result = await this.productService.updateProduct(id, businessId, validatedData.body);
    return apiResponse.success(res, 200, 'Product updated successfully', result);
  });

  deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    await this.productService.deleteProduct(id, businessId);
    return apiResponse.success(res, 200, 'Product archived successfully');
  });

  getLowStockProducts = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const result = await this.productService.getLowStockProducts(businessId);
    return apiResponse.success(res, 200, 'Low stock products fetched successfully', result);
  });

  getCategories = asyncHandler(async (req: Request, res: Response) => {
    const businessId = (req as any).user.businessId;
    const products = await this.productService.getProducts(businessId, { limit: 1000 });
    const categories = Array.from(new Set(products.data.map((p: any) => p.category).filter(Boolean)));
    return apiResponse.success(res, 200, 'Categories fetched successfully', categories);
  });

  getProductInventory = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const businessId = (req as any).user.businessId;
    const product = await this.productService.getProductById(id, businessId);
    return apiResponse.success(res, 200, 'Product inventory fetched successfully', {
      currentStock: product.currentStock,
      lowStockThreshold: product.lowStockThreshold
    });
  });
}