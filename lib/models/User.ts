import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'super-admin' | 'admin' | 'sales-man';
  shopIds: string[];
  permissions: Record<string, string[]>;
  isActive: boolean;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const permissionActions = ['create', 'read', 'update', 'delete'];

const PermissionSchema = new Schema({}, { strict: false });

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['super-admin', 'admin', 'sales-man'], required: true, default: 'sales-man' },
  shopIds: [{ type: Schema.Types.ObjectId, ref: 'Shop' }],
  permissions: { type: Map, of: [String], default: {} },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.set('toJSON', {
  transform: function (_doc: any, ret: any) {
    delete ret.password;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
