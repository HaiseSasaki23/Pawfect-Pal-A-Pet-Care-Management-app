using Microsoft.AspNetCore.Mvc;
using PawfectPal.Api.Models;
using PawfectPal.Api.Services;

namespace PawfectPal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _paymentService;

        public PaymentController(PaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpGet("user/{userId}/history")]
        public IActionResult GetPaymentHistory(int userId)
        {
            try
            {
                return Ok(_paymentService.GetPaymentsByUserId(userId));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult CreatePayment([FromBody] Payment payment)
        {
            try
            {
                _paymentService.CreatePayment(payment);
                return Ok(new { message = "Payment recorded successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}