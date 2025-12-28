# GoDone Backend API

Backend server untuk aplikasi manajemen tugas **GoDone** yang dibangun dengan **Express.js** dan **MySQL**.

## 📋 Table of Contents

- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Instalasi](#instalasi)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [API Endpoints](#api-endpoints)
- [Struktur Folder](#struktur-folder)
- [Database Schema](#database-schema)
- [Autentikasi](#autentikasi)
- [Error Handling](#error-handling)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

## ✨ Fitur Utama

- ✅ **Autentikasi & Otorisasi** - Register, Login, JWT Token
- ✅ **Manajemen User** - Update profil, upload foto, ganti password
- ✅ **Manajemen Tugas** - CRUD tasks dengan prioritas & deadline
- ✅ **Kategori Tugas** - Organisasi task berdasarkan kategori
- ✅ **Upload Gambar** - Integrasi Cloudinary untuk profile picture
- ✅ **CORS Support** - Mendukung multiple origins
- ✅ **Password Encryption** - Keamanan dengan bcryptjs
- ✅ **Token Validation** - JWT middleware untuk protected routes

## 🛠 Tech Stack

| Technology | Version | Deskripsi |
|-----------|---------|-----------|
| **Node.js** | >= 14.0 | JavaScript runtime |
| **Express.js** | ^5.2.1 | Web framework |
| **MySQL** | 8.0+ | Database |
| **JWT** | ^9.0.3 | Token-based authentication |
| **bcryptjs** | ^3.0.3 | Password hashing |
| **Cloudinary** | ^2.8.0 | Cloud image storage |
| **CORS** | ^2.8.5 | Cross-origin handling |
| **dotenv** | ^17.2.3 | Environment variables |

## 📦 Prerequisites

Sebelum menginstal, pastikan Anda memiliki:

- **Node.js** (v14 atau lebih tinggi)
- **npm** atau **yarn**
- **MySQL Server** (berjalan di localhost:3306 atau sesuai config)
- **Cloudinary Account** (untuk upload gambar)

Cek instalasi Node.js:
```bash
node --version
npm --version
```

## 🚀 Instalasi

### 1. Clone Repository
```bash
git clone https://github.com/username/godone-backend.git
cd godone-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
Buat database MySQL dan import schema:
```sql
CREATE DATABASE godone_db;
USE godone_db;

-- Users table
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  profile_picture VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
  category_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE tasks (
  task_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  category_id INT,
  task_title VARCHAR(255) NOT NULL,
  task_description TEXT,
  priority VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);
```

## ⚙️ Konfigurasi Environment

Buat file `.env` di root folder:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=godone_db

# JWT
JWT_SECRET=your_super_secret_key_here_change_this

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS
FRONTEND_URL=http://localhost:5173
```

⚠️ **PENTING**: Jangan commit `.env` ke repository. Gunakan `.env.example` sebagai template.

## 🎯 Menjalankan Aplikasi

### Development Mode
```bash
npm start
```

Server akan berjalan di `http://localhost:5000`

### Verifikasi Server Berjalan
```bash
curl http://localhost:5000
```

Response:
```json
{
  "status": "OK",
  "service": "GoDone Backend"
}
```

## 📡 API Endpoints

### Authentication Routes (`/auth`)

| Method | Endpoint | Deskripsi | Body |
|--------|----------|-----------|------|
| POST | `/auth/register` | Registrasi user baru | `{first_name, last_name, username, email, password}` |
| POST | `/auth/login` | Login dengan email & password | `{email, password}` |

**Contoh Request Register:**
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Contoh Response Login:**
```json
{
  "success": true,
  "message": "Login berhasil!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### User Routes (`/user`) ⚠️ Requires Token

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/user/profile` | Get profile user |
| PUT | `/user/update` | Update profil user |
| POST | `/user/upload-picture` | Upload profile picture |
| PUT | `/user/change-password` | Ganti password |

**Header yang diperlukan:**
```
Authorization: Bearer <your_jwt_token>
```

### Task Routes (`/tasks`) ⚠️ Requires Token

| Method | Endpoint | Deskripsi | Body |
|--------|----------|-----------|------|
| GET | `/tasks` | Get semua tasks user | - |
| POST | `/tasks` | Buat task baru | `{task_title, task_description, category_id, priority, due_date}` |
| GET | `/tasks/:id` | Get task by ID | - |
| PUT | `/tasks/:id` | Update task | `{task_title, task_description, priority, status, due_date}` |
| DELETE | `/tasks/:id` | Delete task | - |

**Contoh Request Create Task:**
```bash
curl -X POST http://localhost:5000/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "task_title": "Belajar Node.js",
    "task_description": "Pelajari Express.js dan MySQL",
    "category_id": 1,
    "priority": "high",
    "due_date": "2024-12-31"
  }'
```

### Category Routes (`/categories`) ⚠️ Requires Token

| Method | Endpoint | Deskripsi | Body |
|--------|----------|-----------|------|
| GET | `/categories` | Get semua kategori | - |
| POST | `/categories` | Buat kategori baru | `{category_name}` |
| DELETE | `/categories/:id` | Hapus kategori | - |

## 📁 Struktur Folder

```
backend-go-done/
├── middleware/
│   └── auth.js              # JWT verification middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── user.js              # User management routes
│   ├── task.js              # Task CRUD routes
│   └── category.js          # Category management routes
├── cloudinary.js            # Cloudinary configuration
├── db.js                    # MySQL connection
├── server.js                # Main server file
├── package.json             # Dependencies
├── .env                     # Environment variables (create manually)
├── .env.example             # Template environment variables
└── README.md                # Documentation
```

## 🗄️ Database Schema

### Users Table
```
user_id (PK, INT, AUTO_INCREMENT)
├── first_name (VARCHAR)
├── last_name (VARCHAR)
├── username (VARCHAR, UNIQUE)
├── email (VARCHAR, UNIQUE)
├── password (VARCHAR, hashed)
├── profile_picture (VARCHAR, URL)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Categories Table
```
category_id (PK, INT, AUTO_INCREMENT)
├── user_id (FK → users)
├── category_name (VARCHAR)
└── created_at (TIMESTAMP)
```

### Tasks Table
```
task_id (PK, INT, AUTO_INCREMENT)
├── user_id (FK → users)
├── category_id (FK → categories)
├── task_title (VARCHAR)
├── task_description (TEXT)
├── priority (VARCHAR: low, medium, high)
├── status (VARCHAR: pending, in-progress, completed)
├── due_date (DATE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 🔐 Autentikasi

### Password Validation Rules
- Minimal **8 karakter**
- Harus mengandung **huruf besar** (A-Z)
- Harus mengandung **huruf kecil** (a-z)
- Harus mengandung **angka** (0-9)

Contoh password yang valid: `SecurePass123`

### JWT Token
- Token dikirim dalam header: `Authorization: Bearer <token>`
- Token tidak ada expiration time (sesuaikan di production)
- Secret key disimpan di `.env` → `JWT_SECRET`

### Token Verification Flow
```
Request → Middleware (verifyToken) → Check Authorization Header
                                   → Extract token dari "Bearer <token>"
                                   → Verify dengan JWT_SECRET
                                   → Attach user data ke req.user
                                   → Next()
```

## ⚠️ Error Handling

### Error Response Format
```json
{
  "success": false,
  "message": "Deskripsi error"
}
```

### Common Status Codes
| Code | Arti |
|------|------|
| 200 | OK - Request berhasil |
| 400 | Bad Request - Data tidak valid |
| 401 | Unauthorized - Token tidak ditemukan/expired |
| 403 | Forbidden - Token tidak valid |
| 404 | Not Found - Resource tidak ditemukan |
| 500 | Server Error - Error server |

## 🌐 CORS Configuration

Backend mendukung requests dari:
- `http://localhost:5173` (development frontend)
- `http://127.0.0.1:5173`
- `https://godone-frontend.vercel.app` (production frontend)

Untuk menambah origin lain, edit di `server.js`:
```javascript
const allowedOrigins = [
  "http://localhost:5173",
  "https://your-frontend.com"  // Tambahkan di sini
];
```

## 🚢 Deployment

### Deploy ke Vercel / Railway / Render

1. **Siapkan environment variables** di platform hosting
2. **Pastikan MySQL accessible** dari server
3. **Set NODE_ENV=production**
4. **Jalankan**: `npm start`

Contoh Vercel config (`vercel.json`):
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

## 🐛 Troubleshooting

### Error: "Cannot find module 'express'"
```bash
npm install
```

### Error: "ECONNREFUSED - MySQL tidak terkoneksi"
- Pastikan MySQL server berjalan
- Check DB_HOST, DB_USER, DB_PASSWORD di `.env`
- Verifikasi database sudah dibuat

### Error: "CORS blocked"
- Tambahkan origin frontend ke `allowedOrigins` di `server.js`
- Pastikan frontend mengirim request dari URL yang benar

### Error: "Token expired"
- Generate token baru dengan login lagi
- Atau extend token expiration di `server.js`

## 📝 Kontribusi

1. Fork repository
2. Buat branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 Lisensi

Project ini dilisensikan di bawah MIT License - lihat file [LICENSE](../LICENSE) untuk detail.

## 📧 Support

Jika ada pertanyaan atau issue, silakan buka GitHub Issue atau hubungi team development.

---

**Dibuat dengan ❤️ oleh Tim GoDone**
