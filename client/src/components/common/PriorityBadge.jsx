const PriorityBadge = ({ priority }) => {
  const priorityConfig = {
    low: { 
      label: 'Low', 
      style: { backgroundColor: '#65A30D', color: '#1F1F1F' } 
    },
    medium: { 
      label: 'Medium', 
      style: { backgroundColor: '#D97706', color: '#1F1F1F' } 
    },
    high: { 
      label: 'High', 
      style: { backgroundColor: '#DC2626', color: '#1F1F1F' } 
    },
  };

  const config = priorityConfig[priority] || {
    label: priority,
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

export default PriorityBadge;

