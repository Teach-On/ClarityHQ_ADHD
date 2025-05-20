import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { Database } from '../../types/supabase';

type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'];

interface CalendarEventCardProps {
  event: CalendarEvent;
  expanded?: boolean;
}

const CalendarEventCard = ({ event, expanded = false }: CalendarEventCardProps) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);
  
  // Check if this is an all-day event
  const isAllDay = startTime.getHours() === 0 && 
                   startTime.getMinutes() === 0 && 
                   endTime.getHours() === 23 && 
                   endTime.getMinutes() === 59;
  
  // Format the event time display
  const getTimeDisplay = () => {
    if (isAllDay) {
      return 'All day';
    }
    
    return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
  };
  
  // Format the date display
  const getDateDisplay = () => {
    if (isToday(startTime)) {
      return 'Today';
    }
    
    return format(startTime, 'EEEE, MMM d');
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Calendar className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900 dark:text-white truncate">
                {event.title}
              </h3>
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="ml-2 flex-shrink-0 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                aria-label={isExpanded ? 'Collapse event details' : 'Expand event details'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </div>
            
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                {getTimeDisplay()}
              </div>
              
              <div>
                {getDateDisplay()}
              </div>
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pl-10"
          >
            {event.location && (
              <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="mr-1 h-3 w-3 flex-shrink-0" />
                <span className="break-words">{event.location}</span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CalendarEventCard;