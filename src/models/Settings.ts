import { Schema, model, Document } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  maintenanceMode: boolean;
  freeTrialAllowed: boolean;
  app_version: string;
}

const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, default : 'sonic_1c1d6bbad9e501fa8b131f45' },
    maintenanceMode: { type: Boolean, default: false },
    freeTrialAllowed: { type: Boolean, default: false },
    app_version: { type: String, default: "1.1" }
  },
  { timestamps: true }
);

export const SettingsModel = model<ISettings>('Settings', settingsSchema);
