namespace PawfectPal.Api.Models
{
    public class Service
    {
        public int ServiceId { get; set; }
        public string ServiceType { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }
}