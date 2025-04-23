// client/src/components/dashboard/TopGroupsCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardHeader, Divider, List, ListItem, ListItemText, 
  ListItemSecondaryAction, Box, Typography, LinearProgress
} from '@mui/material';

const TopGroupsCard = ({ topGroups }) => {
  const navigate = useNavigate();
  
  // หาค่าสูงสุดเพื่อใช้ในการคำนวณเปอร์เซ็นต์
  const maxCount = topGroups?.length ? Math.max(...topGroups.map(group => group.count)) : 0;
  
  return (
    <Card sx={{ height: '100%', boxShadow: 3 }}>
      <CardHeader title="กลุ่มยอดนิยม" />
      <Divider />
      <CardContent sx={{ px: 0, py: 0 }}>
        <List>
          {topGroups?.length ? (
            topGroups.map((group, index) => (
              <ListItem 
                key={group._id || index}
                button
                onClick={() => navigate(`/groups/${group._id}`)}
              >
                <ListItemText
                  primary={
                    <Typography variant="body1" noWrap>
                      {group.groupName || 'ไม่ระบุชื่อกลุ่ม'}
                    </Typography>
                  }
                  secondary={
                    <Box width="100%" mt={1}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" color="textSecondary">
                          {group.count} คอมเมนต์
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {maxCount ? Math.round((group.count / maxCount) * 100) : 0}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={maxCount ? (group.count / maxCount) * 100 : 0}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))
          ) : (
            <Box textAlign="center" p={2}>
              <Typography variant="body2" color="textSecondary">
                ไม่มีข้อมูลกลุ่ม
              </Typography>
            </Box>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default TopGroupsCard;