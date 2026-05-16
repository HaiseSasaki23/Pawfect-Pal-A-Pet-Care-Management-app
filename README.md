<div align="center">

![Pawfect Pal Banner](Pawfect%20Pal/docs/img/banner.png)

# 🐾 Pawfect Pal — Pet Care Management App

> A full-stack web application designed to help pet owners manage their pets' care, health records, and appointments in one convenient platform.

<br/>

![GitHub repo size](https://img.shields.io/github/repo-size/HaiseSasaki23/Pawfect-Pal-A-Pet-Care-Management-app?style=for-the-badge&color=9d72d6&labelColor=fdf5f7&logoColor=9d72d6)
![GitHub last commit](https://img.shields.io/github/last-commit/HaiseSasaki23/Pawfect-Pal-A-Pet-Care-Management-app?style=for-the-badge&color=c49be0&labelColor=fdf5f7&logoColor=9d72d6)
![GitHub issues](https://img.shields.io/github/issues/HaiseSasaki23/Pawfect-Pal-A-Pet-Care-Management-app?style=for-the-badge&color=9d72d6&labelColor=fdf5f7&logoColor=9d72d6)
![GitHub stars](https://img.shields.io/github/stars/HaiseSasaki23/Pawfect-Pal-A-Pet-Care-Management-app?style=for-the-badge&color=c49be0&labelColor=fdf5f7&logoColor=9d72d6)

<br/>

![.NET](https://img.shields.io/badge/.NET-7.0+-9d72d6?style=flat-square&logo=dotnet&logoColor=fdf5f7)
![C#](https://img.shields.io/badge/C%23-ASP.NET_Core-8a5bc9?style=flat-square&logo=csharp&logoColor=fdf5f7)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-9d72d6?style=flat-square&logo=javascript&logoColor=fdf5f7)
![HTML5](https://img.shields.io/badge/HTML5-Frontend-8a5bc9?style=flat-square&logo=html5&logoColor=fdf5f7)
![CSS3](https://img.shields.io/badge/CSS3-Styled-9d72d6?style=flat-square&logo=css3&logoColor=fdf5f7)
![JWT](https://img.shields.io/badge/JWT-Auth-8a5bc9?style=flat-square&logo=jsonwebtokens&logoColor=fdf5f7)
![Entity Framework](https://img.shields.io/badge/EF_Core-ORM-9d72d6?style=flat-square&logo=dotnet&logoColor=fdf5f7)
![Swagger](https://img.shields.io/badge/Swagger-API_Docs-8a5bc9?style=flat-square&logo=swagger&logoColor=fdf5f7)

</div>

---

## 📋 Table of Contents

- [Project Description and Purpose](#-project-description-and-purpose)
- [UML Diagram](#-uml-diagram)
- [Features and Functionalities](#-features-and-functionalities)
- [How the Program Works](#️-how-the-program-works)
- [How to Run the Application](#-how-to-run-the-application)
- [Team Members](#-team-members)
- [Tech Stack](#️-tech-stack)

---

## 📖 Project Description and Purpose

**Pawfect Pal** is a Pet Care Management web application built to simplify and centralize the management of pet-related information. The system is intended for pet owners who want a reliable, organized, and easy-to-use platform to track their pets' health records, manage appointments, and keep important information in one place.

The application follows a **client-server architecture**, with a responsive HTML/CSS/JavaScript frontend and a RESTful ASP.NET Core Web API backend secured with JSON Web Token (JWT) authentication. The goal of Pawfect Pal is to bridge the gap between pet owners and organized pet care — ensuring no vaccination, checkup, or health milestone is ever missed.

---

## 📐 UML Diagram



---

## ✨ Features and Functionalities

<details>
<summary>🔐 <b>Authentication & Authorization</b></summary>
<br>

- User **Registration** with secure password hashing
- User **Login** with JWT (JSON Web Token) generation
- Protected routes — only authenticated users can access their data
- Token-based session management

</details>

<details>
<summary>🐶 <b>Pet Management</b></summary>
<br>

- **Add, view, edit, and delete** pet profiles
- Store details such as name, species, breed, date of birth, and weight
- Each pet is tied to its owner's account

</details>

<details>
<summary>🏥 <b>Health Records</b></summary>
<br>

- Log and view **health records** per pet
- Record medications, diagnoses, and veterinary visit notes
- Track historical health data over time

</details>

<details>
<summary>📅 <b>Appointment Tracking</b></summary>
<br>

- Schedule and manage **vet appointments**
- View upcoming and past appointments per pet
- Add vet name, date, and description

</details>

<details>
<summary>📊 <b>Dashboard</b></summary>
<br>

- Centralized overview of all pets and upcoming appointments
- Quick-access navigation to individual pet profiles

</details>

<details>
<summary>🔒 <b>Security</b></summary>
<br>

- Passwords stored as hashed values (never plain text)
- JWT authentication with configurable secret key and expiry
- Swagger UI available for API exploration and testing during development

</details>

---

## ⚙️ How the Program Works

Pawfect Pal is built using a **separation of concerns** architecture with two distinct layers:

<details>
<summary>🌐 <b>Frontend (Client Side)</b></summary>
<br>

The frontend is a static web application built with plain **HTML, CSS, and JavaScript**. It communicates with the backend through **HTTP requests** (using the Fetch API). Upon successful login, the server returns a **JWT token**, which is stored on the client side and attached to every subsequent request in the `Authorization` header as a Bearer token.

</details>

<details>
<summary>🖥️ <b>Backend (Server Side)</b></summary>
<br>

The backend is an **ASP.NET Core Web API** project (`PawfectPal.Api`) built with C#. It handles:

1. **Routing** — HTTP endpoints are organized by controllers (e.g., `AuthController`, `PetController`).
2. **Authentication** — When a user logs in, the server validates credentials and issues a signed JWT token using a configured secret key from `appsettings.json`.
3. **Business Logic** — Service classes process data and enforce rules before interacting with the database.
4. **Data Persistence** — Entity Framework Core (EF Core) maps C# model classes to database tables and handles all database queries via LINQ.

</details>

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

<details>
<summary>📋 <b>Step 1 — Clone the Repository</b></summary>
<br>

```bash
git clone https://github.com/HaiseSasaki23/Pawfect-Pal-A-Pet-Care-Management-app.git
cd Pawfect-Pal-A-Pet-Care-Management-app
```

</details>

<details>
<summary>⚙️ <b>Step 2 — Configure the Backend</b></summary>
<br>

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

</details>

<details>
<summary>🗄️ <b>Step 3 — Apply Database Migrations</b></summary>
<br>

Open a terminal in the `PawfectPal.Api` project folder and run:

```bash
dotnet ef database update
```

> If EF tools are not installed: `dotnet tool install --global dotnet-ef`

</details>

<details>
<summary>▶️ <b>Step 4 — Run the Backend</b></summary>
<br>

```bash
dotnet run
```

The API will be available at:
- `https://localhost:5182` (or the port shown in the terminal)
- Swagger UI: `https://localhost:5182/swagger`

</details>

<details>
<summary>🌍 <b>Step 5 — Open the Frontend</b></summary>
<br>

Navigate to the frontend folder:

```
Pawfect Pal/frontend/
```

Open `index.html` directly in your browser, **or** use a local server.

</details>

---

## 👥 Team Members

<div align="center">

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/HaiseSasaki23">
        <img src="https://github.com/HaiseSasaki23.png" width="100px" alt="Gian Louie D. Baes"/><br/>
        <sub><b>Gian Louie D. Baes</b></sub>
      </a><br/>
      🧑‍💼 Project Manager / Lead Dev
    </td>
    <td align="center">
      <a href="https://github.com/monkozen">
        <img src="https://github.com/monkozen.png" width="100px" alt="Edrian A. Angsioco"/><br/>
        <sub><b>Edrian A. Angsioco</b></sub>
      </a><br/>
      🧪 Logic Developer / Tester
    </td>
    <td align="center">
      <a href="https://github.com/danirchvs">
        <img src="https://github.com/danirchvs.png" width="100px" alt="Danielle A. Balilla"/><br/>
        <sub><b>Danielle A. Balilla</b></sub>
      </a><br/>
      🎨 GUI Designer
    </td>
  </tr>
</table>

</div>



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
