using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;

namespace PawfectPal.Api.Services
{
    public class UserService
    {
        private readonly UserRepository _userRepository;

        public UserService(UserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public List<User> GetAllUsers()
        {
            return _userRepository.GetAllUsers();
        }

        public User? GetUserById(int id)
        {
            return _userRepository.GetUserById(id);
        }

        public void CreateUser(User user)
        {
            if (string.IsNullOrEmpty(user.OwnerFName))
                throw new Exception("First name is required.");

            if (string.IsNullOrEmpty(user.OwnerLName))
                throw new Exception("Last name is required.");

            if (string.IsNullOrEmpty(user.UserName))
                throw new Exception("Username is required.");

            if (string.IsNullOrEmpty(user.Email))
                throw new Exception("Email is required.");

            if (string.IsNullOrEmpty(user.Password))
                user.Password = "default123";

            if (string.IsNullOrEmpty(user.Role))
                user.Role = "User";

            _userRepository.CreateUser(user);
        }

        public void UpdateUser(User user)
        {
            var existing = _userRepository.GetUserById(user.UserId);
            if (existing == null)
                throw new Exception("User not found.");

            _userRepository.UpdateUser(user);
        }

        public void DeleteUser(int id)
        {
            _userRepository.DeleteUser(id);
        }
    }
}