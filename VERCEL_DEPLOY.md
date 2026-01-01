# Vercel Deployment Steps

Follow these steps exactly to deploy your app to Vercel.

## Prerequisites Checklist

Before you start, make sure you have:
- [ ] GitHub account
- [ ] Vercel account (sign up at https://vercel.com with GitHub)
- [ ] Neon account for database (sign up at https://neon.tech)

---

## Step 1: Set Up Production Database (Neon)

### 1.1 Create Neon Account
1. Go to https://neon.tech
2. Click "Sign up" and use GitHub to sign in
3. Authorize Neon to access your GitHub

### 1.2 Create Database
1. Click "Create a project"
2. Fill in:
   - **Project name**: `ebe-production`
   - **Region**: Select closest to your location
   - **PostgreSQL version**: 16 (default)
3. Click "Create project"

### 1.3 Get Connection String
1. In your Neon dashboard, you'll see "Connection string"
2. Copy the **connection string** - it looks like:
   ```
   postgresql://username:password@ep-cool-mountain-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. **IMPORTANT**: Save this somewhere safe (Notes app, password manager)

---

## Step 2: Initialize Git and Push to GitHub

### 2.1 Initialize Git Repository
```bash
cd /Users/boluwaji/Desktop/ebe
git init
git add .
git commit -m "Initial commit - Reading journal app"
```

### 2.2 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `ebe` (or any name you prefer)
3. Description: "Reading journal web app with 500K+ books"
4. **Keep it Public** (required for Vercel free tier)
5. **DO NOT** check "Add README" or "Add .gitignore" (we already have these)
6. Click "Create repository"

### 2.3 Push to GitHub
GitHub will show you commands. Run these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ebe.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 3: Deploy to Vercel

### 3.1 Import Project
1. Go to https://vercel.com
2. Click "Add New..." > "Project"
3. You'll see your GitHub repositories
4. Find `ebe` and click "Import"

### 3.2 Configure Project
Vercel will auto-detect Next.js settings:

- **Framework Preset**: Next.js ✓ (auto-detected)
- **Root Directory**: `./` ✓
- **Build Command**: `npm run build` ✓
- **Output Directory**: `.next` ✓
- **Install Command**: `npm install` ✓

**DO NOT CLICK DEPLOY YET!**

### 3.3 Add Environment Variables
Before deploying, click "Environment Variables" section:

1. Add variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste your Neon connection string from Step 1.3
   - **Environments**: Check all (Production, Preview, Development)
2. Click "Add"

### 3.4 Deploy!
Now click "Deploy"

Vercel will:
- Install dependencies
- Run Prisma generate (via postbuild script)
- Build your Next.js app
- Deploy to production

This takes 2-5 minutes.

---

## Step 4: Run Database Migrations

Once deployment is complete:

### 4.1 Install Vercel CLI (one-time)
```bash
npm i -g vercel
```

### 4.2 Login to Vercel
```bash
vercel login
```

### 4.3 Link Your Project
```bash
cd /Users/boluwaji/Desktop/ebe
vercel link
```

Follow prompts:
- Set up and link? **Yes**
- Scope: Your username
- Link to existing? **Yes**
- Project name: `ebe` (or whatever you named it)

### 4.4 Run Migrations in Production
```bash
# Pull environment variables
vercel env pull .env.production

# Run migrations using production DATABASE_URL
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"') npx prisma migrate deploy
```

---

## Step 5: Import Books to Production

### 5.1 Import from Open Library (Recommended: 100K books)
```bash
# Use the production DATABASE_URL
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"') npm run import:books:fast -- --limit=100000
```

This will take 30-60 minutes. You can:
- Start with fewer books: `--limit=10000` (faster, ~10 minutes)
- Or import all 500K+ books: `--limit=1000000` (1-2 hours)

### 5.2 Import from Goodreads (Optional)
```bash
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"') npm run import:goodreads -- --limit=50000 --genres="fiction,fantasy,science-fiction,mystery"
```

---

## Step 6: Test Your Production App

### 6.1 Get Your URL
Vercel will give you a URL like:
```
https://ebe-username.vercel.app
```

### 6.2 Test the Search API
```bash
curl "https://ebe-username.vercel.app/api/books/search?query=harry+potter&limit=3"
```

You should see JSON results!

### 6.3 Test in Browser
Open in browser:
```
https://ebe-username.vercel.app/api/books/search?query=fiction&limit=10
```

---

## Step 7: Set Up Custom Domain (Optional)

### 7.1 Add Domain in Vercel
1. Go to your project in Vercel
2. Click "Settings" > "Domains"
3. Enter your domain (e.g., `mybookapp.com`)
4. Follow DNS instructions

### 7.2 Update DNS
Add the records Vercel provides to your domain registrar (Namecheap, GoDaddy, etc.)

---

## Troubleshooting

### Error: "Cannot connect to database"
- Check your DATABASE_URL in Vercel dashboard
- Make sure Neon database is running (check Neon dashboard)
- Verify connection string has `?sslmode=require` at the end

### Error: "Prisma Client not generated"
- The `postbuild` script should handle this
- If not, add to Vercel build command: `npx prisma generate && npm run build`

### Error: "Module not found"
- Make sure all dependencies are in `dependencies`, not `devDependencies`
- Prisma and @prisma/client should be in `dependencies` ✓

### Deployment Takes Too Long
- First deployment is always slower (cold start)
- Subsequent deploys are faster (~1-2 minutes)

---

## Automatic Deployments

Now that you're set up:

1. Make changes to your code locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. Vercel automatically deploys! (Watch at https://vercel.com/dashboard)

Every push to `main` branch triggers a new production deployment.

---

## Monitoring

### View Logs
1. Go to your project in Vercel dashboard
2. Click "Deployments" > Latest deployment
3. Click "View Function Logs"

### Check Database Usage
1. Go to Neon dashboard
2. Check storage usage (free tier: 512MB)
3. Monitor active connections

---

## Cost Estimate

With Vercel + Neon free tiers:
- **Hosting**: Free (Vercel Hobby plan)
- **Database**: Free (Neon Free plan - 512MB storage)
- **Bandwidth**: Unlimited on Vercel free tier
- **Function calls**: Unlimited on free tier

**Total: $0/month** for moderate traffic!

### When to Upgrade
- Neon Free tier: ~200K-300K books (with search caching, you'll grow organically)
- If you need more, Neon Pro is $19/month for 10GB
- Vercel Pro ($20/month) needed only for team features or commercial use

---

## Next Steps After Deployment

1. Build a frontend UI for the search API
2. Add user authentication
3. Implement book submission features
4. Create user reading lists
5. Add social features

Your backend is ready to go! 🚀
