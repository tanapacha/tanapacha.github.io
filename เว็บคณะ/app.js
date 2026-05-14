const { 
    Layout, Menu, Card, Form, Input, Select, Button, 
    Steps, Radio, Upload, Table, Modal, Tag, Space, 
    Typography, message, ConfigProvider, theme 
} = antd;
const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;
const { 
    UserOutlined, FileAddOutlined, DashboardOutlined, 
    CheckSquareOutlined, UploadOutlined, PlusOutlined,
    EditOutlined, HistoryOutlined, AuditOutlined, SettingOutlined
} = icons;

const { useState, useEffect } = React;

const App = () => {
    const [currentMenu, setCurrentMenu] = useState('dashboard');
    const [collapsed, setCollapsed] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setCollapsed(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems = [
        { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
        { key: 'new', icon: <FileAddOutlined />, label: 'New Document' },
        { key: 'approval', icon: <CheckSquareOutlined />, label: 'Approval' },
        { key: 'register', icon: <UserOutlined />, label: 'Registration' },
    ];

    const renderContent = () => {
        switch (currentMenu) {
            case 'register': return <RegistrationPage />;
            case 'new': return <NewDocumentPage />;
            case 'approval': return <ApprovalPage />;
            case 'dashboard': default: return <DashboardPage />;
        }
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#1677ff',
                    colorSuccess: '#52c41a',
                    fontFamily: "'Inter', 'Sarabun', sans-serif",
                    borderRadius: 8,
                },
            }}
        >
            <Layout className="min-h-screen">
                <Sider 
                    trigger={null} 
                    collapsible 
                    collapsed={collapsed}
                    breakpoint="md"
                    className="shadow-sm z-10"
                    theme="light"
                >
                    <div className="h-16 flex items-center justify-center border-b border-gray-100">
                        <span className="text-xl font-bold text-primary truncate px-4">
                            {collapsed ? 'DWS' : 'DocFlow'}
                        </span>
                    </div>
                    <Menu
                        theme="light"
                        mode="inline"
                        selectedKeys={[currentMenu]}
                        onClick={(e) => setCurrentMenu(e.key)}
                        items={menuItems}
                        className="mt-4"
                        style={{ borderRight: 'none' }}
                    />
                </Sider>
                <Layout>
                    <Header className="flex justify-between items-center shadow-sm z-0 px-6 bg-white" style={{ background: '#fff', padding: '0 24px' }}>
                        <Title level={4} style={{ margin: 0 }}>
                            {menuItems.find(m => m.key === currentMenu)?.label}
                        </Title>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm">
                                U
                            </div>
                        </div>
                    </Header>
                    <Content className="p-4 md:p-6 overflow-auto" style={{ background: '#f5f7fa' }}>
                        <div className="max-w-6xl mx-auto">
                            {renderContent()}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
};

