using Microsoft.AspNetCore.Mvc;
using PawfectPal.Api.Services;

namespace PawfectPal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly DashboardService _dashboardService;

        public DashboardController(DashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("admin-summary")]
        public IActionResult GetAdminSummary()
        {
            try
            {
                var summary = _dashboardService.GetAdminSummary();
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("user-summary/{userId}")]
        public IActionResult GetUserSummary(int userId)
        {
            try
            {
                var summary = _dashboardService.GetUserSummary(userId);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}