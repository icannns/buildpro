import React, { useState, useEffect } from 'react';
import { Card, Progress, Button, Typography, Space, Tag, Divider, Row, Col, Statistic, Spin, Alert, message, Modal, InputNumber, Drawer, Timeline } from 'antd';
import {
    BuildOutlined,
    CalendarOutlined,
    DashboardOutlined,
    LoadingOutlined,
    DownloadOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    LineChartOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { Title, Text, Paragraph } = Typography;

function DashboardHome() {
    const { user } = useAuth(); // Get current user
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newProgress, setNewProgress] = useState(0);
    const [updating, setUpdating] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [scurveDrawerVisible, setScurveDrawerVisible] = useState(false);

    useEffect(() => {
        fetchProjectData();
    }, []);

    const fetchProjectData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get('/projects');

            if (response.data.success && response.data.data.length > 0) {
                const projectData = response.data.data[0];
                setProject(projectData);
                setNewProgress(projectData.progress || 0);
            } else {
                setError('No project data found');
            }
        } catch (err) {
            console.error('Error fetching project data:', err);
            setError('Gagal memuat data proyek. Pastikan backend sudah running.');
            message.error('Gagal memuat data proyek');
        } finally {
            setLoading(false);
        }
    };

    const showUpdateModal = () => {
        if (project) {
            setNewProgress(project.progress || 0);
            setIsModalVisible(true);
        }
    };

    // Check if user can update progress (ADMIN or PROJECT_MANAGER only)
    const canUpdateProgress = () => {
        return user && (user.role === 'ADMIN' || user.role === 'PROJECT_MANAGER');
    };

    const handleUpdateProgress = async () => {
        if (!project) return;

        try {
            setUpdating(true);

            if (newProgress < 0 || newProgress > 100) {
                message.error('Progress harus antara 0 - 100');
                return;
            }

            const response = await api.post('/update-progress', {
                project_id: project.id,
                progress: newProgress
            });

            if (response.data.success) {
                message.success('Progress berhasil diupdate!');
                setIsModalVisible(false);
                await fetchProjectData();
            } else {
                message.error('Gagal mengupdate progress');
            }
        } catch (err) {
            console.error('Error updating progress:', err);
            message.error('Gagal mengupdate progress. Cek koneksi backend.');
        } finally {
            setUpdating(false);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const showDetailDrawer = () => {
        setDrawerVisible(true);
    };

    const closeDetailDrawer = () => {
        setDrawerVisible(false);
    };

    const showScurveDrawer = () => {
        setScurveDrawerVisible(true);
    };

    const closeScurveDrawer = () => {
        setScurveDrawerVisible(false);
    };

    // S-Curve data (sample data for demo)
    const scurveData = [
        { week: 'Week 1', planned: 10, actual: 10 },
        { week: 'Week 2', planned: 20, actual: 20 },
        { week: 'Week 4', planned: 35, actual: 30 },
        { week: 'Week 6', planned: 50, actual: 40 },
        { week: 'Week 8', planned: 65, actual: 45 },
        { week: 'Week 10', planned: 75, actual: 45 },
        { week: 'Week 12', planned: 85, actual: 45 },
        { week: 'Week 14', planned: 95, actual: 45 },
        { week: 'Week 16', planned: 100, actual: 45 },
    ];

    const calculateMilestoneUI = (currentProgress) => {
        const milestones = {
            fondasi: { percent: 0, status: 'normal' },
            struktur: { percent: 0, status: 'normal' },
            finishing: { percent: 0, status: 'normal' }
        };

        if (currentProgress >= 20) {
            milestones.fondasi = { percent: 100, status: 'success' };
        } else if (currentProgress > 0) {
            milestones.fondasi = {
                percent: Math.round((currentProgress / 20) * 100),
                status: 'active'
            };
        }

        if (currentProgress >= 60) {
            milestones.struktur = { percent: 100, status: 'success' };
        } else if (currentProgress > 20) {
            milestones.struktur = {
                percent: Math.round(((currentProgress - 20) / 40) * 100),
                status: 'active'
            };
        }

        if (currentProgress >= 100) {
            milestones.finishing = { percent: 100, status: 'success' };
        } else if (currentProgress > 60) {
            milestones.finishing = {
                percent: Math.round(((currentProgress - 60) / 40) * 100),
                status: 'active'
            };
        }

        return milestones;
    };

    const generateMilestoneRows = (currentProgress) => {
        const milestones = [];

        if (currentProgress >= 20) {
            milestones.push(['Fondasi', 'Selesai', '100%']);
        } else if (currentProgress > 0) {
            const fondasiProgress = Math.round((currentProgress / 20) * 100);
            milestones.push(['Fondasi', 'Dalam Progress', `${fondasiProgress}%`]);
        } else {
            milestones.push(['Fondasi', 'Belum Dimulai', '0%']);
        }

        if (currentProgress >= 60) {
            milestones.push(['Struktur Bangunan', 'Selesai', '100%']);
        } else if (currentProgress > 20) {
            const strukturProgress = Math.round(((currentProgress - 20) / 40) * 100);
            milestones.push(['Struktur Bangunan', 'Dalam Progress', `${strukturProgress}%`]);
        } else {
            milestones.push(['Struktur Bangunan', 'Belum Dimulai', '0%']);
        }

        if (currentProgress >= 90) {
            milestones.push(['Finishing', 'Selesai', '100%']);
        } else if (currentProgress > 60) {
            const finishingProgress = Math.round(((currentProgress - 60) / 30) * 100);
            milestones.push(['Finishing', 'Dalam Progress', `${finishingProgress}%`]);
        } else {
            milestones.push(['Finishing', 'Belum Dimulai', '0%']);
        }

        if (currentProgress >= 100) {
            milestones.push(['Inspeksi Final', 'Selesai', '100%']);
        } else if (currentProgress > 90) {
            const inspeksiProgress = Math.round(((currentProgress - 90) / 10) * 100);
            milestones.push(['Inspeksi Final', 'Dalam Progress', `${inspeksiProgress}%`]);
        } else {
            milestones.push(['Inspeksi Final', 'Belum Dimulai', '0%']);
        }

        return milestones;
    };

    const downloadPDF = () => {
        if (!project) {
            message.error('Tidak ada data proyek untuk diunduh');
            return;
        }

        try {
            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('LAPORAN PROYEK KONSTRUKSI', 105, 20, { align: 'center' });

            doc.setFontSize(16);
            doc.setFont('helvetica', 'normal');
            doc.text(project.name, 105, 35, { align: 'center' });

            doc.setLineWidth(0.5);
            doc.line(20, 42, 190, 42);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Informasi Proyek:', 20, 52);

            doc.setFont('helvetica', 'normal');
            doc.text(`Kontraktor: ${project.contractor || '-'}`, 25, 60);
            doc.text(`Lokasi: ${project.location || '-'}`, 25, 68);
            doc.text(`Budget: Rp ${parseFloat(project.budget || 0).toLocaleString('id-ID')}`, 25, 76);
            doc.text(`Status: ${project.status}`, 25, 84);
            doc.text(`Progress: ${project.progress}%`, 25, 92);

            const milestoneRows = generateMilestoneRows(project.progress);

            autoTable(doc, {
                startY: 105,
                head: [['Milestone', 'Status', 'Progress']],
                body: milestoneRows,
                theme: 'grid',
                headStyles: {
                    fillColor: [24, 144, 255],
                    fontSize: 11,
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    fontSize: 10
                },
                margin: { left: 20, right: 20 }
            });

            const finalY = doc.lastAutoTable.finalY || 160;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text(`Generated: ${new Date().toLocaleString('id-ID')}`, 105, finalY + 15, { align: 'center' });
            doc.text('BuildPro - Construction Management System', 105, finalY + 22, { align: 'center' });

            doc.save(`Laporan_${project.name.replace(/\s+/g, '_')}.pdf`);
            message.success('Laporan berhasil didownload!');

        } catch (error) {
            console.error('Error PDF:', error);
            message.error('Gagal membuat PDF: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                <div style={{ marginTop: '20px' }}>
                    <Text type="secondary">Memuat data proyek...</Text>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                action={
                    <Button size="small" danger onClick={fetchProjectData}>
                        Coba Lagi
                    </Button>
                }
            />
        );
    }

    if (!project) {
        return (
            <Alert
                message="Tidak Ada Data"
                description="Belum ada proyek yang tersedia"
                type="info"
                showIcon
            />
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatCurrency = (amount) => {
        if (!amount) return 'Rp 0';
        return `Rp ${parseFloat(amount).toLocaleString('id-ID')}`;
    };

    return (
        <div>
            <Title level={2}>Dashboard Proyek</Title>
            <Paragraph type="secondary">
                Pantau progress dan detail proyek konstruksi Anda
            </Paragraph>

            <Card
                title={
                    <Space>
                        <BuildOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                        <span style={{ fontSize: '18px' }}>{project.name}</span>
                        <Tag color={project.status === 'Dalam Progress' ? 'processing' : 'success'}>
                            {project.status}
                        </Tag>
                    </Space>
                }
                extra={
                    <Space>
                        <CalendarOutlined />
                        <Text type="secondary">Deadline: {formatDate(project.deadline)}</Text>
                    </Space>
                }
                style={{ marginTop: '24px' }}
                hoverable
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                        <Title level={5}>Informasi Proyek</Title>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text strong>Lokasi:</Text>
                                <Text>{project.location || '-'}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text strong>Kontraktor:</Text>
                                <Text>{project.contractor || '-'}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text strong>Budget:</Text>
                                <Text>{formatCurrency(project.budget)}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text strong>Tanggal Mulai:</Text>
                                <Text>{formatDate(project.start_date)}</Text>
                            </div>
                        </Space>
                    </div>

                    <Divider />

                    <div>
                        <Title level={5} style={{ marginBottom: '16px' }}>Progress Pengerjaan</Title>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                            <Progress
                                type="circle"
                                percent={project.progress || 0}
                                size={120}
                                strokeColor={{
                                    '0%': '#108ee9',
                                    '100%': '#87d068',
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                    <div>
                                        <Text type="secondary">Fondasi</Text>
                                        <Progress
                                            percent={calculateMilestoneUI(project.progress).fondasi.percent}
                                            status={calculateMilestoneUI(project.progress).fondasi.status}
                                        />
                                    </div>
                                    <div>
                                        <Text type="secondary">Struktur Bangunan</Text>
                                        <Progress
                                            percent={calculateMilestoneUI(project.progress).struktur.percent}
                                            status={calculateMilestoneUI(project.progress).struktur.status}
                                        />
                                    </div>
                                    <div>
                                        <Text type="secondary">Finishing</Text>
                                        <Progress
                                            percent={calculateMilestoneUI(project.progress).finishing.percent}
                                            status={calculateMilestoneUI(project.progress).finishing.status}
                                        />
                                    </div>
                                </Space>
                            </div>
                        </div>
                    </div>

                    <Divider />

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {canUpdateProgress() && (
                            <Button
                                type="primary"
                                size="large"
                                icon={<DashboardOutlined />}
                                onClick={showUpdateModal}
                            >
                                Update Progress
                            </Button>
                        )}
                        <Button
                            size="large"
                            icon={<InfoCircleOutlined />}
                            onClick={showDetailDrawer}
                        >
                            Lihat Detail
                        </Button>
                        <Button
                            size="large"
                            icon={<LineChartOutlined />}
                            onClick={showScurveDrawer}
                        >
                            Lihat Kurva-S
                        </Button>
                        <Button
                            size="large"
                            icon={<DownloadOutlined />}
                            onClick={downloadPDF}
                        >
                            Download Laporan
                        </Button>
                    </div>
                </Space>
            </Card>

            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title="Total Proyek Aktif"
                            value={1}
                            prefix={<BuildOutlined />}
                            suffix={<Tag color="success">Active</Tag>}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title="Budget Terpakai"
                            value={project.progress || 0}
                            precision={0}
                            suffix="%"
                        />
                        <Tag color="processing" style={{ marginTop: '8px' }}>
                            {formatCurrency(parseFloat(project.budget || 0) * (project.progress || 0) / 100)} terpakai
                        </Tag>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title="Progress Proyek"
                            value={project.progress || 0}
                            suffix="%"
                            valueStyle={{ color: project.progress >= 50 ? '#52c41a' : '#1890ff' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Update Progress Modal */}
            <Modal
                title="Update Progress Proyek"
                open={isModalVisible}
                onOk={handleUpdateProgress}
                onCancel={handleCancel}
                confirmLoading={updating}
                okText="Update"
                cancelText="Batal"
            >
                <div style={{ padding: '20px 0' }}>
                    <Paragraph>
                        <Text strong>Proyek:</Text> {project?.name}
                    </Paragraph>
                    <Paragraph>
                        <Text strong>Progress Saat Ini:</Text> {project?.progress}%
                    </Paragraph>
                    <Divider />
                    <div>
                        <Text strong>Progress Baru (0-100):</Text>
                        <InputNumber
                            min={0}
                            max={100}
                            value={newProgress}
                            onChange={(value) => setNewProgress(value)}
                            style={{ width: '100%', marginTop: '8px' }}
                            size="large"
                            formatter={value => `${value}%`}
                            parser={value => value.replace('%', '')}
                        />
                    </div>
                    <div style={{ marginTop: '16px' }}>
                        <Progress percent={newProgress} />
                    </div>
                </div>
            </Modal>

            {/* Detail Drawer */}
            <Drawer
                title="Detail Proyek & Riwayat Progress"
                placement="right"
                onClose={closeDetailDrawer}
                open={drawerVisible}
                width={600}
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                        <Title level={4}>{project?.name}</Title>
                        <Tag color="processing">{project?.status}</Tag>
                    </div>

                    <Divider />

                    <div>
                        <Title level={5}>Informasi Lengkap</Title>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Text><strong>ID Proyek:</strong> #{project?.id}</Text>
                            <Text><strong>Lokasi:</strong> {project?.location}</Text>
                            <Text><strong>Kontraktor:</strong> {project?.contractor}</Text>
                            <Text><strong>Budget:</strong> {formatCurrency(project?.budget)}</Text>
                            <Text><strong>Tanggal Mulai:</strong> {formatDate(project?.start_date)}</Text>
                            <Text><strong>Deadline:</strong> {formatDate(project?.deadline)}</Text>
                            <Text><strong>Progress:</strong> {project?.progress}%</Text>
                        </Space>
                    </div>

                    <Divider />

                    <div>
                        <Title level={5}>Timeline Progress</Title>
                        <Timeline
                            mode="left"
                            items={[
                                {
                                    label: '1 Sep 2025',
                                    children: 'Proyek dimulai',
                                    color: 'green',
                                    dot: <CheckCircleOutlined />
                                },
                                {
                                    label: '10 Sep 2025',
                                    children: 'Fondasi selesai 100%',
                                    color: 'green',
                                    dot: <CheckCircleOutlined />
                                },
                                {
                                    label: '25 Sep 2025',
                                    children: 'Struktur bangunan dimulai',
                                    color: 'green',
                                    dot: <CheckCircleOutlined />
                                },
                                {
                                    label: '15 Okt 2025',
                                    children: 'Struktur 50% - Progress update',
                                    color: 'blue',
                                    dot: <ClockCircleOutlined />
                                },
                                {
                                    label: '24 Nov 2025',
                                    children: `Progress mencapai ${project?.progress}%`,
                                    color: 'blue',
                                    dot: <ClockCircleOutlined />
                                },
                                {
                                    label: '31 Des 2025',
                                    children: 'Target deadline penyelesaian',
                                    color: 'gray'
                                }
                            ]}
                        />
                    </div>
                </Space>
            </Drawer>

            {/* S-Curve Drawer */}
            <Drawer
                title={
                    <Space>
                        <LineChartOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
                        <span>Kurva-S: Progress Planned vs Actual</span>
                    </Space>
                }
                placement="right"
                onClose={closeScurveDrawer}
                open={scurveDrawerVisible}
                width={800}
            >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                        <Paragraph>
                            <Text strong>Proyek:</Text> {project?.name}
                        </Paragraph>
                        <Paragraph type="secondary">
                            Grafik ini menampilkan perbandingan antara progress yang direncanakan (Planned)
                            dengan progress aktual (Actual) proyek dari waktu ke waktu.
                        </Paragraph>
                    </div>

                    <Divider />

                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={scurveData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="week" />
                                <YAxis label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="planned"
                                    stroke="#1890ff"
                                    strokeWidth={2}
                                    name="Planned Progress"
                                    dot={{ r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="actual"
                                    stroke="#52c41a"
                                    strokeWidth={2}
                                    name="Actual Progress"
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <Divider />

                    <div>
                        <Title level={5}>Analisis</Title>
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <div style={{ padding: '12px', background: '#f0f2f5', borderRadius: '4px' }}>
                                <Text>
                                    <strong>Status:</strong> Proyek mengalami keterlambatan sejak Week 8.
                                    Progress aktual (45%) berada di bawah rencana (75% untuk Week 10).
                                </Text>
                            </div>
                            <div style={{ padding: '12px', background: '#fff7e6', borderRadius: '4px' }}>
                                <Text>
                                    <strong>Rekomendasi:</strong> Perlu evaluasi kendala proyek dan penambahan resources
                                    untuk mengejar target deadline.
                                </Text>
                            </div>
                        </Space>
                    </div>
                </Space>
            </Drawer>
        </div>
    );
}

export default DashboardHome;
