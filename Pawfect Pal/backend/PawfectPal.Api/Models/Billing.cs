namespace PawfectPal.Api.Models
{
    public class Billing
    {
        public int BillingId { get; set; }
        public int AppointmentId { get; set; }
        public decimal TotalAmount { get; set; }
        public string BillingStatus { get; set; } = "Unpaid";
        public DateTime CreatedAt { get; set; }
    }
}