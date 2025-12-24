import { Document, model, Schema } from 'mongoose';

export interface ITask extends Document {
 
  task: any;
  status: 'pending' | 'completed' | 'failed';
  result?: any;
  createdAt: Date;
  updatedAt: Date;
}


const TaskSchema = new Schema<ITask>(
  {
   
    task: {
      type: Schema.Types.Mixed,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    result: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
    versionKey: false
  }
);

export const TaskModel = model<ITask>('Task', TaskSchema);