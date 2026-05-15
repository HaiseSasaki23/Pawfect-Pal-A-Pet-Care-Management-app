using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;

namespace PawfectPal.Api.Services
{
    public class BillingService
    {
        private readonly BillingRepository _billingRepository;

        public BillingService(BillingRepository billingRepository)
        {
            _billingRepository = billingRepository;
        }

        public List<Billing> GetUnpaidBillsByUserId(int userId)
        {
            if (userId <= 0)
                throw new Exception("Invalid user ID.");

            return _billingRepository.GetUnpaidBillsByUserId(userId);
        }
        public List<dynamic> GetUnpaidBills()
        {
            return _billingRepository.GetUnpaidBills();
        }        
    }
}