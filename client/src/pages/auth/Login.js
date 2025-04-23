// client/src/pages/auth/Login.js
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, TextField, Typography, Link, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(formData.email, formData.password);
      toast.success('เข้าสู่ระบบสำเร็จ');
    } catch (error) {
      toast.error(error.response?.data?.message || 'เข้าสู่ระบบล้มเหลว');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" component="h1" align="center" gutterBottom>
        เข้าสู่ระบบ
      </Typography>
      <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
        Facebook Auto Commenter
      </Typography>

      <form onSubmit={handleSubmit}>
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
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          disabled={isSubmitting}
          sx={{ mt: 3, mb: 2 }}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'เข้าสู่ระบบ'}
        </Button>
      </form>

      <Box textAlign="center" mt={2}>
        <Typography variant="body2">
          ยังไม่มีบัญชี?{' '}
          <Link component={RouterLink} to="/register" variant="body2">
            สมัครสมาชิก
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;