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
            ValidatePet(pet);
            _petRepository.InsertPet(pet);
        }

        public List<Pet> GetPets()
        {
            return _petRepository.GetAllPets();
        }

        public Pet? GetPetById(int id)
        {
            return _petRepository.GetPetById(id);
        }

        public void UpdatePet(Pet pet)
        {
            if (pet.PetId <= 0)
                throw new Exception("Invalid pet ID.");

            ValidatePet(pet);
            _petRepository.UpdatePet(pet);
        }

        public void DeletePet(int id)
        {
            if (id <= 0)
                throw new Exception("Invalid pet ID.");

            _petRepository.DeletePet(id);
        }

        private void ValidatePet(Pet pet)
        {
            if (pet.UserId <= 0)
                throw new Exception("User ID is required.");

            if (string.IsNullOrWhiteSpace(pet.Name))
                throw new Exception("Pet name is required.");

            if (string.IsNullOrWhiteSpace(pet.Color))
                throw new Exception("Pet color is required.");

            if (string.IsNullOrWhiteSpace(pet.Breed))
                throw new Exception("Pet breed is required.");

            if (pet.Age < 0)
                throw new Exception("Age cannot be negative.");

            if (string.IsNullOrWhiteSpace(pet.Gender))
                throw new Exception("Pet gender is required.");
        }
    }
}