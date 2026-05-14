using Microsoft.AspNetCore.Mvc;
using PawfectPal.Api.Services;

namespace PawfectPal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BillingController : ControllerBase
    {
        private readonly BillingService _billingService;

        public BillingController(BillingService billingService)
        {
            _billingService = billingService;
        }

        [HttpGet("user/{userId}/unpaid")]
        public IActionResult GetUnpaidBillsByUserId(int userId)
        {
            try
            {
                return Ok(_billingService.GetUnpaidBillsByUserId(userId));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}