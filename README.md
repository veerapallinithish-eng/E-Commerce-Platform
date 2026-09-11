# Northstar E-Commerce Platform

A full-stack store built with React, Context API, Flask, and MySQL.

## Setup

1. Create the database: `mysql -u root -p < backend/schema.sql`
2. Install backend packages: `cd backend && pip install -r requirements.txt`
3. Seed 4 categories, 20 products, and an admin account: `python seed.py`
4. Start Flask: `python app.py`
5. In another terminal, install and start the client: `cd frontend && npm install && npm run dev`

The frontend expects Flask at `http://localhost:5000`. Set `VITE_API_URL` to change it. Backend database settings use `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `SECRET_KEY`.

Admin login: `trendadmin@ecommerce.com` / `admin123`
