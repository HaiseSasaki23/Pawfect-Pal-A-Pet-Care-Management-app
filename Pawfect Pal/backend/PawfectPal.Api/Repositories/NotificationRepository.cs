using MySql.Data.MySqlClient;
using PawfectPal.Api.Data;
using PawfectPal.Api.Models;

namespace PawfectPal.Api.Repositories
{
    public class NotificationRepository
    {
        private readonly DatabaseHelper _db;

        public NotificationRepository(DatabaseHelper db)
        {
            _db = db;
        }

        public List<Notification> GetByUserId(int userId)
        {
            var list = new List<Notification>();
            using var conn = _db.GetConnection();
            conn.Open();

            var cmd = new MySqlCommand(@"
                SELECT NotificationID, UserID, Title, Message, Type,
                       ReferenceID, IsRead, CreatedAt
                FROM notifications
                WHERE UserID = @uid
                ORDER BY CreatedAt DESC", conn);

            cmd.Parameters.AddWithValue("@uid", userId);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
                list.Add(MapRow(reader));

            return list;
        }

        public int GetUnreadCount(int userId)
        {
            using var conn = _db.GetConnection();
            conn.Open();

            var cmd = new MySqlCommand(@"
                SELECT COUNT(*) FROM notifications
                WHERE UserID = @uid AND IsRead = 0", conn);

            cmd.Parameters.AddWithValue("@uid", userId);
            return Convert.ToInt32(cmd.ExecuteScalar());
        }

        public void Create(Notification n)
        {
            using var conn = _db.GetConnection();
            conn.Open();

            var cmd = new MySqlCommand(@"
                INSERT INTO notifications (UserID, Title, Message, Type, ReferenceID, IsRead, CreatedAt)
                VALUES (@uid, @title, @msg, @type, @refId, 0, NOW())", conn);

            cmd.Parameters.AddWithValue("@uid",   n.UserId);
            cmd.Parameters.AddWithValue("@title", n.Title);
            cmd.Parameters.AddWithValue("@msg",   n.Message);
            cmd.Parameters.AddWithValue("@type",  (object?)n.Type ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@refId", (object?)n.ReferenceId ?? DBNull.Value);

            cmd.ExecuteNonQuery();
        }

        public void MarkAsRead(int notificationId, int userId)
        {
            using var conn = _db.GetConnection();
            conn.Open();

            var cmd = new MySqlCommand(@"
                UPDATE notifications
                SET IsRead = 1
                WHERE NotificationID = @id AND UserID = @uid", conn);

            cmd.Parameters.AddWithValue("@id",  notificationId);
            cmd.Parameters.AddWithValue("@uid", userId);
            cmd.ExecuteNonQuery();
        }

        public void MarkAllAsRead(int userId)
        {
            using var conn = _db.GetConnection();
            conn.Open();

            var cmd = new MySqlCommand(@"
                UPDATE notifications SET IsRead = 1
                WHERE UserID = @uid AND IsRead = 0", conn);

            cmd.Parameters.AddWithValue("@uid", userId);
            cmd.ExecuteNonQuery();
        }

        public bool Exists(int userId, string type, int referenceId)
        {
            using var conn = _db.GetConnection();
            conn.Open();

            var cmd = new MySqlCommand(@"
                SELECT COUNT(*) FROM notifications
                WHERE UserID      = @uid
                  AND Type        = @type
                  AND ReferenceID = @refId
                  AND CreatedAt  >= NOW() - INTERVAL 48 HOUR", conn);

            cmd.Parameters.AddWithValue("@uid",   userId);
            cmd.Parameters.AddWithValue("@type",  type);
            cmd.Parameters.AddWithValue("@refId", referenceId);

            return Convert.ToInt32(cmd.ExecuteScalar()) > 0;
        }

        public List<(int AppointmentId, int UserId, DateTime AppointmentDate)> GetRecentlyConfirmed()
        {
            var result = new List<(int, int, DateTime)>();
            using var conn = _db.GetConnection();
            conn.Open();

            var cmd = new MySqlCommand(@"
                SELECT AppointmentID, UserID, AppointmentDate
                FROM appointment
                WHERE RequestStatus = 'Confirmed'
                  AND AppointmentDate >= NOW()", conn);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
                result.Add((
                    reader.GetInt32("AppointmentID"),
                    reader.GetInt32("UserID"),
                    reader.GetDateTime("AppointmentDate")
                ));

            return result;
        }

        public List<(int AppointmentId, int UserId, DateTime AppointmentDate)> GetTomorrowAppointments()
        {
            var result = new List<(int, int, DateTime)>();
            using var conn = _db.GetConnection();
            conn.Open();

            var cmd = new MySqlCommand(@"
                SELECT AppointmentID, UserID, AppointmentDate
                FROM appointment
                WHERE RequestStatus = 'Confirmed'
                  AND DATE(AppointmentDate) = DATE(NOW() + INTERVAL 1 DAY)", conn);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
                result.Add((
                    reader.GetInt32("AppointmentID"),
                    reader.GetInt32("UserID"),
                    reader.GetDateTime("AppointmentDate")
                ));

            return result;
        }

        public List<(int BillingId, int UserId, decimal RemainingBalance, DateTime DueDate)> GetTomorrowDueBillings()
        {
            var result = new List<(int, int, decimal, DateTime)>();
            using var conn = _db.GetConnection();
            conn.Open();

            var cmd = new MySqlCommand(@"
                SELECT b.BillingID, a.UserID, b.RemainingBalance, b.DueDate
                FROM billing b
                JOIN appointment a ON a.AppointmentID = b.AppointmentID
                WHERE b.BillingStatus != 'Paid'
                  AND b.RemainingBalance > 0
                  AND DATE(b.DueDate) = DATE(NOW() + INTERVAL 1 DAY)", conn);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
                result.Add((
                    reader.GetInt32("BillingID"),
                    reader.GetInt32("UserID"),
                    reader.GetDecimal("RemainingBalance"),
                    reader.GetDateTime("DueDate")
                ));

            return result;
        }

        private static Notification MapRow(MySqlDataReader r) => new()
        {
            NotificationId = r.GetInt32("NotificationID"),
            UserId         = r.GetInt32("UserID"),
            Title          = r.GetString("Title"),
            Message        = r.GetString("Message"),
            Type           = r.IsDBNull(r.GetOrdinal("Type"))        ? null : r.GetString("Type"),
            ReferenceId    = r.IsDBNull(r.GetOrdinal("ReferenceID")) ? null : r.GetInt32("ReferenceID"),
            IsRead         = r.GetBoolean("IsRead"),
            CreatedAt      = r.GetDateTime("CreatedAt")
        };
    }
}
