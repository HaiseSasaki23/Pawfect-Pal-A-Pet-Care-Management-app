using MySql.Data.MySqlClient;
using PawfectPal.Api.Data;
using PawfectPal.Api.Models;
using System.Data;

namespace PawfectPal.Api.Repositories
{
    public class PaymentRepository
    {
        private readonly DatabaseHelper _db;

        public PaymentRepository(DatabaseHelper db)
        {
            _db = db;
        }

        public void InsertPayment(Payment payment)
        {
            string query = @"
                INSERT INTO payment
                (BillingID, PaymentMethod, ReferenceNumber, PaidAmount)
                VALUES
                (@BillingID, @PaymentMethod, @ReferenceNumber, @PaidAmount)
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@BillingID", payment.BillingId),
                new("@PaymentMethod", payment.PaymentMethod),
                new("@ReferenceNumber", payment.ReferenceNumber),
                new("@PaidAmount", payment.PaidAmount)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public List<dynamic> GetAllPayments()
        {
            string query = @"
                SELECT
                    p.PaymentID,
                    p.BillingID,
                    p.PaymentMethod,
                    p.ReferenceNumber,
                    p.PaidAmount,
                    p.PaidDate,

                    b.AppointmentID,

                    pet.Name AS PetName,

                    u.OwnerFName,
                    u.OwnerLName

                FROM payment p

                INNER JOIN billing b
                    ON p.BillingID = b.BillingID

                INNER JOIN appointment a
                    ON b.AppointmentID = a.AppointmentID

                INNER JOIN pet pet
                    ON a.PetID = pet.PetID

                INNER JOIN user u
                    ON a.UserID = u.UserID

                ORDER BY p.PaidDate DESC
            ";

            DataTable dt = _db.ExecuteQuery(query);

            List<dynamic> payments = new();

            foreach (DataRow row in dt.Rows)
            {
                payments.Add(new
                {
                    paymentId =
                        Convert.ToInt32(row["PaymentID"]),

                    billingId =
                        Convert.ToInt32(row["BillingID"]),

                    appointmentId =
                        Convert.ToInt32(row["AppointmentID"]),

                    paymentMethod =
                        row["PaymentMethod"].ToString(),

                    referenceNumber =
                        row["ReferenceNumber"].ToString(),

                    paidAmount =
                        Convert.ToDecimal(row["PaidAmount"]),

                    paidDate =
                        Convert.ToDateTime(row["PaidDate"]),

                    petName =
                        row["PetName"].ToString(),

                    ownerFName =
                        row["OwnerFName"].ToString(),

                    ownerLName =
                        row["OwnerLName"].ToString()
                });
            }

            return payments;
        }
        public List<Payment> GetPaymentsByUserId(int userId)
        {
            string query = @"
                SELECT p.*
                FROM payment p
                INNER JOIN billing b ON p.BillingID = b.BillingID
                INNER JOIN appointment a ON b.AppointmentID = a.AppointmentID
                WHERE a.UserID = @UserID
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", userId)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            List<Payment> payments = new();

            foreach (DataRow row in dt.Rows)
            {
                payments.Add(new Payment
                {
                    PaymentId = Convert.ToInt32(row["PaymentID"]),
                    BillingId = Convert.ToInt32(row["BillingID"]),
                    PaymentMethod = row["PaymentMethod"].ToString() ?? "",
                    ReferenceNumber = row["ReferenceNumber"].ToString(),
                    PaidAmount = Convert.ToDecimal(row["PaidAmount"]),
                    PaidDate = Convert.ToDateTime(row["PaidDate"])
                });
            }

            return payments;
        }
    }
}