import type { ThemeConfig } from 'antd';

/** Токены Ant Design в цветах бренда (см. src/styles/theme.css). */
export const appTheme: ThemeConfig = {
    token: {
        fontFamily: "'Montserrat', system-ui, -apple-system, sans-serif",
        colorPrimary: '#33415e',
        colorInfo: '#33415e',
        colorText: '#14181c',
        colorTextSecondary: '#737373',
        colorTextTertiary: '#a3a3a3',
        colorTextQuaternary: '#a3a3a3',
        colorBorder: '#d4d4d4',
        colorBorderSecondary: '#e8e8e8',
        colorBgContainer: '#ffffff',
        colorBgLayout: '#fafafa',
        colorBgElevated: '#ffffff',
        colorLink: '#33415e',
        colorLinkHover: '#16182f',
        colorLinkActive: '#16182f',
        borderRadius: 4,
        controlOutline: 'rgba(51, 65, 94, 0.15)',
    },
    components: {
        Layout: {
            headerBg: '#16182f',
            headerHeight: 56,
            bodyBg: '#fafafa',
            siderBg: '#14181c',
        },
        Menu: {
            darkItemBg: '#14181c',
            darkSubMenuItemBg: '#16182f',
        },
        Table: {
            headerBg: '#f0f0f0',
            headerColor: '#14181c',
            rowHoverBg: '#e4e7ec',
            borderColor: '#d4d4d4',
        },
        Card: {
            colorBgContainer: '#ffffff',
        },
        Button: {
            primaryShadow: '0 2px 0 rgba(20, 24, 28, 0.08)',
        },
    },
};
