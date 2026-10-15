using E_COMMERCE_MANAGEMENT.Data;
using E_COMMERCE_MANAGEMENT.Repos.Interfaces;

namespace E_COMMERCE_MANAGEMENT.Repos.Implementation
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly My_AppContext _context;

        public UnitOfWork(My_AppContext context, ICategory categoryCustomRepo, IUser userCustomRepo, IProduct productCustomRepo, IOrder orderCustomRepo, IOrderItem orderItemCustomRepo)
        {
            _context = context;
            CategoryCustomRepo = categoryCustomRepo;
            UserCustomRepo = userCustomRepo;
            ProductCustomRepo = productCustomRepo;
            OrderCustomRepo = orderCustomRepo;
            OrderItemCustomRepo = orderItemCustomRepo;
        }

        public ICategory CategoryCustomRepo { get; }

        public IUser UserCustomRepo { get; }

        public IProduct ProductCustomRepo { get; }

        public IOrder OrderCustomRepo { get; }

        public IOrderItem OrderItemCustomRepo { get; }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
