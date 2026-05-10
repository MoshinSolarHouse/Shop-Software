import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  shopId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  address: string;
  totalDue: number;
  createdAt: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  totalDue: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
