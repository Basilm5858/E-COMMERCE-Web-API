using AutoMapper;
using E_COMMERCE_MANAGEMENT.DTOs;
using E_COMMERCE_MANAGEMENT.Models;

namespace E_COMMERCE_MANAGEMENT.Mapper
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Category, CategoryDTO>();
            CreateMap<CreateCategoryDTO, Category>();

            CreateMap<Product, ProductDTO>();
            CreateMap<CreateProductDTO, Product>();
            CreateMap<UpdateProductDTO, Product>();
            CreateMap<UpdateStockDTO, Product>();

            CreateMap<Order, OrderDTOWithTotalRevenue>();
            CreateMap<Order, OrderDTO>();
            CreateMap<OrderItem, OrderItemDTO>()
                .ForMember(
                    dest => dest.ProductName,
                    opt => opt.MapFrom(src => src.Product.Name)
                );



            CreateMap<CreateOrderDTO, Order>()
                 .ForMember(
                x => x.OrderItems,
                x => x.MapFrom(s => s.OrderItems)
                );
            CreateMap<UpdateStatusDTO, Order>();
        }
    }
}
