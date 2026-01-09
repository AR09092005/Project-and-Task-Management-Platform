import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Chip, Avatar, AvatarGroup, IconButton } from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const TableView = ({ tasks, projectId }) => {
  const navigate = useNavigate();

  const getPriorityColor = (priority) => {
    const colors = { Low: 'info', Medium: 'default', High: 'warning', Urgent: 'error' };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      'To Do': 'default',
      'In Progress': 'info',
      'In Review': 'warning',
      Done: 'success',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      field: 'title',
      headerName: 'Task',
      width: 250,
      flex: 1,
      renderCell: (params) => (
        <Box
          sx={{
            fontWeight: 500,
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
          onClick={() => navigate(`/projects/${projectId}/tasks/${params.row.id}`)}
        >
          {params.value}
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip label={params.value} color={getStatusColor(params.value)} size="small" />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 110,
      renderCell: (params) => (
        <Chip label={params.value} color={getPriorityColor(params.value)} size="small" />
      ),
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      width: 130,
      type: 'date',
      valueGetter: (params) => (params.value ? new Date(params.value) : null),
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : '-',
    },
    {
      field: 'estimatedHours',
      headerName: 'Est. Hours',
      width: 110,
      type: 'number',
      renderCell: (params) => (params.value ? `${params.value}h` : '-'),
    },
    {
      field: 'assignees',
      headerName: 'Assignees',
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <AvatarGroup max={3}>
          {params.value && params.value.length > 0 ? (
            params.value.map((assignee) => (
              <Avatar
                key={assignee._id}
                alt={assignee.name}
                src={assignee.profilePicture}
                sx={{ width: 28, height: 28 }}
              />
            ))
          ) : (
            <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>-</Box>
          )}
        </AvatarGroup>
      ),
    },
    {
      field: 'tags',
      headerName: 'Tags',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {params.value && params.value.length > 0 ? (
            params.value.slice(0, 2).map((tag, idx) => (
              <Chip key={idx} label={tag} size="small" variant="outlined" />
            ))
          ) : (
            <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>-</Box>
          )}
          {params.value && params.value.length > 2 && (
            <Chip label={`+${params.value.length - 2}`} size="small" variant="outlined" />
          )}
        </Box>
      ),
    },
    {
      field: 'dependencies',
      headerName: 'Dependencies',
      width: 120,
      type: 'number',
      valueGetter: (params) => (params.value ? params.value.length : 0),
      renderCell: (params) => (params.value > 0 ? params.value : '-'),
    },
    {
      field: 'subtasks',
      headerName: 'Subtasks',
      width: 110,
      sortable: false,
      renderCell: (params) => {
        if (!params.value || params.value.length === 0) return '-';
        const completed = params.value.filter((st) => st && st.status === 'Done').length;
        return `${completed}/${params.value.length}`;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 90,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => navigate(`/projects/${projectId}/tasks/${params.row.id}`)}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const rows = tasks.map((task) => ({
    id: task._id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    assignees: task.assignees,
    tags: task.tags,
    dependencies: task.dependencies,
    subtasks: task.subtasks,
  }));

  return (
    <Box sx={{ height: '70vh', width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 25 },
          },
          sorting: {
            sortModel: [{ field: 'dueDate', sort: 'asc' }],
          },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        checkboxSelection
        disableRowSelectionOnClick
        sx={{
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #e0e0e0',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f5f5',
            borderBottom: '2px solid #e0e0e0',
            fontWeight: 600,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: '#f5f9ff',
          },
        }}
      />
    </Box>
  );
};

export default TableView;
