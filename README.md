# StockManager

A full-stack inventory management system designed to simplify product management, stock tracking, and inventory monitoring through a centralized web application.

## 🚀 Features

* Add, update, delete, and view products
* Track inventory and stock levels
* Manage product information
* Monitor available stock
* RESTful backend APIs
* Persistent database storage
* Interactive web-based interface

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* JavaScript

### Backend

* Java
* Spring Boot
* Maven
* REST APIs

### Database

* PostgreSQL

## 📁 Project Structure

```text
inventory-system/
├── backend/
│   ├── pom.xml
│   └── src/
├── database/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.cjs
├── .gitignore
└── structure.txt
```

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:

* Java
* Maven
* Node.js
* npm
* PostgreSQL

### 1. Clone the Repository

```bash
git clone https://github.com/mokshagnachowdary/StockManager.git
cd StockManager
```

### 2. Set Up the Database

Create a PostgreSQL database for the application.

Configure the database connection in the Spring Boot application configuration with your PostgreSQL credentials.

### 3. Start the Backend

Open a terminal in the project root and run:

```bash
cd backend
mvn spring-boot:run
```

The Spring Boot backend will start locally.

### 4. Start the Frontend

Open another terminal and run:

```bash
cd frontend
npm install
npm run dev
```

Vite will provide the local development URL in the terminal.

## 🗄️ Database

StockManager uses **PostgreSQL** for persistent storage of product and inventory data.

The Spring Boot backend connects to PostgreSQL and provides the APIs used by the frontend.

## 🔌 API

The backend provides RESTful APIs for inventory management operations, including:

* Creating products
* Retrieving products
* Updating products
* Deleting products
* Managing stock information

## 🎯 Project Goal

The goal of StockManager is to provide a simple and efficient solution for inventory management while demonstrating:

* Full-stack web development
* React frontend development
* Spring Boot backend development
* REST API design
* PostgreSQL database integration
* CRUD operations

## 👨‍💻 Author

**Mokshagna Chowdhary**

