# 🍽️ Kitchen Expense Tracker

A full-stack web application to manage and track kitchen expenses efficiently. This application helps users record daily expenses, categorize spending, monitor budgets, and view expense history through an intuitive interface.

## 📌 Features

- 🔐 User Authentication (Login & Signup)
- ➕ Add Kitchen Expenses
- ✏️ Edit Existing Expenses
- 🗑️ Delete Expenses
- 📋 View Expense History
- 📂 Category-wise Expense Management
- 📊 Dashboard with Expense Summary
- 🔍 Search & Filter Expenses
- 📱 Responsive User Interface

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Bootstrap

### Backend
- Python
- Flask

### Database
- MySQL

---

## 📁 Project Structure

```
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
```

---

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

---

## 🤝 Contributing

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