import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

const QRCode = ({ restaurantId, restaurantName }) => {
  const qrValue = `${window.location.origin}/join/${restaurantId}`;

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${restaurantName}-qrcode.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 300,
        mx: 'auto',
      }}
    >
      <Typography variant="h6" gutterBottom>
        {restaurantName}
      </Typography>
      <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1 }}>
        <QRCodeSVG
          id="qr-code"
          value={qrValue}
          size={200}
          level="H"
          includeMargin={true}
        />
      </Box>
      <Button
        variant="contained"
        startIcon={<DownloadIcon />}
        onClick={downloadQRCode}
        sx={{ mt: 2 }}
      >
        Download QR Code
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
        Scan this QR code to join the waitlist
      </Typography>
    </Paper>
  );
};

export default QRCode; 