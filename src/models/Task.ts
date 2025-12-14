export interface ITask {
  _id?: string;
  apiKey: string;
  task: any;
  status: 'pending' | 'completed' | 'failed';
  result?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TaskModel {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async create(taskData: Omit<ITask, '_id' | 'createdAt' | 'updatedAt'>): Promise<ITask> {
    const collection = this.db.collection('tasks');
    const now = new Date();
    const result = await collection.insertOne({
      ...taskData,
      createdAt: now,
      updatedAt: now
    });
    return { _id: result.insertedId.toString(), ...taskData, createdAt: now, updatedAt: now };
  }

  async findOne(query: Partial<ITask>): Promise<ITask | null> {
    const collection = this.db.collection('tasks');
    return await collection.findOne(query);
  }

  async findById(id: string): Promise<ITask | null> {
    const collection = this.db.collection('tasks');
    const { ObjectId } = require('mongodb');
    return await collection.findOne({ _id: new ObjectId(id) });
  }

  async find(): Promise<ITask[]> {
    const collection = this.db.collection('tasks');
    return await collection.find({}).toArray();
  }

  async findByIdAndUpdate(id: string, updateData: Partial<ITask>): Promise<ITask | null> {
    const collection = this.db.collection('tasks');
    const { ObjectId } = require('mongodb');
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result.value;
  }

  async findByIdAndDelete(id: string): Promise<ITask | null> {
    const collection = this.db.collection('tasks');
    const { ObjectId } = require('mongodb');
    const result = await collection.findOneAndDelete({ _id: new ObjectId(id) });
    return result.value;
  }
}
