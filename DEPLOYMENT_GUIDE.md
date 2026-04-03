# 🚀 Deployment Guide - Task Management Platform

## Easiest Deployment Method: Render.com

This guide will help you deploy your Task Management Platform in **30 minutes** with zero Docker knowledge required.

---

## 📋 Prerequisites

Before you begin, make sure you have:
- [x] GitHub account with your code pushed to a repository
- [x] MongoDB Atlas account (sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
- [x] Render account (sign up at [render.com](https://render.com))
- [x] Gmail account for email notifications (optional but recommended)

---

## 🗂️ Deployment Overview

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Frontend (React)          Backend (Node.js + Express)      │
│  ├─ Render Static Site     ├─ Render Web Service          │
│  └─ Port: 443 (HTTPS)      └─ Port: 5000                   │
│                                                             │
│              Database (MongoDB Atlas - Free Tier)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Setup MongoDB Atlas (5 minutes)

### 1.1 Create Account and Cluster

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with Google or email
3. Create a new project (e.g., "Task Management Platform")
4. Click **"Build a Database"**
5. Select **FREE** tier (M0 Sandbox)
6. Choose:
   - **Cloud Provider**: AWS
   - **Region**: Choose nearest to you (e.g., `us-east-1`, `eu-west-1`)
7. Cluster Name: `TaskManagementCluster`
8. Click **"Create Cluster"** (takes 1-3 minutes)

### 1.2 Create Database User

1. Go to **Database Access** in left sidebar
2. Click **"Add New Database User"**
3. Choose **Password** authentication
4. Username: `taskmanager`
5. Password: Click **"Autogenerate Secure Password"** and **COPY IT** somewhere safe
6. Database User Privileges: **Read and write to any database**
7. Click **"Add User"**

### 1.3 Whitelist IP Addresses

1. Go to **Network Access** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - This is safe because MongoDB still requires username/password
4. Click **"Confirm"**

### 1.4 Get Connection String

1. Go to **Database** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **4.1 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://taskmanager:<password>@taskmanagementcluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password from step 1.2
7. Add database name after `.net/`: `taskmanagement`
   
   **Final connection string:**
   ```
   mongodb+srv://taskmanager:YOUR_PASSWORD_HERE@taskmanagementcluster.xxxxx.mongodb.net/taskmanagement?retryWrites=true&w=majority
   ```

8. **SAVE THIS** - you'll need it for Render environment variables

---

## Step 2: Deploy Backend on Render (10 minutes)

### 2.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with **GitHub** (recommended for easy deployment)
3. Authorize Render to access your repositories

### 2.2 Create Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `Project-and-Task-Management-Platform`
3. If you don't see it, click **"Configure account"** and grant access

### 2.3 Configure Backend Service

Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | `task-management-backend` |
| **Root Directory** | `backend` |
| **Environment** | `Node` |
| **Region** | Choose nearest to you |
| **Branch** | `main` (or your default branch) |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | `Free` (or `Starter` for $7/month - no cold starts) |

### 2.4 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add these:

#### Required Variables

```bash
NODE_ENV=production
PORT=5000
CLIENT_URL=https://task-management-frontend.onrender.com
MONGODB_URI=mongodb+srv://taskmanager:YOUR_PASSWORD@cluster.mongodb.net/taskmanagement?retryWrites=true&w=majority
JWT_EXPIRE=24h
JWT_COOKIE_EXPIRE=1
```

#### Generate JWT Secret

Open terminal and run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and add:
```bash
JWT_SECRET=<paste-the-generated-secret-here>
```

#### Email Configuration (Optional - Recommended)

For email notifications to work:

1. Enable 2-Factor Authentication on your Gmail account
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an App Password for "Mail"
4. Copy the 16-character password

Add these variables:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=noreply@taskmanagement.com
EMAIL_FROM_NAME=Task Management Platform
```

#### OAuth Configuration (Optional)

**Google OAuth:**
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_CALLBACK_URL=https://task-management-backend.onrender.com/api/auth/google/callback
```

**GitHub OAuth:**
```bash
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-secret
GITHUB_CALLBACK_URL=https://task-management-backend.onrender.com/api/auth/github/callback
```

**Microsoft OAuth:**
```bash
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-secret
MICROSOFT_CALLBACK_URL=https://task-management-backend.onrender.com/api/auth/microsoft/callback
```

#### File Upload Settings

```bash
MAX_FILE_SIZE=52428800
MAX_FILES_PER_TASK=10
```

**For AWS S3 (Optional - Recommended for file uploads on free tier):**
```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### 2.5 Deploy Backend

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies (`npm install`)
   - Start your server (`npm start`)
3. Wait 5-10 minutes for first deployment
4. You'll see logs in the dashboard

### 2.6 Get Backend URL

Once deployed, your backend URL will be:
```
https://task-management-backend.onrender.com
```

**Test it**: Visit `https://task-management-backend.onrender.com/health`

You should see:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-04-03T..."
}
```

---

## Step 3: Deploy Frontend on Render (10 minutes)

### 3.1 Create Static Site

1. Go back to Render dashboard
2. Click **"New +"** → **"Static Site"**
3. Select the same repository: `Project-and-Task-Management-Platform`

### 3.2 Configure Frontend Service

| Field | Value |
|-------|-------|
| **Name** | `task-management-frontend` |
| **Root Directory** | `frontend` |
| **Branch** | `main` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `build` |

### 3.3 Add Frontend Environment Variable

Click **"Advanced"** → **"Add Environment Variable"**:

```bash
REACT_APP_API_URL=https://task-management-backend.onrender.com/api
```

**Important**: Replace `task-management-backend` with your actual backend service name from Step 2.

### 3.4 Deploy Frontend

1. Click **"Create Static Site"**
2. Render will:
   - Clone repository
   - Install dependencies
   - Build React app (`npm run build`)
   - Serve static files
3. Wait 3-5 minutes

Your frontend URL will be:
```
https://task-management-frontend.onrender.com
```

---

## Step 4: Update Backend Configuration (2 minutes)

Now that you have your frontend URL, update the backend:

1. Go to Render dashboard → Your backend service
2. Click **"Environment"** in left sidebar
3. Find `CLIENT_URL` variable
4. Update to: `https://task-management-frontend.onrender.com`
5. Click **"Save Changes"**
6. Backend will automatically redeploy (takes 2-3 minutes)

---

## Step 5: OAuth Setup (Optional - 5 minutes)

If you're using OAuth login, update callback URLs:

### Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click your OAuth 2.0 Client ID
5. Add to **Authorized redirect URIs**:
   ```
   https://task-management-backend.onrender.com/api/auth/google/callback
   ```
6. Click **Save**

### GitHub OAuth

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click your OAuth App
3. Update **Authorization callback URL**:
   ```
   https://task-management-backend.onrender.com/api/auth/github/callback
   ```
4. Click **Update application**

### Microsoft OAuth

1. Go to [portal.azure.com](https://portal.azure.com)
2. Go to **Azure Active Directory** → **App registrations**
3. Select your app
4. Go to **Authentication**
5. Add redirect URI:
   ```
   https://task-management-backend.onrender.com/api/auth/microsoft/callback
   ```
6. Click **Save**

---

## Step 6: Verification & Testing (10 minutes)

### 6.1 Access Your Application

Visit: `https://task-management-frontend.onrender.com`

You should see the login page! 🎉

### 6.2 Test Core Features

**1. User Registration**
- Click "Register"
- Fill in: Name, Email, Password
- Click "Create Account"
- Should redirect to dashboard

**2. Login**
- Enter credentials
- Should redirect to dashboard

**3. Create Project**
- Click "New Project"
- Enter project name and details
- Click "Create"
- Project should appear in list

**4. Create Task**
- Click on your project
- Click "New Task"
- Fill in task details
- Assign to yourself
- Click "Create Task"
- Task should appear in Kanban board

**5. Real-time Notifications (if possible, open 2 browser windows)**
- Window 1: Stay on dashboard
- Window 2: Create a task assigned to user from Window 1
- Window 1 should show notification popup

**6. Email Notifications (if SMTP configured)**
- Invite a team member via email
- Check if email arrives (check spam folder too)

**7. File Upload (if configured)**
- Open a task
- Try attaching a file
- Should upload successfully

**8. OAuth Login (if configured)**
- Logout
- Click "Sign in with Google/GitHub"
- Should authenticate and log you in

### 6.3 Common Issues

**Issue**: "Network Error" or "Failed to fetch"
- **Solution**: Check that `REACT_APP_API_URL` in frontend matches your backend URL
- **Solution**: Check that `CLIENT_URL` in backend matches your frontend URL
- **Solution**: Look at browser console for CORS errors

**Issue**: "Cannot connect to MongoDB"
- **Solution**: Check `MONGODB_URI` is correct
- **Solution**: Verify IP whitelist includes `0.0.0.0/0` in MongoDB Atlas
- **Solution**: Check database user credentials

**Issue**: "Invalid token" or authentication errors
- **Solution**: Make sure `JWT_SECRET` is set in backend
- **Solution**: Clear browser cookies and try again

**Issue**: Backend takes 30 seconds to respond (first request)
- **Expected**: Free tier spins down after 15 min of inactivity
- **Solution**: Upgrade to Starter plan ($7/month) for always-on backend

**Issue**: Emails not sending
- **Solution**: Verify Gmail App Password (not regular password)
- **Solution**: Check SMTP settings in backend environment variables
- **Solution**: Look at backend logs for email errors

---

## 🎉 Success!

Your Task Management Platform is now live!

**URLs:**
- Frontend: `https://task-management-frontend.onrender.com`
- Backend: `https://task-management-backend.onrender.com`
- API Health: `https://task-management-backend.onrender.com/health`

---

## 📊 Cost Breakdown

### Free Tier (Current Setup)
- **Render Backend**: $0/month (with cold starts)
- **Render Frontend**: $0/month
- **MongoDB Atlas**: $0/month (512MB storage)
- **Total**: **$0/month** ✅

**Limitations:**
- Backend spins down after 15 min inactivity (30s cold start)
- 750 hours/month backend runtime (plenty for small apps)
- No persistent disk (use AWS S3 for file uploads)

### Paid Tier (Production-Ready)
- **Render Backend Starter**: $7/month (always-on, 512MB RAM)
- **Render Frontend**: $0/month
- **MongoDB Atlas M10**: $9/month (2GB storage) OR stay on free tier
- **Total**: **$7-16/month**

**Benefits:**
- No cold starts
- Persistent disk storage (25GB)
- Better performance
- Priority support

---

## 🔄 Auto-Deployment

Good news! Your app will **auto-deploy** whenever you push to GitHub:

```bash
git add .
git commit -m "Add new feature"
git push origin main
```

Render will automatically:
1. Detect the push
2. Rebuild your app
3. Deploy the new version
4. Takes 3-5 minutes

Watch deployment progress in Render dashboard.

---

## 🔒 Security Checklist

Before going to production:

- [ ] Change `JWT_SECRET` to a strong random string (64+ characters)
- [ ] Enable HTTPS (automatic on Render)
- [ ] Update OAuth callback URLs to production domains
- [ ] Review MongoDB IP whitelist (consider restricting if needed)
- [ ] Enable MongoDB encryption at rest (available on paid tiers)
- [ ] Add custom domain with SSL (optional)
- [ ] Set up monitoring and alerts (Render provides basic monitoring)
- [ ] Review and limit environment variable access
- [ ] Enable 2FA on all accounts (GitHub, Render, MongoDB Atlas)
- [ ] Backup database regularly (MongoDB Atlas automatic backups on M10+)

---

## 🌐 Custom Domain (Optional)

To use your own domain (e.g., `taskmanager.com`):

### Frontend Domain

1. Go to Render → Your static site
2. Click **"Settings"**
3. Scroll to **"Custom Domain"**
4. Click **"Add Custom Domain"**
5. Enter: `taskmanager.com`
6. Add DNS records at your domain registrar:
   ```
   Type: CNAME
   Name: @
   Value: <provided-by-render>
   ```
7. Wait for DNS propagation (5-60 minutes)
8. Render automatically provisions SSL certificate

### Backend Domain

1. Go to Render → Your web service
2. Click **"Settings"**
3. Add custom domain: `api.taskmanager.com`
4. Add DNS CNAME record
5. Update `CLIENT_URL` in backend env vars
6. Update `REACT_APP_API_URL` in frontend env vars
7. Update OAuth callback URLs

---

## 📈 Monitoring & Logs

### View Logs

**Backend Logs:**
1. Render dashboard → Backend service
2. Click **"Logs"** tab
3. See real-time logs (errors, requests, etc.)

**Frontend Logs:**
1. Render dashboard → Frontend static site
2. Click **"Logs"** tab
3. See build logs

### Monitor Performance

**Render Metrics:**
- CPU usage
- Memory usage
- Request count
- Response times

Available in **"Metrics"** tab of your service.

### Set Up Alerts

1. Go to service **"Settings"**
2. Scroll to **"Notifications"**
3. Add webhook or email for deploy failures

---

## 🆘 Troubleshooting

### Backend Won't Start

Check logs for errors:
```
Error: Cannot find module 'express'
```
**Fix**: Make sure `package.json` is in `/backend` directory

```
MongooseServerSelectionError
```
**Fix**: Check `MONGODB_URI` is correct and MongoDB Atlas whitelist includes `0.0.0.0/0`

### Frontend Shows Blank Page

1. Check browser console for errors
2. Verify `REACT_APP_API_URL` is correct
3. Check `/frontend/public/_redirects` file exists
4. Rebuild static site

### CORS Errors

```
Access to fetch at 'https://backend.com/api/...' has been blocked by CORS
```

**Fix**: 
1. Check `CLIENT_URL` in backend matches frontend URL exactly
2. Make sure URLs have `https://` (no trailing slash)
3. Redeploy backend after changing

### OAuth Not Working

1. Verify callback URLs match in OAuth provider console
2. Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
3. Make sure callback URL uses `https://` (not `http://`)
4. Test with provider's OAuth debugger

---

## 🔄 Alternative Deployment Methods

If Render doesn't meet your needs, check these alternatives:

### Option 2: Docker + DigitalOcean
- **Pros**: Full control, production-ready, always-on
- **Cons**: Requires Docker knowledge, $12/month
- **Guide**: See `DEPLOYMENT_DOCKER.md` (create if needed)

### Option 3: Vercel + Railway
- **Pros**: Excellent React performance, good free tier
- **Cons**: Split infrastructure (2 platforms)
- **Guide**: See `DEPLOYMENT_VERCEL_RAILWAY.md` (create if needed)

### Option 4: Railway (All-in-one)
- **Pros**: Simple, includes managed MongoDB, $5 free credit
- **Cons**: Free tier limited
- **Website**: [railway.app](https://railway.app)

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 🎓 Next Steps

- [ ] Add custom domain
- [ ] Set up automated backups
- [ ] Configure monitoring and alerts
- [ ] Add error tracking (e.g., Sentry)
- [ ] Performance monitoring (e.g., New Relic)
- [ ] Set up staging environment
- [ ] Create deployment CI/CD pipeline
- [ ] Add end-to-end tests

---

**Need help?** Check Render community forum or MongoDB Atlas support.

**Congratulations on deploying your Task Management Platform!** 🚀
