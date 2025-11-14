const EmptyState = ({ message = 'No data available', icon = '📋' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <div className="text-6xl mb-4">{icon}</div>
      <p className="text-lg">{message}</p>
    </div>
  );
};

export default EmptyState;

