using E_COMMERCE_MANAGEMENT.Repos.Implementation;

namespace E_COMMERCE_MANAGEMENT.Repos.Interfaces
{
    public interface IUnitOfWork
    {
        public ICategory CategoryCustomRepo { get; }

        public IUser UserCustomRepo { get; }

        public IProduct ProductCustomRepo { get; }

        public IOrder OrderCustomRepo { get; }

        public IOrderItem OrderItemCustomRepo { get; }
        Task SaveChangesAsync();
    }
}
