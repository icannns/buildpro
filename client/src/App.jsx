import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Space, Spin } from 'antd';
import {
    DashboardOutlined,
    ShoppingOutlined,
    DollarOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    BuildOutlined,
    UserOutlined,
    LogoutOutlined
} from '@ant-design/icons';
import './App.css';

// Import context
import { AuthProvider, useAuth } from './context/AuthContext';

// Import pages
import Login from './pages/Login';
import DashboardHome from './pages/DashboardHome';
import MaterialLogistics from './pages/MaterialLogistics';
import FinanceBudget from './pages/FinanceBudget';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// Protected Route Component
function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
}

// Main Layout Component
function AppLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    // Determine selected menu key based on current route
    const getSelectedKey = () => {
        const path = location.pathname;
        if (path === '/') return '1';
        if (path === '/material') return '2';
        if (path === '/finance') return '3';
        return '1';
    };

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const menuItems = [
        {
            key: '1',
            icon: <DashboardOutlined />,
            label: <Link to="/">Dashboard Proyek</Link>,
        },
        {
            key: '2',
            icon: <ShoppingOutlined />,
            label: <Link to="/material">Material/Logistik</Link>,
        },
        {
            key: '3',
            icon: <DollarOutlined />,
            label: <Link to="/finance">Keuangan</Link>,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
            >
                <div className="logo">
                    <BuildOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
                    {!collapsed && <span style={{ marginLeft: '12px', fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>BuildPro</span>}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[getSelectedKey()]}
                    items={menuItems}
                />
            </Sider>

            <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
                <Header
                    style={{
                        padding: '0 24px',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                >
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />
                    <Space>
                        <UserOutlined style={{ fontSize: '18px' }} />
                        <Text strong>{user?.name || 'User'}</Text>
                        <Text type="secondary">({user?.role || 'N/A'})</Text>
                        <Button
                            type="text"
                            icon={<LogoutOutlined />}
                            onClick={handleLogout}
                            danger
                        >
                            Logout
                        </Button>
                    </Space>
                </Header>

                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: '#f0f2f5',
                    }}
                >
                    <Routes>
                        <Route path="/" element={<DashboardHome />} />
                        <Route path="/material" element={<MaterialLogistics />} />
                        <Route path="/finance" element={<FinanceBudget />} />
                    </Routes>
                </Content>
            </Layout>
        </Layout>
    );
}

// App component with Router wrapper and Auth Provider
function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/*"
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;

