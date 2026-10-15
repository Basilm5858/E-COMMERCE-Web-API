using E_COMMERCE_MANAGEMENT.Data;
using E_COMMERCE_MANAGEMENT.DTOs;
using E_COMMERCE_MANAGEMENT.Models;
using E_COMMERCE_MANAGEMENT.Repos.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace E_COMMERCE_MANAGEMENT.Repos.Implementation
{
    public class ProductCustomRepo : GenericRepo<Product>, IProduct
    {
        private readonly My_AppContext _context;
        public ProductCustomRepo(My_AppContext c) : base(c)
        {
            _context = c;
        }

        public async Task<ICollection<ProductDTO>> GetAllWithPages(int? categoryid, int pageno, int pagesize)
        {
            return await _context.Products
                .Where(x => x.CategoryId == categoryid)
                .OrderBy(x => x.Id)
                .Skip((pageno - 1) * pagesize)
                .Take(pagesize)
                .Select(x => new ProductDTO
                {
                    StockQuantity = x.StockQuantity,
                    CategoryId = x.CategoryId,
                    Description = x.Description,
                    Id = x.Id,
                    Name = x.Name,
                    Price = x.Price
                }).ToListAsync();
        }

        public async Task<ICollection<ProductDTO>> GetSecondMostExpensive(int categoryid)
        {
            return await _context.Products  
                .Where(x => x.CategoryId != categoryid)
                .OrderByDescending(x => x.Price)
                .Skip(1)
                .Select(x => new ProductDTO
                {
                    StockQuantity = x.StockQuantity,
                    CategoryId = x.CategoryId,
                    Description = x.Description,
                    Id = x.Id,
                    Name = x.Name,
                    Price = x.Price
                }).ToListAsync();
        }

        public async Task<ICollection<ProductDTO>> Search(string name)
        {
            return await _context.Products
                .Where(x => x.Name.Contains(name))
                .Select(x => new ProductDTO
                {
                    StockQuantity = x.StockQuantity,
                    CategoryId = x.CategoryId,
                    Description = x.Description,
                    Id = x.Id,
                    Name = x.Name,
                    Price = x.Price
                }).ToListAsync();
        }
    }
}
