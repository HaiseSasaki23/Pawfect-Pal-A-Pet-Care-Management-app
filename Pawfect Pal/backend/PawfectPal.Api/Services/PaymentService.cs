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

            if (
                payment.PaymentMethod == "GCash" &&
                string.IsNullOrWhiteSpace(payment.ReferenceNumber)
            )
            {
                throw new Exception("GCash reference number is required.");
            }

            var billing = _billingRepository.GetBillingById(payment.BillingId);

            if (billing == null)
                throw new Exception("Billing not found.");

            if (billing.BillingStatus == "Paid")
                throw new Exception("Billing already fully paid.");

            decimal newAmountPaid =
                billing.AmountPaid + payment.PaidAmount;

            decimal remainingBalance =
                billing.TotalAmount - newAmountPaid;

            if (remainingBalance < 0)
                throw new Exception("Payment exceeds remaining balance.");

            string newStatus;

            if (remainingBalance == 0)
                newStatus = "Paid";

            else if (newAmountPaid > 0)
                newStatus = "Partial";

            else
                newStatus = "Unpaid";

            _paymentRepository.InsertPayment(payment);

            _billingRepository.UpdateBillingBalances(
                billing.BillingId,
                newAmountPaid,
                remainingBalance,
                newStatus
            );
        }
    }
}