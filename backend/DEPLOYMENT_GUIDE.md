# 🚀 Deployment Guide - Render.com

Hướng dẫn chi tiết để deploy backend API lên Render.

## 📋 Yêu cầu trước khi deploy

-   ✅ Tài khoản GitHub
-   ✅ Repository đã push code lên GitHub
-   ✅ MongoDB Atlas cluster đã setup
-   ✅ Firebase project đã tạo
-   ✅ Tài khoản Render.com (miễn phí)

---

## 🔥 Bước 1: Setup MongoDB Atlas

### 1.1. Tạo Cluster

1. Đăng nhập [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **Create** để tạo cluster mới
3. Chọn **FREE** tier (M0 Sandbox)
4. Chọn **Provider**: AWS
5. Chọn **Region**: Singapore (ap-southeast-1) - gần Việt Nam nhất
6. Click **Create Cluster**

### 1.2. Tạo Database User

1. Vào **Database Access** (menu bên trái)
2. Click **Add New Database User**
3. Chọn **Password** authentication
4. Username: `hotel_user` (hoặc tên bạn muốn)
5. Password: Tạo password mạnh (lưu lại để dùng sau)
6. Database User Privileges: **Read and write to any database**
7. Click **Add User**

### 1.3. Whitelist IP

1. Vào **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (0.0.0.0/0)
    > ⚠️ Điều này cần thiết để Render có thể kết nối
4. Click **Confirm**

### 1.4. Lấy Connection String

1. Vào **Database** > Click **Connect**
2. Chọn **Connect your application**
3. Driver: **Node.js**, Version: **5.5 or later**
4. Copy connection string:
    ```
    mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
    ```
5. Thay thế:
    - `<username>` bằng username bạn tạo
    - `<password>` bằng password bạn tạo
    - Thêm database name sau `.net/`: `.net/hotel-booking?retryWrites=true&w=majority`

**Ví dụ:**

```
mongodb+srv://hotel_user:MyP@ssw0rd@cluster0.abc123.mongodb.net/hotel-booking?retryWrites=true&w=majority
```

---

## 🔑 Bước 2: Setup Firebase

### 2.1. Tạo Firebase Project

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Nhập tên project: `hotel-booking-app`
4. Disable Google Analytics (không bắt buộc)
5. Click **Create project**

### 2.2. Enable Authentication

1. Trong Firebase Console, vào **Authentication**
2. Click **Get started**
3. Vào tab **Sign-in method**
4. Enable **Email/Password**

### 2.3. Lấy Service Account Key

1. Vào **Project Settings** (⚙️ icon)
2. Chọn tab **Service accounts**
3. Click **Generate new private key**
4. Click **Generate key** để download file JSON
5. Lưu file an toàn

File JSON sẽ có dạng:

```json
{
  "type": "service_account",
  "project_id": "hotel-booking-app",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@hotel-booking-app.iam.gserviceaccount.com",
  ...
}
```

### 2.4. Chuẩn bị Firebase Credentials cho Render

Từ file JSON trên, lưu lại các giá trị:

-   `project_id`
-   `client_email`
-   `private_key` (toàn bộ, bao gồm cả `-----BEGIN PRIVATE KEY-----` và `-----END PRIVATE KEY-----`)

---

## ☁️ Bước 3: Deploy lên Render

### 3.1. Tạo tài khoản Render

1. Truy cập [render.com](https://render.com)
2. Click **Get Started** hoặc **Sign Up**
3. Đăng nhập bằng **GitHub**
4. Authorize Render để truy cập repositories

### 3.2. Tạo Web Service

1. Trong Dashboard, click **New +**
2. Chọn **Web Service**
3. Chọn repository: `hotel-book-me`
4. Click **Connect**

### 3.3. Cấu hình Web Service

Điền các thông tin sau:

**Basic Settings:**

-   **Name**: `hotel-booking-api` (hoặc tên bạn muốn)
-   **Region**: Singapore (gần Việt Nam)
-   **Branch**: `main` hoặc `backend`
-   **Root Directory**: `backend`
-   **Runtime**: Node
-   **Build Command**: `npm install`
-   **Start Command**: `npm start`

**Instance Type:**

-   Chọn **Free** (miễn phí)

### 3.4. Thêm Environment Variables

Scroll xuống phần **Environment Variables**, click **Add Environment Variable** và thêm:

#### 1. NODE_ENV

```
Key: NODE_ENV
Value: production
```

#### 2. PORT

```
Key: PORT
Value: 8080
```

#### 3. MONGO_URI

```
Key: MONGO_URI
Value: mongodb+srv://hotel_user:MyP@ssw0rd@cluster0.abc123.mongodb.net/hotel-booking?retryWrites=true&w=majority
```

> ⚠️ Thay bằng connection string của bạn từ Bước 1.4

#### 4. FIREBASE_PROJECT_ID

```
Key: FIREBASE_PROJECT_ID
Value: hotel-booking-app
```

> Lấy từ file serviceAccountKey.json

#### 5. FIREBASE_CLIENT_EMAIL

```
Key: FIREBASE_CLIENT_EMAIL
Value: firebase-adminsdk-xxxxx@hotel-booking-app.iam.gserviceaccount.com
```

> Lấy từ file serviceAccountKey.json

#### 6. FIREBASE_PRIVATE_KEY

```
Key: FIREBASE_PRIVATE_KEY
Value: -----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...toàn bộ private key...
-----END PRIVATE KEY-----
```

> ⚠️ Copy toàn bộ private key từ file serviceAccountKey.json, giữ nguyên format với `\n`

#### 7. ALLOWED_ORIGINS

```
Key: ALLOWED_ORIGINS
Value: *
```

> Sau này có thể thay bằng URL frontend của bạn

### 3.5. Deploy

1. Scroll xuống cuối
2. Click **Create Web Service**
3. Đợi quá trình build và deploy (khoảng 3-5 phút)

### 3.6. Kiểm tra Deploy

Sau khi deploy xong:

1. Render sẽ cung cấp URL: `https://hotel-booking-api.onrender.com`
2. Truy cập URL đó trên browser
3. Bạn sẽ thấy response:
    ```json
    {
      "success": true,
      "message": "Hotel Booking API is running 🚀",
      "version": "1.0.0",
      "endpoints": {
        "auth": "/api/auth",
        "hotels": "/api/hotels",
        ...
      }
    }
    ```

---

## ✅ Bước 4: Test API

### 4.1. Test với Postman hoặc Thunder Client

**Base URL**: `https://hotel-booking-api.onrender.com`

#### Test 1: Health Check

```
GET https://hotel-booking-api.onrender.com/
```

#### Test 2: Get Hotels

```
GET https://hotel-booking-api.onrender.com/api/hotels
```

#### Test 3: Register User

```
POST https://hotel-booking-api.onrender.com/api/auth/register

Body (JSON):
{
  "email": "test@example.com",
  "password": "test123456",
  "userName": "Test User"
}
```

### 4.2. Test với cURL

```bash
# Health check
curl https://hotel-booking-api.onrender.com/

# Get hotels
curl https://hotel-booking-api.onrender.com/api/hotels

# Register user
curl -X POST https://hotel-booking-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456","userName":"Test User"}'
```

---

## 🔄 Bước 5: Auto Deploy

Render tự động deploy khi bạn push code lên GitHub:

1. Sửa code trong project
2. Commit và push lên GitHub:
    ```bash
    git add .
    git commit -m "Update backend"
    git push origin main
    ```
3. Render sẽ tự động detect changes và rebuild

---

## 📊 Bước 6: Monitoring

### 6.1. Xem Logs

1. Vào Render Dashboard
2. Click vào service `hotel-booking-api`
3. Vào tab **Logs** để xem real-time logs

### 6.2. Metrics

-   **Events**: Xem deployment history
-   **Metrics**: CPU, Memory usage (Free plan có giới hạn)

---

## 🐛 Troubleshooting

### Lỗi: "Build failed"

**Nguyên nhân**: Thiếu dependencies hoặc lỗi syntax

**Giải pháp**:

1. Xem logs chi tiết trong tab **Logs**
2. Đảm bảo `package.json` có đầy đủ dependencies
3. Test build locally: `npm install && npm start`

### Lỗi: "MongoDB connection failed"

**Nguyên nhân**: Connection string sai hoặc IP chưa whitelist

**Giải pháp**:

1. Kiểm tra `MONGO_URI` trong Environment Variables
2. Đảm bảo đã whitelist IP `0.0.0.0/0` trong MongoDB Atlas
3. Kiểm tra username/password trong connection string

### Lỗi: "Firebase authentication failed"

**Nguyên nhân**: Firebase credentials sai

**Giải pháp**:

1. Kiểm tra `FIREBASE_PRIVATE_KEY` có đầy đủ không
2. Đảm bảo private key giữ nguyên format với `\n`
3. Kiểm tra `FIREBASE_PROJECT_ID` và `FIREBASE_CLIENT_EMAIL`

### Lỗi: "Service unavailable" hoặc chậm

**Nguyên nhân**: Free tier của Render sleep sau 15 phút không hoạt động

**Giải pháp**:

1. Lần đầu truy cập sẽ mất 30-60 giây để service wake up
2. Xem xét upgrade lên paid plan nếu cần uptime 24/7
3. Có thể dùng cron job để ping service mỗi 10 phút

---

## 💰 Chi phí

### Render Free Tier

-   ✅ 750 hours/tháng (đủ cho 1 service chạy 24/7)
-   ✅ Tự động sleep sau 15 phút không hoạt động
-   ✅ 100GB bandwidth/tháng
-   ⚠️ Service sẽ bị restart mỗi 90 ngày

### MongoDB Atlas Free Tier (M0)

-   ✅ 512 MB storage
-   ✅ Shared RAM
-   ✅ Miễn phí mãi mãi

### Firebase

-   ✅ Spark Plan (Free): 50,000 authentications/tháng
-   ✅ Đủ cho development và small apps

**Tổng chi phí: $0/tháng** 🎉

---

## 🚀 Next Steps

1. ✅ Setup domain riêng (optional)
2. ✅ Implement rate limiting
3. ✅ Add monitoring với Sentry hoặc LogRocket
4. ✅ Setup CI/CD với GitHub Actions
5. ✅ Add automated tests
6. ✅ Implement caching với Redis

---

## 📞 Support

Nếu gặp vấn đề:

1. Check [Render Documentation](https://render.com/docs)
2. Check [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
3. Check [Firebase Docs](https://firebase.google.com/docs)
4. Liên hệ support của từng platform

---

**🎉 Chúc mừng! Backend API của bạn đã được deploy thành công!**
