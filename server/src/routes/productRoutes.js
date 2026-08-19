import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage
} from '../controllers/productController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';
import { uploadProductImage } from '../middleware/upload.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), createProduct);
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), updateProduct);
router.delete('/:id', authorizeRoles('ADMIN'), deleteProduct);
router.post('/:id/image', authorizeRoles('ADMIN', 'MANAGER'), uploadProductImage.single('image'), uploadImage);

export default router;
