import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Space, Spin, Select, Tooltip } from 'antd';
import {
    DashboardOutlined,
    ShoppingOutlined,
    DollarOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    BuildOutlined,
    UserOutlined,
    LogoutOutlined,
    FileTextOutlined,
    ShopOutlined,
    ShoppingCartOutlined,
    PlusOutlined
} from '@ant-design/icons';
import './App.css';

//Import context
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider, useProject } from './context/ProjectContext';

// Import components
import ProjectModal from './components/ProjectModal';

// Import pages
import Login from './pages/Login';
import DashboardHome from './pages/DashboardHome';
import MaterialLogistics from './pages/MaterialLogistics';
import FinanceBudget from './pages/FinanceBudget';
import DailyLogs from './pages/DailyLogs';
import VendorPortal from './pages/VendorPortal';
import PurchaseOrders from './pages/PurchaseOrders';

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
    const { activeProject, projects, switchProject, createProject } = useProject();
    const [projectModalVisible, setProjectModalVisible] = useState(false);
    const [projectModalLoading, setProjectModalLoading] = useState(false);

    // Determine selected menu key based on current route
    const getSelectedKey = () => {
        const path = location.pathname;
        if (path === '/') return '1';
        if (path === '/daily-logs') return '2';
        if (path === '/material') return '3';
        if (path === '/purchase-orders') return '4';
        if (path === '/vendor-portal') return '5';
        if (path === '/finance') return '6';
        return '1';
    };

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    // Role-based menu items
    const getMenuItems = () => {
        const role = user?.role;
        const baseItems = [
            {
                key: '1',
                icon: <DashboardOutlined />,
                label: <Link to="/">Dashboard Proyek</Link>,
            },
        ];

        // Daily Logs - visible for ADMIN, WORKER
        if (role === 'ADMIN' || role === 'WORKER') {
            baseItems.push({
                key: '2',
                icon: <FileTextOutlined />,
                label: <Link to="/daily-logs">Log Harian</Link>,
            });
        }

        // Material/Logistics - visible for ADMIN, STAFF_LOGISTIC
        if (role === 'ADMIN' || role === 'STAFF_LOGISTIC') {
            baseItems.push({
                key: '3',
                icon: <ShoppingOutlined />,
                label: <Link to="/material">Material/Logistik</Link>,
            });
        }

        // Purchase Orders - visible for ADMIN, STAFF_LOGISTIC
        if (role === 'ADMIN' || role === 'STAFF_LOGISTIC') {
            baseItems.push({
                key: '4',
                icon: <ShoppingCartOutlined />,
                label: <Link to="/purchase-orders">Purchase Orders</Link>,
            });
        }

        // Vendor Portal - visible for ADMIN, VENDOR
        if (role === 'ADMIN' || role === 'VENDOR') {
            baseItems.push({
                key: '5',
                icon: <ShopOutlined />,
                label: <Link to="/vendor-portal">Portal Vendor</Link>,
            });
        }

        // Finance - visible for ADMIN only (restricted in FinanceBudget.jsx)
        if (role === 'ADMIN') {
            baseItems.push({
                key: '6',
                icon: <DollarOutlined />,
                label: <Link to="/finance">Keuangan</Link>,
            });
        }

        return baseItems;
    };

    const handleCreateProject = async (projectData) => {
        setProjectModalLoading(true);
        const result = await createProject(projectData);
        setProjectModalLoading(false);
        if (result.success) {
            setProjectModalVisible(false);
        }
    };

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
                    items={getMenuItems()}
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
                        {/* Project Switcher */}
                        <Select
                            value={activeProject?.id}
                            onChange={switchProject}
                            style={{ width: 250 }}
                            placeholder="Pilih Proyek"
                        >
                            {projects.map(project => (
                                <Select.Option key={project.id} value={project.id}>
                                    {project.name}
                                </Select.Option>
                            ))}
                        </Select>

                        {/* Create Project Button - ADMIN Only */}
                        {user?.role === 'ADMIN' && (
                            <Tooltip title="Buat Proyek Baru">
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setProjectModalVisible(true)}
                                    style={{ borderRadius: '50%' }}
                                />
                            </Tooltip>
                        )}

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
                        <Route path="/daily-logs" element={<DailyLogs />} />
                        <Route path="/material" element={<MaterialLogistics />} />
                        <Route path="/purchase-orders" element={<PurchaseOrders />} />
                        <Route path="/vendor-portal" element={<VendorPortal />} />
                        <Route path="/finance" element={<FinanceBudget />} />
                    </Routes>
                </Content>
            </Layout>

            {/* Project Modal */}
            <ProjectModal
                visible={projectModalVisible}
                onClose={() => setProjectModalVisible(false)}
                onSubmit={handleCreateProject}
                mode="create"
                loading={projectModalLoading}
            />
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
                                <ProjectProvider>
                                    <AppLayout />
                                </ProjectProvider>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;

