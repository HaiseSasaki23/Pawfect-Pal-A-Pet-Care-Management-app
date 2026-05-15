namespace PawfectPal.Api.Models
{
    public class Billing
    {
        public int BillingId { get; set; }
        public int AppointmentId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal AmountPaid { get; set; }
        public decimal RemainingBalance { get; set; }
        public string BillingStatus { get; set; } = "Unpaid";
        public DateTime? DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}