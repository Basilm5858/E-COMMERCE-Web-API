using E_COMMERCE_MANAGEMENT.Enums;
using E_COMMERCE_MANAGEMENT.Models;
using Microsoft.EntityFrameworkCore;

namespace E_COMMERCE_MANAGEMENT.Data
{
    public class My_AppContext : DbContext
    {
        public My_AppContext(DbContextOptions<My_AppContext> options) : base(options)
        {
        }
        public DbSet<User> Users { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> orderItems { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Category>()
                .HasMany(x => x.Products)
                .WithOne(x => x.Category)
                .HasForeignKey(x => x.CategoryId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<User>()
                .HasMany(x => x.Orders)
                .WithOne(x => x.Customer)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Order>()
                .HasOne(x => x.Customer)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.NoAction);


            modelBuilder.Entity<Order>()
                .HasMany(x => x.OrderItems)
                .WithOne(x => x.Order)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Product>()
               .HasMany(x => x.OrderItems)
               .WithOne(x => x.Product)
               .HasForeignKey(x => x.ProductId)
               .OnDelete(DeleteBehavior.NoAction);


            modelBuilder.Entity<OrderItem>().HasIndex(x => new { x.ProductId, x.OrderId }).IsUnique();
            modelBuilder.Entity<User>().HasIndex(x => x.Email).IsUnique();
            modelBuilder.Entity<Category>().HasIndex(x => x.Name).IsUnique();

            modelBuilder.Entity<User>().HasData(new User { Id = 1, Email = "b@gmail.com", FullName = "Basil Mohamed", Password = "123456", Role = "Admin" });
            modelBuilder.Entity<User>().HasData(new User { Id = 2, Email = "c@gmail.com", FullName = "Customer Test", Password = "123456", Role = "Customer" });

            modelBuilder.Entity<Category>().HasData(new Category { Id = 1, Name = "Test", Description = "Test API" });

            modelBuilder.Entity<Product>().HasData(new Product { Id = 1, Name = "Test", Description = "Test API", CategoryId = 1, Price = 123, StockQuantity = 40 });

            modelBuilder.Entity<Order>().HasData(new Order { Id = 1, Status = StatusEnum.Pending, OrderDate = new DateTime(2026 - 10 - 01), UserId = 2, TotalAmount = 123 });

            modelBuilder.Entity<OrderItem>().HasData(new OrderItem { Id = 1, OrderId = 1, ProductId = 1, Quantity = 20, UnitPrice = 123 });



            base.OnModelCreating(modelBuilder);
        }

    }
}
