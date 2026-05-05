namespace PawfectPal.Api.Models
{
    public class PasswordResetToken
    {
        public int ResetTokenId { get; set; }
        public int UserId { get; set; }
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiryDate { get; set; }
        public bool IsUsed { get; set; }
    }
}