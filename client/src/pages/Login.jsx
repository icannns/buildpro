import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert, Typography, Space, theme } from 'antd';
import { UserOutlined, LockOutlined, BuildOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const { token } = theme.useToken();

    const onFinish = async (values) => {
        setLoading(true);
        setError('');

        const result = await login(values.email, values.password);

        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Left Side - Visual & Branding */}
            <div style={{
                flex: '1.5',
                background: 'linear-gradient(rgba(0, 21, 41, 0.85), rgba(0, 21, 41, 0.95)), url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '60px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative Circle */}
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(24, 144, 255, 0.2) 0%, rgba(0,0,0,0) 70%)',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{
                            background: '#1890ff',
                            padding: '12px',
                            borderRadius: '12px',
                            display: 'flex',
                            marginRight: '16px',
                            boxShadow: '0 8px 16px rgba(24, 144, 255, 0.3)'
                        }}>
                            <BuildOutlined style={{ fontSize: '32px', color: 'white' }} />
                        </div>
                        <Title level={1} style={{ color: 'white', margin: 0, fontSize: '36px', letterSpacing: '-0.5px' }}>
                            BuildPro
                        </Title>
                    </div>

                    <Title level={2} style={{ color: 'white', fontWeight: 300, marginTop: 0, marginBottom: '24px' }}>
                        Membangun Masa Depan,<br />
                        <span style={{ fontWeight: 700, color: '#69c0ff' }}>Satu Proyek Sekaligus.</span>
                    </Title>

                    <Paragraph style={{ color: 'rgba(255,255,255, 0.7)', fontSize: '16px', maxWidth: '500px', lineHeight: '1.8' }}>
                        Platform manajemen konstruksi terintegrasi untuk memantau progress,
                        mengelola logistik material, dan mengontrol budget proyek Anda secara real-time.
                    </Paragraph>

                    <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px 24px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                            <Title level={4} style={{ color: 'white', margin: 0 }}>50+</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Proyek Aktif</Text>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px 24px', borderRadius: '8px', backdropFilter: 'blur(10px)' }}>
                            <Title level={4} style={{ color: 'white', margin: 0 }}>98%</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Tepat Waktu</Text>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div style={{
                flex: '1',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px'
            }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <Title level={2} style={{ marginBottom: '8px', color: '#001529' }}>Selamat Datang</Title>
                        <Text type="secondary" style={{ fontSize: '16px' }}>Silakan login untuk mengakses dashboard.</Text>
                    </div>

                    {error && (
                        <Alert
                            message="Login Gagal"
                            description={error}
                            type="error"
                            showIcon
                            closable
                            onClose={() => setError('')}
                            style={{ marginBottom: '24px', borderRadius: '8px' }}
                        />
                    )}

                    <Form
                        name="login"
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                    >
                        <Form.Item
                            name="email"
                            label={<span style={{ fontWeight: 500 }}>Email Address</span>}
                            rules={[
                                { required: true, message: 'Mohon masukkan email Anda!' },
                                { type: 'email', message: 'Format email tidak valid!' }
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                                placeholder="name@company.com"
                                style={{ borderRadius: '8px', padding: '10px 16px' }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<span style={{ fontWeight: 500 }}>Password</span>}
                            rules={[{ required: true, message: 'Mohon masukkan password Anda!' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                                placeholder="••••••••"
                                style={{ borderRadius: '8px', padding: '10px 16px' }}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginTop: '32px' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                block
                                style={{
                                    height: '50px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    borderRadius: '8px',
                                    background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                                }}
                            >
                                Masuk ke Dashboard <ArrowRightOutlined />
                            </Button>
                        </Form.Item>
                    </Form>

                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <Text type="secondary">
                            Lupa password? <a style={{ color: '#1890ff', fontWeight: 500 }}>Hubungi IT Support</a>
                        </Text>
                    </div>

                    <div style={{ marginTop: '60px', textAlign: 'center' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            &copy; 2025 BuildPro Construction Management. v2.0.0
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
