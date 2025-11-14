import { sendEmail } from '../config/email.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

export const sendTaskAssignmentEmail = async (taskId) => {
  try {
    const task = await Task.findById(taskId)
      .populate('assignee_id', 'name email')
      .populate('reporter_id', 'name');

    if (!task || !task.assignee_id) {
      return { success: false, error: 'Task or assignee not found' };
    }

    const assignee = task.assignee_id;
    const reporter = task.reporter_id;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Task Assigned: ${task.title}</h2>
        <p>Hello ${assignee.name},</p>
        <p>You have been assigned a new task by ${reporter.name}.</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Title:</strong> ${task.title}</p>
          <p><strong>Description:</strong> ${task.description || 'N/A'}</p>
          <p><strong>Priority:</strong> ${task.priority}</p>
          <p><strong>Start Date:</strong> ${new Date(task.start_date).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> ${new Date(task.end_date).toLocaleDateString()}</p>
        </div>
        <p>Please log in to view and manage your tasks.</p>
        <p>Best regards,<br>TaskFlow Team</p>
      </div>
    `;

    return await sendEmail({
      to: assignee.email,
      subject: `New Task: ${task.title}`,
      html,
    });
  } catch (error) {
    console.error('Error sending assignment email:', error);
    return { success: false, error: error.message };
  }
};

export const sendReminderEmail = async (taskId) => {
  try {
    const task = await Task.findById(taskId)
      .populate('assignee_id', 'name email')
      .populate('reporter_id', 'name');

    if (!task || !task.assignee_id) {
      return { success: false, error: 'Task or assignee not found' };
    }

    const assignee = task.assignee_id;
    const daysLeft = Math.ceil((task.end_date - new Date()) / (1000 * 60 * 60 * 24));

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Task Reminder: ${task.title}</h2>
        <p>Hello ${assignee.name},</p>
        <p>This is a reminder that you have a task deadline approaching.</p>
        <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
          <p><strong>Title:</strong> ${task.title}</p>
          <p><strong>Due Date:</strong> ${new Date(task.end_date).toLocaleDateString()}</p>
          <p><strong>Days Remaining:</strong> ${daysLeft} day(s)</p>
          <p><strong>Status:</strong> ${task.status}</p>
        </div>
        <p>Please ensure the task is completed before the deadline.</p>
        <p>Best regards,<br>TaskFlow Team</p>
      </div>
    `;

    return await sendEmail({
      to: assignee.email,
      subject: `Reminder: ${task.title} - Due Soon`,
      html,
    });
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return { success: false, error: error.message };
  }
};

export const sendOverdueEmail = async (taskId) => {
  try {
    const task = await Task.findById(taskId)
      .populate('assignee_id', 'name email')
      .populate('reporter_id', 'name');

    if (!task || !task.assignee_id) {
      return { success: false, error: 'Task or assignee not found' };
    }

    const assignee = task.assignee_id;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">⚠️ Task Overdue: ${task.title}</h2>
        <p>Hello ${assignee.name},</p>
        <p>This task has passed its deadline and is now overdue.</p>
        <div style="background: #f8d7da; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc3545;">
          <p><strong>Title:</strong> ${task.title}</p>
          <p><strong>Due Date:</strong> ${new Date(task.end_date).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${task.status}</p>
        </div>
        <p>Please update the task status or contact your manager if you need assistance.</p>
        <p>Best regards,<br>TaskFlow Team</p>
      </div>
    `;

    return await sendEmail({
      to: assignee.email,
      subject: `⚠️ Overdue Task: ${task.title}`,
      html,
    });
  } catch (error) {
    console.error('Error sending overdue email:', error);
    return { success: false, error: error.message };
  }
};

