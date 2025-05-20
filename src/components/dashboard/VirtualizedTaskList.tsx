import { FixedSizeList as List } from 'react-window';
import TaskCard from './TaskCard';
import { Task } from '../../types/supabase';

interface VirtualizedTaskListProps {
  tasks: Task[];
  onTaskUpdate: (updatedTask: Task) => void;
  onTaskDelete: (taskId: string) => void;
}

const VirtualizedTaskList = ({ tasks, onTaskUpdate, onTaskDelete }: VirtualizedTaskListProps) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <TaskCard
        task={tasks[index]}
        onTaskUpdate={onTaskUpdate}
        onTaskDelete={onTaskDelete}
      />
    </div>
  );
  
  // Don't render the virtualized list if there are too few items
  if (tasks.length < 10) {
    return (
      <div>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onTaskUpdate={onTaskUpdate}
            onTaskDelete={onTaskDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <List
      height={Math.min(500, tasks.length * 100)} // Adjust based on average card height
      itemCount={tasks.length}
      itemSize={100} // Adjust based on your card size
      width="100%"
      className="overflow-auto"
    >
      {Row}
    </List>
  );
};

export default VirtualizedTaskList;