using BCrypt.Net;
using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;

namespace PawfectPal.Api.Services
{
    public class AuthService : BaseService
    {
        private readonly UserRepository _userRepository;

        public AuthService(UserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public bool Login(LoginDto dto)
        {
            User? existingUser = _userRepository.GetUserByUserName(dto.UserName);

            if (existingUser == null)
                return false;

            return BCrypt.Net.BCrypt.Verify(dto.Password, existingUser.Password);
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

            if (string.IsNullOrWhiteSpace(dto.Password))
                throw new Exception("Password is required.");

            if (_userRepository.UserNameExists(dto.UserName))
                throw new Exception("Username already exists.");

            User user = new User
            {
                UserName = dto.UserName,
                OwnerFName = dto.OwnerFName,
                OwnerLName = dto.OwnerLName,
                ContactNum = dto.ContactNum,
                Address = dto.Address,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Role = "User"
            };

            _userRepository.InsertUser(user);
        }

        public bool ValidateCredentials(LoginDto dto)
        {
            return !string.IsNullOrWhiteSpace(dto.UserName) &&
                   !string.IsNullOrWhiteSpace(dto.Password);
        }
    }
}