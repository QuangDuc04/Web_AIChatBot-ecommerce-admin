import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import AdminLayout from '@/layouts/AdminLayout'
import AuthLayout from '@/layouts/AuthLayout'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import Dashboard from '@/pages/dashboard/Dashboard'
import ProductList from '@/pages/products/ProductList'
import ProductForm from '@/pages/products/ProductForm'
import CategoryList from '@/pages/categories/CategoryList'
import BrandList from '@/pages/brands/BrandList'
import OrderList from '@/pages/orders/OrderList'
import OrderDetail from '@/pages/orders/OrderDetail'
import PaymentList from '@/pages/payments/PaymentList'
import ShipmentList from '@/pages/shipments/ShipmentList'
import CouponList from '@/pages/coupons/CouponList'
import FlashSaleList from '@/pages/flash-sales/FlashSaleList'
import NewsList from '@/pages/news/NewsList'
import BannerList from '@/pages/banners/BannerList'
import ReviewList from '@/pages/reviews/ReviewList'
import ConversationList from '@/pages/conversations/ConversationList'
import NotificationManager from '@/pages/notifications/NotificationManager'
import Analytics from '@/pages/analytics/Analytics'
import CustomerList from '@/pages/customers/CustomerList'
import ContactList from '@/pages/contacts/ContactList'
import InventoryList from '@/pages/inventory/InventoryList'
import SettingsPage from '@/pages/settings/SettingsPage'
import ChatbotHistory from '@/pages/chatbot-history/ChatbotHistory'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <NotificationProvider>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/new" element={<ProductForm />} />
            <Route path="/products/:id/edit" element={<ProductForm />} />
            <Route path="/categories" element={<CategoryList />} />
            <Route path="/brands" element={<BrandList />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/payments" element={<PaymentList />} />
            <Route path="/shipments" element={<ShipmentList />} />
            <Route path="/coupons" element={<CouponList />} />
            <Route path="/flash-sales" element={<FlashSaleList />} />
            <Route path="/news" element={<NewsList />} />
            <Route path="/banners" element={<BannerList />} />
            <Route path="/reviews" element={<ReviewList />} />
            <Route path="/conversations" element={<ConversationList />} />
            <Route path="/notifications" element={<NotificationManager />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/contacts" element={<ContactList />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/chatbot-history" element={<ChatbotHistory />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
