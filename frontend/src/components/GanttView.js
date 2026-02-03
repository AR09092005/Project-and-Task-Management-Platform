import React, { useState, useEffect, useRef } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import {
  Box,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Typography,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { taskAPI } from '../services/api';

const GanttView = ({ tasks, projectId, onTaskUpdate }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const ganttRef = useRef(null);
  const [viewMode, setViewMode] = useState(ViewMode.Day);
  const [ganttTasks, setGanttTasks] = useState([]);

  useEffect(() => {
    convertTasksToGanttFormat();
  }, [tasks]);

  const convertTasksToGanttFormat = () => {
    // Filter out tasks without valid due dates
    const validTasks = tasks.filter((task) => {
      if (!task.dueDate) return false;
      const date = new Date(task.dueDate);
      return date instanceof Date && !isNaN(date.getTime());
    });

    const formatted = validTasks.map((task) => {
      // Parse dates safely
      const dueDate = new Date(task.dueDate);
      const startDate = task.startDate ? new Date(task.startDate) : null;

      // Calculate start: use startDate if valid, otherwise 7 days before due date
      let start;
      if (startDate && !isNaN(startDate.getTime())) {
        start = startDate;
      } else {
        start = new Date(Math.max(dueDate.getTime() - 7 * 24 * 60 * 60 * 1000, new Date().getTime()));
      }

      const end = dueDate;

      // Ensure start is before end
      if (start >= end) {
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000); // 1 day before end
      }

      // Final validation - ensure both dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn(`Invalid dates for task ${task._id}, skipping`);
        return null;
      }

      // Calculate progress based on subtasks or status
      let progress = 0;
      if (task.subtasks && task.subtasks.length > 0) {
        const completedSubtasks = task.subtasks.filter((st) => st && st.status === 'Done').length;
        progress = (completedSubtasks / task.subtasks.length) * 100;
      } else {
        // Calculate progress based on status
        const statusProgress = {
          'To Do': 0,
          'In Progress': 50,
          'In Review': 75,
          Done: 100,
        };
        progress = statusProgress[task.status] || 0;
      }

      return {
        id: task._id,
        name: task.title,
        start,
        end,
        progress,
        type: 'task',
        project: projectId,
        dependencies: task.dependencies
          ? task.dependencies
              .filter((dep) => dep.task && dep.dependencyType === 'blocks')
              .map((dep) => dep.task._id || dep.task)
          : [],
        styles: {
          backgroundColor: getColorByPriority(task.priority),
          backgroundSelectedColor: getColorByPriority(task.priority),
          progressColor: getProgressColor(task.status),
          progressSelectedColor: getProgressColor(task.status),
        },
      };
    }).filter(task => task !== null); // Remove any null entries from invalid dates

    setGanttTasks(formatted);
  };

  const getColorByPriority = (priority) => {
    const colors = {
      Low: '#64b5f6',
      Medium: '#ffa726',
      High: '#ef5350',
      Urgent: '#d32f2f',
    };
    return colors[priority] || '#64b5f6';
  };

  const getProgressColor = (status) => {
    const colors = {
      'To Do': '#bdbdbd',
      'In Progress': '#42a5f5',
      'In Review': '#ffa726',
      Done: '#66bb6a',
    };
    return colors[status] || '#bdbdbd';
  };

  const handleTaskChange = async (task) => {
    try {
      const originalTask = tasks.find((t) => t._id === task.id);
      if (!originalTask) return;

      const updateData = {
        dueDate: task.end.toISOString(),
      };

      await taskAPI.update(task.id, updateData);
      if (onTaskUpdate) onTaskUpdate();
      enqueueSnackbar('Task updated successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to update task', { variant: 'error' });
      // Revert changes
      convertTasksToGanttFormat();
    }
  };

  const handleProgressChange = async (task) => {
    try {
      // Update task progress based on new percentage
      const newProgress = Math.round(task.progress);
      let newStatus = 'To Do';

      if (newProgress === 100) {
        newStatus = 'Done';
      } else if (newProgress >= 75) {
        newStatus = 'In Review';
      } else if (newProgress > 0) {
        newStatus = 'In Progress';
      }

      await taskAPI.update(task.id, { status: newStatus });
      if (onTaskUpdate) onTaskUpdate();
      enqueueSnackbar('Task progress updated', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to update progress', { variant: 'error' });
      convertTasksToGanttFormat();
    }
  };

  const handleDoubleClick = (task) => {
    navigate(`/projects/${projectId}/tasks/${task.id}`);
  };

  const exportToPDF = async () => {
    try {
      const ganttElement = ganttRef.current;
      if (!ganttElement) return;

      enqueueSnackbar('Generating PDF...', { variant: 'info' });

      const canvas = await html2canvas(ganttElement, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`gantt-chart-${Date.now()}.pdf`);

      enqueueSnackbar('PDF exported successfully', { variant: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      enqueueSnackbar('Failed to export PDF', { variant: 'error' });
    }
  };

  const exportToPNG = async () => {
    try {
      const ganttElement = ganttRef.current;
      if (!ganttElement) return;

      enqueueSnackbar('Generating PNG...', { variant: 'info' });

      const canvas = await html2canvas(ganttElement, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gantt-chart-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
        enqueueSnackbar('PNG exported successfully', { variant: 'success' });
      });
    } catch (error) {
      console.error('Export error:', error);
      enqueueSnackbar('Failed to export PNG', { variant: 'error' });
    }
  };

  if (ganttTasks.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary">
          No tasks with due dates to display in Gantt chart
        </Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && setViewMode(newMode)}
          size="small"
        >
          <ToggleButton value={ViewMode.Hour}>Hour</ToggleButton>
          <ToggleButton value={ViewMode.QuarterDay}>Quarter Day</ToggleButton>
          <ToggleButton value={ViewMode.HalfDay}>Half Day</ToggleButton>
          <ToggleButton value={ViewMode.Day}>Day</ToggleButton>
          <ToggleButton value={ViewMode.Week}>Week</ToggleButton>
          <ToggleButton value={ViewMode.Month}>Month</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={exportToPNG}
          >
            Export PNG
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={exportToPDF}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      <Box ref={ganttRef} sx={{ overflow: 'auto' }}>
        {ganttTasks.length > 0 ? (
          <Gantt
            tasks={ganttTasks}
            viewMode={viewMode}
            onDateChange={handleTaskChange}
            onProgressChange={handleProgressChange}
            onDoubleClick={handleDoubleClick}
            listCellWidth="200px"
            columnWidth={viewMode === ViewMode.Month ? 300 : viewMode === ViewMode.Week ? 250 : 65}
            rowHeight={50}
            barCornerRadius={5}
            barProgressColor="#ffffff"
            barProgressSelectedColor="#ffffff"
            arrowColor="#999"
            arrowIndent={20}
            todayColor="rgba(252, 248, 227, 0.5)"
            fontSize="14px"
            fontFamily="Inter, Roboto, Helvetica, Arial, sans-serif"
          />
        ) : (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No valid tasks to display in Gantt chart
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default GanttView;
