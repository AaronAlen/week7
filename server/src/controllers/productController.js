import { Product, InventoryTransaction, RestockRequest, PurchaseOrder } from '../models/index.js';
import { z } from 'zod';
import path from 'path';

const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional().nullable(),
  sku: z.string().min(2, 'SKU is required'),
  currentStock: z.number().int().min(0, 'Current stock must be non-negative'),
  safetyThreshold: z.number().int().min(1, 'Safety threshold must be at least 1'),
  targetStock: z.number().int().min(1, 'Target stock must be at least 1'),
  unitCost: z.number().positive('Unit cost must be greater than 0'),
  supplierName: z.string().min(2, 'Supplier name is required'),
  supplierEmail: z.string().email('Invalid supplier email'),
  supplierPhone: z.string().optional().nullable()
});

export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      order: [['id', 'DESC']]
    });

    const enhancedProducts = products.map(p => {
      const pJson = p.toJSON();
      pJson.stockStatus = pJson.currentStock === 0 
        ? 'OUT_OF_STOCK' 
        : pJson.currentStock < pJson.safetyThreshold 
          ? 'LOW_STOCK' 
          : 'NORMAL';
      return pJson;
    });

    res.json(enhancedProducts);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: InventoryTransaction, as: 'transactions', limit: 10, order: [['createdAt', 'DESC']] },
        { model: RestockRequest, as: 'restockRequests', limit: 5, order: [['createdAt', 'DESC']] },
        { model: PurchaseOrder, as: 'purchaseOrders', limit: 5, order: [['createdAt', 'DESC']] }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const pJson = product.toJSON();
    pJson.stockStatus = pJson.currentStock === 0 
      ? 'OUT_OF_STOCK' 
      : pJson.currentStock < pJson.safetyThreshold 
        ? 'LOW_STOCK' 
        : 'NORMAL';

    res.json(pJson);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const validated = productSchema.parse(req.body);

    const existingSku = await Product.findOne({ where: { sku: validated.sku } });
    if (existingSku) {
      return res.status(400).json({ error: `Product with SKU '${validated.sku}' already exists.` });
    }

    const product = await Product.create(validated);
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const validated = productSchema.partial().parse(req.body);

    if (validated.sku && validated.sku !== product.sku) {
      const existingSku = await Product.findOne({ where: { sku: validated.sku } });
      if (existingSku) {
        return res.status(400).json({ error: `Product with SKU '${validated.sku}' already exists.` });
      }
    }

    await product.update(validated);
    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', details: error.errors });
    }
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const uploadImage = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const imagePath = `/uploads/${path.basename(req.file.path)}`;
    product.image = imagePath;
    await product.save();

    res.json({
      message: 'Product image uploaded successfully',
      image: imagePath,
      product
    });
  } catch (error) {
    next(error);
  }
};
