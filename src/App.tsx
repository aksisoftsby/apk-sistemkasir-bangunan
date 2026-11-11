import { useEffect, useMemo, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { initDb, useAutoSaveOnHide, useDbVersion } from './lib/db';
import { getStoreProfile } from './lib/repo';
import { useSession } from './stores/session';
import { ToastHost } from './components/ui';
import { t, useLang } from './lib/locale';
import { IconBox, IconCart, IconChart, IconSettings, IconUsers } from './components/icons';
import LoginScreen from './features/auth/LoginScreen';
import SetupScreen from './features/auth/SetupScreen';
import PosScreen from './features/pos/PosScreen';
import PaymentScreen from './features/pos/PaymentScreen';
import SuccessScreen from './features/pos/SuccessScreen';
import HistoryScreen from './features/pos/HistoryScreen';
import TransactionDetailScreen from './features/pos/TransactionDetailScreen';
import ProductListScreen from './features/products/ProductListScreen';
import ProductFormScreen from './features/products/ProductFormScreen';
import StockScreen from './features/products/StockScreen';
import CustomerListScreen from './features/customers/CustomerListScreen';
import CustomerDetailScreen from './features/customers/CustomerDetailScreen';
import ReportsScreen from './features/reports/ReportsScreen';
import SettingsScreen from './features/settings/SettingsScreen';
import StoreSettingsScreen from './features/settings/StoreSettingsScreen';
import UsersScreen from './features/settings/UsersScreen';
import BackupScreen from './features/settings/BackupScreen';
import DatabasesScreen from './features/settings/DatabasesScreen';
import PurchaseScreen from './features/purchase/PurchaseScreen';
import PurchaseFormScreen from './features/purchase/PurchaseFormScreen';
import ShiftScreen from './features/shift/ShiftScreen';
import DeliveryScreen from './features/pos/DeliveryScreen';

function TabBar() {
  useLang();
  const nav = useNavigate();
  const loc = useLocation();
  const tabs = [
    { path: '/pos', label: t('tab.pos'), icon: IconCart },
    { path: '/products', label: t('tab.products'), icon: IconBox },
    { path: '/customers', label: t('tab.customers'), icon: IconUsers },
    { path: '/reports', label: t('tab.reports'), icon: IconChart },
    { path: '/settings', label: t('tab.more'), icon: IconSettings },
  ];
  const active = tabs.find((t) => loc.pathname.startsWith(t.path));
  return (
    <div className="tabbar">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active?.path === t.path;
        return (
          <button key={t.path} className={'tabbar-item' + (isActive ? ' active' : '')} onClick={() => nav(t.path)}>
            <span className="tab-icon">
              <Icon size={24} />
            </span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Protected() {
  const user = useSession((s) => s.user);
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  const tabRoutes = ['/pos', '/products', '/customers', '/reports', '/settings'];
  const showTabs = tabRoutes.includes(loc.pathname);
  return (
    <>
      <Routes>
        <Route path="/pos" element={<PosScreen />} />
        <Route path="/pos/payment" element={<PaymentScreen />} />
        <Route path="/pos/success/:id" element={<SuccessScreen />} />
        <Route path="/pos/history" element={<HistoryScreen />} />
        <Route path="/pos/history/:id" element={<TransactionDetailScreen />} />
        <Route path="/pos/delivery" element={<DeliveryScreen />} />
        <Route path="/products" element={<ProductListScreen />} />
        <Route path="/products/new" element={<ProductFormScreen />} />
        <Route path="/products/:id" element={<ProductFormScreen />} />
        <Route path="/stock" element={<StockScreen />} />
        <Route path="/customers" element={<CustomerListScreen />} />
        <Route path="/customers/:id" element={<CustomerDetailScreen />} />
        <Route path="/reports" element={<ReportsScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/settings/store" element={<StoreSettingsScreen />} />
        <Route path="/settings/users" element={<UsersScreen />} />
        <Route path="/settings/backup" element={<BackupScreen />} />
        <Route path="/settings/databases" element={<DatabasesScreen />} />
        <Route path="/purchase" element={<PurchaseScreen />} />
        <Route path="/purchase/new" element={<PurchaseFormScreen />} />
        <Route path="/shift" element={<ShiftScreen />} />
        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
      {showTabs ? <TabBar /> : null}
    </>
  );
}

function Shell() {
  useLang();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const user = useSession((s) => s.user);
  const ver = useDbVersion();
  useAutoSaveOnHide();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initDb();
        if (!mounted) return;
        setReady(true);
      } catch (e) {
        console.error(e);
        setError(String(e));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const hasStore = useMemo(() => (ready ? !!getStoreProfile() : true), [ready, ver]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    void StatusBar.setBackgroundColor({ color: '#1E293B' }).catch(() => {});
    const sub = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back();
    });
    return () => {
      void sub.then((s) => s.remove());
    };
  }, []);

  if (error) {
    return (
      <div className="splash">
        <div className="h2">{t('app.loadFail')}</div>
        <div className="small" style={{ opacity: 0.8 }}>{error}</div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="splash">
        <img src="./assets/logo.webp" alt="Kokoh" />
        <div className="h2">Kokoh</div>
        <div className="small" style={{ opacity: 0.75 }}>{t('app.tagline')}</div>
        <div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.2)' }} />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/setup" element={<SetupScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route
          path="/*"
          element={
            !hasStore ? <Navigate to="/setup" replace /> : !user ? <Navigate to="/login" replace /> : <Protected />
          }
        />
      </Routes>
      <ToastHost />
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
