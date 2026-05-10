import mongoose, { Schema, Document } from 'mongoose';

export interface ISaleItem {
  productId: mongoose.Types.ObjectId;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface ISale extends Document {
  shopId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId | null;
  items: ISaleItem[];
  totalAmount: number;
  receivedAmount: number;
  dueAmount: number;
  date: string;
  notes: string;
  isWalkIn: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SaleItemSchema = new Schema<ISaleItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  qty: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
});

const SaleSchema = new Schema<ISale>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  items: [SaleItemSchema],
  totalAmount: { type: Number, default: 0 },
  receivedAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  date: { type: String, required: true },
  notes: { type: String, default: '' },
  isWalkIn: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.models.Sale || mongoose.model<ISale>('Sale', SaleSchema);
