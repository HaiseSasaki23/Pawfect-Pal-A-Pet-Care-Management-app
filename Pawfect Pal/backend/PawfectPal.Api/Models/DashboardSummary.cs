namespace PawfectPal.Api.Models
{
    public class DashboardSummary
    {
        public int TotalPets { get; set; }
        public int TotalAppointments { get; set; }
        public decimal DueBalance { get; set; }
    }
}