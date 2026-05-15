using MySql.Data.MySqlClient;
using PawfectPal.Api.Data;
using PawfectPal.Api.Models;
using System.Data;

namespace PawfectPal.Api.Repositories
{
    public class AppointmentRepository
    {
        private readonly DatabaseHelper _db;

        public AppointmentRepository(DatabaseHelper db)
        {
            _db = db;
        }

        public int InsertAppointment(Appointment appointment)
        {
        string query = @"
            INSERT INTO appointment
            (
                UserID,
                PetID,
                AppointmentDate,
                RequestStatus,
                PaymentMode,
                AppStatus,
                Notes,
                AmountPaid,
                PaymentStatus,
                PaymentMethod,
                GcashName,
                GcashRef
            )
            VALUES
            (
                @UserID,
                @PetID,
                @AppointmentDate,
                @RequestStatus,
                @PaymentMode,
                @AppStatus,
                @Notes,
                @AmountPaid,
                @PaymentStatus,
                @PaymentMethod,
                @GcashName,
                @GcashRef
            );

            SELECT LAST_INSERT_ID();
        ";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", appointment.UserId),
                new("@PetID", appointment.PetId),
                new("@AppointmentDate", appointment.AppointmentDate),
                new("@RequestStatus", appointment.RequestStatus),
                new("@PaymentMode", appointment.PaymentMode),
                new("@AppStatus", appointment.AppStatus),
                new("@Notes", appointment.Notes ?? (object)DBNull.Value),
                new("@AmountPaid", appointment.AmountPaid),
                new("@PaymentStatus", appointment.PaymentStatus),
                new("@PaymentMethod", appointment.PaymentMethod),
                new("@GcashName", appointment.GcashName ?? (object)DBNull.Value),
                new("@GcashRef", appointment.GcashRef ?? (object)DBNull.Value)
            };

            object? result = _db.ExecuteScalar(query, parameters);

            if (result == null || result == DBNull.Value)
                throw new Exception("Failed to insert appointment.");

