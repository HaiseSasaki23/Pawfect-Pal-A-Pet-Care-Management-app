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
            string query = @"
                INSERT INTO pet (UserID, Name, Species, Color, Breed, Gender, Birthdate)
                VALUES (@UserID, @Name, @Species, @Color, @Breed, @Gender, @Birthdate)";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", pet.UserId),
                new("@Name", pet.Name),
                new("@Species", pet.Species),
                new("@Color", pet.Color),
                new("@Breed", pet.Breed),
                new("@Gender", pet.Gender),
                new("@Birthdate", pet.Birthdate.HasValue ? pet.Birthdate.Value : DBNull.Value)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public List<Pet> GetAllPets()
        {
            string query = "SELECT * FROM pet";
            DataTable dt = _db.ExecuteQuery(query);

            List<Pet> pets = new List<Pet>();

            foreach (DataRow row in dt.Rows)
            {
                pets.Add(MapPet(row));
            }

            return pets;
        }

        public Pet? GetPetById(int id)
        {
            string query = "SELECT * FROM pet WHERE PetID = @PetID LIMIT 1";

            var parameters = new List<MySqlParameter>
            {
                new("@PetID", id)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            if (dt.Rows.Count == 0)
                return null;

            return MapPet(dt.Rows[0]);
        }

        public List<Pet> GetPetsByUserId(int userId)
        {
            string query = "SELECT * FROM pet WHERE UserID = @UserID";

            var parameters = new List<MySqlParameter>
            {
                new("@UserID", userId)
            };

            DataTable dt = _db.ExecuteQuery(query, parameters);

            List<Pet> pets = new List<Pet>();

            foreach (DataRow row in dt.Rows)
            {
                pets.Add(MapPet(row));
            }

            return pets;
        }

        public void UpdatePet(Pet pet)
        {
            string query = @"
                UPDATE pet
                SET UserID = @UserID,
                    Name = @Name,
                    Species = @Species,
                    Color = @Color,
                    Breed = @Breed,
                    Gender = @Gender,
                    Birthdate = @Birthdate
                WHERE PetID = @PetID";

            var parameters = new List<MySqlParameter>
            {
                new("@PetID", pet.PetId),
                new("@UserID", pet.UserId),
                new("@Name", pet.Name),
                new("@Species", pet.Species),
                new("@Color", pet.Color),
                new("@Breed", pet.Breed),
                new("@Gender", pet.Gender),
                new("@Birthdate", pet.Birthdate.HasValue ? pet.Birthdate.Value : DBNull.Value)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        public void DeletePet(int id)
        {
            string query = "DELETE FROM pet WHERE PetID = @PetID";

            var parameters = new List<MySqlParameter>
            {
                new("@PetID", id)
            };

            _db.ExecuteNonQuery(query, parameters);
        }

        private Pet MapPet(DataRow row)
        {
            return new Pet
            {
                PetId = Convert.ToInt32(row["PetID"]),
                UserId = Convert.ToInt32(row["UserID"]),
                Name = row["Name"].ToString() ?? string.Empty,
                Species = row["Species"].ToString() ?? string.Empty,
                Color = row["Color"].ToString() ?? string.Empty,
                Breed = row["Breed"].ToString() ?? string.Empty,
                Gender = row["Gender"].ToString() ?? string.Empty,
                Birthdate = row["Birthdate"] == DBNull.Value ? null : Convert.ToDateTime(row["Birthdate"])
            };
        }
    }
}