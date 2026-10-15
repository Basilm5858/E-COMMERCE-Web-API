using E_COMMERCE_MANAGEMENT.Data;
using E_COMMERCE_MANAGEMENT.Models;
using E_COMMERCE_MANAGEMENT.Repos.Interfaces;

namespace E_COMMERCE_MANAGEMENT.Repos.Implementation
{
    public class CategoryCustomRepo : GenericRepo<Category>, ICategory
    {
        public CategoryCustomRepo(My_AppContext c) : base(c)
        {
        }
    }
}
