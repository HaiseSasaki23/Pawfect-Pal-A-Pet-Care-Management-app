namespace PawfectPal.Api.Models
{
    public class Service
    {
        public int ServiceID { get; set; }
        public string ServiceType { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? Description { get; set; }
    }
}