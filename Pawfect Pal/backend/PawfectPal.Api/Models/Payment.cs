namespace PawfectPal.Api.Models
{
    public class Payment
    {
        public int PaymentId { get; set; }
        public int BillingId { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string? ReferenceNumber { get; set; }
        public decimal PaidAmount { get; set; }
        public DateTime PaidDate { get; set; }
    }
}