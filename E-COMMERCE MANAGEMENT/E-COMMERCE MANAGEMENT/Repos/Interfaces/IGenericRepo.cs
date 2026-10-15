namespace E_COMMERCE_MANAGEMENT.Repos.Interfaces
{
    public interface IGenericRepo<T> where T: class
    {
        Task<ICollection<T>> GetAll();
        Task<T?> GetById(int id);
        Task AddAsync(T entity);
        void Delete(T entity);
    }
}
