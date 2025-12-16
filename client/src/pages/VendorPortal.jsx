import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, message, Space, Tag, Tabs, Popconfirm } from 'antd';
import { ShopOutlined, EditOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const { TextArea } = Input;

function VendorPortal() {
    const { user } = useAuth();
    const [vendors, setVendors] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [form] = Form.useForm();
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchVendors();
        fetchVendorMaterials();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await api.get('/vendors');
            if (response.data.success) {
                setVendors(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    };

    const fetchVendorMaterials = async () => {
        try {
            setLoading(true);
            // Get materials for first vendor (or could filter by user's vendor)
            const response = await api.get('/vendors/1/materials');
            if (response.data.success) {
                setMaterials(response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching materials:', error);
            message.error('Gagal memuat data material');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (record) => {
        setEditingMaterial(record);
        form.setFieldsValue(record);
        setModalVisible(true);
    };

    const handleAdd = () => {
        setEditingMaterial(null);
        form.resetFields();
        form.setFieldsValue({
            vendor_id: 1 // Hardcode for now
        });
        setModalVisible(true);
    };

    const handleSubmit = async (values) => {
        try {
            if (editingMaterial) {
                // Update existing material price
                await api.put(`/vendors/1/materials/${editingMaterial.id}`, values);
                message.success('Harga material berhasil diupdate');
            } else {
                // Add new material
                await api.post('/vendors/1/materials', values);
                message.success('Material berhasil ditambahkan');
            }

            setModalVisible(false);
            form.resetFields();
            fetchVendorMaterials();
        } catch (error) {
            console.error('Error saving material:', error);
            message.error('Gagal menyimpan data material');
        }
    };

    const handleDeleteMaterial = async (id, name) => {
        try {
            setDeleting(true);
            const response = await api.delete(`/vendors/1/materials/${id}`);

            if (response.data.success) {
                message.success(response.data.message);
                await fetchVendorMaterials(); // Refresh data
            } else {
                message.error('Gagal menghapus material');
            }
        } catch (error) {
            console.error('Error deleting material:', error);
            const errorMsg = error.response?.data?.message || error.message;
            message.error(`Gagal: ${errorMsg}`);
        } finally {
            setDeleting(false);
        }
    };

    const materialColumns = [
        {
            title: 'Material',
            dataIndex: 'material_name',
            key: 'material_name',
        },
        {
            title: 'Harga',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `Rp ${price.toLocaleString('id-ID')}`,
        },
        {
            title: 'Unit',
            dataIndex: 'unit',
            key: 'unit',
        },
        {
            title: 'Stok Tersedia',
            dataIndex: 'stock_available',
            key: 'stock_available',
        },
        {
            title: 'Min. Order',
            dataIndex: 'min_order_quantity',
            key: 'min_order_quantity',
        },
        {
            title: 'Waktu Kirim',
            dataIndex: 'delivery_time_days',
            key: 'delivery_time_days',
            render: (days) => `${days} hari`,
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(record)}
                    >
                        Edit Harga
                    </Button>
                    <Popconfirm
                        title={`Hapus material "${record.material_name}"?`}
                        description="Material yang dihapus tidak dapat dikembalikan."
                        onConfirm={() => handleDeleteMaterial(record.id, record.material_name)}
                        okText="Hapus"
                        cancelText="Batal"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            size="small"
                            loading={deleting}
                        >
                            Hapus
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Card
                title={
                    <span>
                        <ShopOutlined style={{ marginRight: 8 }} />
                        Portal Vendor - Kelola Material & Harga
                    </span>
                }
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                    >
                        Tambah Material Baru
                    </Button>
                }
            >
                <Tabs defaultActiveKey="1">
                    <Tabs.TabPane tab="Material Saya" key="1">
                        <Table
                            columns={materialColumns}
                            dataSource={materials}
                            rowKey="id"
                            loading={loading}
                            pagination={{
                                pageSize: 10,
                                showTotal: (total) => `Total ${total} material`,
                            }}
                        />
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Info Vendor" key="2">
                        <Card>
                            {vendors.length > 0 && (
                                <div>
                                    <p><strong>Nama:</strong> {vendors[0].name}</p>
                                    <p><strong>Kontak:</strong> {vendors[0].contact_person}</p>
                                    <p><strong>Telepon:</strong> {vendors[0].phone}</p>
                                    <p><strong>Email:</strong> {vendors[0].email}</p>
                                    <p><strong>Rating:</strong> {vendors[0].rating} / 5.0</p>
                                    <p><strong>Status:</strong> <Tag color={vendors[0].status === 'Active' ? 'green' : 'red'}>{vendors[0].status}</Tag></p>
                                </div>
                            )}
                        </Card>
                    </Tabs.TabPane>
                </Tabs>
            </Card>

            <Modal
                title={editingMaterial ? 'Edit Harga Material' : 'Tambah Material Baru'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="material_name"
                        label="Nama Material"
                        rules={[{ required: true, message: 'Masukkan nama material' }]}
                    >
                        <Input placeholder="Contoh: Semen Portland" disabled={!!editingMaterial} />
                    </Form.Item>

                    <Form.Item
                        name="price"
                        label="Harga"
                        rules={[{ required: true, message: 'Masukkan harga' }]}
                    >
                        <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/Rp\s?|(,*)/g, '')}
                            placeholder="Harga per unit"
                        />
                    </Form.Item>

                    <Form.Item
                        name="unit"
                        label="Unit"
                        rules={[{ required: true, message: 'Masukkan unit' }]}
                    >
                        <Input placeholder="Contoh: sak, m3, batang" />
                    </Form.Item>

                    <Form.Item
                        name="stock_available"
                        label="Stok Tersedia"
                        rules={[{ required: true, message: 'Masukkan stok' }]}
                    >
                        <InputNumber min={0} style={{ width: '100%' }} placeholder="Jumlah stok" />
                    </Form.Item>

                    <Form.Item
                        name="min_order_quantity"
                        label="Minimal Order"
                        rules={[{ required: true, message: 'Masukkan minimal order' }]}
                    >
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="Minimal pemesanan" />
                    </Form.Item>

                    <Form.Item
                        name="delivery_time_days"
                        label="Waktu Pengiriman (hari)"
                        rules={[{ required: true, message: 'Masukkan waktu pengiriman' }]}
                    >
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="Estimasi pengiriman" />
                    </Form.Item>

                    <Form.Item
                        name="notes"
                        label="Catatan"
                    >
                        <TextArea rows={3} placeholder="Catatan tambahan (opsional)" />
                    </Form.Item>

                    <Form.Item>
                        <Space style={{ float: 'right' }}>
                            <Button onClick={() => setModalVisible(false)}>
                                Batal
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingMaterial ? 'Update' : 'Simpan'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default VendorPortal;
