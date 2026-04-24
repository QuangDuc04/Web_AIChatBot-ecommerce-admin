# Ecommerce Admin Panel

Giao diện quản trị cho hệ thống thương mại điện tử, xây dựng với **React + Vite + Tailwind CSS**.

## Tính năng

| Module | Tính năng |
|--------|-----------|
| **Dashboard** | Thống kê tổng quan, biểu đồ doanh thu, đơn hàng gần đây, cảnh báo tồn kho |
| **Sản phẩm** | CRUD đầy đủ, upload ảnh, quản lý biến thể, lọc/tìm kiếm |
| **Danh mục** | Cây danh mục đa cấp, CRUD |
| **Thương hiệu** | CRUD + upload logo |
| **Đơn hàng** | Danh sách, chi tiết, cập nhật trạng thái, bulk update |
| **Thanh toán** | Danh sách giao dịch, xác nhận COD, xử lý hoàn tiền |
| **Vận chuyển** | Tạo vận đơn, cập nhật tracking, đánh dấu giao hàng |
| **Mã giảm giá** | CRUD, xem thống kê sử dụng |
| **Flash Sale** | Tạo chiến dịch, quản lý sản phẩm flash sale |
| **Banner** | CRUD + upload ảnh, quản lý vị trí hiển thị |
| **Đánh giá** | Xem theo sản phẩm, phản hồi, xóa |
| **Hỗ trợ** | Chat realtime với khách hàng, đóng cuộc trò chuyện |
| **Thông báo** | Gửi thông báo đơn lẻ hoặc hàng loạt |
| **Phân tích** | Doanh thu, đơn hàng, khách hàng, top sản phẩm |
| **Cài đặt** | Cấu hình hệ thống |

## Yêu cầu

- Node.js 18+
- Backend `ecommerce-backend` đang chạy (mặc định port 3000)

## Cài đặt & chạy

```bash
# 1. Vào thư mục
cd ecommerce-admin

# 2. Copy file env
cp .env.example .env
# Chỉnh sửa VITE_API_URL nếu backend chạy khác port

# 3. Cài dependencies
npm install

# 4. Chạy dev server
npm run dev
# → http://localhost:5173

# 5. Build production
npm run build
```

## Cấu trúc thư mục

```
src/
├── api/           # Axios instance + tất cả API calls
├── components/    # Shared components (Sidebar, Header, Modal, ...)
├── context/       # AuthContext (đăng nhập, phân quyền)
├── hooks/         # Custom hooks (useDebounce)
├── layouts/       # AdminLayout, AuthLayout
├── lib/           # Utilities (formatCurrency, formatDate, ...)
└── pages/         # Các trang chính
```

## Stack

- **React 18** + **TypeScript**
- **Vite** — build tool
- **Tailwind CSS** — styling
- **TanStack Query** — data fetching & caching
- **React Hook Form** + **Zod** — form validation
- **Recharts** — biểu đồ
- **Lucide React** — icons
- **React Hot Toast** — notifications
- **React Router v6** — routing

## Tài khoản đăng nhập

Cần tài khoản có role `admin` hoặc `staff` (tạo từ backend).
