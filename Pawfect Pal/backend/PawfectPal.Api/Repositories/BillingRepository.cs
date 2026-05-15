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

    public List<dynamic> GetUnpaidBills()
    {
        string query = @"
            SELECT
                b.BillingID,
                b.TotalAmount,
                b.AmountPaid,
                b.RemainingBalance,
                b.BillingStatus,
                b.DueDate,

                a.AppointmentID,

                pet.Name AS PetName,

                u.UserName,
                u.OwnerFName,
                u.OwnerLName

            FROM billing b

            INNER JOIN appointment a
                ON b.AppointmentID = a.AppointmentID

            INNER JOIN pet pet
                ON a.PetID = pet.PetID

            INNER JOIN user u
                ON a.UserID = u.UserID

            WHERE b.BillingStatus != 'Paid'

            ORDER BY b.CreatedAt DESC
        ";

        DataTable dt = _db.ExecuteQuery(query);

        List<dynamic> bills = new();

        foreach (DataRow row in dt.Rows)
        {
            bills.Add(new
            {
                billingId = Convert.ToInt32(row["BillingID"]),

                appointmentId = Convert.ToInt32(row["AppointmentID"]),

                totalAmount = Convert.ToDecimal(row["TotalAmount"]),

                amountPaid = Convert.ToDecimal(row["AmountPaid"]),

                remainingBalance = Convert.ToDecimal(row["RemainingBalance"]),

                billingStatus = row["BillingStatus"].ToString(),

                dueDate = row["DueDate"] == DBNull.Value
                    ? (DateTime?)null
                    : Convert.ToDateTime(row["DueDate"]),

                petName = row["PetName"].ToString(),

                userName = row["UserName"].ToString(),

                ownerFName = row["OwnerFName"].ToString(),

                ownerLName = row["OwnerLName"].ToString()
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
                (
                    AppointmentID,
                    TotalAmount,
                    AmountPaid,
                    RemainingBalance,
                    BillingStatus,
                    DueDate
                )
                VALUES
                (
                    @AppointmentID,
                    @TotalAmount,
                    0.00,
                    @TotalAmount,
                    'Unpaid',
                    DATE_ADD(NOW(), INTERVAL 7 DAY)
                )";

            var parameters = new List<MySqlParameter>
            {
                new("@AppointmentID", appointmentId),
                new("@TotalAmount", totalAmount)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public Billing? GetBillingById(int billingId)
        {
            string query = @"
                SELECT *
                FROM billing
                WHERE BillingID = @BillingID
                LIMIT 1
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@BillingID", billingId)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            if (dt.Rows.Count == 0)
                return null;

            DataRow row = dt.Rows[0];

            return new Billing
            {
                BillingId = Convert.ToInt32(row["BillingID"]),
                AppointmentId = Convert.ToInt32(row["AppointmentID"]),
                TotalAmount = Convert.ToDecimal(row["TotalAmount"]),
                AmountPaid = Convert.ToDecimal(row["AmountPaid"]),
                RemainingBalance = Convert.ToDecimal(row["RemainingBalance"]),
                BillingStatus = row["BillingStatus"].ToString() ?? "Unpaid",
                DueDate = row["DueDate"] == DBNull.Value
                    ? null
                    : Convert.ToDateTime(row["DueDate"]),
                CreatedAt = Convert.ToDateTime(row["CreatedAt"])
            };
        }   
        public void UpdateBillingBalances(
            int billingId,
            decimal amountPaid,
            decimal remainingBalance,
            string status)
        {
            string query = @"
                UPDATE billing
                SET
                    AmountPaid = @AmountPaid,
                    RemainingBalance = @RemainingBalance,
                    BillingStatus = @Status
                WHERE BillingID = @BillingID
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@AmountPaid", amountPaid),
                new("@RemainingBalance", remainingBalance),
                new("@Status", status),
                new("@BillingID", billingId)
            };

            _db.ExecuteNonQuery(query, parameters);
        }             
    }
}