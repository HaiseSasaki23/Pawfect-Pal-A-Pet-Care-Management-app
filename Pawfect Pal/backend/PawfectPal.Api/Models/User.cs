namespace PawfectPal.Api.Models
{
    public class User
    {
        public int UserId { get; set; }
        public string UserName   { get; set; } = string.Empty;
        public string OwnerFName { get; set; } = string.Empty;
        public string OwnerLName { get; set; } = string.Empty;
        public string Email      { get; set; } = string.Empty;
        public string Password   { get; set; } = string.Empty;
        public string Role       { get; set; } = "User";
        public string? ContactNum { get; set; }
        public string? Address    { get; set; }
    }
}