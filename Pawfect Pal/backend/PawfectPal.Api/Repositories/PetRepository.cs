using MySql.Data.MySqlClient;
using PawfectPal.Api.Data;
using PawfectPal.Api.Models;
using System.Data;

namespace PawfectPal.Api.Repositories
{
    public class PetRepository
    {
        private readonly DatabaseHelper _db;

        public PetRepository(DatabaseHelper db)
        {
            _db = db;
        }

        public void InsertPet(Pet pet)
        {
            string query = @"INSERT INTO pets (UserID, Type, Name, Color, Breed, Age, Gender)
                             VALUES (@UserID, @Type, @Name, @Color, @Breed, @Age, @Gender)";

            var parameters = new List<MySqlParameter>
            {
                new MySqlParameter("@UserID", pet.UserId),
                new MySqlParameter("@Type", pet.Type),
                new MySqlParameter("@Name", pet.Name),
                new MySqlParameter("@Color", pet.Color),
                new MySqlParameter("@Breed", pet.Breed),
                new MySqlParameter("@Age", pet.Age),
                new MySqlParameter("@Gender", pet.OwnerName) // temporary, fix when schema finalizes
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public List<Pet> GetAllPets()
        {
            string query = "SELECT * FROM pets";
            DataTable dt = _db.ExecuteQuery(query);

            List<Pet> pets = new List<Pet>();

            foreach (DataRow row in dt.Rows)
            {
                pets.Add(new Pet
                {
                    PetId = Convert.ToInt32(row["PetID"]),
                    UserId = Convert.ToInt32(row["UserID"]),
                    Type = row["Type"].ToString() ?? "",
                    Name = row["Name"].ToString() ?? "",
                    Color = row["Color"].ToString() ?? "",
                    Breed = row["Breed"].ToString() ?? "",
                    Age = Convert.ToInt32(row["Age"])
                });
            }

            return pets;
        }
    }
}