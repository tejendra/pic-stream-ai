// AI Generated - Needs Review
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Camera,
  User, 
  LogOut, 
  Menu, 
  X
} from 'lucide-react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ThemeToggle from '../../theme/ThemeToggle';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const theme = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      // Force navigation to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Still try to navigate even if logout fails
      window.location.href = '/';
    }
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [];

  return (
    <>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          {/* Logo and main nav */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Camera size={32} color={theme.palette.mode === 'dark' ? theme.palette.primary.main : 'white'} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  PicStream AI
                </Typography>
              </Box>
            </Link>
            
            {/* Desktop navigation */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, ml: 4, gap: 2 }}>
              {/* Theme Toggle - Always visible */}
              
            </Box>
          </Box>


          {/* User menu */}
          {user && (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ThemeToggle />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {user.displayName || user.email}
                </Typography>
              </Box>
              
              <IconButton
                onClick={handleLogout}
                color="inherit"
                title="Logout"
              >
                <LogOut size={20} />
              </IconButton>
            </Box>
          )}

          {/* Mobile menu button */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              color="inherit"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile menu */}
      <Drawer
        anchor="top"
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <Box sx={{ width: '100%', pt: 8 }}>
          <List>
            {/* Theme Toggle in mobile menu */}
            <ListItem>
              <ListItemIcon>
                <ThemeToggle />
              </ListItemIcon>
              <ListItemText primary="Toggle Theme" />
            </ListItem>
            
            {user && (
              <>
                <Divider />
                <ListItem>
                  <ListItemIcon>
                    {user.photoURL ? (
                      <Avatar src={user.photoURL} alt={user.displayName} sx={{ width: 32, height: 32 }} />
                    ) : (
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        <User size={16} />
                      </Avatar>
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={user.displayName || user.email}
                    secondary="Logged in"
                  />
                </ListItem>
                <ListItem
                  button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                >
                  <ListItemIcon>
                    <LogOut size={20} />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar; 