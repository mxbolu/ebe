# Deployment Guide

This guide will help you deploy your reading journal app to a remote server.

## Option 1: Vercel (Recommended - Easiest)

Vercel is the easiest option for Next.js apps. It's made by the Next.js team.

### Prerequisites
1. GitHub account
2. Vercel account (free tier available at https://vercel.com)

### Steps

1. **Push code to GitHub**
   ```bash
   # Initialize git repository if you haven't already
   git init
   git add .
   git commit -m "Initial commit"

   # Create a new repository on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

2. **Set up Production Database**

   You need a production PostgreSQL database. Options:

   **A. Neon (Recommended - Free tier, serverless)**
   - Visit https://neon.tech
   - Create account and new project
   - Copy the connection string (looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname`)

   **B. Supabase (Free tier, more features)**
   - Visit https://supabase.com
   - Create account and new project
   - Get connection string from Settings > Database

   **C. Railway (Free trial, easy to use)**
   - Visit https://railway.app
   - Create PostgreSQL database
   - Copy connection string

3. **Deploy to Vercel**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Deploy
   vercel
   ```

   Follow the prompts:
   - Link to existing project? No
   - Project name? (enter your project name)
   - Directory? ./
   - Override settings? No

4. **Set Environment Variables**

   In Vercel Dashboard:
   - Go to your project > Settings > Environment Variables
   - Add `DATABASE_URL` = your production PostgreSQL connection string
   - Example: `postgresql://user:pass@host.com:5432/database`

5. **Run Database Migrations**

   ```bash
   # Set production DATABASE_URL locally (temporarily)
   export DATABASE_URL="your_production_database_url"

   # Run migrations
   npx prisma migrate deploy

   # Optional: Import books to production
   npm run import:books:fast -- --limit=100000
   npm run import:goodreads -- --limit=50000
   ```

6. **Redeploy**

   ```bash
   vercel --prod
   ```

Your app will be live at `https://your-project.vercel.app`!

---

## Option 2: Railway (Good for Full-Stack Apps)

Railway is great because it can host both your app and database together.

### Steps

1. **Push to GitHub** (same as Vercel option 1)

2. **Sign up for Railway**
   - Visit https://railway.app
   - Sign in with GitHub

3. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

4. **Add PostgreSQL Database**
   - In your project, click "+ New"
   - Select "Database" > "PostgreSQL"
   - Railway will auto-create `DATABASE_URL` variable

5. **Configure Environment**
   - Railway should auto-detect Next.js
   - Verify build command: `npm run build`
   - Verify start command: `npm run start`

6. **Run Migrations**

   Railway provides a shell environment:
   - Go to your service > "Shell" tab
   - Run: `npx prisma migrate deploy`
   - Run imports if needed

7. **Deploy**
   - Railway auto-deploys on push to main branch
   - Your app will be at `https://your-app.up.railway.app`

---

## Option 3: DigitalOcean App Platform

Good middle ground between ease and control.

### Steps

1. **Push to GitHub**

2. **Create App on DigitalOcean**
   - Visit https://cloud.digitalocean.com/apps
   - Click "Create App"
   - Connect GitHub repo

3. **Create Managed Database**
   - Go to Databases > Create
   - Choose PostgreSQL
   - Copy connection string

4. **Configure App**
   - Build Command: `npm run build`
   - Run Command: `npm run start`
   - Environment Variables:
     - `DATABASE_URL` = your database connection string

5. **Deploy**
   - DigitalOcean will build and deploy
   - URL: `https://your-app.ondigitalocean.app`

---

## Option 4: Self-Hosted VPS (Most Control)

For maximum control, deploy to your own VPS.

### Steps

1. **Get a VPS**
   - DigitalOcean Droplet ($6/month)
   - Linode ($5/month)
   - Vultr ($6/month)
   - Choose Ubuntu 22.04

2. **SSH into your server**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Dependencies**
   ```bash
   # Update system
   apt update && apt upgrade -y

   # Install Node.js 24
   curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
   apt install -y nodejs

   # Install PostgreSQL
   apt install -y postgresql postgresql-contrib

   # Install PM2 (process manager)
   npm install -g pm2

   # Install Nginx (reverse proxy)
   apt install -y nginx
   ```

4. **Set up PostgreSQL**
   ```bash
   # Switch to postgres user
   sudo -u postgres psql

   # Create database and user
   CREATE DATABASE ebe;
   CREATE USER ebeuser WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE ebe TO ebeuser;
   \\q
   ```

5. **Clone and Configure App**
   ```bash
   # Clone your repo
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git /var/www/ebe
   cd /var/www/ebe

   # Install dependencies
   npm install

   # Create .env file
   echo 'DATABASE_URL="postgresql://ebeuser:your_secure_password@localhost:5432/ebe"' > .env.local

   # Run migrations
   npx prisma migrate deploy

   # Build app
   npm run build
   ```

6. **Start with PM2**
   ```bash
   pm2 start npm --name "ebe" -- start
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx**
   ```bash
   nano /etc/nginx/sites-available/ebe
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   ln -s /etc/nginx/sites-available/ebe /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

8. **Set up SSL (HTTPS)**
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

---

## Post-Deployment Checklist

After deploying to any platform:

- [ ] Test the search API: `https://your-domain.com/api/books/search?query=test`
- [ ] Verify database connection
- [ ] Import books to production database
- [ ] Set up monitoring (Vercel/Railway have built-in monitoring)
- [ ] Configure custom domain (optional)
- [ ] Set up CI/CD for automatic deployments
- [ ] Enable CORS if building a separate frontend

---

## Environment Variables Needed

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

For production, remove or update:
- Remove any local Prisma Postgres URLs
- Use a production PostgreSQL URL instead

---

## Database Import Commands (Production)

After deploying, import books to production:

```bash
# Import from Open Library (100K books)
npm run import:books:fast -- --limit=100000

# Import from Goodreads (50K books)
npm run import:goodreads -- --limit=50000 --genres="fiction,fantasy,science-fiction,mystery"
```

---

## Monitoring and Maintenance

### Check Application Logs
- **Vercel**: Dashboard > Logs
- **Railway**: Service > Deployments > Logs
- **VPS with PM2**: `pm2 logs ebe`

### Check Database Size
```bash
# Connect to production database
psql $DATABASE_URL

# Check size
SELECT pg_size_pretty(pg_database_size('your_database_name'));

# Check book count
SELECT COUNT(*) FROM "Book";
```

### Update Application
```bash
# Push to GitHub
git push origin main

# Vercel/Railway auto-deploy on push
# For VPS:
cd /var/www/ebe
git pull
npm install
npm run build
pm2 restart ebe
```

---

## Recommended: Vercel + Neon

For the easiest and most cost-effective production setup:

1. **Database**: Neon (Free tier, 500MB)
2. **Hosting**: Vercel (Free tier, unlimited bandwidth)
3. **Total cost**: $0/month for moderate traffic

This gives you:
- Automatic deployments on git push
- Serverless database (scales to zero)
- Global CDN
- HTTPS by default
- Custom domains
- 99.99% uptime

Would you like me to help you set up any of these options?
