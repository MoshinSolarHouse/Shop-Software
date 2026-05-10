import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  shopId: mongoose.Types.ObjectId;
  name: string;
  image: string;
  isActive: boolean;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>({
  shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  name: { type: String, required: true, trim: true },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

CategorySchema.index({ shopId: 1, name: 1 }, { unique: true });

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
