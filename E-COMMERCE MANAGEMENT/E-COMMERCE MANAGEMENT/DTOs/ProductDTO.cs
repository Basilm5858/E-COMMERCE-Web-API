using E_COMMERCE_MANAGEMENT.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace E_COMMERCE_MANAGEMENT.DTOs
{
    public class ProductDTO
    {
        [Key]
        public int Id { get; set; }
        [Required]
        [MinLength(2)]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        [MaxLength(500)]
        public string? Description { get; set; }
        [Range(0.01, 1000000)]
        [Required]
        public decimal Price { get; set; }
        [Range(0, 1000000)]
        [Required]
        public decimal StockQuantity { get; set; }
        public int CategoryId { get; set; }
    }
    public class CreateProductDTO
    {
        [Required]
        [MinLength(2)]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        [MaxLength(500)]
        public string? Description { get; set; }
        [Range(0.01, 1000000)]
        [Required]
        public decimal Price { get; set; }
        [Range(0, 1000000)]
        [Required]
        public decimal StockQuantity { get; set; }
        public int CategoryId { get; set; }
    }
    public class UpdateStockDTO
    {
        [Range(0, 1000000)]
        [Required]
        public decimal StockQuantity { get; set; }
    }
    public class UpdateProductDTO
    {
        [Required]
        [MinLength(2)]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        [MaxLength(500)]
        public string? Description { get; set; }
        [Range(0.01, 1000000)]
        [Required]
        public decimal Price { get; set; }
        [Range(0, 1000000)]
        [Required]
        public decimal StockQuantity { get; set; }
        public int CategoryId { get; set; }
    }
}
