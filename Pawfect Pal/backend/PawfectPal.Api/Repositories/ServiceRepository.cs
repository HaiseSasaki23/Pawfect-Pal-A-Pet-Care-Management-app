using MySql.Data.MySqlClient;
using PawfectPal.Api.Data;
using PawfectPal.Api.Models;
using System.Data;

namespace PawfectPal.Api.Repositories
{
    public class ServiceRepository
    {
        private readonly DatabaseHelper _db;

        public ServiceRepository(DatabaseHelper db)
        {
            _db = db;
        }

        public List<Service> GetAllServices()
        {
            string query = "SELECT * FROM service";

            DataTable dt = _db.ExecuteQuery(query);

            List<Service> services = new();

            foreach (DataRow row in dt.Rows)
            {
                services.Add(new Service
                {
                    ServiceID = Convert.ToInt32(row["ServiceID"]),
                    ServiceType = row["ServiceType"].ToString() ?? string.Empty,
                    Price = Convert.ToDecimal(row["Price"]),
                    Description = row["Description"] == DBNull.Value
                        ? null
                        : row["Description"].ToString()
                });
            }

            return services;
        }
    }
}