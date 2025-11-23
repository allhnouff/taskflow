# TaskFlow - Company Task & Reminder System

A production-ready MERN stack web application for managing company tasks, assignments, and reminders with role-based access control, file attachments, email notifications, and automated reminders.

## 🚀 Features

- **User Authentication**: JWT-based authentication with role-based access control (Admin, Manager, User)
- **Task Management**: Create, assign, update, and track tasks with deadlines
- **Dashboard**: Overview of upcoming, in-progress, overdue, and completed tasks
- **File Attachments**: Upload, preview, and download attachments for tasks
- **Email Notifications**: Automated emails for task assignments, reminders, and overdue alerts
- **Cron Jobs**: Automated reminder system that sends notifications before deadlines
- **Task Filtering & Search**: Filter tasks by status, priority, assignee, and search by title/description
- **CSV Export**: Export tasks to CSV for reporting
- **Admin Panel**: User management and system configuration
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS

## 🛠 Technology Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Multer (File Upload)
- Nodemailer (Email)
- node-cron (Scheduled Tasks)

### Frontend
- React 18
- Vite
- React Router
- React Query
- Tailwind CSS
- Axios

## 📋 Prerequisites

- Node.js (v18+)
- MongoDB (v7.0+)
- npm or yarn

## 🔧 Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd TaskFlow
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@taskflow.com
FRONTEND_URL=http://localhost:5173
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,pdf,doc,docx,xls,xlsx,txt
REMINDER_BEFORE_HOURS=24
CRON_TIMEZONE=UTC
```

### 3. Frontend Setup

```bash
cd ../client
npm install
```

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Seed Database

Run the seed script to create default admin, manager, and user accounts:

```bash
cd server
npm run seed
```

Default credentials:
- **Admin**: admin@taskflow.com / admin123
- **Manager**: manager@taskflow.com / manager123
- **User**: user@taskflow.com / user123

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🐳 Docker Deployment

### Using Docker Compose

1. Update environment variables in `docker-compose.yml`

2. Build and start all services:

```bash
docker-compose up -d
```

3. Seed the database:

```bash
docker-compose exec backend npm run seed
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Individual Docker Builds

**Backend:**
```bash
cd server
docker build -t taskflow-backend .
docker run -p 5000:5000 --env-file .env taskflow-backend
```

**Frontend:**
```bash
cd client
docker build -t taskflow-frontend .
docker run -p 3000:80 taskflow-frontend
```

## 📁 Project Structure

```
TaskFlow/
├── server/
│   ├── src/
│   │   ├── config/         # Database, email configuration
│   │   ├── models/         # Mongoose models
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, validation middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Email, cron, file services
│   │   ├── utils/          # Error handlers, utilities
│   │   ├── scripts/        # Database seeding
│   │   ├── app.js
│   │   └── server.js
│   ├── uploads/            # File uploads directory
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # Auth context
│   │   ├── services/       # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create user (Admin only)
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - List tasks (with filters)
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `PATCH /api/tasks/:id/status` - Update task status
- `DELETE /api/tasks/:id` - Delete task

### Attachments
- `POST /api/tasks/:id/attachments` - Upload attachment
- `GET /api/tasks/:id/attachments` - List attachments
- `GET /api/tasks/:id/attachments/:attachmentId/download` - Download attachment
- `DELETE /api/tasks/:id/attachments/:attachmentId` - Delete attachment

### Dashboard
- `GET /api/dashboard` - Get dashboard data

### Users (Admin only)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### Notifications
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Export
- `GET /api/export/csv` - Export tasks to CSV

## ⚙️ Configuration

### Email Setup (Gmail)

1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Create a new app password for "Mail"
   - Use this password in `SMTP_PASS`

### File Upload

- Default max file size: 10MB
- Allowed types: jpg, jpeg, png, pdf, doc, docx, xls, xlsx, txt
- Files are stored in `server/uploads/tasks/`

### Cron Jobs

- **Reminder Check**: Runs every hour, sends reminders 24 hours before deadline (configurable)
- **Overdue Check**: Runs every 30 minutes, marks overdue tasks

To configure reminder hours, update the `reminder_before_hours` setting in the database or set `REMINDER_BEFORE_HOURS` in `.env`.

## 🧪 Testing

Test the API endpoints using the included Postman collection or any HTTP client.

Default test credentials:
- Email: admin@taskflow.com
- Password: admin123

## 📝 Environment Variables

See `.env.example` files in both `server` and `client` directories for all available configuration options.

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control (RBAC)
- File upload validation
- CORS configuration
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` or start MongoDB service
- Check `MONGODB_URI` in `.env` file

### Email Not Sending
- Verify SMTP credentials
- Check if App Password is correct (for Gmail)
- Ensure firewall allows SMTP port

### File Upload Issues
- Check `uploads/tasks` directory permissions
- Verify file size and type restrictions
- Ensure disk space is available

## 📧 Support

For issues and questions, please open an issue on the repository.

---

Built with ❤️ using the MERN stack

