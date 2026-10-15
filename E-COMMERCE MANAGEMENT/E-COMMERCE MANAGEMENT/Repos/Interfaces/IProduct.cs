using E_COMMERCE_MANAGEMENT.Models;
using E_COMMERCE_MANAGEMENT.DTOs;

namespace E_COMMERCE_MANAGEMENT.Repos.Interfaces
{
    public interface IProduct : IGenericRepo<Product>
    {
        Task<ICollection<ProductDTO>> GetAllWithPages(int? categoryid, int pageno, int pagesize);
        Task<ICollection<ProductDTO>> GetSecondMostExpensive(int categoryid);
        Task<ICollection<ProductDTO>> Search(string name);

    }
}
