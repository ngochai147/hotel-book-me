# Hotel Booking Backend API

Backend API cho ứng dụng đặt phòng khách sạn sử dụng Node.js, Express, MongoDB Atlas và Firebase Authentication.

## 🚀 Công nghệ sử dụng

-   **Node.js** - JavaScript runtime
-   **Express.js** - Web framework
-   **MongoDB Atlas** - Cloud database
-   **Firebase Admin SDK** - Authentication
-   **Mongoose** - MongoDB ODM
-   **Render** - Cloud deployment platform

## 📁 Cấu trúc thư mục

```
backend/
├── config/                 # Cấu hình
│   ├── firebaseConfig.js
│   └── serviceAccountKey.js
├── controllers/           # Business logic
│   ├── authController.js
│   ├── bookingController.js
│   ├── hotelController.js
│   ├── reviewController.js
│   └── userController.js
├── middlewares/          # Middleware functions
│   ├── errorHandler.js
│   ├── logger.js
│   └── verifyToken.js
├── models/              # Database schemas
│   ├── Booking.js
│   ├── Hotel.js
│   ├── Review.js
│   ├── Room.js
│   └── User.js
├── routes/             # API routes
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   ├── hotelRoutes.js
│   ├── reviewRoutes.js
│   └── userRoutes.js
├── .env.example       # Environment variables template
├── .gitignore
├── package.json
└── server.js         # Entry point
```

## 🔧 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd backend
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Environment Variables

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các biến môi trường trong file `.env`:

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# Firebase (optional - nếu không dùng serviceAccountKey.json)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# CORS
ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

### 4. Cấu hình Firebase

Tải về `serviceAccountKey.json` từ Firebase Console:

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Project Settings** > **Service Accounts**
4. Click **Generate new private key**
5. Lưu file vào `backend/config/serviceAccountKey.json`

Hoặc tạo file `config/serviceAccountKey.js`:

```javascript
export default {
    type: "service_account",
    project_id: "your-project-id",
    private_key_id: "your-private-key-id",
    private_key: "your-private-key",
    client_email: "your-client-email",
    client_id: "your-client-id",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "your-cert-url",
};
```

### 5. Cấu hình MongoDB Atlas

