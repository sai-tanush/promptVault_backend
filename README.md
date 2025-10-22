#  Node.js Backend Setup Guide

This document provides a step-by-step guide to set up and run the backend server locally.

---

##  Prerequisites

Before getting started, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or above)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)

---

##  Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/sai-tanush/promptVault_backend.git
```

---

### 2. Install Dependencies

Navigate to the project directory and install all required packages:

```bash
cd prompt_backend
npm i
```

---

### 3. Configure Environment Variables

Download the `.env_backend` file shared with you and **place it in the root directory** of your project.

Then, rename it to `.env`.

```bash
mv .env_backend .env
```

>  The backend won’t run properly without this file, as it contains essential environment configurations.

---

### 4. Run the Backend Server

Once everything is set up, start the server using:

```bash
npm run dev
```

---

## Server Running

After a successful start, you should see something like:

```
✅ Server running on port 5000
✅ Connected to Database
```

You can now access your backend at:

```
http://localhost:5001/
```

---

## Notes

- Make sure your database credentials and API keys are correctly set inside `.env`.
- If you face any issues, try removing `node_modules` and running `npm install` again.

---
