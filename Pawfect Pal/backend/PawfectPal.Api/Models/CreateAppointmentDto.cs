namespace PawfectPal.Api.Models
{
    public class CreateAppointmentDto
    {
        public decimal AmountPaid { get; set; }

        public string PaymentStatus { get; set; } = string.Empty;

        public string PaymentMethod { get; set; } = string.Empty;

        public string? GcashName { get; set; }

        public string? GcashRef { get; set; }
    }
}