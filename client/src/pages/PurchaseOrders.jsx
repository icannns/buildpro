import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, DatePicker, InputNumber, Select, message, Space, Tag, Popconfirm } from 'antd';
import { ShoppingCartOutlined, PlusOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

function PurchaseOrders() {
    const [pos, setPos] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [receiveModalVisible, setReceiveModalVisible] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const [form] = Form.useForm();
    const [receiveForm] = Form.useForm();
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchPOs();
        fetchMaterials();
        fetchVendors();
    }, []);

    const fetchPOs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/purchase-orders');
            if (response.data.success) {
                setPos(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching POs:', error);
            message.error('Gagal memuat data purchase order');
        } finally {
            setLoading(false);
        }
    };

    const fetchMaterials = async () => {
        try {
            const response = await api.get('/materials');
            if (response.data.success) {
                setMaterials(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching materials:', error);
        }
    };

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

    const handleAdd = () => {
        form.resetFields();
        setModalVisible(true);
    };

    const handleSubmit = async (values) => {
        try {
            const payload = {
                ...values,
                order_date: values.order_date.format('YYYY-MM-DD'),
                expected_delivery: values.expected_delivery?.format('YYYY-MM-DD'),
            };

            await api.post('/purchase-orders', payload);
            message.success('Purchase order berhasil dibuat');
            setModalVisible(false);
            form.resetFields();
            fetchPOs();
        } catch (error) {
            console.error('Error creating PO:', error);
            message.error('Gagal membuat purchase order');
        }
    };

    const handleReceive = (record) => {
        setSelectedPO(record);
        receiveForm.setFieldsValue({
            actual_delivery: dayjs()
        });
        setReceiveModalVisible(true);
    };

    const handleReceiveSubmit = async (values) => {
        try {
            await api.put(`/purchase-orders/${selectedPO.id}/receive`, {
                actual_delivery: values.actual_delivery.format('YYYY-MM-DD'),
                notes: values.notes
            });
            message.success('Barang berhasil diterima, stok diupdate');
            setReceiveModalVisible(false);
            receiveForm.resetFields();
            fetchPOs();
        } catch (error) {
            console.error('Error receiving PO:', error);
            message.error('Gagal memproses penerimaan barang');
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/purchase-orders/${id}/status`, { status });
            message.success(`Status PO berhasil diubah menjadi ${status}`);
            fetchPOs();
        } catch (error) {
            console.error('Error updating status:', error);
            message.error('Gagal mengubah status PO');
        }
    };

    const handleDeletePO = async (id) => {
        try {
            setDeleting(true);
            const response = await api.delete(`/purchase-orders/${id}`);

            if (response.data.success) {
                message.success(response.data.message);
                await fetchPOs(); // Refresh data
            } else {
                message.error('Gagal menghapus purchase order');
            }
        } catch (error) {
            console.error('Error deleting PO:', error);
            const errorMsg = error.response?.data?.message || error.message;
            message.error(`Gagal: ${errorMsg}`);
        } finally {
            setDeleting(false);
        }
    };

    const columns = [
        {
            title: 'PO ID',
            dataIndex: 'id',
            key: 'id',
            render: (id) => `PO-${id.toString().padStart(4, '0')}`,
        },
        {
            title: 'Material',
            dataIndex: 'material_name',
            key: 'material_name',
        },
        {
            title: 'Vendor',
            dataIndex: 'vendor_name',
            key: 'vendor_name',
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'Harga',
            dataIndex: 'agreed_price',
            key: 'agreed_price',
            render: (price) => `Rp ${price.toLocaleString('id-ID')}`,
        },
        {
            title: 'Total',
            key: 'total',
            render: (_, record) => `Rp ${(record.quantity * record.agreed_price).toLocaleString('id-ID')}`,
        },
        {
            title: 'Tanggal Order',
            dataIndex: 'order_date',
            key: 'order_date',
            render: (date) => dayjs(date).format('DD MMM YYYY'),
        },
        {
            title: 'Estimasi Kirim',
            dataIndex: 'expected_delivery',
            key: 'expected_delivery',
            render: (date) => date ? dayjs(date).format('DD MMM YYYY') : '-',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colors = {
                    'Pending': 'orange',
                    'Confirmed': 'blue',
                    'Delivered': 'green',
                    'Cancelled': 'red'
                };
                return <Tag color={colors[status]}>{status}</Tag>;
            },
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space>
                    {record.status === 'Pending' && (
                        <Button
                            size="small"
                            onClick={() => handleStatusUpdate(record.id, 'Confirmed')}
                            type="default"
                            style={{ borderColor: '#52c41a', color: '#52c41a' }}
                        >
                            Konfirmasi
                        </Button>
                    )}
                    {record.status === 'Confirmed' && (
                        <Button
                            icon={<CheckCircleOutlined />}
                            size="small"
                            onClick={() => handleReceive(record)}
                            type="primary"
                        >
                            Terima Barang
                        </Button>
                    )}
                    <Popconfirm
                        title={`Hapus PO-${record.id.toString().padStart(4, '0')}?`}
                        description="Purchase order yang dihapus tidak dapat dikembalikan."
                        onConfirm={() => handleDeletePO(record.id)}
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
                        <ShoppingCartOutlined style={{ marginRight: 8 }} />
                        Purchase Orders - Pembelian Material
                    </span>
                }
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                    >
                        Buat PO Baru
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    dataSource={pos}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Total ${total} purchase orders`,
                    }}
                    summary={(pageData) => {
                        let totalAmount = 0;
                        pageData.forEach(({ quantity, agreed_price }) => {
                            totalAmount += quantity * agreed_price;
                        });
                        return (
                            <Table.Summary fixed>
                                <Table.Summary.Row>
                                    <Table.Summary.Cell index={0} colSpan={5}>
                                        <strong>Total Nilai PO (halaman ini)</strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={1}>
                                        <strong style={{ color: '#1890ff' }}>
                                            Rp {totalAmount.toLocaleString('id-ID')}
                                        </strong>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} colSpan={3} />
                                </Table.Summary.Row>
                            </Table.Summary>
                        );
                    }}
                />
            </Card>

            {/* Modal Buat PO Baru */}
            <Modal
                title="Buat Purchase Order Baru"
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
                        name="material_id"
                        label="Material"
                        rules={[{ required: true, message: 'Pilih material' }]}
                    >
                        <Select placeholder="Pilih material">
                            {materials.map(mat => (
                                <Option key={mat.id} value={mat.id}>
                                    {mat.name} (Stok: {mat.stock})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="vendor_id"
                        label="Vendor"
                        rules={[{ required: true, message: 'Pilih vendor' }]}
                    >
                        <Select
                            placeholder="Pilih vendor"
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {Array.isArray(vendors) && vendors.map(vendor => (
                                <Option key={vendor.id} value={vendor.id}>
                                    {vendor.name} {vendor.contact_person ? `- ${vendor.contact_person}` : ''}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="quantity"
                        label="Jumlah"
                        rules={[{ required: true, message: 'Masukkan jumlah' }]}
                    >
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="Jumlah pesanan" />
                    </Form.Item>

                    <Form.Item
                        name="agreed_price"
                        label="Harga Kesepakatan"
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
                        name="order_date"
                        label="Tanggal Order"
                        rules={[{ required: true, message: 'Pilih tanggal' }]}
                        initialValue={dayjs()}
                    >
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item
                        name="expected_delivery"
                        label="Estimasi Pengiriman"
                    >
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
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
                                Buat PO
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal Terima Barang */}
            <Modal
                title="Penerimaan Barang"
                open={receiveModalVisible}
                onCancel={() => {
                    setReceiveModalVisible(false);
                    receiveForm.resetFields();
                }}
                footer={null}
                width={500}
            >
                <Form
                    form={receiveForm}
                    layout="vertical"
                    onFinish={handleReceiveSubmit}
                >
                    <p>Konfirmasi penerimaan barang untuk PO: <strong>PO-{selectedPO?.id.toString().padStart(4, '0')}</strong></p>
                    <p>Material: <strong>{selectedPO?.material_name}</strong></p>
                    <p>Quantity: <strong>{selectedPO?.quantity}</strong></p>

                    <Form.Item
                        name="actual_delivery"
                        label="Tanggal Penerimaan"
                        rules={[{ required: true, message: 'Pilih tanggal' }]}
                    >
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item
                        name="notes"
                        label="Catatan Penerimaan"
                    >
                        <TextArea rows={3} placeholder="Kondisi barang, dll (opsional)" />
                    </Form.Item>

                    <Form.Item>
                        <Space style={{ float: 'right' }}>
                            <Button onClick={() => setReceiveModalVisible(false)}>
                                Batal
                            </Button>
                            <Button type="primary" htmlType="submit">
                                Konfirmasi Penerimaan
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default PurchaseOrders;
