import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  shopId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  isActive: boolean;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true, trim: true },
  unit: { type: String, default: 'piece' },
  costPrice: { type: Number, default: 0 },
  salePrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
