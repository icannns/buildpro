import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, DatePicker, InputNumber, message, Space, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import dayjs from 'dayjs';

const { TextArea } = Input;

function DailyLogs() {
    const { user } = useAuth();
    const { activeProject, refreshActiveProject } = useProject();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        if (activeProject?.id) {
            fetchDailyLogs();
        }
    }, [activeProject]);

    const fetchDailyLogs = async () => {
        if (!activeProject?.id) return;

        try {
            setLoading(true);
            const response = await api.get(`/daily-logs/${activeProject.id}`);
            if (response.data.success) {
                setLogs(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching daily logs:', error);
            message.error('Gagal memuat data log harian');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingLog(null);
        form.resetFields();
        form.setFieldsValue({
            project_id: activeProject?.id,
            worker_name: user?.name || ''
        });
        setModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingLog(record);
        form.setFieldsValue({
            ...record,
            log_date: dayjs(record.log_date)
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/daily-logs/${id}`);
            message.success('Log berhasil dihapus');
            fetchDailyLogs();
            // Refresh active project to update Dashboard progress
            await refreshActiveProject();
        } catch (error) {
            console.error('Error deleting log:', error);
            message.error('Gagal menghapus log');
        }
    };

    const handleSubmit = async (values) => {
        try {
            const payload = {
                ...values,
                log_date: values.log_date.format('YYYY-MM-DD'),
                project_id: activeProject?.id
            };

            if (editingLog) {
                await api.put(`/daily-logs/${editingLog.id}`, payload);
                message.success('Log berhasil diupdate');
            } else {
                await api.post('/daily-logs', payload);
                message.success('Log berhasil ditambahkan');
            }

            setModalVisible(false);
            form.resetFields();
            fetchDailyLogs();
            // Refresh active project to update Dashboard progress
            await refreshActiveProject();
        } catch (error) {
            console.error('Error saving log:', error);
            const errorMsg = error.response?.data?.message || error.message;
            message.error(`Gagal: ${errorMsg}`);
        }
    };

    const columns = [
        {
            title: 'Tanggal',
            dataIndex: 'log_date',
            key: 'log_date',
            render: (date) => dayjs(date).format('DD MMM YYYY'),
            sorter: (a, b) => new Date(a.log_date) - new Date(b.log_date),
        },
        {
            title: 'Pekerja',
            dataIndex: 'worker_name',
            key: 'worker_name',
        },
        {
            title: 'Deskripsi Pekerjaan',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Progress',
            dataIndex: 'progress_added',
            key: 'progress_added',
            render: (progress) => (
                <Tag color={progress > 0 ? 'green' : 'default'}>
                    +{progress}%
                </Tag>
            ),
        },
        {
            title: 'Catatan',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true,
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
                        Edit
                    </Button>
                    <Popconfirm
                        title="Hapus log ini?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Ya"
                        cancelText="Tidak"
                    >
                        <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
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
                        <FileTextOutlined style={{ marginRight: 8 }} />
                        Log Harian Pekerjaan
                    </span>
                }
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                    >
                        Tambah Log
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    dataSource={logs}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Total ${total} log`,
                    }}
                />
            </Card>

            <Modal
                title={editingLog ? 'Edit Log Harian' : 'Tambah Log Harian'}
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
                        name="log_date"
                        label="Tanggal"
                        rules={[{ required: true, message: 'Pilih tanggal' }]}
                    >
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item
                        name="worker_name"
                        label="Nama Pekerja"
                        rules={[{ required: true, message: 'Masukkan nama pekerja' }]}
                    >
                        <Input placeholder="Nama pekerja" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Deskripsi Pekerjaan"
                        rules={[{ required: true, message: 'Masukkan deskripsi' }]}
                    >
                        <TextArea rows={4} placeholder="Apa yang dikerjakan hari ini?" />
                    </Form.Item>

                    <Form.Item
                        name="progress_added"
                        label="Progress Ditambahkan (%)"
                        rules={[{ required: true, message: 'Masukkan progress' }]}
                    >
                        <InputNumber
                            min={0}
                            max={100}
                            style={{ width: '100%' }}
                            placeholder="Contoh: 5"
                        />
                    </Form.Item>

                    <Form.Item
                        name="notes"
                        label="Catatan Tambahan"
                    >
                        <TextArea rows={3} placeholder="Catatan atau kendala (opsional)" />
                    </Form.Item>

                    <Form.Item>
                        <Space style={{ float: 'right' }}>
                            <Button onClick={() => setModalVisible(false)}>
                                Batal
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingLog ? 'Update' : 'Simpan'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default DailyLogs;
