/**
 * ScheduleCard - Irrigation schedule visibility
 */

interface ScheduleCardProps {
  lastIrrigationAt: number | null;
  nextIrrigationAt: number | null;
  irrigationIntervalHours: number;
}

export function ScheduleCard({
  lastIrrigationAt,
  nextIrrigationAt,
  irrigationIntervalHours,
}: ScheduleCardProps) {
  const formatTimeDiff = (timestamp: number | null, isFuture: boolean = false): string => {
    if (!timestamp) return 'Unknown';
    
    const diffMs = isFuture ? timestamp - Date.now() : Date.now() - timestamp;
    const diffMin = Math.floor(diffMs / (60 * 1000));
    
    if (diffMin < 0) return 'Overdue';
    if (diffMin < 1) return isFuture ? 'Soon' : 'Just now';
    if (diffMin < 60) return `${diffMin}m ${isFuture ? '' : 'ago'}`;
    
    const diffHours = Math.floor(diffMin / 60);
    const remainingMin = diffMin % 60;
    
    if (diffHours < 24) {
      return `${diffHours}h ${remainingMin}m ${isFuture ? '' : 'ago'}`;
    }
    
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Generate schedule dots for last 24 hours
  const generateScheduleDots = () => {
    const dots = [];
    const now = Date.now();
    const hoursBack = 24;
    
    for (let i = 0; i < hoursBack / irrigationIntervalHours; i++) {
      const dotTime = now - (i * irrigationIntervalHours * 60 * 60 * 1000);
      const hour = new Date(dotTime).getHours();
      dots.unshift({ hour, isPast: i > 0 });
    }
    
    return dots.slice(-6); // Show last 6 irrigation points
  };

  const scheduleDots = generateScheduleDots();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
        Irrigation Schedule
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Last watering:</span>
          <span className="font-medium text-gray-900">
            {formatTimeDiff(lastIrrigationAt)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Next watering:</span>
          <span className="font-medium text-green-600">
            {nextIrrigationAt ? `in ${formatTimeDiff(nextIrrigationAt, true)}` : 'Scheduled'}
          </span>
        </div>
        
        <div className="pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center mb-2">
            {scheduleDots.map((dot, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    dot.isPast ? 'bg-blue-500' : 'bg-blue-200'
                  }`}
                />
                <span className="text-xs text-gray-400 mt-1">
                  {dot.hour}:00
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-200 rounded relative">
            <div 
              className="h-full bg-blue-500 rounded"
              style={{ width: '70%' }}
            />
          </div>
        </div>
        
        <p className="text-xs text-gray-400">
          Every {irrigationIntervalHours} hours
        </p>
      </div>
    </div>
  );
}
