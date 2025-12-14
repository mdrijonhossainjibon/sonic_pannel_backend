export interface IApiKey {
  _id?: string;
  key: string;
  name?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ApiKeyModel {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async create(apiKeyData: Omit<IApiKey, '_id' | 'createdAt' | 'updatedAt'>): Promise<IApiKey> {
    const collection = this.db.collection('apikeys');
    const now = new Date();
    const result = await collection.insertOne({
      ...apiKeyData,
      createdAt: now,
      updatedAt: now
    });
    return { _id: result.insertedId.toString(), ...apiKeyData, createdAt: now, updatedAt: now };
  }

  async findOne(query: Partial<IApiKey>): Promise<IApiKey | null> {
    const collection = this.db.collection('apikeys');
    return await collection.findOne(query);
  }
}
