namespace PawfectPal.Api.Models
{
    public class RegisterDto
    {
        public string UserName { get; set; } = string.Empty;
        public string OwnerFName { get; set; } = string.Empty;
        public string OwnerLName { get; set; } = string.Empty;
        public string ContactNum { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}