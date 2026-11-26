import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import PostAdPage from './pages/PostAdPage';
import AccountPage from './pages/AccountPage';
import ItemDetailPage from './pages/ItemDetailPage';
import ChatsPage from './pages/ChatsPage';
import MyAdsPage from './pages/MyAdsPage';
import IncomingOrders from './pages/IncomingOrders';
import MyRentals from './pages/MyRentals';
import Dashboard from './pages/Dashboard';
import BookingDetail from './pages/BookingDetail';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AuthModal />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/post-ad" element={<PostAdPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/item/:id" element={<ItemDetailPage />} />
            <Route path="/chats" element={<ChatsPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-ads" element={<MyAdsPage />} />
            <Route path="/incoming-orders" element={<IncomingOrders />} />
            <Route path="/my-rentals" element={<MyRentals />} />
            <Route path="/my-orders" element={<Navigate to="/my-rentals" replace />} />
            <Route path="/booking/:id" element={<BookingDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
