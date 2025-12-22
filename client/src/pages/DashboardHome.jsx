import React, { useState, useEffect } from 'react';
import { Card, Progress, Button, Typography, Space, Tag, Divider, Row, Col, Statistic, Spin, Alert, message, Modal, InputNumber, Drawer, Timeline, Tooltip, Badge, Switch } from 'antd';
import {
    BuildOutlined,
    CalendarOutlined,
    DashboardOutlined,
    LoadingOutlined,
    DownloadOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    LineChartOutlined,
    EditOutlined,
    SyncOutlined,
    BellOutlined,
    ProjectOutlined,
    DollarOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import ProjectModal from '../components/ProjectModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const { Title, Text, Paragraph } = Typography;

function DashboardHome() {
    const { user } = useAuth();
    const { activeProject, refreshActiveProject, updateProject } = useProject();
    const project = activeProject; // Use active project from context
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newProgress, setNewProgress] = useState(0);
    const [updating, setUpdating] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [scurveDrawerVisible, setScurveDrawerVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editModalLoading, setEditModalLoading] = useState(false);
    const [budgetSummary, setBudgetSummary] = useState(null);
    const [timelineNotes, setTimelineNotes] = useState([]);
    const [dailyLogs, setDailyLogs] = useState([]);

    // Real-time update states
    const [previousProgress, setPreviousProgress] = useState(0);
    const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);

    useEffect(() => {
        if (project?.id) {
            fetchBudgetSummary();
            fetchTimelineNotes();
            fetchDailyLogs();
        }
    }, [project?.id, project?.progress]); // Re-fetch when progress changes

    const fetchProjectData = async () => {
        // Refresh active project from context
        await refreshActiveProject();
    };

    const fetchBudgetSummary = async () => {
        if (!project?.id) return;

        // Always calculate from project progress for accurate real-time data
        const totalBudget = parseFloat(project.budget || 0);
        const progressPercent = parseFloat(project.progress || 0) / 100;
        const usedBudget = totalBudget * progressPercent;

        setBudgetSummary({
            total_budget: totalBudget,
            used_budget: usedBudget,
            remaining_budget: totalBudget - usedBudget,
            percentage_used: project.progress || 0
        });
    };

    const fetchTimelineNotes = async () => {
        if (!project?.id) return;
        try {
            const response = await api.get(`/timeline-notes/${project.id}`);
            if (response.data.success) {
                setTimelineNotes(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching timeline notes:', err);
        }
    };

    const fetchDailyLogs = async () => {
        if (!project?.id) return;
        try {
            const response = await api.get(`/daily-logs/${project.id}`);
            if (response.data.success) {
                setDailyLogs(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching daily logs:', err);
        }
    };

    // Auto-refresh mechanism - polls every 10 seconds
    useEffect(() => {
        if (!isAutoRefreshing || !project?.id) return;

        const interval = setInterval(async () => {
            try {
                await refreshActiveProject();
                await fetchBudgetSummary();
                await fetchTimelineNotes();
                await fetchDailyLogs();
                setLastUpdateTime(new Date());
            } catch (err) {
                console.error('Auto-refresh error:', err);
            }
        }, 10000); // 10 seconds

        return () => clearInterval(interval);
    }, [isAutoRefreshing, project?.id]);

    // Change detection - show notification when progress changes
    useEffect(() => {
        if (!project) return;

        const currentProgress = parseFloat(project.progress || 0);

        // Only show notification if progress actually changed and it's not the first load
        if (previousProgress > 0 && currentProgress !== previousProgress) {
            const isIncrease = currentProgress > previousProgress;
            const diff = Math.abs(currentProgress - previousProgress).toFixed(1);

            message.success({
                content: (
                    <span>
                        <BellOutlined style={{ marginRight: 8 }} />
                        Progress {isIncrease ? 'naik' : 'turun'}: {previousProgress}% → {currentProgress}%
                        ({isIncrease ? '+' : '-'}{diff}%)
                    </span>
                ),
                duration: 5,
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
            });
        }

        setPreviousProgress(currentProgress);
    }, [project?.progress]);

    const showUpdateModal = () => {
        if (project) {
            setNewProgress(project.progress || 0);
            setIsModalVisible(true);
        }
    };

    const handleEditProject = async (projectData) => {
        if (!project?.id) return;
        setEditModalLoading(true);
        const result = await updateProject(project.id, projectData);
        setEditModalLoading(false);
        if (result.success) {
            setEditModalVisible(false);
            // Refresh all data to show updated fields
            await fetchBudgetSummary();
            await fetchDailyLogs();
            message.success('Project berhasil diupdate!');
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

    const showDetailDrawer = async () => {
        setDrawerVisible(true);
        // Refresh budget summary when drawer opens to show latest data
        await fetchBudgetSummary();
        await fetchDailyLogs();
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

    const calculateDaysRemaining = (endDate) => {
        if (!endDate) return null;
        const today = new Date();
        const deadline = new Date(endDate);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
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
                    <Space size="large">
                        {/* Auto-refresh toggle */}
                        <Tooltip title={isAutoRefreshing ? 'Auto-refresh aktif (10s)' : 'Auto-refresh nonaktif'}>
                            <Space>
                                <Badge status={isAutoRefreshing ? 'processing' : 'default'} />
                                <SyncOutlined
                                    spin={isAutoRefreshing}
                                    style={{ color: isAutoRefreshing ? '#1890ff' : '#d9d9d9' }}
                                />
                                <Switch
                                    size="small"
                                    checked={isAutoRefreshing}
                                    onChange={(checked) => setIsAutoRefreshing(checked)}
                                />
                                {lastUpdateTime && isAutoRefreshing && (
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {lastUpdateTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </Text>
                                )}
                            </Space>
                        </Tooltip>

                        <Divider type="vertical" />

                        <CalendarOutlined />
                        <Text type="secondary">Deadline: {formatDate(project.end_date)}</Text>
                        {(() => {
                            const daysRemaining = calculateDaysRemaining(project.end_date);
                            if (daysRemaining !== null) {
                                return (
                                    <Tag color={daysRemaining > 30 ? 'green' : daysRemaining > 7 ? 'orange' : 'red'}>
                                        {daysRemaining > 0 ? `${daysRemaining} hari lagi` : `Terlambat ${Math.abs(daysRemaining)} hari`}
                                    </Tag>
                                );
                            }
                            return null;
                        })()}

                        {/* Edit Project Button - ADMIN Only */}
                        {user?.role === 'ADMIN' && (
                            <Tooltip title="Edit Proyek">
                                <Button
                                    type="link"
                                    icon={<EditOutlined />}
                                    onClick={() => setEditModalVisible(true)}
                                />
                            </Tooltip>
                        )}
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

                        {/* Progress Rencana vs Aktual */}
                        <Row gutter={16} style={{ marginBottom: '16px' }}>
                            <Col span={12}>
                                <Card size="small" style={{ backgroundColor: '#e6f7ff', borderColor: '#1890ff' }}>
                                    <Statistic
                                        title="Progress Rencana"
                                        value={project.planned_progress || 0}
                                        suffix="%"
                                        valueStyle={{ color: '#1890ff' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#52c41a' }}>
                                    <Statistic
                                        title="Progress Aktual"
                                        value={project.progress || 0}
                                        suffix="%"
                                        valueStyle={{ color: '#52c41a' }}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        {/* Indikator Keterlambatan */}
                        {(() => {
                            const plannedProgress = parseFloat(project.planned_progress || 0);
                            const actualProgress = parseFloat(project.progress || 0);
                            const delay = plannedProgress - actualProgress;

                            if (delay > 0) {
                                return (
                                    <Alert
                                        message="Indikator Keterlambatan"
                                        description={`Tertinggal ${delay.toFixed(1)}% dari rencana`}
                                        type="warning"
                                        showIcon
                                        style={{ marginBottom: '16px' }}
                                    />
                                );
                            } else if (delay < 0) {
                                return (
                                    <Alert
                                        message="Indikator Progress"
                                        description={`Lebih cepat ${Math.abs(delay).toFixed(1)}% dari rencana`}
                                        type="success"
                                        showIcon
                                        style={{ marginBottom: '16px' }}
                                    />
                                );
                            } else {
                                return (
                                    <Alert
                                        message="Indikator Progress"
                                        description="Sesuai dengan rencana"
                                        type="info"
                                        showIcon
                                        style={{ marginBottom: '16px' }}
                                    />
                                );
                            }
                        })()}

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
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div>
                        <Title level={4}>{project?.name}</Title>
                        <Tag color="processing">{project?.status}</Tag>
                    </div>

                    <Divider />

                    {/* Informasi Lengkap Card */}
                    <Card
                        title={
                            <Space>
                                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                                <Text strong>Informasi Lengkap</Text>
                            </Space>
                        }
                        size="small"
                        style={{ marginBottom: 16 }}
                    >
                        <Row gutter={[16, 8]}>
                            <Col span={12}>
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>ID Proyek</Text>
                                <Text strong>#{project?.id}</Text>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Lokasi</Text>
                                <Text strong>{project?.location}</Text>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Kontraktor</Text>
                                <Text strong>{project?.contractor}</Text>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Budget</Text>
                                <Text strong style={{ color: '#1890ff' }}>{formatCurrency(project?.budget)}</Text>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Tanggal Mulai</Text>
                                <Text strong>{formatDate(project?.start_date)}</Text>
                            </Col>
                            <Col span={12}>
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Deadline</Text>
                                <Text strong>{formatDate(project?.end_date)}</Text>
                            </Col>
                            <Col span={24}>
                                <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Progress Aktual</Text>
                                <Progress
                                    percent={project?.progress}
                                    strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                                    size="small"
                                />
                            </Col>
                        </Row>
                    </Card>

                    {/* Detail Proyek Card */}
                    <Card
                        title={
                            <Space>
                                <ProjectOutlined style={{ color: '#52c41a' }} />
                                <Text strong>Detail Proyek</Text>
                            </Space>
                        }
                        size="small"
                        style={{ marginBottom: 16 }}
                    >
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text type="secondary">Jenis Proyek</Text>
                                <Tag color="blue" style={{ margin: 0 }}>{project?.project_type || 'Konstruksi Baru'}</Tag>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text type="secondary">Penanggung Jawab</Text>
                                <Text strong>{project?.project_manager || '-'}</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text type="secondary">Tahap Saat Ini</Text>
                                <Tag color="blue" style={{ margin: 0 }}>{project?.current_phase || 'Perencanaan'}</Tag>
                            </div>
                        </Space>
                    </Card>

                    {/* Status Anggaran Card */}
                    <Card
                        title={
                            <Space>
                                <DollarOutlined style={{ color: '#faad14' }} />
                                <Text strong>Status Anggaran</Text>
                            </Space>
                        }
                        size="small"
                        style={{ marginBottom: 16 }}
                    >
                        {budgetSummary ? (
                            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#e6f7ff', borderRadius: 4 }}>
                                    <Text>Anggaran terpakai</Text>
                                    <Text strong style={{ color: '#1890ff' }}>{formatCurrency(budgetSummary.used_budget)}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f6ffed', borderRadius: 4 }}>
                                    <Text>Sisa anggaran</Text>
                                    <Text strong style={{ color: '#52c41a' }}>{formatCurrency(budgetSummary.remaining_budget)}</Text>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
                                        Progress Penggunaan: {budgetSummary.percentage_used}%
                                    </Text>
                                    <Progress
                                        percent={budgetSummary.percentage_used}
                                        strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                                        size="default"
                                    />
                                </div>
                            </Space>
                        ) : (
                            <Text type="secondary">Loading budget info...</Text>
                        )}
                    </Card>

                    {/* Timeline Card */}
                    <Card
                        title={
                            <Space>
                                <CalendarOutlined style={{ color: '#722ed1' }} />
                                <Text strong>Timeline Progress - Log Harian</Text>
                            </Space>
                        }
                        size="small"
                    >
                        {dailyLogs.length > 0 ? (
                            <Timeline
                                items={[...dailyLogs].sort((a, b) => new Date(a.log_date) - new Date(b.log_date)).map(log => {
                                    const progressAdded = parseFloat(log.progress_added || 0);
                                    let color = 'blue';
                                    let dot = <ClockCircleOutlined />;

                                    if (progressAdded > 0) {
                                        color = 'green';
                                        dot = <CheckCircleOutlined />;
                                    }

                                    return {
                                        children: (
                                            <div style={{
                                                padding: '8px 12px',
                                                backgroundColor: '#fafafa',
                                                borderRadius: 6,
                                                marginBottom: 8,
                                                border: '1px solid #f0f0f0'
                                            }}>
                                                <div style={{ marginBottom: 4 }}>
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                                        {formatDate(log.log_date)}
                                                    </Text>
                                                </div>
                                                <div>
                                                    <Text strong>{log.description}</Text>
                                                    <Tag color="green" style={{ marginLeft: 8 }}>+{progressAdded}%</Tag>
                                                </div>
                                                {log.worker_name && (
                                                    <div style={{ marginTop: 4 }}>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            👷 {log.worker_name}
                                                        </Text>
                                                    </div>
                                                )}
                                                {log.notes && (
                                                    <div style={{ marginTop: 6, padding: '8px 10px', backgroundColor: '#fff', borderRadius: 4, borderLeft: '3px solid #1890ff' }}>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            💬 {log.notes}
                                                        </Text>
                                                    </div>
                                                )}
                                            </div>
                                        ),
                                        color: color,
                                        dot: dot
                                    };
                                })}
                            />
                        ) : (
                            <Alert
                                message="Belum ada log harian"
                                description="Tambahkan log harian untuk melihat timeline progress"
                                type="info"
                                showIcon
                            />
                        )}
                    </Card>


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
                                <RechartsTooltip />
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

            {/* Edit Project Modal */}
            <ProjectModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
                onSubmit={handleEditProject}
                mode="edit"
                initialData={project}
                loading={editModalLoading}
            />
        </div >
    );
}

export default DashboardHome;
