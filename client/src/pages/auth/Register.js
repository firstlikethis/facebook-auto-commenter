// client/src/pages/auth/Register.js
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, TextField, Typography, Link, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('รหัสผ่านไม่ตรงกัน');
      return;
    }
    
    setIsSubmitting(true);

    try {
      await register(formData.username, formData.email, formData.password);
      toast.success('สมัครสมาชิกสำเร็จ');
    } catch (error) {
      toast.error(error.response?.data?.message || 'สมัครสมาชิกล้มเหลว');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h1" align="center" gutterBottom>
        สมัครสมาชิก
      </Typography>
      <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
        Facebook Auto Commenter
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="ชื่อผู้ใช้"
          name="username"
          value={formData.username}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="อีเมล"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="รหัสผ่าน"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="ยืนยันรหัสผ่าน"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          margin="normal"
          required
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          disabled={isSubmitting}
          sx={{ mt: 3, mb: 2 }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'สมัครสมาชิก'}
        </Button>
      </form>

      <Box textAlign="center" mt={2}>
        <Typography variant="body2">
          มีบัญชีอยู่แล้ว?{' '}
          <Link component={RouterLink} to="/login" variant="body2">
            เข้าสู่ระบบ
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default Register;