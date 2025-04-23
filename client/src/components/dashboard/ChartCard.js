
// client/src/components/dashboard/ChartCard.js
import React from 'react';
import { Card, CardContent, CardHeader, Divider } from '@mui/material';

const ChartCard = ({ title, children }) => {
  return (
    <Card sx={{ height: '100%', boxShadow: 3 }}>
      <CardHeader title={title} />
      <Divider />
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default ChartCard;