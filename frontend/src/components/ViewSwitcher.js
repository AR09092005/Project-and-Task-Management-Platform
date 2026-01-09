import React from 'react';
import { ToggleButtonGroup, ToggleButton, Box } from '@mui/material';
import {
  ViewList,
  ViewKanban,
  ViewTimeline,
  CalendarMonth,
  TableChart,
} from '@mui/icons-material';

const ViewSwitcher = ({ currentView, onViewChange }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
      <ToggleButtonGroup
        value={currentView}
        exclusive
        onChange={(e, newView) => newView && onViewChange(newView)}
        aria-label="view mode"
        sx={{
          bgcolor: 'background.paper',
          '& .MuiToggleButton-root': {
            py: 1,
            px: 2,
            border: 1,
            borderColor: 'divider',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            },
          },
        }}
      >
        <ToggleButton value="list" aria-label="list view">
          <ViewList sx={{ mr: 1 }} />
          List
        </ToggleButton>
        <ToggleButton value="kanban" aria-label="kanban view">
          <ViewKanban sx={{ mr: 1 }} />
          Kanban
        </ToggleButton>
        <ToggleButton value="gantt" aria-label="gantt view">
          <ViewTimeline sx={{ mr: 1 }} />
          Gantt
        </ToggleButton>
        <ToggleButton value="calendar" aria-label="calendar view">
          <CalendarMonth sx={{ mr: 1 }} />
          Calendar
        </ToggleButton>
        <ToggleButton value="table" aria-label="table view">
          <TableChart sx={{ mr: 1 }} />
          Table
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ViewSwitcher;
