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
        public string? Notes { get; set; }
        public List<int> ServiceIds { get; set; } = new List<int>();
        
    }
}