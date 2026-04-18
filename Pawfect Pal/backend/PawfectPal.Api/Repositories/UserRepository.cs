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
                INSERT INTO user (UserName, OwnerFName, OwnerLName, ContactNum, Address, Password)
                VALUES (@UserName, @OwnerFName, @OwnerLName, @ContactNum, @Address, @Password)";

            var parameters = new List<MySqlParameter>
            {
                new("@UserName", user.UserName),
                new("@OwnerFName", user.OwnerFName),
                new("@OwnerLName", user.OwnerLName),
                new("@ContactNum", user.ContactNum),
                new("@Address", user.Address),
                new("@Password", user.Password)
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
                Address = row["Address"].ToString() ?? string.Empty,
                Password = row["Password"].ToString() ?? string.Empty
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