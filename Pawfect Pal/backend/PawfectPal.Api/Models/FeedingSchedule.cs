namespace PawfectPal.Api.Models
{
    public class FeedingSchedule
    {
        public int ScheduleId { get; set; }
        public int PetId { get; set; }
        public DateTime FeedingTime { get; set; }
    }
}