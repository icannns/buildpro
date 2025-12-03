import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, message } from 'antd';
import dayjs from 'dayjs';

const ProjectModal = ({ visible, onClose, onSubmit, mode, initialData, loading }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible && mode === 'edit' && initialData) {
            // Pre-fill form for edit mode
            form.setFieldsValue({
                name: initialData.name,
                location: initialData.location,
                contractor: initialData.contractor,
                budget: initialData.budget,
                start_date: initialData.start_date ? dayjs(initialData.start_date) : null,
                end_date: initialData.end_date ? dayjs(initialData.end_date) : null
            });
        } else if (visible && mode === 'create') {
            // Reset form for create mode
            form.resetFields();
        }
    }, [visible, mode, initialData, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // Convert dates to YYYY-MM-DD format
            const formattedData = {
                ...values,
                start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : null,
                end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null
            };
            await onSubmit(formattedData);
            form.resetFields();
        } catch (error) {
            console.error('Form validation failed:', error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title={mode === 'create' ? 'Buat Proyek Baru' : 'Edit Proyek'}
            open={visible}
            onOk={handleSubmit}
            onCancel={handleCancel}
            confirmLoading={loading}
            okText={mode === 'create' ? 'Buat Proyek' : 'Simpan Perubahan'}
            cancelText="Batal"
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                style={{ marginTop: 20 }}
            >
                <Form.Item
                    name="name"
                    label="Nama Proyek"
                    rules={[{ required: true, message: 'Nama proyek wajib diisi' }]}
                >
                    <Input placeholder="contoh: Pembangunan Villa Bali" />
                </Form.Item>

                <Form.Item
                    name="location"
                    label="Lokasi"
                    rules={[{ required: true, message: 'Lokasi wajib diisi' }]}
                >
                    <Input placeholder="contoh: Ubud, Bali" />
                </Form.Item>

                <Form.Item
                    name="contractor"
                    label="Kontraktor"
                >
                    <Input placeholder="contoh: CV Bangunan Bali Indah" />
                </Form.Item>

                <Form.Item
                    name="budget"
                    label="Budget"
                    rules={[{ required: true, message: 'Budget wajib diisi' }]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/Rp\s?|(,*)/g, '')}
                        placeholder="contoh: 1500000000"
                        min={0}
                    />
                </Form.Item>

                <Form.Item
                    name="start_date"
                    label="Tanggal Mulai"
                    rules={[{ required: true, message: 'Tanggal mulai wajib diisi' }]}
                >
                    <DatePicker
                        style={{ width: '100%' }}
                        format="DD MMMM YYYY"
                        placeholder="Pilih tanggal mulai"
                    />
                </Form.Item>

                <Form.Item
                    name="end_date"
                    label="Deadline / Tanggal Selesai"
                    rules={[{ required: true, message: 'Deadline wajib diisi' }]}
                >
                    <DatePicker
                        style={{ width: '100%' }}
                        format="DD MMMM YYYY"
                        placeholder="Pilih deadline"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ProjectModal;
