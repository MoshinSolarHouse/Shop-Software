import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
  shopId: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  address?: string;
  createdAt: Date;
}

const SupplierSchema = new Schema<ISupplier>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
}, { timestamps: true });

export default mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
