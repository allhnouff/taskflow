import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    start_date: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    end_date: {
      type: Date,
      required: [true, 'End date is required'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['upcoming', 'in_progress', 'completed', 'overdue'],
      default: 'upcoming',
    },
    assignee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assignee is required'],
    },
    reporter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ assignee_id: 1, status: 1 });
taskSchema.index({ end_date: 1 });
taskSchema.index({ status: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;

