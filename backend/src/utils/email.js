const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports (587 uses STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Send email
exports.sendEmail = async (options) => {
  // Check if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD ||
      process.env.SMTP_USER === 'your-email@gmail.com') {
    console.warn('⚠️  Email not configured - SMTP credentials are missing or using defaults');
    throw new Error('Email service not configured. Please set SMTP credentials in .env file');
  }

  const transporter = createTransporter();

  const message = {
    from: `${process.env.EMAIL_FROM_NAME || 'Task Management'} <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Check SMTP_USER and SMTP_PASSWORD in .env');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Could not connect to email server. Check SMTP_HOST and SMTP_PORT in .env');
    }
    throw error;
  }
};

// Test email configuration
exports.verifyEmailConfig = async () => {
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@gmail.com') {
    return { configured: false, message: 'SMTP credentials not configured' };
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { configured: true, message: 'Email service is ready' };
  } catch (error) {
    return { configured: false, message: error.message };
  }
};

// Email templates
exports.emailTemplates = {
  verification: (name, link) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #1976d2;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Welcome to Task Management Platform!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${link}" class="button">Verify Email</a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${link}</p>
        <p>This link will expire in 24 hours.</p>
        <div class="footer">
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  passwordReset: (name, link) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #d32f2f;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <a href="${link}" class="button">Reset Password</a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${link}</p>
        <p>This link will expire in 1 hour.</p>
        <div class="footer">
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  projectInvite: (inviterName, projectName, link) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #2e7d32;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Project Invitation</h2>
        <p>${inviterName} has invited you to join the project "${projectName}".</p>
        <p>Click the button below to accept the invitation:</p>
        <a href="${link}" class="button">Accept Invitation</a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${link}</p>
        <p>This invitation will expire in 7 days.</p>
        <div class="footer">
          <p>If you don't want to join this project, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  taskAssigned: (assigneeName, taskTitle, projectName, link) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #1976d2;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>New Task Assignment</h2>
        <p>Hi ${assigneeName},</p>
        <p>You have been assigned to the task "${taskTitle}" in project "${projectName}".</p>
        <a href="${link}" class="button">View Task</a>
      </div>
    </body>
    </html>
  `,

  deadlineReminder: (userName, taskTitle, dueDate, link) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #f57c00;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Deadline Reminder</h2>
        <p>Hi ${userName},</p>
        <p>This is a reminder that the task "${taskTitle}" is due on ${dueDate}.</p>
        <a href="${link}" class="button">View Task</a>
      </div>
    </body>
    </html>
  `,
};
