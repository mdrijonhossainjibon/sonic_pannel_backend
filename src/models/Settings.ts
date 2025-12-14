export interface ISettings {
  _id?: string;
  maintenanceMode: boolean;
  freeTrialAllowed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SettingsModel {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async create(settingsData: Omit<ISettings, '_id' | 'createdAt' | 'updatedAt'>): Promise<ISettings> {
    const collection = this.db.collection('settings');
    const now = new Date();
    const result = await collection.insertOne({
      ...settingsData,
      createdAt: now,
      updatedAt: now
    });
    return { _id: result.insertedId.toString(), ...settingsData, createdAt: now, updatedAt: now };
  }

  async findOne(): Promise<ISettings | null> {
    const collection = this.db.collection('settings');
    return await collection.findOne({});
  }
}
