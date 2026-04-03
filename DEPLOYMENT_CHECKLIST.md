# ✅ Deployment Checklist

Quick reference for deploying your Task Management Platform to Render.com

---

## Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] All tests passing (`npm run test:ci` in backend)
- [ ] No uncommitted changes

---

## MongoDB Atlas Setup (5 min)

- [ ] Account created at mongodb.com/cloud/atlas
- [ ] M0 Free cluster created
- [ ] Database user created (username + password)
- [ ] IP whitelist set to `0.0.0.0/0`
- [ ] Connection string copied and password replaced
- [ ] Connection string saved: `mongodb+srv://user:pass@cluster.mongodb.net/taskmanagement`

---

## Backend Deployment (10 min)

- [ ] Render account created (render.com)
- [ ] GitHub connected to Render
- [ ] New Web Service created
- [ ] Root directory: `backend`
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`

### Environment Variables Set

**Required:**
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`
- [ ] `CLIENT_URL=https://[frontend-url].onrender.com`
- [ ] `MONGODB_URI=mongodb+srv://...`
- [ ] `JWT_SECRET=<64-char-random-string>`
- [ ] `JWT_EXPIRE=24h`
- [ ] `JWT_COOKIE_EXPIRE=1`

**Optional - Email:**
- [ ] `SMTP_HOST=smtp.gmail.com`
- [ ] `SMTP_PORT=587`
- [ ] `SMTP_USER=your-email@gmail.com`
- [ ] `SMTP_PASSWORD=<gmail-app-password>`
- [ ] `EMAIL_FROM=noreply@taskmanagement.com`

**Optional - OAuth:**
- [ ] Google OAuth credentials
- [ ] GitHub OAuth credentials  
- [ ] Microsoft OAuth credentials

**Optional - File Uploads:**
- [ ] AWS S3 credentials (recommended for free tier)

### Deployment Status
- [ ] Backend deployed successfully
- [ ] Backend URL noted: `https://[backend-name].onrender.com`
- [ ] Health check works: `https://[backend-name].onrender.com/health`

---

## Frontend Deployment (10 min)

- [ ] New Static Site created on Render
- [ ] Root directory: `frontend`
- [ ] Build command: `npm install && npm run build`
- [ ] Publish directory: `build`

### Environment Variable Set
- [ ] `REACT_APP_API_URL=https://[backend-name].onrender.com/api`

### Deployment Status
- [ ] Frontend deployed successfully
- [ ] Frontend URL noted: `https://[frontend-name].onrender.com`
- [ ] Login page loads without errors

---

## Configuration Updates (2 min)

- [ ] Backend `CLIENT_URL` updated to frontend URL
- [ ] Backend redeployed with new CLIENT_URL

---

## OAuth Configuration (if using)

- [ ] Google OAuth callback URL updated to production backend
- [ ] GitHub OAuth callback URL updated to production backend
- [ ] Microsoft OAuth callback URL updated to production backend

---

## Testing (10 min)

- [ ] User registration works
- [ ] User login works
- [ ] Dashboard loads
- [ ] Can create project
- [ ] Can create task
- [ ] Can assign task to user
- [ ] Real-time notifications work (test with 2 browser windows)
- [ ] Email invitations work (if SMTP configured)
- [ ] File uploads work (if configured)
- [ ] OAuth login works (if configured)
- [ ] No CORS errors in browser console
- [ ] No errors in backend logs

---

## Post-Deployment

- [ ] URLs documented:
  - Frontend: `_____________________________`
  - Backend: `_____________________________`
  - Health Check: `_____________________________/health`

- [ ] Credentials saved securely:
  - MongoDB connection string
  - JWT secret
  - Gmail app password
  - AWS S3 credentials (if used)

- [ ] Auto-deployment enabled (automatic with Render + GitHub)

---

## Optional Enhancements

- [ ] Custom domain configured
- [ ] SSL certificate verified (automatic with Render)
- [ ] Monitoring set up
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Database backups configured
- [ ] Staging environment created

---

## Troubleshooting

If something doesn't work:

1. **Check Backend Logs**: Render dashboard → Backend service → Logs tab
2. **Check Frontend Console**: Browser DevTools → Console tab
3. **Verify Environment Variables**: All required vars are set correctly
4. **Test Health Endpoint**: `https://[backend].onrender.com/health` should return JSON
5. **Check CORS**: Make sure `CLIENT_URL` matches frontend URL exactly
6. **MongoDB Connection**: Verify connection string and IP whitelist

---

## Important Notes

⚠️ **Free Tier Limitations:**
- Backend spins down after 15 min of inactivity
- 30-second cold start on first request
- Use AWS S3 for file uploads (no persistent disk on free tier)

💡 **Upgrade to Paid ($7/month) for:**
- Always-on backend (no cold starts)
- Persistent disk storage (25GB)
- Better performance

---

## Quick Deploy Commands

After making code changes:

```bash
# Commit and push
git add .
git commit -m "Your changes"
git push origin main

# Render auto-deploys in 3-5 minutes
```

That's it! ✅