const RegistrationPage = () => {
    const [form] = Form.useForm();
    const onFinish = (values) => {
        message.success("Registration saved successfully!");
    };
    return (
        <Card className="max-w-lg mx-auto mt-8 border-none shadow-sm rounded-xl">
            <div className="text-center mb-8">
                <Title level={3}>Profile Registration</Title>
                <Text type="secondary">ลงทะเบียนประสานงานเอกสาร</Text>
            </div>
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item name="department" label="สังกัดฝ่าย / งาน" rules={[{ required: true, message: 'กรุณาเลือกฝ่าย!' }]}>
                    <Select showSearch placeholder="เลือกฝ่ายที่สังกัด" options={mockDepartments} size="large" />
                </Form.Item>
                <Form.Item name="email" label="Email ติดต่อ" rules={[{ required: true, message: 'กรุณาระบุ Email!' }, { type: 'email', message: 'รูปแบบ Email ไม่ถูกต้อง!' }]}>
                    <Input placeholder="example@domain.com" size="large" />
                </Form.Item>
                <Form.Item className="mt-8 mb-0">
                    <Button type="primary" htmlType="submit" size="large" block>Save Profile</Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

const NewDocumentPage = () => {
    const [form] = Form.useForm();
    const [workflowMode, setWorkflowMode] = useState('auto');
    const [stepsData, setStepsData] = useState([
        { title: 'ผู้ร่าง', current: true },
        { title: 'หัวหน้าฝ่าย', editable: true },
        { title: 'คณบดี', editable: true }
    ]);

    const handleAddStep = () => {
        setStepsData([...stepsData, { title: 'ระบุฝ่ายรับ...', editable: true }]);
    };

    const handleEditStep = (index) => {
        message.info("Editing step " + (index + 1));
    };

    const onFinish = (values) => {
        message.success("Document created and forwarded!");
        form.resetFields();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 lg:col-span-2">
                <Card className="border-none shadow-sm rounded-xl">
                    <Title level={4} className="mb-6">Create New Document</Title>
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Form.Item name="title" label="หัวข้อเอกสาร" rules={[{ required: true }]}>
                            <Input placeholder="เช่น ขออนุมัติจัดซื้อ..." size="large" />
                        </Form.Item>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item name="docType" label="ประเภทเอกสาร" rules={[{ required: true }]}>
                                <Select placeholder="เลือกประเภท" options={mockDocumentTypes} size="large" />
                            </Form.Item>
                            <Form.Item label="อัปโหลดไฟล์ (PDF, Word)">
                                <Upload>
                                    <Button icon={<UploadOutlined />} size="large" className="w-full">แนบไฟล์เอกสาร</Button>
                                </Upload>
                            </Form.Item>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Space>
                                <Button size="large">Cancel</Button>
                                <Button type="primary" htmlType="submit" size="large">Submit Document</Button>
                            </Space>
                        </div>
                    </Form>
                </Card>
            </div>
            <div className="col-span-1">
                <Card title="Workflow Routes" className="h-full border-none shadow-sm rounded-xl">
                    <Radio.Group 
                        value={workflowMode} 
                        onChange={e => setWorkflowMode(e.target.value)}
                        className="mb-6 flex w-full"
                        optionType="button"
                        buttonStyle="solid"
                    >
                        <Radio.Button value="auto" className="flex-1 text-center">Auto Mode</Radio.Button>
                        <Radio.Button value="manual" className="flex-1 text-center">Manual Mode</Radio.Button>
                    </Radio.Group>
                    <div className="mt-4 pb-4">
                        <Steps
                            direction="vertical"
                            current={0}
                            items={stepsData.map((step, idx) => ({
                                title: (
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-sm font-medium">{step.title}</span>
                                        {step.editable && (
                                            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditStep(idx)} className="text-gray-400 hover:text-primary" />
                                        )}
                                    </div>
                                ),
                                description: <span className="text-xs text-gray-500">{step.current ? "Current step" : "Pending"}</span>
                            }))}
                        />
                    </div>
                    {workflowMode === 'manual' && (
                        <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAddStep}>
                            เพิ่มขั้นตอน
                        </Button>
                    )}
                </Card>
            </div>
        </div>
    );
};

const DashboardPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: '130px', render: text => <strong className="text-gray-700">{text}</strong> },
        { title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true },
        { title: 'Current Step', dataIndex: 'currentStep', key: 'currentStep' },
        { title: 'Assigned To', dataIndex: 'assignedTo', key: 'assignedTo', ellipsis: true },
        { 
            title: 'Status', 
            dataIndex: 'status', 
            key: 'status',
            render: (status) => {
                let color = status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'processing';
                return <Tag color={color} className="rounded-md px-2 py-0.5">{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button type="link" onClick={() => { setSelectedDoc(record); setIsModalOpen(true); }} className="px-0">
                    View Flow
                </Button>
            ),
        }
    ];

    return (
        <React.Fragment>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="bg-blue-50 border border-blue-100 shadow-sm rounded-xl">
                    <Text type="secondary" className="font-medium text-blue-600">Pending Actions</Text>
                    <Title level={2} className="!mt-1 !mb-0 text-blue-700">12</Title>
                </Card>
                <Card className="bg-green-50 border border-green-100 shadow-sm rounded-xl">
                    <Text type="secondary" className="font-medium text-green-600">Approved (This Month)</Text>
                    <Title level={2} className="!mt-1 !mb-0 text-green-700">45</Title>
                </Card>
                <Card className="bg-white border border-gray-100 shadow-sm rounded-xl">
                    <Text type="secondary" className="font-medium">Total Documents</Text>
                    <Title level={2} className="!mt-1 !mb-0 text-gray-800">128</Title>
                </Card>
            </div>
            <Card title="Recent Documents" styles={{ body: { padding: 0 } }} className="shadow-sm border-none rounded-xl overflow-hidden">
                <Table 
                    columns={columns} 
                    dataSource={mockDocuments} 
                    pagination={{ pageSize: 5 }}
                    scroll={{ x: 800 }}
                    rowClassName="hover:bg-gray-50 cursor-pointer transition-colors"
                />
            </Card>
            <Modal
                title={<span className="text-gray-800 font-semibold">{"Document Timeline: " + (selectedDoc?.id || "")}</span>}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={600}
                centered
            >
                <div className="py-4">
                    <Text strong className="text-lg block mb-6">{selectedDoc?.title}</Text>
                    <Steps
                        direction="vertical"
                        size="small"
                        current={selectedDoc?.steps?.findIndex(s => s.status === 'process') ?? 0}
                        items={selectedDoc?.steps?.map(step => ({
                            title: <span className="font-medium text-gray-800">{step.title}</span>,
                            description: <span className="text-gray-500 text-xs">{step.description}</span>,
                            status: step.status
                        })) || []}
                    />
                </div>
            </Modal>
        </React.Fragment>
    );
};

