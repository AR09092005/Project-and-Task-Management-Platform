import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PhotoCamera,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Language as WebsiteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import axios from 'axios';

const ProfileSettings = () => {
  const { user, updateUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    phone: '',
    location: '',
    timezone: 'UTC',
    jobTitle: '',
    company: '',
    socialLinks: {
      github: '',
      linkedin: '',
      twitter: '',
      website: '',
    },
    privacySettings: {
      profileVisibility: 'team',
      showEmail: false,
      showPhone: false,
    },
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        location: user.location || '',
        timezone: user.timezone || 'UTC',
        jobTitle: user.jobTitle || '',
        company: user.company || '',
        socialLinks: {
          github: user.socialLinks?.github || '',
          linkedin: user.socialLinks?.linkedin || '',
          twitter: user.socialLinks?.twitter || '',
          website: user.socialLinks?.website || '',
        },
        privacySettings: {
          profileVisibility: user.privacySettings?.profileVisibility || 'team',
          showEmail: user.privacySettings?.showEmail || false,
          showPhone: user.privacySettings?.showPhone || false,
        },
      });
      setPreviewImage(user.profilePicture ? `http://localhost:5000${user.profilePicture}` : null);
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Please select an image file', { variant: 'error' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar('Image size should be less than 5MB', { variant: 'error' });
      return;
    }

    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload image
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await axios.post(
        'http://localhost:5000/api/auth/profile/picture',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        updateUser({ ...user, profilePicture: response.data.data.profilePicture });
        enqueueSnackbar('Profile picture updated successfully', { variant: 'success' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to upload image', {
        variant: 'error',
      });
      setPreviewImage(user.profilePicture ? `http://localhost:5000${user.profilePicture}` : null);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(profileData);
      updateUser(response.data.data);
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to update profile', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
  ];

  return (
    <Box>
      {/* Profile Picture Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Profile Picture
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={previewImage}
              alt={user?.name}
              sx={{ width: 120, height: 120 }}
            />
            {uploading && (
              <CircularProgress
                size={120}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 1,
                }}
              />
            )}
          </Box>
          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={handleImageClick}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Change Picture'}
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
              Recommended: Square image, at least 400x400px
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Max file size: 5MB (JPG, PNG, GIF)
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Basic Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              value={profileData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              value={user?.email}
              disabled
              helperText="Email cannot be changed"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bio"
              multiline
              rows={3}
              value={profileData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              helperText={`${profileData.bio.length}/500 characters`}
              inputProps={{ maxLength: 500 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={profileData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              value={profileData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="City, Country"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select
                value={profileData.timezone}
                label="Timezone"
                onChange={(e) => handleInputChange('timezone', e.target.value)}
              >
                {timezones.map((tz) => (
                  <MenuItem key={tz} value={tz}>
                    {tz}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Professional Information */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Professional Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Job Title"
              value={profileData.jobTitle}
              onChange={(e) => handleInputChange('jobTitle', e.target.value)}
              placeholder="e.g., Software Engineer"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Company"
              value={profileData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="e.g., Acme Corp"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Social Links */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Social Links
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="GitHub"
              value={profileData.socialLinks.github}
              onChange={(e) => handleNestedChange('socialLinks', 'github', e.target.value)}
              placeholder="https://github.com/username"
              InputProps={{
                startAdornment: <GitHubIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="LinkedIn"
              value={profileData.socialLinks.linkedin}
              onChange={(e) => handleNestedChange('socialLinks', 'linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/username"
              InputProps={{
                startAdornment: <LinkedInIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Twitter"
              value={profileData.socialLinks.twitter}
              onChange={(e) => handleNestedChange('socialLinks', 'twitter', e.target.value)}
              placeholder="https://twitter.com/username"
              InputProps={{
                startAdornment: <TwitterIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Website"
              value={profileData.socialLinks.website}
              onChange={(e) => handleNestedChange('socialLinks', 'website', e.target.value)}
              placeholder="https://yourwebsite.com"
              InputProps={{
                startAdornment: <WebsiteIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Privacy Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Privacy Settings
        </Typography>
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Profile Visibility</InputLabel>
            <Select
              value={profileData.privacySettings.profileVisibility}
              label="Profile Visibility"
              onChange={(e) =>
                handleNestedChange('privacySettings', 'profileVisibility', e.target.value)
              }
            >
              <MenuItem value="public">Public - Anyone can see your profile</MenuItem>
              <MenuItem value="team">Team Only - Only team members can see your profile</MenuItem>
              <MenuItem value="private">Private - Only you can see your full profile</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={profileData.privacySettings.showEmail}
                onChange={(e) =>
                  handleNestedChange('privacySettings', 'showEmail', e.target.checked)
                }
              />
            }
            label="Show email address on profile"
          />
        </Box>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={profileData.privacySettings.showPhone}
                onChange={(e) =>
                  handleNestedChange('privacySettings', 'showPhone', e.target.checked)
                }
              />
            }
            label="Show phone number on profile"
          />
        </Box>
      </Paper>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSaveProfile}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {/* Account Info */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Account Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Member Since
            </Typography>
            <Typography>{new Date(user?.createdAt).toLocaleDateString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Email Verified
            </Typography>
            <Typography>{user?.emailVerified ? 'Yes' : 'No'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Account Role
            </Typography>
            <Typography>{user?.role}</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProfileSettings;
