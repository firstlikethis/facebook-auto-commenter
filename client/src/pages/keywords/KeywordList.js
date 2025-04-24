// client/src/pages/keywords/KeywordList.js
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Chip, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, TextField, Stack, Tooltip, Switch, FormControlLabel, 
  InputAdornment, Menu, MenuItem, ListItemIcon, ListItemText, Divider // Added Divider import here
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  FilterList as FilterIcon,
  Category as CategoryIcon,
  SortByAlpha as SortIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import { keywordService } from '../../services/keywordService';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const KeywordList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState(location.state?.search || '');
  const [filter, setFilter] = useState({
    isActive: '',
    category: ''
  });
  const [sort, setSort] = useState('-createdAt'); // Default sort by newest
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);

  // โหลดข้อมูลคำสำคัญ
  const { data, isLoading, error } = useQuery(
    ['keywords', page, limit, search, filter, sort],
    () => keywordService.getKeywords(page, limit, { 
      search,
      isActive: filter.isActive !== '' ? filter.isActive : undefined,
      category: filter.category !== '' ? filter.category : undefined,
      sort
    }),
    {
      keepPreviousData: true
    }
  );

  // โหลดหมวดหมู่คำสำคัญ
  const { data: categoriesData } = useQuery(
    'keywordCategories',
    () => keywordService.getCategories()
  );

  // Mutation สำหรับลบคำสำคัญ
  const deleteMutation = useMutation(
    (id) => keywordService.deleteKeyword(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['keywords']);
        toast.success('ลบคำสำคัญสำเร็จ');
        setOpenConfirmDelete(false);
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับเปลี่ยนสถานะคำสำคัญ
  const toggleStatusMutation = useMutation(
    (id) => keywordService.toggleKeywordStatus(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['keywords']);
        toast.success('เปลี่ยนสถานะคำสำคัญสำเร็จ');
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // รีเซ็ตหน้าเมื่อค้นหา
  };

  const handleFilterChange = (key, value) => {
    setFilter({
      ...filter,
      [key]: value
    });
    setPage(1); // รีเซ็ตหน้าเมื่อกรอง
    setFilterMenuAnchor(null);
  };

  const handleSortChange = (value) => {
    setSort(value);
    setSortMenuAnchor(null);
  };

  const handleDeleteClick = (keyword) => {
    setSelectedKeyword(keyword);
    setOpenConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    if (selectedKeyword) {
      deleteMutation.mutate(selectedKeyword._id);
    }
  };

  const handleToggleStatus = (id) => {
    toggleStatusMutation.mutate(id);
  };

  const handleMenuOpen = (event, keyword) => {
    setAnchorEl(event.currentTarget);
    setSelectedKeyword(keyword);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

  const handleSortMenuOpen = (event) => {
    setSortMenuAnchor(event.currentTarget);
  };

  const handleSortMenuClose = () => {
    setSortMenuAnchor(null);
  };

  const getSortLabel = () => {
    switch (sort) {
      case 'keyword': return 'เรียงตามคำสำคัญ (A-Z)';
      case '-keyword': return 'เรียงตามคำสำคัญ (Z-A)';
      case 'totalUses': return 'เรียงตามจำนวนการใช้ (น้อย-มาก)';
      case '-totalUses': return 'เรียงตามจำนวนการใช้ (มาก-น้อย)';
      case 'createdAt': return 'เรียงตามวันที่สร้าง (เก่า-ใหม่)';
      case '-createdAt': return 'เรียงตามวันที่สร้าง (ใหม่-เก่า)';
      default: return 'เรียงตาม...';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">
          เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
        </Typography>
      </Box>
    );
  }

  const keywords = data?.data || [];
  const totalKeywords = data?.total || 0;
  const categories = categoriesData?.data || [];

  return (
    <Box p={3}>
      <PageHeader 
        title="คำสำคัญ (Keywords)" 
        subtitle="สร้างและจัดการคำสำคัญที่จะใช้ในการคอมเมนต์อัตโนมัติ"
        actionButton={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/keywords/new')}
          >
            เพิ่มคำสำคัญ
          </Button>
        }
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="ค้นหาคำสำคัญ..."
            value={search}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FilterIcon />}
            onClick={handleFilterMenuOpen}
            size="small"
          >
            กรอง
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SortIcon />}
            onClick={handleSortMenuOpen}
            size="small"
          >
            {getSortLabel()}
          </Button>
        </Stack>
      </Paper>

      {keywords.length === 0 ? (
        <EmptyState 
          title="ไม่พบข้อมูลคำสำคัญ"
          description={search ? "ไม่พบคำสำคัญที่ตรงกับการค้นหา" : "คุณยังไม่มีคำสำคัญในระบบ กรุณาเพิ่มคำสำคัญเพื่อเริ่มใช้งาน"}
          actionText={search ? "ล้างการค้นหา" : "เพิ่มคำสำคัญ"}
          onAction={search ? () => setSearch('') : () => navigate('/keywords/new')}
          icon={<MessageIcon sx={{ fontSize: 64 }} />}
        />
      ) : (
        <>
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>คำสำคัญ</TableCell>
                  <TableCell>คำสำคัญย่อย</TableCell>
                  <TableCell>จำนวนข้อความ</TableCell>
                  <TableCell>หมวดหมู่</TableCell>
                  <TableCell>การใช้งาน</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>การดำเนินการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {keywords.map((keyword) => (
                  <TableRow key={keyword._id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {keyword.keyword}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {keyword.variations && keyword.variations.map((variation, index) => (
                          <Chip 
                            key={index} 
                            label={variation} 
                            size="small" 
                            variant="outlined"
                            sx={{ m: 0.2 }}
                          />
                        ))}
                        {(!keyword.variations || keyword.variations.length === 0) && (
                          <Typography variant="caption" color="textSecondary">
                            ไม่มีคำสำคัญย่อย
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={
                          keyword.messages 
                            ? `${keyword.messages.length} ข้อความ` 
                            : 'ไม่มีข้อความ'
                        }
                        color={keyword.messages && keyword.messages.length > 0 ? "primary" : "default"}
                        size="small"
                      />
                      {keyword.images && keyword.images.length > 0 && (
                        <Chip 
                          label={`${keyword.images.length} รูปภาพ`}
                          color="secondary"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {keyword.category ? (
                        <Chip
                          icon={<CategoryIcon fontSize="small" />}
                          label={keyword.category}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="caption" color="textSecondary">
                          ไม่มีหมวดหมู่
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ใช้งานแล้ว: {keyword.totalUses || 0} ครั้ง
                      </Typography>
                      {keyword.lastUsedAt && (
                        <Typography variant="caption" color="textSecondary">
                          ล่าสุด: {new Date(keyword.lastUsedAt).toLocaleString('th-TH')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={keyword.isActive ? <ActiveIcon /> : <InactiveIcon />}
                        label={keyword.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                        color={keyword.isActive ? 'success' : 'default'}
                        variant="outlined"
                        onClick={() => handleToggleStatus(keyword._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="แก้ไข">
                          <IconButton 
                            color="primary"
                            onClick={() => navigate(`/keywords/${keyword._id}`)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ตัวเลือกเพิ่มเติม">
                          <IconButton onClick={(e) => handleMenuOpen(e, keyword)}>
                            <MoreIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Pagination
            page={page}
            count={Math.ceil(totalKeywords / limit)}
            limit={limit}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            total={totalKeywords}
          />
        </>
      )}

      {/* เมนูตัวเลือกเพิ่มเติม */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          navigate(`/keywords/${selectedKeyword?._id}`);
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="แก้ไข" />
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          handleToggleStatus(selectedKeyword?._id);
        }}>
          <ListItemIcon>
            {selectedKeyword?.isActive ? <InactiveIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText primary={selectedKeyword?.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"} />
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          handleDeleteClick(selectedKeyword);
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="ลบ" sx={{ color: 'error.main' }} />
        </MenuItem>
      </Menu>

      {/* เมนูตัวกรอง */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterMenuClose}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">กรองตามสถานะ</Typography>
        </MenuItem>
        <MenuItem 
          selected={filter.isActive === ''}
          onClick={() => handleFilterChange('isActive', '')}
        >
          ทุกสถานะ
        </MenuItem>
        <MenuItem 
          selected={filter.isActive === 'true'}
          onClick={() => handleFilterChange('isActive', 'true')}
        >
          เปิดใช้งาน
        </MenuItem>
        <MenuItem 
          selected={filter.isActive === 'false'}
          onClick={() => handleFilterChange('isActive', 'false')}
        >
          ปิดใช้งาน
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem disabled>
          <Typography variant="subtitle2">กรองตามหมวดหมู่</Typography>
        </MenuItem>
        <MenuItem 
          selected={filter.category === ''}
          onClick={() => handleFilterChange('category', '')}
        >
          ทุกหมวดหมู่
        </MenuItem>
        {categories.map((category) => (
          <MenuItem 
            key={category}
            selected={filter.category === category}
            onClick={() => handleFilterChange('category', category)}
          >
            {category}
          </MenuItem>
        ))}
      </Menu>

      {/* เมนูการเรียงลำดับ */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={handleSortMenuClose}
      >
        <MenuItem 
          selected={sort === 'keyword'}
          onClick={() => handleSortChange('keyword')}
        >
          เรียงตามคำสำคัญ (A-Z)
        </MenuItem>
        <MenuItem 
          selected={sort === '-keyword'}
          onClick={() => handleSortChange('-keyword')}
        >
          เรียงตามคำสำคัญ (Z-A)
        </MenuItem>
        <MenuItem 
          selected={sort === 'totalUses'}
          onClick={() => handleSortChange('totalUses')}
        >
          เรียงตามจำนวนการใช้ (น้อย-มาก)
        </MenuItem>
        <MenuItem 
          selected={sort === '-totalUses'}
          onClick={() => handleSortChange('-totalUses')}
        >
          เรียงตามจำนวนการใช้ (มาก-น้อย)
        </MenuItem>
        <MenuItem 
          selected={sort === 'createdAt'}
          onClick={() => handleSortChange('createdAt')}
        >
          เรียงตามวันที่สร้าง (เก่า-ใหม่)
        </MenuItem>
        <MenuItem 
          selected={sort === '-createdAt'}
          onClick={() => handleSortChange('-createdAt')}
        >
          เรียงตามวันที่สร้าง (ใหม่-เก่า)
        </MenuItem>
      </Menu>

      {/* Dialog ยืนยันการลบ */}
      <ConfirmDialog
        open={openConfirmDelete}
        title="ยืนยันการลบคำสำคัญ"
        content={`คุณต้องการลบคำสำคัญ "${selectedKeyword?.keyword}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setOpenConfirmDelete(false)}
        isLoading={deleteMutation.isLoading}
      />
    </Box>
  );
};

export default KeywordList;