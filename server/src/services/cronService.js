import cron from 'node-cron';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import Setting from '../models/Setting.js';
import { sendReminderEmail, sendOverdueEmail } from './emailService.js';

let reminderJob = null;
let overdueJob = null;

const getReminderHours = async () => {
  try {
    const setting = await Setting.findOne({ key: 'reminder_before_hours' });
    return setting ? parseInt(setting.value) : parseInt(process.env.REMINDER_BEFORE_HOURS) || 24;
  } catch (error) {
    return 24;
  }
};

const checkAndSendReminders = async () => {
  try {
    const hoursBefore = await getReminderHours();
    const reminderTime = new Date();
    reminderTime.setHours(reminderTime.getHours() + hoursBefore);

    const tasks = await Task.find({
      status: { $in: ['upcoming', 'in_progress'] },
      end_date: {
        $gte: new Date(),
        $lte: reminderTime,
      },
    }).populate('assignee_id', 'email name');

    for (const task of tasks) {
      // Check if reminder was already sent (by checking notifications)
      const existingNotification = await Notification.findOne({
        user_id: task.assignee_id._id,
        type: 'reminder',
        'payload.task_id': task._id.toString(),
      });

      if (!existingNotification && task.assignee_id) {
        // Send email
        await sendReminderEmail(task._id);

        // Create notification
        await Notification.create({
          user_id: task.assignee_id._id,
          type: 'reminder',
          title: 'Task Reminder',
          message: `Task "${task.title}" is due soon`,
          payload: { task_id: task._id },
        });
      }
    }

    console.log(`Checked ${tasks.length} tasks for reminders`);
  } catch (error) {
    console.error('Error in reminder cron job:', error);
  }
};

const checkAndMarkOverdue = async () => {
  try {
    const now = new Date();

    const overdueTasks = await Task.find({
      status: { $in: ['upcoming', 'in_progress'] },
      end_date: { $lt: now },
    }).populate('assignee_id', 'email name');

    for (const task of overdueTasks) {
      // Update task status
      task.status = 'overdue';
      await task.save();

      if (task.assignee_id) {
        // Check if overdue notification was already sent
        const existingNotification = await Notification.findOne({
          user_id: task.assignee_id._id,
          type: 'overdue',
          'payload.task_id': task._id.toString(),
          read: false,
        });

        if (!existingNotification) {
          // Send email
          await sendOverdueEmail(task._id);

          // Create notification
          await Notification.create({
            user_id: task.assignee_id._id,
            type: 'overdue',
            title: 'Task Overdue',
            message: `Task "${task.title}" is now overdue`,
            payload: { task_id: task._id },
          });
        }
      }
    }

    console.log(`Marked ${overdueTasks.length} tasks as overdue`);
  } catch (error) {
    console.error('Error in overdue cron job:', error);
  }
};

export const startCronJobs = () => {
  // Run reminder check every hour
  reminderJob = cron.schedule('0 * * * *', checkAndSendReminders, {
    scheduled: true,
    timezone: process.env.CRON_TIMEZONE || 'UTC',
  });

  // Run overdue check every 30 minutes
  overdueJob = cron.schedule('*/30 * * * *', checkAndMarkOverdue, {
    scheduled: true,
    timezone: process.env.CRON_TIMEZONE || 'UTC',
  });

  console.log('Cron jobs started');
};

export const stopCronJobs = () => {
  if (reminderJob) {
    reminderJob.stop();
  }
  if (overdueJob) {
    overdueJob.stop();
  }
  console.log('Cron jobs stopped');
};

