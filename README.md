# AI-Powered Scam Detection Portal

This repository contains a frontend scaffold for the "AI-Powered Scam Detection Portal" — a modern, responsive web UI with Firebase placeholders and mock AI stubs.

Getting started

This repository has been updated to use a PHP/MySQL backend instead of Firebase for authentication and data storage.

1. Create a MySQL database named `scamguard` or update `api/bootstrap.php` with your database credentials.
2. Import `api/database.sql` into MySQL to create the required tables.
3. Run a PHP server from the project root, for example:

```bash
php -S localhost:8000
```

4. Open `http://localhost:8000/pages/login.html` in your browser.

Local preview

```bash
php -S localhost:8000
```

Then open:

```text
http://localhost:8000/pages/login.html
```

Backend notes
- PHP API endpoints live under `api/`
- Login endpoint: `api/login.php`
- Register endpoint: `api/register.php`
- Session endpoint: `api/session.php`
- Logout endpoint: `api/logout.php`
- Firestore-style data adapter: `api/firestore.php`

Next steps
- Complete additional backend migration for any remaining Firebase data flows
- Secure API endpoints and enable HTTPS for production
- Add proper validation for all form inputs
- Wire page-specific analytics and reporting into the PHP backend

