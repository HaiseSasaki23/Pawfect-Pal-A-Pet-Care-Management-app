using MySql.Data.MySqlClient;
using PawfectPal.Api.Data;

namespace PawfectPal.Api.Repositories
{
    public class DashboardRepository
    {
        private readonly DatabaseHelper _db;

        public DashboardRepository(DatabaseHelper db)
        {
            _db = db;
        }

        public int GetTotalPets()
        {
            return Convert.ToInt32(_db.ExecuteScalar("SELECT COUNT(*) FROM pet"));
        }

        public int GetTotalAppointments()
        {
            return Convert.ToInt32(_db.ExecuteScalar("SELECT COUNT(*) FROM appointment"));
        }

        public int GetTotalReminders()
        {
            return Convert.ToInt32(_db.ExecuteScalar("SELECT COUNT(*) FROM reminder"));
        }

        public int GetTotalHealthRecords()
        {
            return Convert.ToInt32(_db.ExecuteScalar("SELECT COUNT(*) FROM healthrecord"));
        }

        public int GetTotalPetsByUserId(int userId)
        {
            return Convert.ToInt32(_db.ExecuteScalar(
                "SELECT COUNT(*) FROM pet WHERE UserID = @UserID",
                new List<MySqlParameter>
                {
                    new("@UserID", userId)
                }));
        }

        public int GetTotalAppointmentsByUserId(int userId)
        {
            return Convert.ToInt32(_db.ExecuteScalar(
                @"SELECT COUNT(*)
                  FROM appointment a
                  INNER JOIN pet p ON a.PetID = p.PetID
                  WHERE p.UserID = @UserID",
                new List<MySqlParameter>
                {
                    new("@UserID", userId)
                }));
        }

        public int GetTotalRemindersByUserId(int userId)
        {
            return Convert.ToInt32(_db.ExecuteScalar(
                @"SELECT COUNT(*)
                  FROM reminder r
                  INNER JOIN pet p ON r.PetID = p.PetID
                  WHERE p.UserID = @UserID",
                new List<MySqlParameter>
                {
                    new("@UserID", userId)
                }));
        }

        public int GetTotalHealthRecordsByUserId(int userId)
        {
            return Convert.ToInt32(_db.ExecuteScalar(
                @"SELECT COUNT(*)
                  FROM healthrecord h
                  INNER JOIN pet p ON h.PetID = p.PetID
                  WHERE p.UserID = @UserID",
                new List<MySqlParameter>
                {
                    new("@UserID", userId)
                }));
        }
    }
}