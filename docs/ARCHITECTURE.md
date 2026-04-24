# Kiến Trúc Hệ Thống — ecommerce-admin

Tài liệu này mô tả kiến trúc tổng thể của dự án **ecommerce-admin**, một Single Page Application (SPA) xây dựng bằng React 18 + TypeScript + Vite.

---

## 1. Tổng Quan

**ecommerce-admin** là giao diện quản trị cho hệ thống thương mại điện tử. Ứng dụng giao tiếp với Backend REST API tại `http://localhost:5000/api` và cung cấp các tính năng quản lý toàn diện cho người quản trị.

### Công nghệ chính

| Lớp | Công nghệ |
|-----|-----------|
| UI Framework | React 18 |
| Ngôn ngữ | TypeScript |
| Build Tool | Vite |
| Routing | React Router v6 |
| State / Data Fetching | TanStack Query (React Query) |
| HTTP Client | Axios |
| Styling | Tailwind CSS |
| Form | React Hook Form + Zod |
| Thông báo | react-hot-toast |
| UI Components | @headlessui/react |

---

## 2. Sơ Đồ Kiến Trúc Tổng Thể

```mermaid
graph TD
    subgraph Entry["Điểm Khởi Đầu"]
        HTML[index.html]
        MAIN[main.tsx\nQueryClient + Toaster]
        APP[App.tsx\nRouter + AuthProvider]
    end

    subgraph Layout["Lớp Layout"]
        ADMIN_LAYOUT[AdminLayout\nSidebar + Header + Outlet]
        AUTH_LAYOUT[AuthLayout\nLogin Wrapper]
    end

    subgraph Pages["Lớp Pages (16 modules)"]
        direction LR
        P1[analytics]
        P2[auth]
        P3[banners]
        P4[brands]
        P5[categories]
        P6[conversations]
        P7[coupons]
        P8[dashboard]
        P9[flash-sales]
        P10[notifications]
        P11[orders]
        P12[payments]
        P13[products]
        P14[reviews]
        P15[settings]
        P16[shipments]
    end

    subgraph Components["Shared Components"]
        C1[Modal]
        C2[Pagination]
        C3[Spinner]
        C4[StatsCard]
        C5[ConfirmDialog]
        C6[Sidebar]
        C7[Header]
    end

    subgraph API["Lớp API (17 modules)"]
        direction LR
        A1[auth.api]
        A2[products.api]
        A3[categories.api]
        A4[brands.api]
        A5[orders.api]
        A6[payments.api]
        A7[shipments.api]
        A8[coupons.api]
        A9[flashSales.api]
        A10[banners.api]
        A11[reviews.api]
        A12[conversations.api]
        A13[notifications.api]
        A14[settings.api]
        A15[upload.api]
        A16[analytics.api]
    end

    subgraph Context["Context / State"]
        AUTH_CTX[AuthContext\nuser state, login/logout, role check]
    end

    subgraph Utils["Utilities"]
        U1[useDebounce hook]
        U2[formatCurrency]
        U3[formatDate]
        U4[cn - clsx + tailwind-merge]
    end

    subgraph Backend["Backend"]
        BE[REST API\nlocalhost:5000/api]
    end

    HTML --> MAIN --> APP
    APP --> ADMIN_LAYOUT
    APP --> AUTH_LAYOUT
    ADMIN_LAYOUT --> Pages
    AUTH_LAYOUT --> P2
    Pages --> Components
    Pages --> API
    Pages --> Context
    Pages --> Utils
    API --> BE
```

---

## 3. Mô Tả Các Lớp

### 3.1 Lớp Điểm Khởi Đầu (Entry)

| File | Vai trò |
|------|---------|
| `index.html` | HTML shell, mount point `<div id="root">` |
| `main.tsx` | Khởi tạo `QueryClient`, render `<Toaster>` (react-hot-toast), mount React app |
| `App.tsx` | Cấu hình Router, bọc `AuthProvider`, định nghĩa route tree |

### 3.2 Lớp Layout

- **AdminLayout**: Layout chính cho các trang admin — bao gồm `Sidebar` (navigation), `Header` (user info, actions), và `<Outlet>` (nội dung trang). Thực hiện kiểm tra role tại đây.
- **AuthLayout**: Layout đơn giản cho trang đăng nhập — chỉ render form đăng nhập, không có sidebar/header.

