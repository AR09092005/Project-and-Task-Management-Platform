import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  CalendarMonth,
  AccountCircle,
  Notifications,
} from '@mui/icons-material';
import CalendarSettings from '../components/CalendarSettings';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">Settings</Typography>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<CalendarMonth />} label="Calendar" iconPosition="start" />
            <Tab icon={<AccountCircle />} label="Profile" iconPosition="start" />
            <Tab icon={<Notifications />} label="Notifications" iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <CalendarSettings />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Typography variant="h5" gutterBottom>
            Profile Settings
          </Typography>
          <Typography color="text.secondary">
            Profile settings coming soon...
          </Typography>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="h5" gutterBottom>
            Notification Settings
          </Typography>
          <Typography color="text.secondary">
            Notification preferences coming soon...
          </Typography>
        </TabPanel>
      </Box>
    </Container>
  );
};

export default Settings;
