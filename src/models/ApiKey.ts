import { Schema, model, Document } from 'mongoose';

export interface IApiKey extends Document {
  key: string;
  name?: string;
  status: 'active' | 'expire' | 'inactive';
  expiresAt?: Date;
  lastUsedAt?: Date;
  visitorId?: string;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String },
    status: { type: String, enum: ['active', 'expire', 'inactive'], default: 'active' },
    expiresAt: { type: Date },
    lastUsedAt: { type: Date },
    visitorId: { type: String }
  },
  { timestamps: true }
);

export const ApiKeyModel = model<IApiKey>('ApiKey', apiKeySchema);
