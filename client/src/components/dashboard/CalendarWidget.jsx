import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfDay } from 'date-fns';
import { tasksAPI } from '../../services/api';
import DateTasksModal from '../common/DateTasksModal';

const CalendarWidget = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  // Adjust to start week on Monday
  const firstDayOfMonth = (monthStart.getDay() + 6) % 7; // Convert Sunday (0) to 6, Monday (1) to 0
  const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  
  // Create array with empty cells for days before month starts
  // Add days from previous month to fill the first week
  const calendarDays = [];
  if (firstDayOfMonth > 0) {
    const prevMonthEnd = new Date(monthStart);
    prevMonthEnd.setDate(0); // Last day of previous month
    const daysToAdd = firstDayOfMonth;
    for (let i = daysToAdd - 1; i >= 0; i--) {
      const date = new Date(prevMonthEnd);
      date.setDate(prevMonthEnd.getDate() - i);
      calendarDays.push(date);
    }
  }
  calendarDays.push(...daysInMonth);
  
  // Fill remaining days to complete the grid (42 cells for 6 weeks)
  const remainingDays = 42 - calendarDays.length;
  if (remainingDays > 0) {
    const nextMonthStart = new Date(monthEnd);
    nextMonthStart.setDate(monthEnd.getDate() + 1);
    for (let i = 0; i < remainingDays; i++) {
      const date = new Date(nextMonthStart);
      date.setDate(nextMonthStart.getDate() + i);
      calendarDays.push(date);
    }
  }
  
  // Fetch all tasks to show indicators on calendar
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'calendar', { limit: 500 }],
    queryFn: async () => {
      const response = await tasksAPI.getTasks({ limit: 500 });
      return response.data.data.tasks || [];
    },
  });

  const tasks = tasksData || [];
  
  // Create a map of dates to task counts
  const tasksByDate = new Map();
  tasks.forEach((task) => {
    if (task.end_date) {
      const taskDate = startOfDay(new Date(task.end_date));
      const dateKey = format(taskDate, 'yyyy-MM-dd');
      if (!tasksByDate.has(dateKey)) {
        tasksByDate.set(dateKey, []);
      }
      tasksByDate.get(dateKey).push(task);
    }
  });
  
  const today = new Date();
  
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDayClick = (day) => {
    if (!isSameMonth(day, currentDate)) return; // Don't allow clicking on days from other months
    
    const dateKey = format(startOfDay(day), 'yyyy-MM-dd');
    setSelectedDate(dateKey);
  };

  const getTasksForDay = (day) => {
    const dateKey = format(startOfDay(day), 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <h3 className="font-bold text-lg text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} className="text-gray-600" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
        
        {calendarDays.map((day, index) => {
          const isToday = isSameDay(day, today);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const dayTasks = getTasksForDay(day);
          const hasTasks = dayTasks.length > 0;
          
          // Count tasks by status for visual indicators
          const completedCount = dayTasks.filter(t => t.status === 'completed').length;
          const inProgressCount = dayTasks.filter(t => t.status === 'in_progress').length;
          const overdueCount = dayTasks.filter(t => t.status === 'overdue').length;
          const upcomingCount = dayTasks.filter(t => t.status === 'upcoming').length;
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className={`h-12 flex flex-col items-center justify-center text-sm rounded-lg transition-all relative ${
                isToday
                  ? 'bg-primary-500 text-brown-dark font-bold shadow-md hover:bg-primary-600'
                  : isCurrentMonth
                  ? 'text-gray-900 hover:bg-primary-50 hover:text-primary-600 cursor-pointer font-medium'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              disabled={!isCurrentMonth}
              title={hasTasks ? `${dayTasks.length} task(s) on ${format(day, 'MMM dd, yyyy')}` : `No tasks on ${format(day, 'MMM dd, yyyy')}`}
            >
              <span>{format(day, 'd')}</span>
              {hasTasks && isCurrentMonth && (
                <div className="flex gap-0.5 mt-0.5">
                  {overdueCount > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" title={`${overdueCount} overdue`}></div>
                  )}
                  {inProgressCount > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" title={`${inProgressCount} in progress`}></div>
                  )}
                  {upcomingCount > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`${upcomingCount} upcoming`}></div>
                  )}
                  {completedCount > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" title={`${completedCount} completed`}></div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <DateTasksModal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default CalendarWidget;

