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
                    <h2>Password Reset Request</h2>
                    <p>Hello,</p>
                    <p>Click the button below to reset your Pawfect Pal password.</p>
                    <p><a href='{resetLink}'>Reset Password</a></p>
                    <p>This link will expire in 30 minutes.</p>
                    <p>If you did not request this, you can ignore this email.</p>
                ",
                IsBodyHtml = true
            };

            mailMessage.To.Add(toEmail);

            smtpClient.Send(mailMessage);
        }
    }
}