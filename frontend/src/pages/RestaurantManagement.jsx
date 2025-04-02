import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import QRCode from '../components/QRCode';
import useWaitlistStore from '../store/waitlistStore';

const RestaurantManagement = () => {
  const {
    currentWaitlist,
    isLoading,
    error,
    fetchWaitlist,
    removeEntry,
    updateStatus,
    updatePosition,
  } = useWaitlistStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [settings, setSettings] = useState({
    maxWaitlistSize: 20,
    refundWindowMinutes: 30,
    currentWaitTime: 15,
  });

  useEffect(() => {
    // In production, fetch waitlist for the logged-in restaurant
    fetchWaitlist('some-restaurant-id');
  }, []);

  const handleOpenDialog = (entry = null) => {
    if (entry) {
      setSelectedEntry(entry);
    } else {
      setSelectedEntry(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEntry(null);
  };

  const handleOpenSettings = () => {
    setOpenSettings(true);
  };

  const handleCloseSettings = () => {
    setOpenSettings(false);
  };

  const handleStatusChange = async (entryId, newStatus) => {
    await updateStatus(entryId, newStatus);
  };

  const handlePositionChange = async (entryId, newPosition) => {
    await updatePosition(entryId, newPosition);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Restaurant Dashboard</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={handleOpenSettings}
            sx={{ mr: 2 }}
          >
            Settings
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Entry
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              QR Code
            </Typography>
            <QRCode
              restaurantId="some-restaurant-id"
              restaurantName="Sample Restaurant"
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Current Waitlist
            </Typography>
            <List>
              {currentWaitlist.map((entry) => (
                <ListItem key={entry.id}>
                  <ListItemText
                    primary={entry.customer_name}
                    secondary={`Party of ${entry.party_size} - Position: ${entry.position}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleOpenDialog(entry)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => removeEntry(entry.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Settings Dialog */}
      <Dialog open={openSettings} onClose={handleCloseSettings}>
        <DialogTitle>Restaurant Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>Maximum Waitlist Size</Typography>
            <Slider
              value={settings.maxWaitlistSize}
              onChange={(e, value) =>
                setSettings({ ...settings, maxWaitlistSize: value })
              }
              min={5}
              max={50}
              marks
              valueLabelDisplay="auto"
            />
            <Typography gutterBottom>Refund Window (minutes)</Typography>
            <Slider
              value={settings.refundWindowMinutes}
              onChange={(e, value) =>
                setSettings({ ...settings, refundWindowMinutes: value })
              }
              min={15}
              max={60}
              step={15}
              marks
              valueLabelDisplay="auto"
            />
            <Typography gutterBottom>Current Wait Time (minutes)</Typography>
            <Slider
              value={settings.currentWaitTime}
              onChange={(e, value) =>
                setSettings({ ...settings, currentWaitTime: value })
              }
              min={0}
              max={120}
              step={5}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettings}>Cancel</Button>
          <Button onClick={handleCloseSettings} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Entry Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedEntry ? 'Edit Entry' : 'Add New Entry'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              defaultValue={selectedEntry?.customer_name}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Party Size"
              type="number"
              defaultValue={selectedEntry?.party_size}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone Number"
              defaultValue={selectedEntry?.phone_number}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Position"
              type="number"
              defaultValue={selectedEntry?.position}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                defaultValue={selectedEntry?.status || 'waiting'}
                label="Status"
              >
                <MenuItem value="waiting">Waiting</MenuItem>
                <MenuItem value="seated">Seated</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCloseDialog} variant="contained">
            {selectedEntry ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RestaurantManagement; 