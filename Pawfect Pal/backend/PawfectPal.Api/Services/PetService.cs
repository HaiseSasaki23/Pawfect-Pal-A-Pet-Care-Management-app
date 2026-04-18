using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;

namespace PawfectPal.Api.Services
{
    public class PetService : BaseService
    {
        private readonly PetRepository _petRepository;

        public PetService(PetRepository petRepository)
        {
            _petRepository = petRepository;
        }

        public void AddPet(Pet pet)
        {
            if (string.IsNullOrWhiteSpace(pet.Name))
                throw new Exception("Pet name is required.");

            if (pet.Age < 0)
                throw new Exception("Age cannot be negative.");

            _petRepository.InsertPet(pet);
        }

        public List<Pet> GetPets()
        {
            return _petRepository.GetAllPets();
        }

        public void UpdatePet(Pet pet)
        {
            // placeholder for later
        }

        public void DeletePet(int id)
        {
            // placeholder for later
        }
    }
}