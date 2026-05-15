using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PawfectPal.Api.Services;
using System.Security.Claims;

namespace PawfectPal.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly NotificationService _service;

        public NotificationController(NotificationService service)
        {
            _service = service;
        }

        // GET api/Notification — all notifications for logged-in user
        [HttpGet]
        public IActionResult GetAll()
        {
            try
            {
                var notifications = _service.GetForUser(GetUserId());
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET api/Notification/unread-count — returns { count: N }
        [HttpGet("unread-count")]
        public IActionResult GetUnreadCount()
        {
            try
            {
                return Ok(new { count = _service.GetUnreadCount(GetUserId()) });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PATCH api/Notification/{id}/read — mark one as read
        [HttpPatch("{id}/read")]
        public IActionResult MarkAsRead(int id)
        {
            try
            {
                _service.MarkAsRead(id, GetUserId());
                return Ok(new { message = "Marked as read." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // PATCH api/Notification/read-all — mark all as read
        [HttpPatch("read-all")]
        public IActionResult MarkAllAsRead()
        {
            try
            {
                _service.MarkAllAsRead(GetUserId());
                return Ok(new { message = "All marked as read." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        private int GetUserId()
            => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    }
}
