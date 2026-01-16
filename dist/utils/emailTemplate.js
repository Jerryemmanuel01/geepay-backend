"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmailTemplate = void 0;
const generateEmailTemplate = ({ title, body, link, linkText, }) => {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const logoUrl = `${backendUrl}/logo.png`;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: #0a3d74;
      padding: 30px;
      text-align: center;
    }
    .logo {
      width: 60px;
      height: 60px;
      background: #ffffff;
      border-radius: 12px;
      padding: 5px;
      display: inline-block;
    }
    .content {
      padding: 40px 30px;
      text-align: left;
    }
    .title {
      color: #0a3d74;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 20px;
      margin-top: 0;
    }
    .text {
      color: #555;
      font-size: 16px;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      background-color: #36c4ec;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 20px;
      text-align: center;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      color: #888;
      font-size: 12px;
      border-top: 1px solid #eaeaea;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Geepay" class="logo" />
    </div>
    <div class="content">
      <h1 class="title">${title}</h1>
      <div class="text">
        ${body.replace(/\n/g, "<br>")}
      </div>
      ${link
        ? `<div style="text-align: center;"><a href="${link}" class="button">${linkText || "Click Here"}</a></div>`
        : ""}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Geepay. All rights reserved.<br>
      This is an automated message, please do not reply.
    </div>
  </div>
</body>
</html>
  `;
};
exports.generateEmailTemplate = generateEmailTemplate;
