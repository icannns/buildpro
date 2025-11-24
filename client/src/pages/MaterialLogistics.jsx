import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Row, Col, Statistic, Spin, Alert, Button, message, Modal, Select, InputNumber } from 'antd';
import {
    ShoppingOutlined,
    WarningOutlined,
    CheckCircleOutlined,
    AppstoreOutlined,
    DollarOutlined,
    LoadingOutlined,
    PlusOutlined,
    EditOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const API_URL = 'http://localhost:5000/api';

function MaterialLogistics() {
    const [materials, setMaterials] = useState([]);
    const [statistics, setStatistics] = useState({
        totalSKU: 0,
        totalAssets: 0,
        lowStockCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Order Material Modal
    const [orderModalVisible, setOrderModalVisible] = useState(false);
    const [selectedMaterialId, setSelectedMaterialId] = useState(null);
    const [orderQty, setOrderQty] = useState(1);
    const [ordering, setOrdering] = useState(false);

    // Update Price Modal
    const [priceModalVisible, setPriceModalVisible] = useState(false);
    const [selectedPriceMaterialId, setSelectedPriceMaterialId] = useState(null);
    const [newPrice, setNewPrice] = useState(0);
    const [updatingPrice, setUpdatingPrice] = useState(false);

    useEffect(() => {
        fetchMaterialsData();
    }, []);

    const fetchMaterialsData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${API_URL}/materials`);

            if (response.data.success) {
                const materialsWithKeys = response.data.data.map(item => ({
                    ...item,
                    key: item.id.toString()
                }));

                setMaterials(materialsWithKeys);
                setStatistics(response.data.statistics);
            } else {
                setError('Failed to load materials data');
            }
        } catch (err) {
            console.error('Error fetching materials:', err);
            setError('Gagal memuat data material. Pastikan backend sudah running.');
            message.error('Gagal memuat data material');
        } finally {
            setLoading(false);
        }
    };

    // Order Material Functions
    const showOrderModal = () => {
        setOrderModalVisible(true);
        setSelectedMaterialId(materials.length > 0 ? materials[0].id : null);
        setOrderQty(1);
    };

    const handleOrderMaterial = async () => {
        if (!selectedMaterialId || !orderQty) {
            message.error('Pilih material dan masukkan jumlah!');
            return;
        }

        try {
            setOrdering(true);

            const response = await axios.post(`${API_URL}/materials/restock`, {
                id: selectedMaterialId,
                qty: orderQty
            });

            if (response.data.success) {
                message.success(response.data.message);
                setOrderModalVisible(false);
                await fetchMaterialsData(); // Refresh data
            } else {
                message.error('Gagal order material');
            }
        } catch (err) {
            console.error('Error ordering material:', err);
            message.error('Gagal order material. Cek koneksi backend.');
        } finally {
            setOrdering(false);
        }
    };

    // Update Price Functions
    const showPriceModal = () => {
        setPriceModalVisible(true);
        if (materials.length > 0) {
            const firstMaterial = materials[0];
            setSelectedPriceMaterialId(firstMaterial.id);
            setNewPrice(parseFloat(firstMaterial.price));
        }
    };

    const handleMaterialPriceChange = (materialId) => {
        const material = materials.find(m => m.id === materialId);
        if (material) {
            setSelectedPriceMaterialId(materialId);
            setNewPrice(parseFloat(material.price));
        }
    };

    const handleUpdatePrice = async () => {
        if (!selectedPriceMaterialId || !newPrice) {
            message.error('Pilih material dan masukkan harga baru!');
            return;
        }

        if (newPrice < 0) {
            message.error('Harga tidak boleh negatif!');
            return;
        }

        try {
            setUpdatingPrice(true);

            const response = await axios.post(`${API_URL}/materials/update-price`, {
                id: selectedPriceMaterialId,
                new_price: newPrice
            });

            if (response.data.success) {
                message.success(response.data.message);
                setPriceModalVisible(false);
                await fetchMaterialsData(); // Refresh data
            } else {
                message.error('Gagal update harga');
            }
        } catch (err) {
            console.error('Error updating price:', err);
            message.error('Gagal update harga. Cek koneksi backend.');
        } finally {
            setUpdatingPrice(false);
        }
    };

    const columns = [
        {
            title: 'Nama Item',
            dataIndex: 'name',
            key: 'name',
            width: '25%',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Kategori',
            dataIndex: 'category',
            key: 'category',
            filters: [...new Set(materials.map(m => m.category))].map(cat => ({
                text: cat,
                value: cat
            })),
            onFilter: (value, record) => record.category === value,
        },
        {
            title: 'Stok',
            dataIndex: 'stock',
            key: 'stock',
            sorter: (a, b) => a.stock - b.stock,
            render: (stock) => (
                <span style={{ fontWeight: stock < 10 ? 'bold' : 'normal', color: stock < 10 ? '#ff4d4f' : 'inherit' }}>
                    {stock}
                </span>
            ),
        },
        {
            title: 'Satuan',
            dataIndex: 'unit',
            key: 'unit',
        },
        {
            title: 'Harga/Unit',
            dataIndex: 'price',
            key: 'price',
            sorter: (a, b) => parseFloat(a.price) - parseFloat(b.price),
            render: (price) => `Rp ${parseFloat(price).toLocaleString('id-ID')}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            filters: [
                { text: 'In Stock', value: 'In Stock' },
                { text: 'Low Stock', value: 'Low Stock' },
            ],
            onFilter: (value, record) => record.status === value || (value === 'Low Stock' && record.stock < 10),
            render: (status, record) => {
                if (status === 'Low Stock' || record.stock < 10) {
                    return (
                        <Tag icon={<WarningOutlined />} color="red">
                            Low Stock
                        </Tag>
                    );
                }
                return (
                    <Tag icon={<CheckCircleOutlined />} color="green">
                        In Stock
                    </Tag>
                );
            },
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
                <div style={{ marginTop: '20px' }}>
                    <Paragraph type="secondary">Memuat data material...</Paragraph>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Title level={2}>Material & Logistik</Title>
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    showIcon
                    action={
                        <Button size="small" danger onClick={fetchMaterialsData}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2}>Material & Logistik</Title>
                    <Paragraph type="secondary">
                        Kelola inventaris material konstruksi dan monitoring stok
                    </Paragraph>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={showOrderModal}
                    >
                        Order Material Baru
                    </Button>
                    <Button
                        icon={<EditOutlined />}
                        size="large"
                        onClick={showPriceModal}
                    >
                        Simulasi Vendor Update Harga
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px', marginTop: '24px' }}>
                <Col xs={24} sm={12} md={8}>
                    <Card>
                        <Statistic
                            title="Total SKU"
                            value={statistics.totalSKU}
                            prefix={<AppstoreOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card>
                        <Statistic
                            title="Total Nilai Aset"
                            value={statistics.totalAssets}
                            precision={0}
                            prefix="Rp"
                            formatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                            valueStyle={{ color: '#52c41a' }}
                            suffix={<DollarOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card>
                        <Statistic
                            title="Item Low Stock"
                            value={statistics.lowStockCount}
                            prefix={<WarningOutlined />}
                            valueStyle={{ color: statistics.lowStockCount > 0 ? '#ff4d4f' : '#52c41a' }}
                            suffix={`/ ${statistics.totalSKU}`}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Inventory Table */}
            <Card
                title={
                    <span>
                        <ShoppingOutlined style={{ marginRight: '8px' }} />
                        Inventaris Material
                    </span>
                }
                extra={<Tag color="blue">{materials.length} Items</Tag>}
            >
                <Table
                    columns={columns}
                    dataSource={materials}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Total ${total} items`,
                        showSizeChanger: true,
                    }}
                    bordered
                    size="middle"
                    loading={loading}
                />
            </Card>

            {/* Order Material Modal */}
            <Modal
                title="Order Material Baru"
                open={orderModalVisible}
                onOk={handleOrderMaterial}
                onCancel={() => setOrderModalVisible(false)}
                confirmLoading={ordering}
                okText="Order"
                cancelText="Batal"
            >
                <div style={{ padding: '20px 0' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <Text strong>Pilih Material:</Text>
                        <Select
                            style={{ width: '100%', marginTop: '8px' }}
                            value={selectedMaterialId}
                            onChange={setSelectedMaterialId}
                            size="large"
                        >
                            {materials.map(material => (
                                <Option key={material.id} value={material.id}>
                                    {material.name} - Stok: {material.stock} {material.unit}
                                </Option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <Text strong>Jumlah Order:</Text>
                        <InputNumber
                            min={1}
                            max={1000}
                            value={orderQty}
                            onChange={setOrderQty}
                            style={{ width: '100%', marginTop: '8px' }}
                            size="large"
                        />
                    </div>

                    <Alert
                        message="Info"
                        description="Stok akan ditambahkan ke inventaris saat ini"
                        type="info"
                        showIcon
                        style={{ marginTop: '16px' }}
                    />
                </div>
            </Modal>

            {/* Update Price Modal */}
            <Modal
                title="Simulasi Vendor Update Harga"
                open={priceModalVisible}
                onOk={handleUpdatePrice}
                onCancel={() => setPriceModalVisible(false)}
                confirmLoading={updatingPrice}
                okText="Update Harga"
                cancelText="Batal"
            >
                <div style={{ padding: '20px 0' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <Text strong>Pilih Material:</Text>
                        <Select
                            style={{ width: '100%', marginTop: '8px' }}
                            value={selectedPriceMaterialId}
                            onChange={handleMaterialPriceChange}
                            size="large"
                        >
                            {materials.map(material => (
                                <Option key={material.id} value={material.id}>
                                    {material.name} - Harga saat ini: Rp {parseFloat(material.price).toLocaleString('id-ID')}
                                </Option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <Text strong>Harga Baru (Rp):</Text>
                        <InputNumber
                            min={0}
                            value={newPrice}
                            onChange={setNewPrice}
                            style={{ width: '100%', marginTop: '8px' }}
                            size="large"
                            formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/Rp\s?|(,*)/g, '')}
                        />
                    </div>

                    <Alert
                        message="Simulasi Vendor"
                        description="Fitur ini mensimulasikan update harga dari vendor/supplier"
                        type="warning"
                        showIcon
                        style={{ marginTop: '16px' }}
                    />
                </div>
            </Modal>
        </div>
    );
}

export default MaterialLogistics;
