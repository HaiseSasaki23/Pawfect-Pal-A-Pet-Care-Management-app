using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;

namespace PawfectPal.Api.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserRepository _userRepository;

        public UserController(UserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        [HttpGet]
        public IActionResult GetAllUsers()
        {
            try
            {
                var users = _userRepository.GetAllUsers();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetUserById(int id)
        {
            try
            {
                var user =
                    _userRepository.GetUserById(id);

                if (user == null)
                {
                    return NotFound(
                        new
                        {
                            message =
                                "User not found."
                        }
                    );
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
        }

        [HttpPost]
        public IActionResult CreateUser(
            [FromBody] User user)
        {
            try
            {
                _userRepository.CreateUser(user);

                return Ok(
                    new
                    {
                        message =
                            "User created successfully.",

                        userId =
                            user.UserId
                    }
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
        }

        [HttpPut("{id}")]
        public IActionResult UpdateUser(
            int id,
            [FromBody] User user)
        {
            try
            {
                user.UserId = id;

                _userRepository.UpdateUser(user);

                return Ok(
                    new
                    {
                        message =
                            "User updated successfully."
                    }
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteUser(int id)
        {
            try
            {
                _userRepository.DeleteUser(id);

                return Ok(
                    new
                    {
                        message =
                            "User deleted successfully."
                    }
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    new
                    {
                        message = ex.Message
                    }
                );
            }
        }
    }
}