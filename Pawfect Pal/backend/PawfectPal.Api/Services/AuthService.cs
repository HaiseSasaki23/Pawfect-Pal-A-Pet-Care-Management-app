using BCrypt.Net;
using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;
using System.Security.Cryptography;
using System.Text;

namespace PawfectPal.Api.Services
{
    public class AuthService : BaseService
    {
        private readonly UserRepository _userRepository;
        private readonly EmailService _emailService;

        public AuthService(UserRepository userRepository, EmailService emailService)
        {
            _userRepository = userRepository;
            _emailService = emailService;
        }

        public User? LoginAndGetUser(LoginDto dto)
        {
            User? existingUser = _userRepository.GetUserByUserName(dto.UserName);

            if (existingUser == null)
                return null;

            bool isValid = BCrypt.Net.BCrypt.Verify(dto.Password, existingUser.Password);

            return isValid ? existingUser : null;
        }

        public void Register(RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserName))
                throw new Exception("Username is required.");

            if (string.IsNullOrWhiteSpace(dto.OwnerFName))
                throw new Exception("First name is required.");

            if (string.IsNullOrWhiteSpace(dto.OwnerLName))
                throw new Exception("Last name is required.");

            if (string.IsNullOrWhiteSpace(dto.ContactNum))
                throw new Exception("Contact number is required.");

            if (string.IsNullOrWhiteSpace(dto.Address))
                throw new Exception("Address is required.");

            if (string.IsNullOrWhiteSpace(dto.Email))
                throw new Exception("Email is required.");                

            ValidatePassword(dto.Password);

            if (_userRepository.UserNameExists(dto.UserName))
                throw new Exception("Username already exists.");

            User user = new User
            {
                UserName = dto.UserName,
                OwnerFName = dto.OwnerFName,
                OwnerLName = dto.OwnerLName,
                ContactNum = dto.ContactNum,
                Email = dto.Email,
                Address = dto.Address,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "User"
            };

            _userRepository.InsertUser(user);
        }

        public void ForgotPassword(ForgotPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                throw new Exception("Email is required.");

            User? user = _userRepository.GetUserByEmail(dto.Email);

            if (user == null)
                return;

            string rawToken = Guid.NewGuid().ToString("N");
            string hashedToken = HashToken(rawToken);
            DateTime expiryDate = DateTime.Now.AddMinutes(30);

            _userRepository.ExpireOldResetTokens(user.UserId);    
            _userRepository.SavePasswordResetToken(user.UserId, hashedToken, expiryDate);

            string resetLink = $"http://127.0.0.1:3000/Pawfect%20Pal/frontend/reset-password/reset-password.html?token={rawToken}";

            _emailService.SendResetEmail(user.Email, resetLink);
        }

        public void ResetPassword(ResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Token))
                throw new Exception("Reset token is required.");

            if (string.IsNullOrWhiteSpace(dto.NewPassword))
                throw new Exception("New password is required.");

            ValidatePassword(dto.NewPassword);

            string hashedToken = HashToken(dto.Token);
            PasswordResetToken? resetToken = _userRepository.GetPasswordResetToken(hashedToken);

            if (resetToken == null)
                throw new Exception("Invalid reset token.");

            if (resetToken.IsUsed)
                throw new Exception("Reset token has already been used.");

            if (resetToken.ExpiryDate < DateTime.Now)
                throw new Exception("Reset token has expired.");

            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

            _userRepository.UpdatePassword(resetToken.UserId, hashedPassword);
            _userRepository.MarkResetTokenAsUsed(hashedToken);
        }
        private string HashToken(string token)
        {
            using var sha256 = SHA256.Create();
            byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(bytes);
        }
        private void ValidatePassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                throw new Exception("Password is required.");

            if (password.Length < 8)
                throw new Exception("Password must be at least 8 characters long.");

            if (!password.Any(char.IsLetter))
                throw new Exception("Password must contain at least one letter.");

            if (!password.Any(char.IsDigit))
                throw new Exception("Password must contain at least one number.");
        }        
        public bool ValidateCredentials(LoginDto dto)
        {
            return !string.IsNullOrWhiteSpace(dto.UserName) &&
                   !string.IsNullOrWhiteSpace(dto.Password);
        }
    }
}