### 3.3 Lớp Pages (16 Feature Modules)

Mỗi module là một nhóm tính năng độc lập:

| Module | Chức năng |
|--------|-----------|
| `analytics` | Biểu đồ thống kê doanh thu, đơn hàng |
| `auth` | Đăng nhập, đăng xuất |
| `banners` | Quản lý banner quảng cáo |
| `brands` | Quản lý thương hiệu sản phẩm |
| `categories` | Quản lý danh mục sản phẩm |
| `conversations` | Hỗ trợ khách hàng, chat |
| `coupons` | Quản lý mã giảm giá |
| `dashboard` | Trang tổng quan, KPIs |
| `flash-sales` | Quản lý flash sale / khuyến mãi thời gian |
| `notifications` | Thông báo hệ thống |
| `orders` | Quản lý đơn hàng |
| `payments` | Quản lý thanh toán, hoàn tiền |
| `products` | Quản lý sản phẩm |
| `reviews` | Quản lý đánh giá sản phẩm |
| `settings` | Cấu hình hệ thống |
| `shipments` | Quản lý vận chuyển |

### 3.4 Shared Components

Các component dùng chung, không phụ thuộc vào feature cụ thể:

- **Modal**: Dialog overlay với backdrop
- **Pagination**: Điều hướng phân trang
- **Spinner**: Chỉ báo loading
- **StatsCard**: Card hiển thị số liệu thống kê
- **ConfirmDialog**: Dialog xác nhận hành động nguy hiểm
- **Sidebar**: Navigation sidebar với menu items
- **Header**: Header bar với thông tin user

### 3.5 Lớp API (17 Modules)

Mỗi module API là một named object export tập hợp các hàm gọi API liên quan đến resource đó. Toàn bộ calls đi qua Axios instance được cấu hình sẵn với Bearer token interceptor.

```
src/api/
├── auth.api.ts
├── products.api.ts
├── categories.api.ts
├── brands.api.ts
├── orders.api.ts
├── payments.api.ts
├── shipments.api.ts
├── coupons.api.ts
├── flashSales.api.ts
├── banners.api.ts
├── reviews.api.ts
├── conversations.api.ts
├── notifications.api.ts
├── settings.api.ts
├── upload.api.ts
└── analytics.api.ts
```

### 3.6 AuthContext

Quản lý toàn bộ trạng thái xác thực của ứng dụng:

- **State**: `user` object, `isLoading`, `isAuthenticated`
- **Actions**: `login()`, `logout()`, `checkRole()`
- **Bootstrap**: Gọi `authApi.me()` khi mount để khôi phục session từ localStorage
- **Truy cập**: Qua hook `useAuth()` trong bất kỳ component nào

### 3.7 Utilities

| Utility | Mô tả |
|---------|-------|
| `useDebounce` | Hook debounce cho search input, tránh gọi API quá nhiều |
| `formatCurrency` | Format tiền tệ theo định dạng Việt Nam (VND) |
| `formatDate` | Format ngày tháng theo locale |
| `cn()` | Kết hợp `clsx` + `tailwind-merge` để merge Tailwind class an toàn |

---

## 4. Luồng Dữ Liệu (Data Flow)

```mermaid
flowchart LR
    subgraph UI["UI Layer"]
        COMP[Component]
        RQ[useQuery / useMutation\nTanStack Query]
    end

    subgraph API_LAYER["API Layer"]
        API_MOD[API Module\nsrc/api/*.api.ts]
        AXIOS[Axios Instance\n+ Bearer Token Interceptor]
    end

    subgraph BACKEND["Backend"]
        REST[REST API\nlocalhost:5000/api]
    end

    COMP -->|"gọi hook"| RQ
    RQ -->|"queryFn / mutationFn"| API_MOD
    API_MOD -->|"HTTP request"| AXIOS
    AXIOS -->|"Authorization: Bearer <token>"| REST
    REST -->|"JSON response"| AXIOS
    AXIOS -->|"data / error"| API_MOD
    API_MOD -->|"resolved data"| RQ
    RQ -->|"data, isLoading, error"| COMP
```

### Mô tả chi tiết

