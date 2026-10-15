using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace E_COMMERCE_MANAGEMENT.Models
{
    public class OrderItem
    {
        [Key]
        public int Id { get; set; }
        [Range(1, 1000)]
        [Required]
        public int Quantity { get; set; }
        [Range(0.01, 1000000)]
        [Required]
        public decimal UnitPrice { get; set; }
        public Order Order { get; set; }
        [ForeignKey(nameof(Order))]
        public int OrderId { get; set; }
        public Product Product { get; set; }
        [ForeignKey(nameof(Product))]
        public int ProductId { get; set; }
    }
}