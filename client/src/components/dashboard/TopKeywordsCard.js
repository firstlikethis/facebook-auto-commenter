// client/src/components/dashboard/TopKeywordsCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardHeader, Divider, List, ListItem, 
  Chip, Box, Typography, LinearProgress
} from '@mui/material';

const TopKeywordsCard = ({ topKeywords }) => {
  const navigate = useNavigate();
  
  // หาค่าสูงสุดเพื่อใช้ในการคำนวณเปอร์เซ็นต์
  const maxCount = topKeywords?.length ? Math.max(...topKeywords.map(keyword => keyword.count)) : 0;
  
  return (
    <Card sx={{ height: '100%', boxShadow: 3 }}>
      <CardHeader title="คำสำคัญยอดนิยม" />
      <Divider />
      <CardContent sx={{ px: 0, py: 0 }}>
        <List>
          {topKeywords?.length ? (
            topKeywords.map((keyword, index) => (
              <ListItem 
                key={keyword._id || index}
                sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
              >
                <Box width="100%" display="flex" alignItems="center" mb={1}>
                  <Chip 
                    label={keyword._id || 'ไม่ระบุคำสำคัญ'} 
                    color="primary" 
                    variant="outlined" 
                    clickable
                    onClick={() => navigate('/keywords', { 
                      state: { search: keyword._id } 
                    })}
                  />
                  <Typography variant="body2" color="textSecondary" ml={1}>
                    {keyword.count} ครั้ง
                  </Typography>
                </Box>
                <Box width="100%">
                  <LinearProgress 
                    variant="determinate" 
                    value={maxCount ? (keyword.count / maxCount) * 100 : 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              </ListItem>
            ))
          ) : (
            <Box textAlign="center" p={2}>
              <Typography variant="body2" color="textSecondary">
                ไม่มีข้อมูลคำสำคัญ
              </Typography>
            </Box>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default TopKeywordsCard;