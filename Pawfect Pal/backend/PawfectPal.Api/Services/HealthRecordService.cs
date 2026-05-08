using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;

namespace PawfectPal.Api.Services
{
    public class HealthRecordService
    {
        private readonly HealthRecordRepository _healthRecordRepository;

        public HealthRecordService(HealthRecordRepository healthRecordRepository)
        {
            _healthRecordRepository = healthRecordRepository;
        }

        public List<HealthRecord> GetByPetId(int petId)
        {
            if (petId <= 0)
                throw new Exception("Invalid pet ID.");

            return _healthRecordRepository.GetByPetId(petId);
        }
        public List<HealthRecord> GetByUserId(int userId)
        {
            if (userId <= 0)
                throw new Exception("Invalid user ID.");

            return _healthRecordRepository.GetByUserId(userId);
        }        
    }
}