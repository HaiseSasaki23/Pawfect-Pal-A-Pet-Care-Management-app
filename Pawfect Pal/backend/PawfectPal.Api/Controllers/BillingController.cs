using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PawfectPal.Api.Services;
using System.Security.Claims;

namespace PawfectPal.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BillingController : ControllerBase
    {
        private readonly BillingService _billingService;

        public BillingController(BillingService billingService)
        {
            _billingService = billingService;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("unpaid")]
        public IActionResult GetUnpaidBills()
        {
            try
            {
                return Ok(_billingService.GetUnpaidBills());
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }
        
        [HttpGet("my/unpaid")]
        public IActionResult GetMyUnpaidBills()
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                return Ok(
                    _billingService.GetUnpaidBillsByUserId(userId)
                );
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }        
    }
}