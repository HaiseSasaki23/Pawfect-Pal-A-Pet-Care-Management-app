using Microsoft.AspNetCore.Mvc;
using PawfectPal.Api.Models;
using PawfectPal.Api.Services;

namespace PawfectPal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpGet("test-db")]
        public IActionResult TestDB()
        {
            return Ok("Database connected!");
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterDto dto)
        {
            try
            {
                _authService.Register(dto);
                return Ok(new { message = "Registration successful." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            try
            {
                if (!_authService.ValidateCredentials(dto))
                    return BadRequest(new { message = "Username and password are required." });

                var user = _authService.LoginAndGetUser(dto);

                if (user == null)
                    return Unauthorized(new { message = "Invalid username or password." });

                return Ok(new 
                { 
                    message = "Login successful.",
                    userId = user.UserId,
                    userName = user.UserName,
                    role = user.Role
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}