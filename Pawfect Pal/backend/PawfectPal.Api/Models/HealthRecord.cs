namespace PawfectPal.Api.Models
{
    public class HealthRecord
    {
        public int RecordId { get; set; }
        public int PetId { get; set; }
        public string Notes { get; set; } = string.Empty;
    }
}