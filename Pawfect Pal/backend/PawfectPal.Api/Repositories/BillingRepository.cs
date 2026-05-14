using MySql.Data.MySqlClient;
using PawfectPal.Api.Data;
using PawfectPal.Api.Models;
using System.Data;

namespace PawfectPal.Api.Repositories
{
    public class BillingRepository
    {
        private readonly DatabaseHelper _db;

        public BillingRepository(DatabaseHelper db)
        {
            _db = db;
        }

        public List<Billing> GetUnpaidBillsByUserId(int userId)
        {
            string query = @"
                SELECT b.*
                FROM billing b
                INNER JOIN appointment a ON b.AppointmentID = a.AppointmentID
                WHERE a.UserID = @UserID
                AND b.BillingStatus = 'Unpaid'
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", userId)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            List<Billing> bills = new();

            foreach (DataRow row in dt.Rows)
            {
                bills.Add(new Billing
                {
                    BillingId = Convert.ToInt32(row["BillingID"]),
                    AppointmentId = Convert.ToInt32(row["AppointmentID"]),
                    TotalAmount = Convert.ToDecimal(row["TotalAmount"]),
                    BillingStatus = row["BillingStatus"].ToString() ?? "Unpaid",
                    CreatedAt = Convert.ToDateTime(row["CreatedAt"])
                });
            }

            return bills;
        }

        public void UpdateBillingStatus(int billingId, string status)
        {
            string query = @"
                UPDATE billing
                SET BillingStatus = @Status
                WHERE BillingID = @BillingID
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@Status", status),
                new("@BillingID", billingId)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public bool BillingExists(int appointmentId)
        {
            string query = @"
                SELECT COUNT(*)
                FROM billing
                WHERE AppointmentID = @AppointmentID
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@AppointmentID", appointmentId)
            };

            object? result = _db.ExecuteScalar(query, parameters);

            return Convert.ToInt32(result) > 0;
        }

        public void CreateBilling(int appointmentId, decimal totalAmount)
        {
            string query = @"
                INSERT INTO billing
                (AppointmentID, TotalAmount, BillingStatus)
                VALUES
                (@AppointmentID, @TotalAmount, 'Unpaid')
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@AppointmentID", appointmentId),
                new("@TotalAmount", totalAmount)
            };

            _db.ExecuteNonQuery(query, parameters);
        }
    }
}