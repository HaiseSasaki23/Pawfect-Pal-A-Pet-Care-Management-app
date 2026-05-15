using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PawfectPal.Api.Models;
using PawfectPal.Api.Services;
using System.Security.Claims;

namespace PawfectPal.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AppointmentController : ControllerBase
    {
        private readonly AppointmentService _service;

        public AppointmentController(AppointmentService service)
        {
            _service = service;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public IActionResult GetAll()
        {
            try
            {
                return Ok(_service.GetAll());
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("my")]
        public IActionResult GetMyAppointments()
        {
            try
            {
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                return Ok(_service.GetByUserId(userId));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            try
            {
                var data = _service.GetById(id);
                if (data == null)
                    return NotFound(new { message = "Appointment not found." });
                return Ok(data);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("user/{userId}")]
        public IActionResult GetByUser(int userId)
        {
            try
            {
                return Ok(_service.GetByUserId(userId));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult Create([FromBody] Appointment appointment)
        {
            try
            {
                int userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
                appointment.UserId = userId;
                _service.Create(appointment);
                return Ok(new { message = "Appointment created successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] Appointment appointment)
        {
            try
            {
                appointment.AppointmentId = id;
                _service.Update(appointment);
                return Ok(new { message = "Appointment updated successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("{id}/request-status")]
        public IActionResult UpdateRequestStatus(int id, [FromBody] string status)
        {
            try
            {
                _service.UpdateRequestStatus(id, status);
                return Ok(new { message = "Request status updated successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("{id}/app-status")]
        public IActionResult UpdateAppStatus(int id, [FromBody] string status)
        {
            try
            {
                _service.UpdateAppStatus(id, status);
                return Ok(new { message = "Appointment status updated successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                _service.Delete(id);
                return Ok(new { message = "Appointment deleted successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}