
// client/src/components/dashboard/ActiveTasksCard.js
import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardHeader, Divider, List, ListItem, ListItemText, 
  CircularProgress, Box, Typography, Button, Chip
} from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import { format } from 'date-fns';

import { scanTaskService } from '../../services/scanTaskService';

const ActiveTasksCard = () => {
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useQuery(
    'activeTasks',
    () => scanTaskService.getActiveTasks(),
    {
      refetchInterval: 10000
    }
  );
  
  return (
    <Card sx={{ height: '100%', boxShadow: 3 }}>
      <CardHeader 
        title="งานที่กำลังทำงาน"
        action={
          <Button 
            variant="contained" 
            color="primary" 
            size="small"
            startIcon={<PlayIcon />}
            onClick={() => navigate('/tasks')}
          >
            สร้างงานใหม่
          </Button>
        }
      />
      <Divider />
      <CardContent sx={{ px: 0, py: 0 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box textAlign="center" p={2}>
            <Typography variant="body2" color="error">
              เกิดข้อผิดพลาดในการโหลดข้อมูล
            </Typography>
          </Box>
        ) : (
          <List>
            {data?.data?.length ? (
              data.data.slice(0, 5).map((task, index) => (
                <React.Fragment key={task._id}>
                  <ListItem button onClick={() => navigate(`/tasks/${task._id}`)}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center">
                          <Typography variant="body1" noWrap>
                            {task.groups.length > 1 
                              ? `สแกน ${task.groups.length} กลุ่ม` 
                              : `สแกนกลุ่ม ${task.groups[0]?.name || 'ไม่ระบุชื่อ'}`}
                          </Typography>
                          <Chip 
                            label={`${task.results?.totalPostsScanned || 0} โพสต์`} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary">
                          เริ่ม: {format(new Date(task.startTime), 'HH:mm:ss')} | 
                          คอมเมนต์: {task.results?.totalCommentsPosted || 0}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < data.data.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))
            ) : (
              <Box textAlign="center" p={2}>
                <Typography variant="body2" color="textSecondary">
                  ไม่มีงานที่กำลังทำงานอยู่
                </Typography>
              </Box>
            )}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveTasksCard;