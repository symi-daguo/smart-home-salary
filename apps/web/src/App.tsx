import { App as AntdApp, ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './state/auth'
import { useUiStore } from './state/ui'
import { AdminLayout } from './pages/AdminLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { PositionsPage } from './pages/PositionsPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { ProductsPage } from './pages/ProductsPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { SalesOrdersPage } from './pages/SalesOrdersPage'
import { InstallationRecordsPage } from './pages/InstallationRecordsPage'
import { AlertsPage } from './pages/AlertsPage'
import { SalariesPage } from './pages/SalariesPage'
import { EmployeeTypesPage } from './pages/EmployeeTypesPage'
import { OpenClawPage } from './pages/OpenClawPage'
import { SettingsPage } from './pages/SettingsPage'
import { MeasurementSurveysPage } from './pages/MeasurementSurveysPage'
import { CurtainOrdersPage } from './pages/CurtainOrdersPage'
import { InventoryPage } from './pages/InventoryPage'
import { OutboundApplicationsPage } from './pages/OutboundApplicationsPage'
import { WarehouseOrdersPage } from './pages/WarehouseOrdersPage'

export default function App() {
  const token = useAuthStore((s) => s.accessToken)
  const currentTheme = useUiStore((s) => s.theme)

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm:
          currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Layout: {
            siderBg: currentTheme === 'dark' ? '#141414' : '#ffffff',
            headerBg: currentTheme === 'dark' ? '#141414' : '#ffffff',
          },
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg:
              currentTheme === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : '#f0f5ff',
            itemSelectedColor:
              currentTheme === 'dark' ? '#ffffff' : '#1677ff',
          },
        },
      }}
    >
      <AntdApp>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={token ? <AdminLayout /> : <Navigate to="/login" replace />}
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="positions" element={<PositionsPage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="employee-types" element={<EmployeeTypesPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route
              path="sales-orders"
              element={<SalesOrdersPage />}
            />
            <Route
              path="installation-records"
              element={<InstallationRecordsPage />}
            />
            <Route path="salary" element={<SalariesPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="openclaw" element={<OpenClawPage />} />
            <Route path="measurement-surveys" element={<MeasurementSurveysPage />} />
            <Route path="curtain-orders" element={<CurtainOrdersPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="outbound-applications" element={<OutboundApplicationsPage />} />
            <Route path="warehouse-orders" element={<WarehouseOrdersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AntdApp>
    </ConfigProvider>
  )
}
