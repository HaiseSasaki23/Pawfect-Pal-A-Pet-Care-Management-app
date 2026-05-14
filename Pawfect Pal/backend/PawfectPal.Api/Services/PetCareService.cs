using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;

namespace PawfectPal.Api.Services
{
    public class PetCareService : BaseService
    {
        private readonly ServiceRepository _repo;

        public PetCareService(ServiceRepository repo)
        {
            _repo = repo;
        }

        public List<Service> GetAllServices()
        {
            return _repo.GetAllServices();
        }
    }
}