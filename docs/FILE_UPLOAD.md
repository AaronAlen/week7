# File Upload System

## Architecture

StockPilot supports product catalog image uploads using **Multer**.

1. **Storage Engine**: `diskStorage` configured to save files into `server/uploads/` directory with unique filenames (`product-timestamp-random.ext`).
2. **File Validation**:
   - MIME Type filter: Accepts only `image/jpeg`, `image/png`, `image/webp`, and `image/gif`.
   - File Size Limit: Maximum 5MB per upload.
3. **Static File Serving**: Express serves `/uploads` statically via `app.use('/uploads', express.static(uploadsDir))`.
4. **Database Record**: Relative URL (e.g. `/uploads/product-123.png`) stored in `Products.image`.
