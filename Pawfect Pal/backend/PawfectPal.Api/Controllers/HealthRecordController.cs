using Microsoft.AspNetCore.Mvc;
using PawfectPal.Api.Services;

namespace PawfectPal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthRecordController : ControllerBase
    {
        private readonly HealthRecordService _healthRecordService;

        public HealthRecordController(HealthRecordService healthRecordService)
        {
            _healthRecordService = healthRecordService;
        }

        [HttpGet("pet/{petId}")]
        public IActionResult GetByPetId(int petId)
        {
            try
            {
                return Ok(_healthRecordService.GetByPetId(petId));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("user/{userId}")]
        public IActionResult GetByUserId(int userId)
        {
            try
            {
                return Ok(_healthRecordService.GetByUserId(userId));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }        
    }
}