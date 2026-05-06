using MySql.Data.MySqlClient;
using PawfectPal.Api.Data;
using PawfectPal.Api.Models;
using System.Data;

namespace PawfectPal.Api.Repositories
{
    public class UserRepository
    {
        private readonly DatabaseHelper _db;

        public UserRepository(DatabaseHelper db)
        {
            _db = db;
        }

        public void InsertUser(User user)
        {
            string query = @"
                INSERT INTO user (UserName, OwnerFName, OwnerLName, ContactNum, Email, Address, Password, Role)
                VALUES (@UserName, @OwnerFName, @OwnerLName, @ContactNum, @Email, @Address, @Password, @Role)";

            var parameters = new List<MySqlParameter>
            {
                new("@UserName", user.UserName),
                new("@OwnerFName", user.OwnerFName),
                new("@OwnerLName", user.OwnerLName),
                new("@ContactNum", user.ContactNum),
                new("@Email", user.Email),
                new("@Address", user.Address),
                new("@Password", user.Password),
                new("@Role", user.Role)
            };

            _db.ExecuteNonQuery(query, parameters);
        }
        public User? GetUserByEmail(string email)
        {
            string query = "SELECT * FROM user WHERE Email = @Email LIMIT 1";

            var parameters = new List<MySqlParameter>
            {
                new("@Email", email)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            if (dt.Rows.Count == 0)
                return null;

            DataRow row = dt.Rows[0];

            return new User
            {
                UserId = Convert.ToInt32(row["UserID"]),
                UserName = row["UserName"].ToString() ?? string.Empty,
                OwnerFName = row["OwnerFName"].ToString() ?? string.Empty,
                OwnerLName = row["OwnerLName"].ToString() ?? string.Empty,
                ContactNum = row["ContactNum"].ToString() ?? string.Empty,
                Email = row["Email"].ToString() ?? string.Empty,
                Address = row["Address"].ToString() ?? string.Empty,
                Password = row["Password"].ToString() ?? string.Empty,
                Role = row["Role"].ToString() ?? "User"
            };
        }

        public void SavePasswordResetToken(int userId, string token, DateTime expiryDate)
        {
            string query = @"
                INSERT INTO password_reset_token (UserID, Token, ExpiryDate, IsUsed)
                VALUES (@UserID, @Token, @ExpiryDate, FALSE)";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", userId),
                new("@Token", token),
                new("@ExpiryDate", expiryDate)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public PasswordResetToken? GetPasswordResetToken(string token)
        {
            string query = @"
                SELECT * FROM password_reset_token
                WHERE Token = @Token
                LIMIT 1";

            var parameters = new List<MySqlParameter>
            {
                new("@Token", token)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            if (dt.Rows.Count == 0)
                return null;

            DataRow row = dt.Rows[0];

            return new PasswordResetToken
            {
                ResetTokenId = Convert.ToInt32(row["ResetTokenID"]),
                UserId = Convert.ToInt32(row["UserID"]),
                Token = row["Token"].ToString() ?? string.Empty,
                ExpiryDate = Convert.ToDateTime(row["ExpiryDate"]),
                IsUsed = Convert.ToBoolean(row["IsUsed"])
            };
        }

        public void UpdatePassword(int userId, string hashedPassword)
        {
            string query = @"
                UPDATE user
                SET Password = @Password
                WHERE UserID = @UserID";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", userId),
                new("@Password", hashedPassword)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public void ExpireOldResetTokens(int userId)
        {
            string query = @"
                UPDATE password_reset_token
                SET IsUsed = TRUE
                WHERE UserID = @UserID AND IsUsed = FALSE";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", userId)
            };

            _db.ExecuteNonQuery(query, parameters);
        }
        public void MarkResetTokenAsUsed(string token)
        {
            string query = @"
                UPDATE password_reset_token
                SET IsUsed = TRUE
                WHERE Token = @Token";

            var parameters = new List<MySqlParameter>
            {
                new("@Token", token)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public User? GetUserByUserName(string userName)
        {
            string query = "SELECT * FROM user WHERE UserName = @UserName LIMIT 1";

            var parameters = new List<MySqlParameter>
            {
                new("@UserName", userName)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            if (dt.Rows.Count == 0)
                return null;

            DataRow row = dt.Rows[0];

            return new User
            {
                UserId = Convert.ToInt32(row["UserID"]),
                UserName = row["UserName"].ToString() ?? string.Empty,
                OwnerFName = row["OwnerFName"].ToString() ?? string.Empty,
                OwnerLName = row["OwnerLName"].ToString() ?? string.Empty,
                ContactNum = row["ContactNum"].ToString() ?? string.Empty,
                Email = row["Email"].ToString() ?? string.Empty,
                Address = row["Address"].ToString() ?? string.Empty,
                Password = row["Password"].ToString() ?? string.Empty,
                Role = row["Role"].ToString() ?? "User"
            };
        }

        public bool UserNameExists(string userName)
        {
            string query = "SELECT COUNT(*) FROM user WHERE UserName = @UserName";

            var parameters = new List<MySqlParameter>
            {
                new("@UserName", userName)
            };

            object? result = _db.ExecuteScalar(query, parameters);
            return Convert.ToInt32(result) > 0;
        }
    }
}