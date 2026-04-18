namespace PawfectPal.Api.Models
{
    public class Appointment
    {
        public int AppointmentId { get; set; }
        public int PetId { get; set; }
        public int ServiceId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}