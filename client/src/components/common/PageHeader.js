// client/src/components/common/PageHeader.js
import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

const PageHeader = ({ title, subtitle, actionButton }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box>
          <Typography variant="h5" component="h1" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {actionButton && <Box>{actionButton}</Box>}
      </Box>
      <Divider />
    </Box>
  );
};

export default PageHeader;