            return Convert.ToInt32(result);
            
        }
        

        public void InsertAppointmentService(int appointmentId, int serviceId)
        {
            string query = @"
                INSERT INTO appointment_services (AppointmentID, ServiceID)
                VALUES (@AppointmentID, @ServiceID)
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@AppointmentID", appointmentId),
                new("@ServiceID", serviceId)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public List<dynamic> GetAllAppointments()
        {
            string query = @"
                SELECT 
                    a.AppointmentID,
                    a.UserID,
                    a.PetID,
                    u.OwnerFName,
                    u.OwnerLName,
                    p.Name AS PetName,
                    a.AppointmentDate,
                    a.RequestStatus,
                    a.AppStatus,
                    a.PaymentMethod,
                    a.AmountPaid,
                    COALESCE(b.TotalAmount, SUM(s.Price), 0) AS TotalAmount,
                    COALESCE(b.BillingStatus, a.PaymentStatus, 'Unpaid') AS PaymentStatus,
                    GROUP_CONCAT(s.ServiceType ORDER BY s.ServiceID SEPARATOR ',') AS Services
                FROM appointment a
                INNER JOIN user u ON a.UserID = u.UserID
                INNER JOIN pet p ON a.PetID = p.PetID
                LEFT JOIN appointment_services aps ON a.AppointmentID = aps.AppointmentID
                LEFT JOIN service s ON aps.ServiceID = s.ServiceID
                LEFT JOIN billing b ON a.AppointmentID = b.AppointmentID
                GROUP BY 
                    a.AppointmentID,
                    a.UserID,
                    a.PetID,
                    u.OwnerFName,
                    u.OwnerLName,
                    p.Name,
                    a.AppointmentDate,
                    a.RequestStatus,
                    a.AppStatus,
                    a.PaymentMethod,
                    a.AmountPaid,
                    b.TotalAmount,
                    b.BillingStatus,
                    a.PaymentStatus
                ORDER BY a.AppointmentDate DESC
            ";

            DataTable dt = _db.ExecuteQuery(query);

            List<dynamic> list = new();

            foreach (DataRow row in dt.Rows)
            {
                list.Add(new
                {
                    appointmentId = Convert.ToInt32(row["AppointmentID"]),
                    userId = Convert.ToInt32(row["UserID"]),
                    petId = Convert.ToInt32(row["PetID"]),
                    ownerFName = row["OwnerFName"].ToString(),
                    ownerLName = row["OwnerLName"].ToString(),
                    petName = row["PetName"].ToString(),
                    appointmentDate = Convert.ToDateTime(row["AppointmentDate"]),
                    requestStatus = row["RequestStatus"].ToString(),
                    appStatus = row["AppStatus"].ToString(),
                    paymentMethod = row["PaymentMethod"].ToString(),
                    amountPaid = row["AmountPaid"] == DBNull.Value ? 0 : Convert.ToDecimal(row["AmountPaid"]),
                    totalAmount = row["TotalAmount"] == DBNull.Value ? 0 : Convert.ToDecimal(row["TotalAmount"]),
                    paymentStatus = row["PaymentStatus"].ToString(),
                    services = row["Services"]?.ToString() ?? ""
                });
            }

            return list;
        }

        public Appointment? GetAppointmentById(int id)
        {
            string query = "SELECT * FROM appointment WHERE AppointmentID = @Id LIMIT 1";

            var parameters = new List<MySqlParameter>
            {
                new("@Id", id)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            if (dt.Rows.Count == 0)
                return null;

            return MapAppointment(dt.Rows[0]);
        }

        public List<dynamic> GetAppointmentsByUserId(int userId)
        {
            string query = @"
                SELECT 
                    a.AppointmentID,
                    a.UserID,
                    a.PetID,
                    p.Name AS PetName,
                    a.AppointmentDate,
                    a.AppStatus,
                    GROUP_CONCAT(s.ServiceType) AS Services,
                    GROUP_CONCAT(s.ServiceID) AS ServiceIds
                FROM appointment a
                JOIN pet p ON a.PetID = p.PetID
                LEFT JOIN appointment_services aps ON a.AppointmentID = aps.AppointmentID
                LEFT JOIN service s ON aps.ServiceID = s.ServiceID
                WHERE a.UserID = @UserID
                GROUP BY a.AppointmentID
                ORDER BY a.AppointmentDate DESC
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", userId)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            List<dynamic> list = new();

            foreach (DataRow row in dt.Rows)
            {
                list.Add(new
                {
                    appointmentId = Convert.ToInt32(row["AppointmentID"]),
                    petId = Convert.ToInt32(row["PetID"]),
                    petName = row["PetName"].ToString(),
                    appointmentDate = Convert.ToDateTime(row["AppointmentDate"]),
                    appStatus = row["AppStatus"].ToString(),
                    services = row["Services"]?.ToString() ?? "",
                    serviceIds = row["ServiceIds"]?.ToString() ?? ""
                });
            }

            return list;
        }

        public void UpdateAppointment(Appointment appointment)
        {
            string query = @"
                UPDATE appointment
                SET PetID = @PetID,
                    AppointmentDate = @Date,
                    Notes = @Notes
                WHERE AppointmentID = @AppointmentID
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@AppointmentID", appointment.AppointmentId),
                new("@PetID", appointment.PetId),
                new("@Date", appointment.AppointmentDate),
                new("@Notes", appointment.Notes ?? (object)DBNull.Value)
            };

            _db.ExecuteNonQuery(query, parameters);

            DeleteAppointmentServices(appointment.AppointmentId);

            if (appointment.ServiceIds != null)
            {
                foreach (var serviceId in appointment.ServiceIds)
                {
                    InsertAppointmentService(
                        appointment.AppointmentId,
                        serviceId
                    );
                }
            }
        }

        public void UpdateRequestStatus(int id, string status)
        {
            string query = @"
                UPDATE appointment
                SET RequestStatus = @Status
                WHERE AppointmentID = @Id
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@Id", id),
                new("@Status", status)
            };

            _db.ExecuteNonQuery(query, parameters);
        }
        public void UpdateAppStatus(int id, string status)
        {
            string query = @"
                UPDATE appointment
                SET AppStatus = @Status
                WHERE AppointmentID = @Id
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@Id", id),
                new("@Status", status)
            };

            _db.ExecuteNonQuery(query, parameters);
        }
        public void DeleteAppointment(int id)
        {
            DeleteAppointmentServices(id);

            string query = "DELETE FROM appointment WHERE AppointmentID = @Id";

            var parameters = new List<MySqlParameter>
            {
                new("@Id", id)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        private void DeleteAppointmentServices(int appointmentId)
        {
            string query = "DELETE FROM appointment_services WHERE AppointmentID = @Id";

            var parameters = new List<MySqlParameter>
            {
                new("@Id", appointmentId)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public decimal CalculateAppointmentTotal(int appointmentId)
        {
            string query = @"
                SELECT SUM(s.Price)
                FROM appointment_services aps
                INNER JOIN service s
                    ON aps.ServiceID = s.ServiceID
                WHERE aps.AppointmentID = @AppointmentID
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@AppointmentID", appointmentId)
            };

            object? result = _db.ExecuteScalar(query, parameters);

            if (result == DBNull.Value || result == null)
                return 0;

            return Convert.ToDecimal(result);
        }

        private Appointment MapAppointment(DataRow row)
        {
            return new Appointment
            {
                AppointmentId =
                    Convert.ToInt32(row["AppointmentID"]),

                UserId =
                    Convert.ToInt32(row["UserID"]),

                PetId =
                    Convert.ToInt32(row["PetID"]),

                AppointmentDate =
                    Convert.ToDateTime(row["AppointmentDate"]),

                RequestStatus =
                    row["RequestStatus"].ToString() ?? "",

                AppStatus =
                    row["AppStatus"].ToString() ?? "",

                PaymentMode =
                    row["PaymentMode"].ToString() ?? "Cash",

                Notes =
                    row["Notes"] == DBNull.Value
                        ? null
                        : row["Notes"].ToString(),

                ServiceIds = new List<int>()
            };
        }
    }
}