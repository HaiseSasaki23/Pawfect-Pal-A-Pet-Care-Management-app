using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;

namespace PawfectPal.Api.Services
{
    public class PaymentService
    {
        private readonly PaymentRepository _paymentRepository;
        private readonly BillingRepository _billingRepository;

        public PaymentService(
            PaymentRepository paymentRepository,
            BillingRepository billingRepository)
        {
            _paymentRepository = paymentRepository;
            _billingRepository = billingRepository;
        }

        public List<Payment> GetPaymentsByUserId(int userId)
        {
            if (userId <= 0)
                throw new Exception("Invalid user ID.");

            return _paymentRepository.GetPaymentsByUserId(userId);
        }

        public void CreatePayment(Payment payment)
        {
            if (payment.BillingId <= 0)
                throw new Exception("Billing ID is required.");

            if (string.IsNullOrWhiteSpace(payment.PaymentMethod))
                throw new Exception("Payment method is required.");

            if (payment.PaidAmount <= 0)
                throw new Exception("Paid amount must be greater than zero.");

            if (payment.PaymentMethod == "GCash" && string.IsNullOrWhiteSpace(payment.ReferenceNumber))
                throw new Exception("GCash reference number is required.");

            _paymentRepository.InsertPayment(payment);
            _billingRepository.UpdateBillingStatus(payment.BillingId, "Paid");
        }
    }
}