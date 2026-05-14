import mongoose, { Schema, Document } from 'mongoose';

export interface IPurchaseItem {
  productId: mongoose.Types.ObjectId;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface IPurchase extends Document {
  shopId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  items: IPurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  date: string;
  referenceNo?: string;
  notes: string;
  status: string; // draft, confirmed, paid
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const PurchaseItemSchema = new Schema<IPurchaseItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  qty: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
});

const PurchaseSchema = new Schema<IPurchase>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
  items: [PurchaseItemSchema],
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  date: { type: String, required: true },
  referenceNo: { type: String, trim: true },
  notes: { type: String, default: '' },
  status: { type: String, default: 'confirmed' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema);
