
// client/src/components/dashboard/RecentActivityCard.js
import React from 'react';
import { 
  Card, CardContent, CardHeader, Divider, List, ListItem, ListItemText, 
  ListItemAvatar, Avatar, Typography, CircularProgress, Box, Chip
} from '@mui/material';
import { 
  CheckCircleOutline as SuccessIcon,
  ErrorOutline as ErrorIcon,
  Schedule as PendingIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const RecentActivityCard = ({ title, activities, loading }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <SuccessIcon style={{ color: '#4caf50' }} />;
      case 'error':
        return <ErrorIcon style={{ color: '#f44336' }} />;
      case 'pending':
        return <PendingIcon style={{ color: '#ff9800' }} />;
      default:
        return <PendingIcon style={{ color: '#9e9e9e' }} />;
    }
  };

  const formatTime = (time) => {
    const date = new Date(time);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} นาทีที่แล้ว`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} ชั่วโมงที่แล้ว`;
    } else {
      return format(date, 'dd MMM yyyy HH:mm', { locale: th });
    }
  };

  return (
    <Card sx={{ height: '100%', boxShadow: 3 }}>
      <CardHeader title={title} />
      <Divider />
      <CardContent sx={{ px: 0, py: 0 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {activities && activities.length > 0 ? (
              activities.slice(0, 5).map((activity, index) => (
                <React.Fragment key={activity.id || index}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar>
                        {getStatusIcon(activity.status)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="textPrimary"
                          >
                            {activity.description}
                          </Typography>
                          <br />
                          <Chip 
                            label={formatTime(activity.time)} 
                            size="small" 
                            variant="outlined"
                            style={{ marginTop: 8 }}
                          />
                        </>
                      }
                    />
                  </ListItem>
                  {index < activities.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))
            ) : (
              <Box textAlign="center" p={2}>
                <Typography variant="body2" color="textSecondary">
                  ไม่มีกิจกรรมล่าสุด
                </Typography>
              </Box>
            )}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;