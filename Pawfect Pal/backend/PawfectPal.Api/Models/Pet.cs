namespace PawfectPal.Api.Models
{
    public class Pet
    {
        public int PetId { get; set; }
        public int UserId { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Species { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public string Breed { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;

        public DateTime? Birthdate { get; set; }
    }
}