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
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import useWaitlistStore from '../store/waitlistStore';

const Dashboard = () => {
  const {
    currentWaitlist,
    isLoading,
    error,
    fetchWaitlist,
    removeEntry,
    updateStatus,
  } = useWaitlistStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    party_size: '',
    phone_number: '',
    notes: '',
  });

  useEffect(() => {
    // In production, fetch waitlist for the logged-in user
    fetchWaitlist('some-restaurant-id');
  }, []);

  const handleOpenDialog = (entry = null) => {
    if (entry) {
      setSelectedEntry(entry);
      setFormData({
        customer_name: entry.customer_name,
        party_size: entry.party_size.toString(),
        phone_number: entry.phone_number,
        notes: entry.notes || '',
      });
    } else {
      setSelectedEntry(null);
      setFormData({
        customer_name: '',
        party_size: '',
        phone_number: '',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEntry(null);
  };

  const handleSubmit = async () => {
    // In production, handle form submission
    handleCloseDialog();
  };

  const handleStatusChange = async (entryId, newStatus) => {
    await updateStatus(entryId, newStatus);
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
        <Typography variant="h4">My Waitlists</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Join Waitlist
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {currentWaitlist.map((entry) => (
          <Grid item xs={12} md={6} key={entry.id}>
            <Paper sx={{ p: 2 }}>
              <List>
                <ListItem>
                  <ListItemText
                    primary={entry.customer_name}
                    secondary={`Party of ${entry.party_size}`}
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
                <ListItem>
                  <ListItemText
                    secondary={`Status: ${entry.status}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    secondary={`Phone: ${entry.phone_number}`}
                  />
                </ListItem>
                {entry.notes && (
                  <ListItem>
                    <ListItemText
                      secondary={`Notes: ${entry.notes}`}
                    />
                  </ListItem>
                )}
              </List>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleStatusChange(entry.id, 'seated')}
                >
                  Mark as Seated
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleStatusChange(entry.id, 'cancelled')}
                >
                  Cancel
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedEntry ? 'Edit Waitlist Entry' : 'Join Waitlist'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.customer_name}
              onChange={(e) =>
                setFormData({ ...formData, customer_name: e.target.value })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Party Size"
              type="number"
              value={formData.party_size}
              onChange={(e) =>
                setFormData({ ...formData, party_size: e.target.value })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone_number}
              onChange={(e) =>
                setFormData({ ...formData, phone_number: e.target.value })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedEntry ? 'Update' : 'Join'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard; 