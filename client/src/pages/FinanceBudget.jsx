import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Typography, Row, Col, Progress, Statistic, Divider, Spin, Alert, Button, message } from 'antd';
import {
    DollarOutlined,
    PayCircleOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    FundOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Paragraph, Text } = Typography;

const API_URL = 'http://localhost:5000/api';

function FinanceBudget() {
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState({
        totalContract: 0,
        paidAmount: 0,
        pendingAmount: 0,
        unpaidAmount: 0,
        remainingBudget: 0,
        percentageUsed: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPaymentsData();
    }, []);

    const fetchPaymentsData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${API_URL}/payments`);

            if (response.data.success) {
                // Add key prop for Table component
                const paymentsWithKeys = response.data.data.map(item => ({
                    ...item,
                    key: item.id.toString()
                }));

                setPayments(paymentsWithKeys);
                setSummary(response.data.summary);
            } else {
                setError('Failed to load payments data');
            }
        } catch (err) {
            console.error('Error fetching payments:', err);
            setError('Gagal memuat data pembayaran. Pastikan backend sudah running.');
            message.error('Gagal memuat data pembayaran');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    const columns = [
        {
            title: 'Termin',
            dataIndex: 'termin_number',
            key: 'termin_number',
            width: '10%',
            render: (term) => `Termin ${term}`,
        },
        {
            title: 'Deskripsi',
            dataIndex: 'termin_name',
            key: 'termin_name',
            width: '35%',
        },
        {
            title: 'Tanggal',
            dataIndex: 'date',
            key: 'date',
            width: '15%',
            sorter: (a, b) => new Date(a.date) - new Date(b.date),
            render: (date) => formatDate(date),
        },
        {
            title: 'Nominal',
            dataIndex: 'amount',
            key: 'amount',
            width: '20%',
            sorter: (a, b) => parseFloat(a.amount) - parseFloat(b.amount),
            render: (amount) => (
                <Text strong>Rp {parseFloat(amount).toLocaleString('id-ID')}</Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: '20%',
            filters: [
                { text: 'Paid', value: 'Paid' },
                { text: 'Pending', value: 'Pending' },
                { text: 'Unpaid', value: 'Unpaid' },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status) => {
                if (status === 'Paid') {
                    return (
                        <Badge
                            status="success"
                            text={
                                <Text strong style={{ color: '#52c41a' }}>
                                    <CheckCircleOutlined style={{ marginRight: '4px' }} />
                                    Paid
                                </Text>
                            }
                        />
                    );
                } else if (status === 'Pending') {
                    return (
                        <Badge
                            status="warning"
                            text={
                                <Text strong style={{ color: '#faad14' }}>
                                    <ClockCircleOutlined style={{ marginRight: '4px' }} />
                                    Pending
                                </Text>
                            }
                        />
                    );
                } else {
                    return (
                        <Badge
                            status="error"
                            text={
                                <Text strong style={{ color: '#ff4d4f' }}>
                                    <ClockCircleOutlined style={{ marginRight: '4px' }} />
                                    Unpaid
                                </Text>
                            }
                        />
                    );
                }
            },
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                <div style={{ marginTop: '20px' }}>
                    <Paragraph type="secondary">Memuat data keuangan...</Paragraph>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Title level={2}>Keuangan & Budget</Title>
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button size="small" danger onClick={fetchPaymentsData}>
                            Coba Lagi
                        </Button>
                    }
                    style={{ marginTop: '24px' }}
                />
            </div>
        );
    }

    return (
        <div>
            <Title level={2}>Keuangan & Budget</Title>
            <Paragraph type="secondary">
                Kelola pembayaran termin dan monitoring budget proyek
            </Paragraph>

            <Row gutter={[24, 24]}>
                {/* Left Column - Payment Table */}
                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <span>
                                <PayCircleOutlined style={{ marginRight: '8px' }} />
                                Riwayat Pembayaran Termin
                            </span>
                        }
                        extra={
                            <span>
                                <Badge status="success" text="Paid" style={{ marginRight: '16px' }} />
                                <Badge status="warning" text="Pending" style={{ marginRight: '16px' }} />
                                <Badge status="error" text="Unpaid" />
                            </span>
                        }
                    >
                        <Table
                            columns={columns}
                            dataSource={payments}
                            pagination={{
                                pageSize: 6,
                                showTotal: (total) => `Total ${total} termin`,
                            }}
                            bordered
                            size="middle"
                            loading={loading}
                            summary={() => (
                                <Table.Summary fixed>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={3}>
                                            <Text strong>Total Contract Value</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1}>
                                            <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                                                Rp {summary.totalContract.toLocaleString('id-ID')}
                                            </Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={2} />
                                    </Table.Summary.Row>
                                </Table.Summary>
                            )}
                        />
                    </Card>
                </Col>

                {/* Right Column - Budget Summary */}
                <Col xs={24} lg={8}>
                    <Card
                        title={
                            <span>
                                <FundOutlined style={{ marginRight: '8px' }} />
                                Project Budget Summary
                            </span>
                        }
                        bordered={true}
                        style={{ position: 'sticky', top: '24px' }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <Progress
                                type="circle"
                                percent={parseFloat(summary.percentageUsed)}
                                size={140}
                                strokeColor={{
                                    '0%': '#108ee9',
                                    '50%': '#faad14',
                                    '100%': '#52c41a',
                                }}
                                format={(percent) => `${percent}%`}
                            />
                            <div style={{ marginTop: '16px' }}>
                                <Text type="secondary">Dana Terpakai</Text>
                            </div>
                        </div>

                        <Divider />

                        <div style={{ marginBottom: '16px' }}>
                            <Statistic
                                title="Total Contract Value"
                                value={summary.totalContract}
                                precision={0}
                                prefix="Rp"
                                formatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                            />
                        </div>

                        <Divider />

                        <div style={{ marginBottom: '16px' }}>
                            <Row gutter={8}>
                                <Col span={12}>
                                    <Card size="small" style={{ backgroundColor: '#f0f5ff' }}>
                                        <Statistic
                                            title="Dana Terpakai"
                                            value={summary.paidAmount}
                                            precision={0}
                                            prefix="Rp"
                                            formatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                            valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                                        />
                                    </Card>
                                </Col>
                                <Col span={12}>
                                    <Card size="small" style={{ backgroundColor: '#fffbe6' }}>
                                        <Statistic
                                            title="Sisa Budget"
                                            value={summary.remainingBudget}
                                            precision={0}
                                            prefix="Rp"
                                            formatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                            valueStyle={{ color: '#faad14', fontSize: '18px' }}
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        </div>

                        <Divider />

                        <div>
                            <Title level={5}>Breakdown Dana</Title>
                            <div style={{ marginTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <Text>Dana Terpakai</Text>
                                    <Text strong style={{ color: '#52c41a' }}>
                                        {summary.percentageUsed}%
                                    </Text>
                                </div>
                                <Progress
                                    percent={parseFloat(summary.percentageUsed)}
                                    strokeColor="#52c41a"
                                    showInfo={false}
                                />
                            </div>
                            <div style={{ marginTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <Text>Sisa Budget</Text>
                                    <Text strong style={{ color: '#faad14' }}>
                                        {(100 - parseFloat(summary.percentageUsed)).toFixed(2)}%
                                    </Text>
                                </div>
                                <Progress
                                    percent={100 - parseFloat(summary.percentageUsed)}
                                    strokeColor="#faad14"
                                    showInfo={false}
                                />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default FinanceBudget;
