import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Chip,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  AttachFile,
  CloudUpload,
  Delete,
  Download,
  InsertDriveFile,
  Image,
  PictureAsPdf,
  Description,
  Archive,
  Code,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { attachmentAPI } from '../services/api';

const FileAttachments = ({ task, onUpdate }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (task?._id) {
      fetchAttachments();
    }
  }, [task?._id]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const response = await attachmentAPI.getAll(task._id);
      setAttachments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to load attachments',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      enqueueSnackbar('File size must be less than 50MB', { variant: 'error' });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress (since axios doesn't provide real progress with our setup)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await attachmentAPI.upload(task._id, formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setAttachments([response.data.data, ...attachments]);
      enqueueSnackbar('File uploaded successfully', { variant: 'success' });

      if (onUpdate) {
        onUpdate();
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to upload file',
        { variant: 'error' }
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (attachment) => {
    if (!window.confirm(`Are you sure you want to delete "${attachment.originalName}"?`)) {
      return;
    }

    try {
      await attachmentAPI.delete(task._id, attachment._id);
      setAttachments(attachments.filter((a) => a._id !== attachment._id));
      enqueueSnackbar('File deleted successfully', { variant: 'success' });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Delete error:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to delete file',
        { variant: 'error' }
      );
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const response = await attachmentAPI.download(task._id, attachment.fileName);

      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      enqueueSnackbar('File downloaded', { variant: 'success' });
    } catch (error) {
      console.error('Download error:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to download file',
        { variant: 'error' }
      );
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <Image color="primary" />;
    if (mimeType === 'application/pdf') return <PictureAsPdf color="error" />;
    if (mimeType.includes('word') || mimeType.includes('document'))
      return <Description color="info" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel'))
      return <Description color="success" />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z'))
      return <Archive color="warning" />;
    if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html'))
      return <Code color="secondary" />;
    return <InsertDriveFile />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachFile />
            <Typography variant="h6">
              Attachments {attachments.length > 0 && `(${attachments.length})`}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="small"
          >
            Upload File
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.json,.js,.html,.css"
          />
        </Box>

        {/* Drag and Drop Zone */}
        {!uploading && attachments.length === 0 && (
          <Box
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              border: `2px dashed ${dragActive ? 'primary.main' : 'grey.400'}`,
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: dragActive ? 'action.hover' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              Drag and drop files here, or click to browse
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Maximum file size: 50MB
            </Typography>
          </Box>
        )}

        {/* Upload Progress */}
        {uploading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Uploading...
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        {/* Attachments List */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <LinearProgress />
          </Box>
        ) : attachments.length > 0 ? (
          <List>
            {attachments.map((attachment) => (
              <ListItem
                key={attachment._id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemIcon>{getFileIcon(attachment.mimeType)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {attachment.originalName}
                      </Typography>
                      <Chip label={formatFileSize(attachment.fileSize)} size="small" />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Avatar
                        src={attachment.uploadedBy?.profilePicture}
                        sx={{ width: 20, height: 20 }}
                      />
                      <Typography variant="caption">
                        {attachment.uploadedBy?.name}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        • {formatDate(attachment.createdAt)}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Download">
                    <IconButton
                      edge="end"
                      onClick={() => handleDownload(attachment)}
                      size="small"
                    >
                      <Download fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(attachment)}
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default FileAttachments;
