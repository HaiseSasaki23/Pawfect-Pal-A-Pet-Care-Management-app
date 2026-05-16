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

        public List<User> GetAllUsers()
        {
            string query = @"
                SELECT *
                FROM user
                WHERE Role = 'User'
                ORDER BY OwnerFName ASC, OwnerLName ASC
            ";

            DataTable dt = _db.ExecuteQuery(query);

            return dt.Rows
                .Cast<DataRow>()
                .Select(MapUser)
                .ToList();
        }

        public User? GetUserById(int id)
        {
            string query = @"
                SELECT *
                FROM user
                WHERE UserID = @UserID
                LIMIT 1
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", id)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            if (dt.Rows.Count == 0)
                return null;

            return MapUser(dt.Rows[0]);
        }

        public void CreateUser(User user)
        {
            string query = @"
                INSERT INTO user
                (
                    UserName,
                    OwnerFName,
                    OwnerLName,
                    Email,
                    Password,
                    Role,
                    ContactNum,
                    Address
                )
                VALUES
                (
                    @UserName,
                    @OwnerFName,
                    @OwnerLName,
                    @Email,
                    @Password,
                    @Role,
                    @ContactNum,
                    @Address
                )
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@UserName", user.UserName),
                new("@OwnerFName", user.OwnerFName),
                new("@OwnerLName", user.OwnerLName),
                new("@Email", user.Email),
                new("@Password", user.Password),
                new("@Role", string.IsNullOrWhiteSpace(user.Role) ? "User" : user.Role),
                new("@ContactNum", string.IsNullOrWhiteSpace(user.ContactNum) ? DBNull.Value : user.ContactNum),
                new("@Address", string.IsNullOrWhiteSpace(user.Address) ? DBNull.Value : user.Address)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public void UpdateUser(User user)
        {
            string query = @"
                UPDATE user
                SET
                    UserName = @UserName,
                    OwnerFName = @OwnerFName,
                    OwnerLName = @OwnerLName,
                    Email = @Email,
                    ContactNum = @ContactNum,
                    Address = @Address,
                    Role = @Role
                WHERE UserID = @UserID
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", user.UserId),
                new("@UserName", user.UserName),
                new("@OwnerFName", user.OwnerFName),
                new("@OwnerLName", user.OwnerLName),
                new("@Email", user.Email),
                new("@ContactNum", string.IsNullOrWhiteSpace(user.ContactNum) ? DBNull.Value : user.ContactNum),
                new("@Address", string.IsNullOrWhiteSpace(user.Address) ? DBNull.Value : user.Address),
                new("@Role", string.IsNullOrWhiteSpace(user.Role) ? "User" : user.Role)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public void DeleteUser(int id)
        {
            string query = @"
                DELETE FROM user
                WHERE UserID = @UserID
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", id)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public User? GetUserByUserNameOrEmail(string login)
        {
            string query = @"
                SELECT *
                FROM user
                WHERE UserName = @Login OR Email = @Login
                LIMIT 1
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@Login", login)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            if (dt.Rows.Count == 0)
                return null;

            return MapUser(dt.Rows[0]);
        }

        public User? GetUserByEmail(string email)
        {
            string query = @"
                SELECT *
                FROM user
                WHERE Email = @Email
                LIMIT 1
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@Email", email)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            if (dt.Rows.Count == 0)
                return null;

            return MapUser(dt.Rows[0]);
        }

        public bool UserNameExists(string userName)
        {
            string query = @"
                SELECT COUNT(*)
                FROM user
                WHERE UserName = @UserName
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@UserName", userName)
            };

            object? result = _db.ExecuteScalar(query, parameters);

            return Convert.ToInt32(result) > 0;
        }

        public void InsertUser(User user)
        {
            CreateUser(user);
        }

        public void UpdatePassword(int userId, string hashedPassword)
        {
            string query = @"
                UPDATE user
                SET Password = @Password
                WHERE UserID = @UserID
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@Password", hashedPassword),
                new("@UserID", userId)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public void SavePasswordResetToken(int userId, string hashedToken, DateTime expiryDate)
        {
            string query = @"
                INSERT INTO password_reset_token
                (
                    UserID,
                    Token,
                    ExpiryDate,
                    IsUsed,
                    CreatedAt
                )
                VALUES
                (
                    @UserID,
                    @Token,
                    @ExpiryDate,
                    0,
                    NOW()
                )
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", userId),
                new("@Token", hashedToken),
                new("@ExpiryDate", expiryDate)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public void ExpireOldResetTokens(int userId)
        {
            string query = @"
                UPDATE password_reset_token
                SET IsUsed = 1
                WHERE UserID = @UserID
                AND IsUsed = 0
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", userId)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public PasswordResetToken? GetPasswordResetToken(string hashedToken)
        {
            string query = @"
                SELECT *
                FROM password_reset_token
                WHERE Token = @Token
                LIMIT 1
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@Token", hashedToken)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            if (dt.Rows.Count == 0)
                return null;

            DataRow row = dt.Rows[0];

            return new PasswordResetToken
            {
                ResetTokenId = Convert.ToInt32(row["ResetTokenID"]),
                UserId = Convert.ToInt32(row["UserID"]),
                Token = row["Token"].ToString() ?? "",
                ExpiryDate = Convert.ToDateTime(row["ExpiryDate"]),
                IsUsed = Convert.ToBoolean(row["IsUsed"])
            };
        }

        public void MarkResetTokenAsUsed(string hashedToken)
        {
            string query = @"
                UPDATE password_reset_token
                SET IsUsed = 1
                WHERE Token = @Token
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@Token", hashedToken)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        private User MapUser(DataRow row)
        {
            return new User
            {
                UserId = Convert.ToInt32(row["UserID"]),
                UserName = row["UserName"]?.ToString() ?? "",
                OwnerFName = row["OwnerFName"]?.ToString() ?? "",
                OwnerLName = row["OwnerLName"]?.ToString() ?? "",
                Email = row["Email"]?.ToString() ?? "",
                Password = row["Password"]?.ToString() ?? "",
                Role = row["Role"]?.ToString() ?? "User",
                ContactNum = row["ContactNum"]?.ToString(),
                Address = row["Address"]?.ToString()
            };
        }
    }
}