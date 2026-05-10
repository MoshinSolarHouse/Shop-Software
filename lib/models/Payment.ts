import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  shopId: mongoose.Types.ObjectId;
  partyId: mongoose.Types.ObjectId;
  partyType: string;
  referenceType: string;
  referenceId: mongoose.Types.ObjectId;
  amount: number;
  method: string;
  date: string;
  notes: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  partyId: { type: Schema.Types.ObjectId, refPath: 'partyType' },
  partyType: { type: String, default: 'customer' },
  referenceType: { type: String, default: 'sale' },
  referenceId: { type: Schema.Types.ObjectId, required: true },
  amount: { type: Number, default: 0 },
  method: { type: String, default: 'cash' },
  date: { type: String, required: true },
  notes: { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