1. **Component** gọi `useQuery` hoặc `useMutation` từ TanStack Query
2. TanStack Query gọi `queryFn` / `mutationFn` — đây là các hàm từ API modules
3. **API Module** tổng hợp params và gọi Axios instance
4. **Axios interceptor** tự động đính kèm `Authorization: Bearer <accessToken>` vào header
5. **Backend** xử lý và trả về JSON response
6. Dữ liệu được cache bởi TanStack Query và trả về component dưới dạng `{ data, isLoading, error }`
7. **Mutations** sau khi thành công sẽ `invalidateQueries` để trigger refetch dữ liệu liên quan

---

## 5. Luồng Xác Thực (Auth Flow)

```mermaid
sequenceDiagram
    participant Browser
    participant App
    participant AuthContext
    participant Axios
    participant Backend

    Browser->>App: Mở ứng dụng
    App->>AuthContext: Mount AuthProvider
    AuthContext->>AuthContext: Đọc accessToken từ localStorage
    AuthContext->>Backend: GET /auth/me (Bearer token)

    alt Token hợp lệ
        Backend-->>AuthContext: User data
        AuthContext-->>App: isAuthenticated = true
        App->>Browser: Render AdminLayout
    else Token hết hạn (401)
        Backend-->>Axios: 401 Unauthorized
        Axios->>Axios: Interceptor bắt 401
        Axios->>Backend: POST /auth/refresh-token (refreshToken)
        alt Refresh thành công
            Backend-->>Axios: accessToken mới
            Axios->>Axios: Cập nhật localStorage
            Axios->>Axios: Thực hiện lại request ban đầu (queue retry)
            Axios-->>AuthContext: User data
            AuthContext-->>App: isAuthenticated = true
        else Refresh thất bại
            Axios-->>AuthContext: Error
            AuthContext->>AuthContext: logout() — xóa localStorage
            App->>Browser: Redirect /login
        end
    else Không có token
        AuthContext-->>App: isAuthenticated = false
        App->>Browser: Redirect /login
    end

    Note over Browser,Backend: AdminLayout kiểm tra role\ntrước khi render trang
```

### Mô tả chi tiết

1. Khi ứng dụng mount, `AuthProvider` đọc `accessToken` và `refreshToken` từ `localStorage`
2. Gọi `authApi.me()` để xác minh token còn hợp lệ và lấy thông tin user
3. Nếu token hết hạn (401), Axios interceptor tự động gọi `/auth/refresh-token`
4. Nếu refresh thành công: lưu token mới, thực hiện lại request trong queue
5. Nếu refresh thất bại: gọi `logout()`, xóa localStorage, redirect về `/login`
6. **AdminLayout** thực hiện kiểm tra role — chặn truy cập nếu không đủ quyền

---

## 6. Cấu Trúc Thư Mục

```
ecommerce-admin/
├── public/
├── src/
│   ├── api/                    # 17 API modules
│   ├── components/             # Shared UI components
│   │   ├── layout/             # Sidebar, Header, AdminLayout, AuthLayout
│   │   └── ui/                 # Modal, Pagination, Spinner, StatsCard, ConfirmDialog
│   ├── contexts/               # AuthContext
│   ├── hooks/                  # useDebounce
│   ├── lib/                    # formatCurrency, formatDate, cn
│   ├── pages/                  # 16 feature modules
│   │   ├── analytics/
│   │   ├── auth/
│   │   ├── banners/
│   │   ├── brands/
│   │   ├── categories/
│   │   ├── conversations/
│   │   ├── coupons/
│   │   ├── dashboard/
│   │   ├── flash-sales/
│   │   ├── notifications/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── products/
│   │   ├── reviews/
│   │   ├── settings/
│   │   └── shipments/
│   ├── types/                  # TypeScript type definitions
│   ├── App.tsx                 # Router + AuthProvider
│   └── main.tsx                # QueryClient + Toaster + mount
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 7. Tích Hợp Ngoài (External Dependencies)

| Dependency | Mô tả |
|------------|-------|
| Backend REST API | `http://localhost:5000/api` — toàn bộ dữ liệu |
| Realtime | Polling 5 giây (không dùng WebSocket) — áp dụng cho notifications, conversations |
| File Uploads | Multipart FormData — qua `upload.api.ts` hoặc trực tiếp trên resource endpoints |

---

*Tài liệu được tạo tự động — cập nhật khi kiến trúc thay đổi.*
