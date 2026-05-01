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
                (UserID, PetID, AppointmentDate, RequestStatus, AppStatus, Notes)
                VALUES 
                (@UserID, @PetID, @Date, @RequestStatus, @AppStatus, @Notes);
                SELECT LAST_INSERT_ID();
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", appointment.UserId),
                new("@PetID", appointment.PetId),
                new("@Date", appointment.AppointmentDate),
                new("@RequestStatus", appointment.RequestStatus),
                new("@AppStatus", appointment.AppStatus),
                new("@Notes", appointment.Notes ?? (object)DBNull.Value)
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

        public List<Appointment> GetAllAppointments()
        {
            string query = "SELECT * FROM appointment";
            DataTable dt = _db.ExecuteQuery(query);

            List<Appointment> list = new();

            foreach (DataRow row in dt.Rows)
            {
                list.Add(MapAppointment(row));
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

        public List<Appointment> GetAppointmentsByUserId(int userId)
        {
            string query = "SELECT * FROM appointment WHERE UserID = @UserID";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", userId)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            List<Appointment> list = new();

            foreach (DataRow row in dt.Rows)
            {
                list.Add(MapAppointment(row));
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

            // 🔥 UPDATE SERVICES
            DeleteAppointmentServices(appointment.AppointmentId);

            foreach (var serviceId in appointment.ServiceIds)
            {
                InsertAppointmentService(appointment.AppointmentId, serviceId);
            }
        }

        public void UpdateStatus(int id, string status)
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

        private Appointment MapAppointment(DataRow row)
        {
            return new Appointment
            {
                AppointmentId = Convert.ToInt32(row["AppointmentID"]),
                UserId = Convert.ToInt32(row["UserID"]),
                PetId = Convert.ToInt32(row["PetID"]),
                AppointmentDate = Convert.ToDateTime(row["AppointmentDate"]),
                RequestStatus = row["RequestStatus"].ToString() ?? "",
                AppStatus = row["AppStatus"].ToString() ?? "",
                Notes = row["Notes"] == DBNull.Value ? null : row["Notes"].ToString(),
                ServiceIds = new List<int>() // optional: fetch later
            };
        }
    }
}