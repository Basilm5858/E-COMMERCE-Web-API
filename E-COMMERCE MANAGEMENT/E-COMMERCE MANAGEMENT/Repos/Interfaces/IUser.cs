using E_COMMERCE_MANAGEMENT.Models;

namespace E_COMMERCE_MANAGEMENT.Repos.Interfaces
{
    public interface IUser : IGenericRepo<User>
    {
        Task<User?> GetByEmail(string email);
    }
}
