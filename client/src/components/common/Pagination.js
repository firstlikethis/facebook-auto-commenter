// client/src/components/common/Pagination.js
import React from 'react';
import { Box, Pagination as MuiPagination, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';

const Pagination = ({ page, count, limit, onPageChange, onLimitChange, total }) => {
  return (
    <Box mt={3} display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="textSecondary">
        แสดง {Math.min((page - 1) * limit + 1, total)} - {Math.min(page * limit, total)} จาก {total} รายการ
      </Typography>
      
      <Box display="flex" alignItems="center">
        <FormControl variant="outlined" size="small" sx={{ minWidth: 80, mr: 2 }}>
          <InputLabel>แสดง</InputLabel>
          <Select
            value={limit}
            onChange={(e) => onLimitChange(e.target.value)}
            label="แสดง"
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
        
        <MuiPagination
          page={page}
          count={count}
          onChange={(event, value) => onPageChange(value)}
          color="primary"
          size="medium"
          showFirstButton
          showLastButton
        />
      </Box>
    </Box>
  );
};

export default Pagination;