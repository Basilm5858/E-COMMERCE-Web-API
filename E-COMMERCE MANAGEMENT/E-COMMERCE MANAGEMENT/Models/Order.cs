using E_COMMERCE_MANAGEMENT.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Net.NetworkInformation;

namespace E_COMMERCE_MANAGEMENT.Models
{
    public class Order
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public DateTime OrderDate { get; set; }
        [Required]
        public StatusEnum Status { get; set; } = StatusEnum.Pending;
        [Required]
        public decimal TotalAmount { get; set; }
        public User Customer { get; set; }
        [ForeignKey(nameof(Customer))]
        public int UserId { get; set; }
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    }
}