namespace PawfectPal.Api.Models
{
    public class HealthRecord
    {
        public string PetName { get; set; } = string.Empty;
        public string Species { get; set; } = string.Empty;
        public string Breed { get; set; } = string.Empty;
        public int RecordId { get; set; }
        public int PetId { get; set; }
        public decimal? Weight { get; set; }
        public DateTime? BirthDate { get; set; }
        public string VaccinationStatus { get; set; } = string.Empty;
        public string Allergies { get; set; } = string.Empty;
        public DateTime? DateRecorded { get; set; }
        public string Notes { get; set; } = string.Empty;
    }
}