import { Router } from 'express';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { prisma } from '../../config/database';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

const productService = new ProductService(prisma);
const productController = new ProductController(productService);

router.use(authenticate);

router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.get('/low-stock', productController.getLowStockProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);
router.patch('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.get('/:id/inventory', productController.getProductInventory);

export default router;