import { Document, Schema, model } from 'mongoose';


export interface IDevice extends Document {
  ipAddress: string;
  status: 'active' | 'inactive';
  name?: string;
  creditUsed: number;
  createdAt: Date;
  updatedAt: Date;
}
 

const DeviceSchema = new Schema<IDevice>(
  {
    ipAddress: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    name: {
      type: String
    },
    creditUsed: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);


export const DeviceModel = model<IDevice>('Device', DeviceSchema);
