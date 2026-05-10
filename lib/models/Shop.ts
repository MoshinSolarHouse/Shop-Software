import mongoose, { Schema, Document } from 'mongoose';

export interface IShop extends Document {
  name: string;
  type: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
}

const ShopSchema = new Schema<IShop>({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, default: 'general' },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Shop || mongoose.model<IShop>('Shop', ShopSchema);
