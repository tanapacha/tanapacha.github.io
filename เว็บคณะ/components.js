// components.js — Premium SaaS Layout
const { Layout, Menu, Typography, ConfigProvider, Avatar, Dropdown, Badge } = antd;
const { Header, Content, Sider } = Layout;
const {
    DashboardOutlined, FileAddOutlined, CheckSquareOutlined,
    UserOutlined, HistoryOutlined, FormOutlined, SettingOutlined,
    BellOutlined, CaretDownOutlined, LogoutOutlined,
    MenuFoldOutlined, MenuUnfoldOutlined, AuditOutlined, GlobalOutlined
} = icons;

const { useState, useEffect } = React;

const SharedLayout = ({ children, activeKey, pageTitle }) => {
    const [collapsed, setCollapsed] = useState(window.innerWidth < 1100);
    const [user, setUser] = useState({ name: 'กำลังโหลด...', initial: '?', dept: '', position: '' });

    useEffect(() => {
        const currentUser = WorkflowEngine.getCurrentUser();
        setUser(currentUser);

        const onResize = () => setCollapsed(window.innerWidth < 1100);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const menuItems = [
        { key: 'status',      icon: <DashboardOutlined />,   label: <a href="status.html">แดชบอร์ดหลัก</a> },
        { key: 'submitDoc',   icon: <FileAddOutlined />,     label: <a href="submitDoc.html">สร้างเอกสารใหม่</a> },
        { key: 'myTasks',     icon: <CheckSquareOutlined />, label: <a href="myTasks.html">งานที่รับผิดชอบ</a> },
        { key: 'approval',    icon: <AuditOutlined />,       label: <a href="approval.html">พิจารณาอนุมัติ</a> },
        { key: 'history',     icon: <HistoryOutlined />,     label: <a href="history.html">ประวัติการทำงาน</a> },
        { key: 'activityLog', icon: <FormOutlined />,        label: <a href="activityLog.html">บันทึกกิจกรรม</a> },
        { key: 'admin',       icon: <SettingOutlined />,     label: <a href="admin.html">วิเคราะห์ระบบ</a> },
        { key: 'profile',     icon: <UserOutlined />,        label: <a href="profile.html">ข้อมูลส่วนตัว</a> },
    ];

    const profileMenu = {
        items: [
            { key: 'profile', icon: <UserOutlined />, label: <a href="profile.html">ข้อมูลบัญชี</a> },
            { type: 'divider' },
            { key: 'logout', icon: <LogoutOutlined style={{ color: '#ea580c' }}/>, label: <a href="index.html" style={{ color: '#ea580c', fontWeight: 600 }}>ออกจากระบบ</a> },
        ]
    };

    return (
        <ConfigProvider theme={{
            token: {
                colorPrimary:     '#ea580c',
                colorPrimaryHover:'#c2410c',
                fontFamily:       "'Inter', 'Sarabun', sans-serif",
                borderRadius:     8,
                colorTextBase:    '#020617',
                colorBgContainer: '#FFFFFF',
            }
        }}>
            <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
                
                {/* ══ HYPER-PREMIUM DARK SIDEBAR ══ */}
                <Sider
                    collapsible
                    collapsed={collapsed}
                    width={280}
                    collapsedWidth={80}
                    trigger={null}
                    style={{
                        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 200,
                        background: '#040b16', // Extremely dark slate
                        borderRight: '1px solid #1e293b',
                        boxShadow: '1px 0 10px rgba(0,0,0,0.1)',
                        overflowY: 'auto', overflowX: 'hidden',
                        display: 'flex', flexDirection: 'column',
                    }}
                >
                    {/* Dark Header / Logo */}
                    <div style={{
                        height: 76, display: 'flex', alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: collapsed ? '0' : '0 24px',
                        borderBottom: '1px solid #1e293b', flexShrink: 0, gap: 16
                    }}>
                        <div style={{
                            width: 38, height: 38, flexShrink: 0,
                            background: 'linear-gradient(135deg, #ea580c, #f97316)', borderRadius: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(234,88,12,0.3), inset 0 2px 0 rgba(255,255,255,0.2)'
                        }}>
                            <GlobalOutlined style={{ fontSize: 20, color: '#FFF' }} />
                        </div>
                        {!collapsed && (
                            <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.01em', lineHeight: 1.2 }}>e-Document System</span>
                                <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', letterSpacing: '0.02em', marginTop: 2 }}>Nakhon Phanom Univ.</span>
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '28px 0 12px 24px', opacity: collapsed ? 0 : 1, transition: '0.2s' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Main Menu</span>
                    </div>

                    <Menu
                        mode="inline"
                        selectedKeys={[activeKey]}
                        items={menuItems}
                        style={{ padding: '0 12px', flex: 1, background: 'transparent', border: 'none' }}
                        theme="dark" // AntD dark theme works well here
                        className="premium-dark-menu"
                    />

                    {/* Dark Footer / User Profile */}
                    <div style={{ padding: '20px 16px', borderTop: '1px solid #1e293b', marginTop: 'auto', background: '#020617' }}>
                        {collapsed ? (
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                                <Avatar size={38} style={{ background: '#ea580c', color: '#FFF', fontWeight: 600, border: '2px solid #1e293b' }}>{user.initial}</Avatar>
                            </div>
                        ) : (
                            <a href="profile.html" style={{
                                textDecoration: 'none', background: '#0f172a', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                                border: '1px solid #1e293b', transition: '0.2s', cursor: 'pointer'
                            }} onMouseEnter={e => {e.currentTarget.style.borderColor='#334155'; e.currentTarget.style.background='#1e293b';}} onMouseLeave={e => {e.currentTarget.style.borderColor='#1e293b'; e.currentTarget.style.background='#0f172a';}}>
                                <Avatar size={42} style={{ background: '#ea580c', color: '#FFF', fontWeight: 600, border: '2px solid #1e293b', flexShrink: 0 }}>{user.initial}</Avatar>
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{user.dept} {user.position ? `(${user.position})` : ''}</div>
                                </div>
                            </a>
                        )}
                        
                        <div onClick={() => setCollapsed(!collapsed)} style={{
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
                            gap: 12, padding: '10px 12px', color: '#64748b', fontSize: 13, fontWeight: 500, borderRadius: 8, transition: '0.2s'
                        }} onMouseEnter={e => { e.currentTarget.style.color='#f8fafc'; e.currentTarget.style.background='#1e293b'; }} onMouseLeave={e => { e.currentTarget.style.color='#64748b'; e.currentTarget.style.background='transparent'; }}>
                            {collapsed ? <MenuUnfoldOutlined /> : <><MenuFoldOutlined /> ย่อแถบเมนู</>}
                        </div>
                    </div>

                    <style>{`
                        .premium-dark-menu.ant-menu-dark .ant-menu-item { color: #94a3b8; border-radius: 8px; margin: 4px 8px; width: calc(100% - 16px); }
                        .premium-dark-menu.ant-menu-dark .ant-menu-item:hover { color: #f8fafc; background: #1e293b; }
                        .premium-dark-menu.ant-menu-dark .ant-menu-item-selected { 
                            background: rgba(234, 88, 12, 0.15) !important; 
                            color: #ea580c !important; 
                            font-weight: 600; 
                            border: 1px solid rgba(234, 88, 12, 0.2);
                        }
                    `}</style>
                </Sider>

                {/* ══ MAIN LAYOUT ══ */}
                <Layout style={{ marginLeft: collapsed ? 80 : 280, transition: 'margin 0.2s', background: 'transparent' }}>
                    
                    {/* HEADER */}
                    <Header style={{
                        position: 'sticky', top: 0, zIndex: 100,
                        height: 76, padding: '0 40px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        lineHeight: 'normal',
                        background: 'rgba(255, 255, 255, 0.85)',
                        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                        borderBottom: '1px solid var(--color-border)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="premium-title" style={{ fontSize: 19 }}>{pageTitle}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: '50%',
                                background: '#FFFFFF', border: '1px solid #e2e8f0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                            }} onMouseEnter={e => e.currentTarget.style.borderColor='#cbd5e1'} onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}>
                                <Badge dot color="#ea580c" offset={[-2, 2]}>
                                    <BellOutlined style={{ fontSize: 16, color: '#475569' }} />
                                </Badge>
                            </div>

                            <Dropdown menu={profileMenu} trigger={['click']} placement="bottomRight">
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                                    padding: '6px 16px 6px 6px', background: '#FFFFFF', borderRadius: '99px',
                                    border: '1px solid #e2e8f0', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                }} onMouseEnter={e => e.currentTarget.style.borderColor='#cbd5e1'} onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}>
                                    <Avatar size={30} style={{ background: '#ea580c', color: '#FFF', fontSize: 13, fontWeight: 600 }}>{user.initial}</Avatar>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#020617' }}>{user.name}</span>
                                    <CaretDownOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
                                </div>
                            </Dropdown>
                        </div>
                    </Header>

                    {/* CONTENT CONTAINER */}
                    <Content style={{ padding: '40px', minHeight: 'calc(100vh - 76px)' }}>
                        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                            {children}
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
};

window.SharedLayout = SharedLayout;
