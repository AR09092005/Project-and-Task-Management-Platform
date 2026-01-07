import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  FormControl,
  InputLabel,
  Box,
} from '@mui/material';
import {
  MoreVert,
  PersonAdd,
  Delete,
  Edit,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { projectAPI, inviteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TeamMembers = ({ project, onUpdate }) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'Member',
  });

  const handleMemberMenu = (event, member) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleChangeRole = async (newRole) => {
    try {
      await projectAPI.updateMemberRole(project._id, selectedMember.user._id, newRole);
      enqueueSnackbar('Member role updated successfully', { variant: 'success' });
      onUpdate();
    } catch (error) {
      enqueueSnackbar('Failed to update member role', { variant: 'error' });
    }
    handleCloseMenu();
  };

  const handleRemoveMember = async () => {
    if (window.confirm(`Remove ${selectedMember.user.name} from the project?`)) {
      try {
        await projectAPI.removeMember(project._id, selectedMember.user._id);
        enqueueSnackbar('Member removed successfully', { variant: 'success' });
        onUpdate();
      } catch (error) {
        enqueueSnackbar('Failed to remove member', { variant: 'error' });
      }
    }
    handleCloseMenu();
  };

  const handleSendInvite = async () => {
    try {
      const response = await inviteAPI.create(project._id, inviteData);

      // Check if email was actually sent
      if (response.data.emailSent) {
        enqueueSnackbar('Invitation sent successfully via email', { variant: 'success' });
      } else if (response.data.emailError) {
        enqueueSnackbar(
          response.data.message || 'Invite created but email failed to send',
          { variant: 'warning' }
        );
      } else {
        enqueueSnackbar('Invitation created successfully', { variant: 'success' });
      }

      setOpenInviteDialog(false);
      setInviteData({ email: '', role: 'Member' });
    } catch (error) {
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to send invitation',
        { variant: 'error' }
      );
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      Owner: 'error',
      Admin: 'warning',
      Member: 'primary',
      Viewer: 'default',
    };
    return colors[role] || 'default';
  };

  const canManageMembers = () => {
    const currentMember = project.members.find((m) => m.user._id === user._id);
    return currentMember && ['Owner', 'Admin'].includes(currentMember.role);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Team Members</Typography>
            {canManageMembers() && (
              <IconButton
                size="small"
                color="primary"
                onClick={() => setOpenInviteDialog(true)}
              >
                <PersonAdd />
              </IconButton>
            )}
          </Box>

          <List>
            {project.members.map((member) => (
              <ListItem
                key={member.user._id}
                secondaryAction={
                  canManageMembers() &&
                  member.role !== 'Owner' &&
                  member.user._id !== user._id && (
                    <IconButton
                      edge="end"
                      onClick={(e) => handleMemberMenu(e, member)}
                    >
                      <MoreVert />
                    </IconButton>
                  )
                }
              >
                <ListItemAvatar>
                  <Avatar src={member.user.profilePicture}>
                    {member.user.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.user.name}
                  secondary={member.user.email}
                />
                <Chip label={member.role} color={getRoleColor(member.role)} size="small" />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Member Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleChangeRole('Admin')}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Make Admin
        </MenuItem>
        <MenuItem onClick={() => handleChangeRole('Member')}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Make Member
        </MenuItem>
        <MenuItem onClick={() => handleChangeRole('Viewer')}>
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Make Viewer
        </MenuItem>
        <MenuItem onClick={handleRemoveMember} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Remove from Project
        </MenuItem>
      </Menu>

      {/* Invite Member Dialog */}
      <Dialog open={openInviteDialog} onClose={() => setOpenInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={inviteData.email}
            onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={inviteData.role}
              label="Role"
              onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
            >
              <MenuItem value="Admin">Admin - Can manage project and members</MenuItem>
              <MenuItem value="Member">Member - Can create and edit tasks</MenuItem>
              <MenuItem value="Viewer">Viewer - Can only view tasks</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            An invitation email will be sent to the email address above.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInviteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSendInvite}
            variant="contained"
            disabled={!inviteData.email}
          >
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TeamMembers;
