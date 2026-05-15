namespace PawfectPal.Api.Models
{
    public class Appointment
    {
        public int AppointmentId { get; set; }
        public int UserId { get; set; }
        public int PetId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public string RequestStatus { get; set; } = "Pending";
        public string AppStatus { get; set; } = "Pending";
        public string PaymentMode { get; set; } = "Cash";
        public decimal AmountPaid { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;

        public string PaymentMethod { get; set; } = string.Empty;

        public string? GcashName { get; set; }

        public string? GcashRef { get; set; }
        public string? Notes { get; set; }
        public List<int> ServiceIds { get; set; } = new List<int>();
        
    }
}