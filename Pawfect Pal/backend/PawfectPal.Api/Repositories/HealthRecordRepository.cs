using MySql.Data.MySqlClient;
using PawfectPal.Api.Data;
using PawfectPal.Api.Models;
using System.Data;

namespace PawfectPal.Api.Repositories
{
    public class HealthRecordRepository
    {
        private readonly DatabaseHelper _db;

        public HealthRecordRepository(DatabaseHelper db)
        {
            _db = db;
        }

        public List<HealthRecord> GetByPetId(int petId)
        {
            string query = @"
                SELECT
                    hr.*,
                    p.Name AS PetName,
                    p.Species,
                    p.Breed,
                    p.BirthDate
                FROM healthrecord hr
                INNER JOIN pet p
                    ON hr.PetID = p.PetID
                WHERE hr.PetID = @PetID
                ORDER BY hr.DateRecorded DESC
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@PetID", petId)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            List<HealthRecord> records = new();

            foreach (DataRow row in dt.Rows)
                records.Add(MapHealthRecord(row));

            return records;
        }

        public List<HealthRecord> GetByUserId(int userId)
        {
            string query = @"
                SELECT
                    hr.*,
                    p.Name AS PetName,
                    p.Species,
                    p.Breed,
                    p.BirthDate
                FROM healthrecord hr
                INNER JOIN pet p ON hr.PetID = p.PetID
                INNER JOIN (
                    SELECT
                        PetID,
                        MAX(DateRecorded) AS LatestDate
                    FROM healthrecord
                    GROUP BY PetID
                ) latest
                ON hr.PetID = latest.PetID
                AND hr.DateRecorded = latest.LatestDate
                WHERE p.UserID = @UserID
                ORDER BY hr.DateRecorded DESC
            ";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", userId)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            List<HealthRecord> records = new();

            foreach (DataRow row in dt.Rows)
                records.Add(MapHealthRecord(row));

            return records;
        }

        private HealthRecord MapHealthRecord(DataRow row)
        {
            return new HealthRecord
            {
                RecordId = Convert.ToInt32(row["RecordID"]),
                PetId = Convert.ToInt32(row["PetID"]),
                PetName = row["PetName"].ToString() ?? "",
                Species = row["Species"].ToString() ?? "",
                Breed = row["Breed"].ToString() ?? "",             
                Weight = row["Weight"] == DBNull.Value ? null : Convert.ToDecimal(row["Weight"]),
                BirthDate = row["BirthDate"] == DBNull.Value ? null : Convert.ToDateTime(row["BirthDate"]),
                VaccinationStatus = row["VaccinationStatus"].ToString() ?? string.Empty,
                Allergies = row["Allergies"].ToString() ?? string.Empty,
                DateRecorded = row["DateRecorded"] == DBNull.Value ? null : Convert.ToDateTime(row["DateRecorded"]),
                Notes = row["Notes"].ToString() ?? string.Empty,
            };
        }
    }
}