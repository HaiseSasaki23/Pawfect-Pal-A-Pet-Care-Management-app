namespace PawfectPal.Api.Models
{
    public class HealthRecord
    {
        public int RecordId { get; set; }
        public int PetId { get; set; }
        public decimal? Weight { get; set; }
        public string VaccinationStatus { get; set; } = string.Empty;
        public string Allergies { get; set; } = string.Empty;
        public DateTime? DateRecorded { get; set; }
        public string Notes { get; set; } = string.Empty;
    }
}