1. Tạo tài khoản tại [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Tạo cluster mới (Free tier)
3. Tạo database user
4. Whitelist IP address (0.0.0.0/0 cho development)
5. Lấy connection string và cập nhật vào `MONGO_URI`

## 🏃 Chạy ứng dụng

### Development mode (với nodemon)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

Server sẽ chạy tại `http://localhost:8080`

## 📚 API Endpoints

### Authentication

| Method | Endpoint             | Description                 | Auth Required |
| ------ | -------------------- | --------------------------- | ------------- |
| POST   | `/api/auth/register` | Đăng ký user mới            | ❌            |
| POST   | `/api/auth/login`    | Đăng nhập                   | ❌            |
| GET    | `/api/auth/me`       | Lấy thông tin user hiện tại | ✅            |
| POST   | `/api/auth/logout`   | Đăng xuất                   | ✅            |

### Hotels

| Method | Endpoint                       | Description           | Auth Required |
| ------ | ------------------------------ | --------------------- | ------------- |
| GET    | `/api/hotels`                  | Lấy tất cả hotels     | ❌            |
| GET    | `/api/hotels/:id`              | Lấy hotel theo ID     | ❌            |
| GET    | `/api/hotels/search/:location` | Tìm kiếm hotel        | ❌            |
| GET    | `/api/hotels/:id/reviews`      | Lấy reviews của hotel | ❌            |
| POST   | `/api/hotels`                  | Tạo hotel mới         | ✅            |
| PUT    | `/api/hotels/:id`              | Cập nhật hotel        | ✅            |
| DELETE | `/api/hotels/:id`              | Xóa hotel             | ✅            |

### Bookings

| Method | Endpoint                    | Description                 | Auth Required |
| ------ | --------------------------- | --------------------------- | ------------- |
| GET    | `/api/bookings`             | Lấy tất cả bookings (Admin) | ✅            |
| GET    | `/api/bookings/my-bookings` | Lấy bookings của user       | ✅            |
| GET    | `/api/bookings/:id`         | Lấy booking theo ID         | ✅            |
| POST   | `/api/bookings`             | Tạo booking mới             | ✅            |
| PUT    | `/api/bookings/:id`         | Cập nhật booking            | ✅            |
| DELETE | `/api/bookings/:id`         | Hủy booking                 | ✅            |

### Reviews

| Method | Endpoint                      | Description            | Auth Required |
| ------ | ----------------------------- | ---------------------- | ------------- |
| GET    | `/api/reviews`                | Lấy tất cả reviews     | ❌            |
| GET    | `/api/reviews/hotel/:hotelId` | Lấy reviews theo hotel | ❌            |
| GET    | `/api/reviews/user/:userId`   | Lấy reviews theo user  | ❌            |
| GET    | `/api/reviews/:id`            | Lấy review theo ID     | ❌            |
| POST   | `/api/reviews`                | Tạo review mới         | ✅            |
| PUT    | `/api/reviews/:id`            | Cập nhật review        | ✅            |
| DELETE | `/api/reviews/:id`            | Xóa review             | ✅            |

### Users

| Method | Endpoint                            | Description          | Auth Required |
| ------ | ----------------------------------- | -------------------- | ------------- |
| GET    | `/api/users`                        | Lấy tất cả users     | ✅            |
| GET    | `/api/users/:id`                    | Lấy user theo ID     | ✅            |
| PUT    | `/api/users/:id`                    | Cập nhật user        | ✅            |
| DELETE | `/api/users/:id`                    | Xóa user             | ✅            |
| GET    | `/api/users/:id/favorites`          | Lấy hotels yêu thích | ✅            |
| POST   | `/api/users/:id/favorites/:hotelId` | Thêm vào yêu thích   | ✅            |
| DELETE | `/api/users/:id/favorites/:hotelId` | Xóa khỏi yêu thích   | ✅            |

## 🔐 Authentication

API sử dụng Firebase Authentication với Bearer Token.

### Request Header Format

```
Authorization: Bearer <firebase-id-token>
```

### Ví dụ với Axios

```javascript
const token = await firebase.auth().currentUser.getIdToken();

axios.get("http://localhost:8080/api/bookings/my-bookings", {
    headers: {
        Authorization: `Bearer ${token}`,
    },
});
```

## 📦 Deploy lên Render

### 1. Tạo tài khoản Render

Đăng ký tại [render.com](https://render.com)

### 2. Tạo Web Service mới

1. Vào Dashboard > **New** > **Web Service**
2. Connect GitHub repository của bạn
3. Cấu hình:
    - **Name**: hotel-booking-api
    - **Environment**: Node
    - **Region**: Singapore (hoặc gần nhất)
    - **Branch**: main/master
    - **Root Directory**: backend
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`

### 3. Cấu hình Environment Variables

Trong phần **Environment**, thêm các biến:

```
NODE_ENV=production
PORT=8080
MONGO_URI=<your-mongodb-atlas-connection-string>
ALLOWED_ORIGINS=<your-frontend-url>
```

### 4. Thêm Firebase Service Account

Có 2 cách:

**Cách 1**: Upload file serviceAccountKey.json (không khuyến nghị cho production)

**Cách 2**: Sử dụng environment variables:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

Và sửa `config/firebaseConfig.js` để sử dụng env variables.

### 5. Deploy

Click **Create Web Service** và đợi deployment hoàn tất.

API sẽ có URL dạng: `https://hotel-booking-api.onrender.com`

## 🛠️ Scripts

```bash
# Development với nodemon
npm run dev

# Production
npm start

# Run tests (chưa implement)
npm test
```

## 📝 Response Format

### Success Response

```json
{
    "success": true,
    "message": "Operation successful",
    "data": {
        // response data
    }
}
```

### Error Response

```json
{
    "success": false,
    "message": "Error message",
    "errors": [] // optional validation errors
}
```

## 🔒 Security Best Practices

1. ✅ Sử dụng HTTPS trong production
2. ✅ Validate input data
3. ✅ Implement rate limiting (có thể thêm)
4. ✅ Secure Firebase service account key
5. ✅ Use environment variables
6. ✅ Implement proper error handling
7. ✅ CORS configuration

## 🐛 Troubleshooting

### MongoDB Connection Error

```
Error: querySrv ENOTFOUND _mongodb._tcp.cluster.mongodb.net
```

**Giải pháp**: Kiểm tra MONGO_URI trong .env và whitelist IP address trong MongoDB Atlas.

### Firebase Authentication Error

```
Error: auth/id-token-expired
```

**Giải pháp**: Token đã hết hạn, refresh token từ client.

### Port already in use

```
Error: listen EADDRINUSE :::8080
```

**Giải pháp**:

```bash
# Kill process on port 8080
npx kill-port 8080
```

## 📖 Additional Resources

-   [Express.js Documentation](https://expressjs.com/)
-   [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
-   [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
-   [Render Documentation](https://render.com/docs)

## 👥 Contributors

-   Your Name

## 📄 License

ISC
