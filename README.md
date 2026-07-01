# 🍳 KitchenMate

> **A modern shared kitchen expense tracking application**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](#)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](#)
[![React 19](https://img.shields.io/badge/React-19-blue.svg)](#)
[![Node 18+](https://img.shields.io/badge/Node-18%2B-green.svg)](#)

KitchenMate is a web-based application that simplifies shared expense management among roommates or kitchen groups. Create groups, invite members, track expenses, and automatically calculate who owes whom.

**🔗 Live Demo:** 
[frontend](https://kitchen-expense-tracker-plum.vercel.app)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running Locally](#-running-locally)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## ✨ Features

### For Admins
- ✅ Create and manage kitchen groups
- ✅ Generate shareable invite links
- ✅ Accept/decline member requests
- ✅ Add expenses and split costs
- ✅ View real-time balance calculations
- ✅ Clear monthly data with undo functionality
- ✅ Manage group members

### For Members
- ✅ Join groups via invite link
- ✅ Add expenses and track spending
- ✅ View personal balance
- ✅ See detailed expense breakdowns
- ✅ Monitor who owes what
- ✅ Real-time balance updates

### General
- 🎨 Professional dark navy + saffron UI
- 📱 Fully responsive (mobile, tablet, desktop)
- 🔐 Secure authentication with hashed passwords
- 🌐 Works on any device with a browser
- ⚡ Fast, real-time updates
- 🔄 Auto-detecting API URLs (local/production)
- 💾 Automatic monthly data clearing

---

## 🛠 Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool
- **Axios** - HTTP client
- **React Router v7** - Navigation
- **React Icons** - Icon library
- **CSS3** - Custom design system

### Backend
- **FastAPI** - Python web framework
- **Uvicorn** - ASGI server
- **MySQL** - Database
- **Python 3.11+** - Programming language

### Cloud
- **Render.com** - Hosting & deployment
- **GitHub** - Version control

---

## 📦 Prerequisites

Before you begin, ensure you have installed:

- **Python** 3.11 or higher ([download](https://www.python.org/downloads/))
- **Node.js** 18+ and npm ([download](https://nodejs.org/))
- **MySQL** 5.7+ ([download](https://www.mysql.com/downloads/))
- **Git** ([download](https://git-scm.com/))
- **Git account** (free at [github.com](https://github.com))

### Verify Installation

```bash
python --version    # Should show 3.11+
node --version      # Should show 18+
npm --version       # Should show 9+
mysql --version     # Should show 5.7+
git --version       # Should show 2.0+
```

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/kitchenmate.git
cd kitchenmate
```

### 2. Set Up Backend

```bash
# Install Python dependencies
pip install -r requirements.txt

# Create database
mysql -u root -p
# Then run:
CREATE DATABASE kitchenmate;
EXIT;

# Import schema
mysql -u root -p kitchenmate < schema.sql
```

### 3. Set Up Frontend

```bash
cd kitchenmate
npm install
```

---

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the project root:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kitchenmate

# API
API_HOST=0.0.0.0
API_PORT=8000

# Environment
ENVIRONMENT=development
```

**Update `main.py` database credentials** (lines 24-27):

```python
def get_db():
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="your_password",  # ← Change this
        database="kitchenmate",
    )
```

### Frontend Configuration

Create `kitchenmate/.env.local`:

```env
VITE_API_URL=${API_URL}
```

The app automatically detects the correct API URL:
- **Local:** `${API_URL}`
- **Production:** Reads from `VITE_API_URL` env variable

---

## 🚀 Running Locally

### Terminal 1: Start Backend

```bash
cd /project/root
python main.py
```

Expected output:
```
Uvicorn running on http://0.0.0.0:8000
Press CTRL+C to quit
```

### Terminal 2: Start Frontend

```bash
cd kitchenmate
npm run dev
```

Expected output:
```
VITE v5.0.0 ready in XXX ms
➜ Local: http://localhost:5173/
```

### Access the App

Open in browser: **http://localhost:5173**

### Test Accounts

```
Admin Login:
  Username: admin
  Password: password123

Member Login:
  Username: member
  Password: password123
```

---

## 🌐 Deployment

### Deploy on Render.com (Recommended - Free Tier Available)

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/kitchenmate.git
git push -u origin main
```

#### Step 2: Deploy Backend

1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub account
4. Select your repository
5. Configure:
   ```
   Name: kitchenmate-api
   Environment: Python 3.11
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
6. Add Environment Variables:
   ```
   DB_HOST=your_render_db_url
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=kitchenmate
   ```
7. Click **"Create Web Service"**
8. Copy the deployed URL (e.g., `https://kitchenmate-api.onrender.com`)

#### Step 3: Deploy Frontend

1. Click **"New +"** → **"Static Site"**
2. Select same repository
3. Configure:
   ```
   Name: kitchenmate-web
   Build Command: cd kitchenmate && npm install && npm run build
   Publish Directory: kitchenmate/dist
   ```
4. Add Environment Variable:
   ```
   VITE_API_URL=https://kitchenmate-api.onrender.com
   ```
5. Click **"Create Static Site"**

#### Step 4: Your App is Live! 🚀

- **Frontend:** `https://kitchenmate-web.onrender.com`
- **Backend API:** `https://kitchenmate-api.onrender.com`
>>>>>>> c05062273e58d480807f14bfb5084b3a28f1b87d

---

## 📁 Project Structure

```
<<<<<<< HEAD
Kitchen-Expense-Tracker/
│
├── static/
│   ├── css/
│   ├── js/
│   └── images/
│
├── templates/
│
├── app.py
├── requirements.txt
├── database.sql
└── README.md
=======
kitchenmate/
├── main.py                      # FastAPI backend
├── requirements.txt             # Python dependencies
├── schema.sql                   # Database schema
├── README.md                    # This file
│
├── kitchenmate/                 # React Frontend
│   ├── src/
│   │   ├── config.js           # API URL configuration
│   │   ├── index.css           # Global design system
│   │   ├── main.jsx            # Entry point
│   │   ├── App.jsx             # Router setup
│   │   ├── AuthContext.jsx     # Authentication context
│   │   ├── useToast.jsx        # Toast notifications
│   │   │
│   │   └── pages/
│   │       ├── Login.jsx       # Login page
│   │       ├── AdminSignup.jsx # Admin registration
│   │       ├── UserSignup.jsx  # Member registration
│   │       ├── AdminDashboard.jsx
│   │       ├── Groups.jsx
│   │       └── Dashboard.jsx
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── dist/                   # Built frontend (production)
│
├── .env.local                  # Local environment variables
└── .env.production             # Production template
>>>>>>> c05062273e58d480807f14bfb5084b3a28f1b87d
```

---

<<<<<<< HEAD
## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/nawabalam07/kitchen-expense-tracker.git
```

### 2. Navigate to the project folder

```bash
cd kitchen-expense-tracker
```

### 3. Create a virtual environment

```bash
python -m venv venv
```

### 4. Activate the virtual environment

**Windows**

```bash
venv\Scripts\activate
```

**Linux/Mac**

```bash
source venv/bin/activate
```

### 5. Install dependencies

```bash
pip install -r requirements.txt
```

### 6. Configure MySQL Database

- Create a new database.
- Import the provided SQL file.

```sql
CREATE DATABASE kitchen_expense_tracker;
```

Import:

```
database.sql
```

Update your database credentials inside the project configuration.

### 7. Run the application

```bash
python app.py
```

Open your browser and visit:

```
http://127.0.0.1:5000/
```

---

## 📸 Screenshots

> Add screenshots here.

Example:

```
screenshots/
│
├── login.png
├── dashboard.png
├── add-expense.png
├── expense-history.png
```

---

## 📈 Future Improvements

- Expense Analytics Dashboard
- Monthly Budget Planning
- Export Expenses to PDF/Excel
- Dark Mode
- Email Notifications
- Expense Charts & Graphs
- Mobile Responsive Improvements
=======
## 💡 Usage Guide

### For Admins

#### 1. Create Account
- Go to app URL
- Click "Create admin account"
- Fill in details
- Create your first group

#### 2. Invite Members
- Copy the invite link from dashboard
- Share via WhatsApp, email, etc.
- Members sign up with the link

#### 3. Manage Expenses
- Click "Add Expense"
- Enter amount, description, date
- Select who to split with
- Save → Balances update automatically

#### 4. Monthly Cleanup
- Click trash icon on group card
- Confirm → All expenses cleared
- Have 30 seconds to undo if you change your mind

### For Members

#### 1. Join Group
- Open invite link from admin
- Create account
- Wait for admin approval

#### 2. Track Expenses
- Add expenses you paid for
- App calculates who owes what
- View real-time balances

#### 3. Monitor Spending
- Check "Balances" tab
- See your balance (owed or owing)
- View all group expenses

---

## 📚 API Documentation

### Authentication

**POST** `/login`
```json
{
  "user_name": "string",
  "password": "string"
}
```

Response:
```json
{
  "user": {
    "user_id": 1,
    "user_name": "admin",
    "role": "admin",
    "user_address": "string",
    "contact": "string"
  }
}
```

### Groups

**GET** `/groups?user_id=1`
- Returns all groups for a user

**POST** `/groups?user_id=1`
```json
{
  "group_name": "Our Flat"
}
```

**GET** `/groups/{group_id}/requests?admin_id=1`
- Get pending member requests

**POST** `/groups/{group_id}/accept/{user_id}?admin_id=1`
- Accept a member request

### Expenses

**POST** `/expenses`
```json
{
  "group_id": 1,
  "paid_by": 1,
  "amount": 500.50,
  "expense_date": "2026-06-30",
  "description": "Groceries",
  "users": [1, 2, 3]
}
```

**GET** `/expenses?group_id=1`
- Get all expenses for a group

**GET** `/balances?group_id=1`
- Get balance summary for all members

### Complete API List

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for full endpoint reference.

---

## 🗄 Database Schema

### Users Table
```sql
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  user_name VARCHAR(100) UNIQUE,
  user_password VARCHAR(255),
  user_address VARCHAR(255),
  user_contact VARCHAR(20),
  role ENUM('admin', 'user')
);
```

### Groups Table
```sql
CREATE TABLE groups (
  group_id INT PRIMARY KEY AUTO_INCREMENT,
  group_name VARCHAR(100),
  invite_code VARCHAR(20) UNIQUE,
  admin_id INT,
  FOREIGN KEY (admin_id) REFERENCES users(user_id)
);
```

### Expenses Table
```sql
CREATE TABLE expenses (
  expense_id INT PRIMARY KEY AUTO_INCREMENT,
  group_id INT,
  paid_by INT,
  paid_by_name VARCHAR(100),
  amount DECIMAL(10, 2),
  expense_date DATE,
  description TEXT,
  FOREIGN KEY (group_id) REFERENCES groups(group_id),
  FOREIGN KEY (paid_by) REFERENCES users(user_id)
);
```

### User Balance Table
```sql
CREATE TABLE user_balance (
  user_id INT,
  group_id INT,
  amount DECIMAL(10, 2),
  PRIMARY KEY (user_id, group_id)
);
```
>>>>>>> c05062273e58d480807f14bfb5084b3a28f1b87d

---

## 🤝 Contributing

<<<<<<< HEAD
Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push to your branch

```bash
git push origin feature-name
```

5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Nawab Alam**

- GitHub: https://github.com/nawabalam07
- LinkedIn: *(Add your LinkedIn profile here)*

---

⭐ If you found this project helpful, don't forget to **Star** the repository!
=======
Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use meaningful variable/function names
- Write comments for complex logic
- Test locally before pushing
- Update README if adding new features

---

## 📝 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## 💬 Support

### Getting Help

- **Documentation:** Check the [docs](./docs) folder
- **Issues:** Open an issue on [GitHub](https://github.com/nawabalam07/kitchenmate/issues)
- **Email:** support@kitchenmate.local
- **Discord:** [Join our community](#)

### Common Issues

#### Port Already in Use
```bash
# Find process on port 5173
lsof -i :5173

# Kill the process
kill -9 <PID>
```

#### Database Connection Error
- Check MySQL is running
- Verify credentials in `main.py`
- Ensure database `kitchenmate` exists

#### API URL Not Working
- Verify backend is running on port 8000
- Check `.env.local` has correct URL
- Clear browser cache

---

## 📊 Project Statistics

- **Lines of Code:** ~3,500
- **Commits:** 45+
- **Contributors:** 1
- **Last Updated:** June 2026

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Receipt upload
- [ ] Recurring expenses
- [ ] Multiple currencies
- [ ] Export to PDF
- [ ] Dark/Light mode toggle
- [ ] Analytics dashboard

---

## 👥 Authors

- **Nawab Alam** - [GitHub](https://github.com/nawabalam07)

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [React](https://react.dev/) - Frontend library
- [Render](https://render.com/) - Hosting platform
- [MySQL](https://www.mysql.com/) - Database

---

## 📞 Contact

- 📧 Email: nawabgullu07@gmail.com
- 💼 LinkedIn: https://www.linkedin.com/in/nawab-alam-465754317/

---

**Made with ❤️ by Nawab Alam**

Last updated: June 30, 2026
>>>>>>> c05062273e58d480807f14bfb5084b3a28f1b87d
