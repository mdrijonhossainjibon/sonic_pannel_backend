export interface IDevice {
  _id?: string;
  ipAddress: string;
  status: 'active' | 'inactive';
  name?: string;
  creditUsed?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class DeviceModel {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async create(deviceData: Omit<IDevice, '_id' | 'createdAt' | 'updatedAt'>): Promise<IDevice> {
    const collection = this.db.collection('devices');
    const now = new Date();
    const result = await collection.insertOne({
      ...deviceData,
      creditUsed: deviceData.creditUsed || 0,
      createdAt: now,
      updatedAt: now
    });
    return { _id: result.insertedId.toString(), ...deviceData, creditUsed: deviceData.creditUsed || 0, createdAt: now, updatedAt: now };
  }

  async findOne(query: Partial<IDevice>): Promise<IDevice | null> {
    const collection = this.db.collection('devices');
    return await collection.findOne(query);
  }

  async findById(id: string): Promise<IDevice | null> {
    const collection = this.db.collection('devices');
    const { ObjectId } = require('mongodb');
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  async find(): Promise<IDevice[]> {
    const collection = this.db.collection('devices');
    return await collection.find({}).toArray();
  }

  async findByIdAndUpdate(id: string, updateData: Partial<IDevice>): Promise<IDevice | null> {
    const collection = this.db.collection('devices');
    const { ObjectId } = require('mongodb');
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  async incrementCredit(id: string, amount: number = 1): Promise<IDevice | null> {
    const collection = this.db.collection('devices');
    const { ObjectId } = require('mongodb');
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $inc: { creditUsed: amount },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  async findByIdAndDelete(id: string): Promise<IDevice | null> {
    const collection = this.db.collection('devices');
    const { ObjectId } = require('mongodb');
    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
    return result.value;
  }
}
