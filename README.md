# 🐾 Pawfect Pal — Pet Care Management App

> A full-stack web application designed to help pet owners manage their pets' care, health records, and appointments in one convenient platform.

---

## 📋 Table of Contents

- [Project Description and Purpose](#-project-description-and-purpose)
- [UML Diagram](#-uml-diagram)
- [Features and Functionalities](#-features-and-functionalities)
- [How the Program Works](#-how-the-program-works)
- [How to Run the Application](#-how-to-run-the-application)
- [Team Members](#-team-members)

---

## 📖 Project Description and Purpose

**Pawfect Pal** is a Pet Care Management web application built to simplify and centralize the management of pet-related information. The system is intended for pet owners who want a reliable, organized, and easy-to-use platform to track their pets' health records, manage appointments, and keep important information in one place.

The application follows a **client-server architecture**, with a responsive HTML/CSS/JavaScript frontend and a RESTful ASP.NET Core Web API backend secured with JSON Web Token (JWT) authentication. The goal of Pawfect Pal is to bridge the gap between pet owners and organized pet care — ensuring no vaccination, checkup, or health milestone is ever missed.

---

## 📐 UML Diagram



---

## ✨ Features and Functionalities

### 🔐 Authentication & Authorization
- User **Registration** with secure password hashing
- User **Login** with JWT (JSON Web Token) generation
- Protected routes — only authenticated users can access their data
- Token-based session management

### 🐶 Pet Management
- **Add, view, edit, and delete** pet profiles
- Store details such as name, species, breed, date of birth, and weight
- Each pet is tied to its owner's account

### 🏥 Health Records
- Log and view **health records** per pet
- Record medications, diagnoses, and veterinary visit notes
- Track historical health data over time

### 📅 Appointment Tracking
- Schedule and manage **vet appointments**
- View upcoming and past appointments per pet
- Add vet name, date, and description

### 📊 Dashboard
- Centralized overview of all pets and upcoming appointments
- Quick-access navigation to individual pet profiles

### 🔒 Security
- Passwords stored as hashed values (never plain text)
- JWT authentication with configurable secret key and expiry
- Swagger UI available for API exploration and testing during development

---

## ⚙️ How the Program Works

Pawfect Pal is built using a **separation of concerns** architecture with two distinct layers:

### Frontend (Client Side)
The frontend is a static web application built with plain **HTML, CSS, and JavaScript**. It communicates with the backend through **HTTP requests** (using the Fetch API). Upon successful login, the server returns a **JWT token**, which is stored on the client side and attached to every subsequent request in the `Authorization` header as a Bearer token.

### Backend (Server Side)
The backend is an **ASP.NET Core Web API** project (`PawfectPal.Api`) built with C#. It handles:

1. **Routing** — HTTP endpoints are organized by controllers (e.g., `AuthController`, `PetController`).
2. **Authentication** — When a user logs in, the server validates credentials and issues a signed JWT token using a configured secret key from `appsettings.json`.
3. **Business Logic** — Service classes process data and enforce rules before interacting with the database.
4. **Data Persistence** — Entity Framework Core (EF Core) maps C# model classes to database tables and handles all database queries via LINQ.



---

## 🚀 How to Run the Application

### Prerequisites

Make sure you have the following installed:

| Tool | Version |
|------|---------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 7.0 or later |
| [Visual Studio Code](https://visualstudio.microsoft.com/) | 17.5+ (or VS Code with C# extension) |
| A modern web browser | Chrome, Firefox, Edge, etc. |

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/HaiseSasaki23/Pawfect-Pal-A-Pet-Care-Management-app.git
cd Pawfect-Pal-A-Pet-Care-Management-app
```

---

### Step 2 — Configure the Backend

Navigate to the API project:

```
Pawfect Pal/backend/PawfectPal.Api/
```

Open `appsettings.json` and fill in your configuration:

```json
{
  "Jwt": {
    "Key": "YourSuperSecretKeyHere_MustBeAtLeast32Characters",
    "Issuer": "PawfectPalApp",
    "Audience": "PawfectPalUsers"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=PawfectPalDb;Trusted_Connection=True;"
  }
}
```

> ⚠️ **Important:** The `Jwt:Key` must not be null or empty or the application will throw an `ArgumentNullException` on startup.

---

### Step 3 — Apply Database Migrations

Open a terminal in the `PawfectPal.Api` project folder and run:

```bash
dotnet ef database update
```

> If EF tools are not installed: `dotnet tool install --global dotnet-ef`

---

### Step 4 — Run the Backend

```bash
dotnet run
```


The API will be available at:
- `https://localhost:5182` (or the port shown in the terminal)
- Swagger UI: `https://localhost:5182/swagger`

---

### Step 5 — Open the Frontend

Navigate to the frontend folder:

```
Pawfect Pal/frontend/
```

Open `index.html` directly in your browser, **or** use a local server such as:

---

## 👥 Team Members

| Name | Role |
|------|------|
| Gian Louie D. Baes | Project Manager / Lead Dev |
| Edrian A. Angsioco | Logic Developer / Tester |
| Danielle A. Balilla | GUI |



---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | C#, ASP.NET Core Web API |
| Authentication | JSON Web Tokens (JWT) |
| ORM | Entity Framework Core |
| Database | Aiven |
| IDE | Visual Studio Code |
| API Docs | Swagger / OpenAPI |

---

<div align="center">
  Made with ❤️ for pets everywhere 🐾
</div>