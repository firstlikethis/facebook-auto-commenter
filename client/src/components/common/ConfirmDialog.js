// client/src/components/common/ConfirmDialog.js
import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress } from '@mui/material';

const ConfirmDialog = ({ open, title, content, onConfirm, onCancel, isLoading, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก', confirmColor = 'primary' }) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          color={confirmColor} 
          variant="contained" 
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;