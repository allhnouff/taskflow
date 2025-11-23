const StatusBadge = ({ status }) => {
  const statusConfig = {
    upcoming: { 
      label: 'Upcoming', 
      style: { backgroundColor: '#9CA3AF', color: '#1F1F1F' } 
    },
    in_progress: { 
      label: 'In Progress', 
      style: { backgroundColor: '#FBBF24', color: '#1F1F1F' } 
    },
    not_started: {
      label: 'Not Started',
      style: { backgroundColor: '#9CA3AF', color: '#1F1F1F' }
    },
    completed: { 
      label: 'Completed', 
      style: { backgroundColor: '#65A30D', color: '#1F1F1F' } 
    },
    overdue: { 
      label: 'Overdue', 
      style: { backgroundColor: '#DC2626', color: '#FFFFFF' } 
    },
  };

  const config = statusConfig[status] || {
    label: status,
    style: { backgroundColor: '#9CA3AF', color: '#1F1F1F' },
  };

  return (
    <span 
      className="px-3 py-1 rounded-full text-xs font-medium"
      style={config.style}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;

