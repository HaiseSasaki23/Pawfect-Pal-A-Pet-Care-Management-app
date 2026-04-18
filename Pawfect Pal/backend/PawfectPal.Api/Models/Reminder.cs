namespace PawfectPal.Api.Models
{
    public class Reminder
    {
        public int ReminderId { get; set; }
        public int PetId { get; set; }
        public int ServiceId { get; set; }
        public DateTime ReminderDate { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}