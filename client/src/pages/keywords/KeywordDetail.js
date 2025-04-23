// client/src/pages/keywords/KeywordDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box, Typography, Button, CircularProgress, Paper, Grid, TextField,
  Chip, Tab, Tabs, Divider, Stack, IconButton, Card, CardContent,
  CardActions, FormControlLabel, Switch, InputAdornment, Alert,
  Dialog, DialogActions, DialogContent, DialogTitle, Input
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  AddPhotoAlternate as ImageIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import { keywordService } from '../../services/keywordService';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';

const KeywordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewKeyword = id === 'new';
  const [activeTab, setActiveTab] = useState(0);
  const [keyword, setKeyword] = useState({
    keyword: '',
    variations: [''],
    messages: [{ content: '', weight: 1 }],
    images: [],
    category: '',
    isActive: true,
    priority: 0,
    minTimeBetweenUses: 3600
  });
  const [newVariation, setNewVariation] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState(null);

  // โหลดข้อมูลคำสำคัญ (กรณีแก้ไข)
  const { data, isLoading, error } = useQuery(
    ['keyword', id],
    () => keywordService.getKeyword(id),
    {
      enabled: !isNewKeyword,
      onSuccess: (data) => {
        setKeyword(data);
        
        // ตรวจสอบและเพิ่มค่าเริ่มต้นถ้าไม่มี
        if (!data.variations || data.variations.length === 0) {
          setKeyword(prev => ({ ...prev, variations: [''] }));
        }
        if (!data.messages || data.messages.length === 0) {
          setKeyword(prev => ({ ...prev, messages: [{ content: '', weight: 1 }] }));
        }
      }
    }
  );

  // Mutation สำหรับบันทึกคำสำคัญ
  const saveMutation = useMutation(
    (keywordData) => isNewKeyword 
      ? keywordService.createKeyword(keywordData)
      : keywordService.updateKeyword(id, keywordData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['keywords']);
        toast.success(`${isNewKeyword ? 'เพิ่ม' : 'อัปเดต'}คำสำคัญสำเร็จ`);
        
        if (isNewKeyword) {
          navigate(`/keywords/${data._id}`);
        }
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับอัปโหลดรูปภาพ
  const uploadMutation = useMutation(
    (formData) => keywordService.uploadImage(id, formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['keyword', id]);
        toast.success('อัปโหลดรูปภาพสำเร็จ');
        setUploadDialogOpen(false);
        setSelectedFilePreview(null);
        setSelectedImage(null);
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาดในการอัปโหลด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับลบรูปภาพ
  const deleteImageMutation = useMutation(
    ({ keywordId, imageId }) => keywordService.deleteImage(keywordId, imageId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['keyword', id]);
        toast.success('ลบรูปภาพสำเร็จ');
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setKeyword(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setKeyword(prev => ({ ...prev, [name]: checked }));
  };

  const handleVariationChange = (index, value) => {
    const newVariations = [...keyword.variations];
    newVariations[index] = value;
    setKeyword(prev => ({ ...prev, variations: newVariations }));
  };

  const handleAddVariation = () => {
    if (!newVariation.trim()) return;
    
    setKeyword(prev => ({
      ...prev,
      variations: [...prev.variations.filter(v => v.trim()), newVariation]
    }));
    setNewVariation('');
  };

  const handleRemoveVariation = (index) => {
    const newVariations = [...keyword.variations];
    newVariations.splice(index, 1);
    
    // ถ้าลบหมดให้เพิ่มช่องว่างไว้
    if (newVariations.length === 0) {
      newVariations.push('');
    }
    
    setKeyword(prev => ({ ...prev, variations: newVariations }));
  };

  const handleMessageChange = (index, field, value) => {
    const newMessages = [...keyword.messages];
    newMessages[index] = { ...newMessages[index], [field]: value };
    setKeyword(prev => ({ ...prev, messages: newMessages }));
  };

  const handleAddMessage = () => {
    if (!newMessage.trim()) return;
    
    setKeyword(prev => ({
      ...prev,
      messages: [...prev.messages, { content: newMessage, weight: 1 }]
    }));
    setNewMessage('');
  };

  const handleRemoveMessage = (index) => {
    const newMessages = [...keyword.messages];
    newMessages.splice(index, 1);
    
    // ถ้าลบหมดให้เพิ่มช่องว่างไว้
    if (newMessages.length === 0) {
      newMessages.push({ content: '', weight: 1 });
    }
    
    setKeyword(prev => ({ ...prev, messages: newMessages }));
  };

  const handleSaveKeyword = () => {
    // ตรวจสอบข้อมูล
    if (!keyword.keyword) {
      toast.error('กรุณาระบุคำสำคัญ');
      return;
    }

    // กรองคำสำคัญย่อยที่ไม่ว่าง
    const filteredVariations = keyword.variations.filter(v => v.trim());
    
    // กรองข้อความที่ไม่ว่าง
    const filteredMessages = keyword.messages.filter(m => m.content.trim());
    
    if (filteredMessages.length === 0) {
      toast.error('กรุณาเพิ่มข้อความอย่างน้อย 1 ข้อความ');
      return;
    }

    // ส่งข้อมูลที่กรองแล้ว
    const dataToSave = {
      ...keyword,
      variations: filteredVariations,
      messages: filteredMessages
    };

    saveMutation.mutate(dataToSave);
  };

  const handleUploadClick = () => {
    if (isNewKeyword) {
      toast.error('กรุณาบันทึกคำสำคัญก่อนอัปโหลดรูปภาพ');
      return;
    }
    setUploadDialogOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);

      // สร้าง URL สำหรับแสดงตัวอย่าง
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = () => {
    if (!selectedImage) {
      toast.error('กรุณาเลือกรูปภาพ');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedImage);
    uploadMutation.mutate(formData);
  };

  const handleDeleteImage = (imageId) => {
    deleteImageMutation.mutate({ keywordId: id, imageId });
  };

  if (isLoading && !isNewKeyword) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !isNewKeyword) {
    return (
      <Box p={3}>
        <Typography color="error">
          เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
        </Typography>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/keywords')}
          sx={{ mt: 2 }}
        >
          กลับไปที่รายการคำสำคัญ
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <PageHeader 
        title={isNewKeyword ? "เพิ่มคำสำคัญใหม่" : "แก้ไขคำสำคัญ"}
        actionButton={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/keywords')}
            >
              กลับ
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveKeyword}
              disabled={saveMutation.isLoading}
            >
              {saveMutation.isLoading ? <CircularProgress size={24} /> : 'บันทึก'}
            </Button>
          </Stack>
        }
      />

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="ข้อมูลทั่วไป" />
          <Tab label="ข้อความตอบกลับ" />
          <Tab label="รูปภาพ" />
        </Tabs>
      </Paper>

      {/* แท็บที่ 1: ข้อมูลทั่วไป */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                name="keyword"
                label="คำสำคัญหลัก"
                value={keyword.keyword}
                onChange={handleInputChange}
                fullWidth
                required
                helperText="คำสำคัญหลักที่ใช้ในการตรวจจับโพสต์"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="category"
                label="หมวดหมู่"
                value={keyword.category}
                onChange={handleInputChange}
                fullWidth
                helperText="หมวดหมู่สำหรับจัดกลุ่มคำสำคัญ (เช่น สินค้า, บริการ)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="priority"
                label="ลำดับความสำคัญ"
                type="number"
                value={keyword.priority}
                onChange={handleInputChange}
                fullWidth
                helperText="ตัวเลขที่สูงกว่าจะมีลำดับความสำคัญมากกว่า"
                InputProps={{
                  inputProps: { min: 0, max: 100 }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="minTimeBetweenUses"
                label="ระยะเวลาขั้นต่ำระหว่างการใช้งาน (วินาที)"
                type="number"
                value={keyword.minTimeBetweenUses}
                onChange={handleInputChange}
                fullWidth
                helperText="ระยะเวลาขั้นต่ำที่ต้องรอก่อนจะใช้คำสำคัญนี้อีกครั้ง"
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={keyword.isActive}
                    onChange={handleSwitchChange}
                    name="isActive"
                    color="primary"
                  />
                }
                label="เปิดใช้งาน"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                คำสำคัญย่อย (Variations)
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                เพิ่มคำสำคัญย่อยที่มีความหมายคล้ายกับคำสำคัญหลัก ระบบจะตรวจจับคำทั้งหมดนี้
              </Typography>
              
              {keyword.variations.map((variation, index) => (
                <Box key={index} display="flex" alignItems="center" mb={2}>
                  <TextField
                    value={variation}
                    onChange={(e) => handleVariationChange(index, e.target.value)}
                    fullWidth
                    placeholder={`คำสำคัญย่อยที่ ${index + 1}`}
                    variant="outlined"
                    size="small"
                  />
                  <IconButton 
                    color="error" 
                    onClick={() => handleRemoveVariation(index)}
                    disabled={keyword.variations.length === 1 && !variation}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              
              <Box display="flex" alignItems="center" mt={2}>
                <TextField
                  value={newVariation}
                  onChange={(e) => setNewVariation(e.target.value)}
                  fullWidth
                  placeholder="เพิ่มคำสำคัญย่อยใหม่"
                  variant="outlined"
                  size="small"
                />
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={handleAddVariation}
                  disabled={!newVariation.trim()}
                  sx={{ ml: 1, height: 40 }}
                >
                  เพิ่ม
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* แท็บที่ 2: ข้อความตอบกลับ */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            ข้อความตอบกลับ
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            เพิ่มข้อความที่จะใช้ในการคอมเมนต์เมื่อพบคำสำคัญนี้ ระบบจะสุ่มเลือกข้อความจากรายการนี้
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>น้ำหนัก</strong> คือโอกาสที่ข้อความจะถูกเลือก ค่ายิ่งมากโอกาสยิ่งสูง (ค่าเริ่มต้น = 1)
            </Typography>
          </Alert>
          
          {keyword.messages.map((message, index) => (
            <Box key={index} mb={3}>
              <Card variant="outlined">
                <CardContent>
                  <TextField
                    value={message.content}
                    onChange={(e) => handleMessageChange(index, 'content', e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="ใส่ข้อความตอบกลับ"
                    variant="outlined"
                  />
                  <Box mt={2}>
                    <TextField
                      value={message.weight}
                      onChange={(e) => handleMessageChange(index, 'weight', parseInt(e.target.value) || 1)}
                      type="number"
                      label="น้ำหนัก"
                      InputProps={{
                        inputProps: { min: 1 }
                      }}
                      size="small"
                      sx={{ width: 120 }}
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    color="error" 
                    startIcon={<DeleteIcon />}
                    onClick={() => handleRemoveMessage(index)}
                    disabled={keyword.messages.length === 1 && !message.content}
                  >
                    ลบข้อความนี้
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
          
          <Box display="flex" alignItems="center" mt={3}>
            <TextField
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="เพิ่มข้อความตอบกลับใหม่"
              variant="outlined"
            />
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleAddMessage}
              disabled={!newMessage.trim()}
              sx={{ ml: 2, height: 56 }}
            >
              เพิ่ม
            </Button>
          </Box>
        </Paper>
      )}

      {/* แท็บที่ 3: รูปภาพ */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            รูปภาพประกอบ
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            เพิ่มรูปภาพที่จะแนบไปกับข้อความคอมเมนต์ ระบบจะสุ่มเลือกรูปภาพจากรายการนี้
          </Typography>
          
          {isNewKeyword ? (
            <Alert severity="warning" sx={{ mb: 3 }}>
              กรุณาบันทึกคำสำคัญก่อนจึงจะสามารถอัปโหลดรูปภาพได้
            </Alert>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<ImageIcon />}
              onClick={handleUploadClick}
              sx={{ mb: 3 }}
            >
              อัปโหลดรูปภาพ
            </Button>
          )}
          
          {keyword.images && keyword.images.length > 0 ? (
            <Grid container spacing={2}>
              {keyword.images.map((image, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card>
                    <Box 
                      sx={{ 
                        height: 200, 
                        backgroundImage: `url(${image.url})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: '#f5f5f5'
                      }} 
                    />
                    <CardActions>
                      <Button
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={() => handleDeleteImage(image._id)}
                      >
                        ลบรูปภาพ
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <EmptyState 
              title="ไม่มีรูปภาพ"
              description="ยังไม่มีรูปภาพสำหรับคำสำคัญนี้"
              icon={<ImageIcon sx={{ fontSize: 64 }} />}
              actionText={isNewKeyword ? undefined : "อัปโหลดรูปภาพ"}
              onAction={isNewKeyword ? undefined : handleUploadClick}
            />
          )}
        </Paper>
      )}

      {/* Dialog อัปโหลดรูปภาพ */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>อัปโหลดรูปภาพ</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ height: 100, mb: 2 }}
            >
              เลือกรูปภาพ
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
            
            {selectedFilePreview && (
              <Box 
                sx={{ 
                  mt: 2, 
                  height: 200, 
                  backgroundImage: `url(${selectedFilePreview})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1
                }} 
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>ยกเลิก</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleUploadSubmit}
            disabled={!selectedImage || uploadMutation.isLoading}
          >
            {uploadMutation.isLoading ? <CircularProgress size={24} /> : 'อัปโหลด'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KeywordDetail;