const ApprovalPage = () => {
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [approvalList, setApprovalList] = useState(mockDocuments.filter(d => d.status === 'pending'));

    const handleApprove = () => {
        message.success("Document Approved successfully!");
    };

    const handleReject = () => {
        setIsRejectModalOpen(true);
    };

    const onRejectSubmit = (values) => {
        message.success("Document Rejected and returned");
        setIsRejectModalOpen(false);
        form.resetFields();
    };

    if(approvalList.length === 0) {
        return (
            <Card className="text-center py-24 shadow-sm border-none rounded-xl">
                <CheckSquareOutlined className="text-6xl text-gray-200 mb-4 block" />
                <Title level={4} className="text-gray-400">No pending approvals</Title>
                <Text type="secondary">You have caught up with all your work.</Text>
            </Card>
        );
    }

    const doc = approvalList[0];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 lg:col-span-2">
                <Card title={<span className="text-primary font-medium">Action Required</span>} className="shadow-sm border-none rounded-xl">
                    <div className="mb-6">
                        <Text type="secondary" className="text-xs tracking-wider uppercase font-semibold">Document ID: {doc.id}</Text>
                        <Title level={3} className="!mt-2 !mb-3 text-gray-800">{doc.title}</Title>
                        <Tag color="processing" className="rounded">Waiting for your approval</Tag>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5 mb-8 border border-gray-100">
                        <Space direction="vertical" className="w-full gap-4">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                <Text type="secondary">Requested By</Text>
                                <Text strong className="text-gray-700">สมชาย เข็มกลัด (งานพัสดุ)</Text>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                                <Text type="secondary">Document Type</Text>
                                <Text strong className="text-gray-700">ขออนุมัติจัดซื้อจัดจ้าง</Text>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <Text type="secondary">Attached Files</Text>
                                <Button type="link" icon={<FileAddOutlined />} size="small" className="hover:bg-blue-50">Specs.pdf</Button>
                            </div>
                        </Space>
                    </div>
                    <div className="flex gap-4">
                        <Button 
                            className="flex-1 text-red-500 border-red-200 hover:border-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg font-medium" 
                            size="large"
                            onClick={handleReject}
                        >
                            Reject
                        </Button>
                        <Button 
                            type="primary" 
                            className="flex-1 bg-[#52c41a] hover:bg-[#389e0d] border-none shadow-sm shadow-green-200 rounded-lg font-medium" 
                            size="large"
                            onClick={handleApprove}
                        >
                            Approve
                        </Button>
                    </div>
                </Card>
            </div>
            <div className="col-span-1">
                <Card title="Timeline" className="h-full shadow-sm border-none rounded-xl">
                    <Steps
                        direction="vertical"
                        size="small"
                        current={2}
                        items={[
                            { title: <span className="font-medium text-gray-800">ผู้ร่าง</span>, description: <span className="text-xs text-gray-500">นาย ก. - 10 May 10:00</span>, status: 'finish' },
                            { title: <span className="font-medium text-gray-800">หัวหน้าฝ่าย</span>, description: <span className="text-xs text-gray-500">นาย ข. - 10 May 14:30</span>, status: 'finish' },
                            { title: <span className="font-medium text-blue-600">งานพัสดุ (You)</span>, description: <span className="text-xs text-blue-400">รอการพิจารณา</span>, status: 'process' },
                            { title: <span className="text-gray-400">คณบดี</span>, status: 'wait' },
                        ]}
                    />
                </Card>
            </div>
            <Modal
                title={<span className="text-gray-800 font-semibold">Reject Document</span>}
                open={isRejectModalOpen}
                onCancel={() => setIsRejectModalOpen(false)}
                footer={null}
                centered
            >
                <Form form={form} layout="vertical" onFinish={onRejectSubmit} className="mt-6">
                    <Form.Item name="reason" label="เหตุผลการ Reject" rules={[{ required: true }]}>
                        <Input.TextArea rows={4} placeholder="ระบุเหตุผลที่ต้องการให้แก้ไข..." className="rounded-lg" />
                    </Form.Item>
                    <Form.Item name="returnTo" label="ส่งกลับไปยัง" rules={[{ required: true }]}>
                        <Select placeholder="เลือกจุดหมายที่ต้องการส่งกลับ" size="large">
                            <Select.Option value="origin">ผู้ร่างเอกสาร (เริ่มต้นใหม่)</Select.Option>
                            <Select.Option value="previous">ขั้นตอนก่อนหน้า (หัวหน้าฝ่าย)</Select.Option>
                        </Select>
                    </Form.Item>
                    <div className="flex justify-end gap-3 mt-8">
                        <Button onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
                        <Button danger type="primary" htmlType="submit">Confirm Reject</Button>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
