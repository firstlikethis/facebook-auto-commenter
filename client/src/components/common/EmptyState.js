// client/src/components/common/EmptyState.js
import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';

const EmptyState = ({ title, description, actionText, onAction, icon }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={6}
      textAlign="center"
    >
      {icon || <InboxOutlined style={{ fontSize: 64, color: '#bdbdbd', marginBottom: '16px' }} />}
      <Typography variant="h6" color="textPrimary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        {description}
      </Typography>
      {actionText && onAction && (
        <Button variant="contained" color="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;