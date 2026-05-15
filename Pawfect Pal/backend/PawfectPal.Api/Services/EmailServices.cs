using System.Net;
using System.Net.Mail;

namespace PawfectPal.Api.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public void SendResetEmail(string toEmail, string resetLink)
        {
            var emailSettings = _config.GetSection("EmailSettings");

            var smtpClient = new SmtpClient(emailSettings["SmtpServer"])
            {
                Port = int.Parse(emailSettings["Port"]!),
                Credentials = new NetworkCredential(
                    emailSettings["SenderEmail"],
                    emailSettings["Password"]
                ),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(
                    emailSettings["SenderEmail"]!,
                    emailSettings["SenderName"]
                ),
                Subject = "Reset your Pawfect Pal password",
                Body = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {{
                            margin: 0;
                            padding: 0;
                            background-color: #f5f1fb;
                            font-family: Arial, sans-serif;
                        }}

                        .container {{
                            max-width: 600px;
                            margin: 40px auto;
                            background: #ffffff;
                            border-radius: 20px;
                            overflow: hidden;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                        }}

                        .header {{
                            background: linear-gradient(135deg, #9b6dff, #7b4ae2);
                            padding: 40px 30px;
                            text-align: center;
                            color: white;
                        }}

                        .header h1 {{
                            margin: 0;
                            font-size: 32px;
                        }}

                        .content {{
                            padding: 40px 35px;
                            color: #444;
                        }}

                        .content h2 {{
                            color: #7b4ae2;
                            margin-top: 0;
                            font-size: 26px;
                        }}

                        .content p {{
                            font-size: 16px;
                            line-height: 1.7;
                            margin-bottom: 18px;
                        }}

                        .button-container {{
                            text-align: center;
                            margin: 35px 0;
                        }}

                        .reset-btn {{
                            display: inline-block;
                            background: #8f63f4;
                            color: white !important;
                            text-decoration: none;
                            padding: 16px 32px;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: bold;
                        }}

                        .warning {{
                            background: #f8f5ff;
                            border-left: 4px solid #9b6dff;
                            padding: 15px;
                            border-radius: 10px;
                            margin-top: 25px;
                            font-size: 14px;
                            color: #666;
                        }}

                        .footer {{
                            padding: 20px;
                            text-align: center;
                            font-size: 13px;
                            color: #999;
                            border-top: 1px solid #eee;
                        }}

                        .paw {{
                            font-size: 40px;
                            margin-bottom: 10px;
                        }}
                    </style>
                </head>

                <body>

                    <div class='container'>

                        <div class='header'>
                            <div class='paw'>🐾</div>
                            <h1>Pawfect Pal</h1>
                        </div>

                        <div class='content'>

                            <h2>Password Reset Request</h2>

                            <p>Hello,</p>

                            <p>
                                We received a request to reset your Pawfect Pal password.
                                Click the button below to create a new password.
                            </p>

                            <div class='button-container'>
                                <a href='{resetLink}' class='reset-btn'>
                                    Reset Password
                                </a>
                            </div>

                            <div class='warning'>
                                This password reset link will expire in <strong>30 minutes</strong>.
                                If you did not request a password reset, you can safely ignore this email.
                            </div>

                        </div>

                        <div class='footer'>
                            © 2026 Pawfect Pal • Pet Care Management System
                        </div>

                    </div>

                </body>
                </html>
                ",
                IsBodyHtml = true
            };

            mailMessage.To.Add(toEmail);

            smtpClient.Send(mailMessage);
        }
    }
}