using AutoMapper;
using E_COMMERCE_MANAGEMENT.DTOs;
using E_COMMERCE_MANAGEMENT.Models;
using E_COMMERCE_MANAGEMENT.Repos.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace E_COMMERCE_MANAGEMENT.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ProductController(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        [HttpGet("GetAllCategories")]
        public async Task<IActionResult> GetAll(int? categoryid, int pageno, int pagesize)
        {
            var products = await _unitOfWork.ProductCustomRepo.GetAllWithPages(categoryid, pageno, pagesize);

            if (products == null)
            {
                return NotFound();
            }
            var res = _mapper.Map<ICollection<ProductDTO>>(products);
            return Ok(res);
        }

        [HttpGet("GetById")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _unitOfWork.ProductCustomRepo.GetById(id);

            if (product == null)
            {
                return NotFound();
            }

            var res = _mapper.Map<ProductDTO>(product);
            return Ok(res);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("Create")]
        public async Task<IActionResult> Create(CreateProductDTO dto)
        {
            var exicategory = await _unitOfWork.CategoryCustomRepo.GetById(dto.CategoryId);
            if(exicategory == null)
            {
                return BadRequest("Category not found");
            }

            var product = _mapper.Map<Product>(dto);

            await _unitOfWork.ProductCustomRepo.AddAsync(product);
            await _unitOfWork.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("Update")]
        public async Task<IActionResult> Update(int id, UpdateProductDTO dto)
        {
            var product = await _unitOfWork.ProductCustomRepo.GetById(id);
            if(product == null)
            {
                return BadRequest("product not found");

            }

            _mapper.Map(product, dto);
            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }

        [Authorize(Roles = "Admin")]
        [HttpPatch("UpdateStock")]
        public async Task<IActionResult> UpdateStock(int id, UpdateStockDTO dto)
        {
            var product = await _unitOfWork.ProductCustomRepo.GetById(id);
            if (product == null)
            {
                return BadRequest("product not found");

            }

            product.StockQuantity = dto.StockQuantity;

            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("Search")]
        public async Task<IActionResult> Search(string name)
        {
            var product = await _unitOfWork.ProductCustomRepo.Search(name);
            if (product == null)
            {
                return NotFound();
            }

            return Ok(product);
        }


        [HttpGet("GetSecondMostExpensive")]
        public async Task<IActionResult> GetSecondMostExpensive(int categoryid)
        {
            var product = await _unitOfWork.ProductCustomRepo.GetSecondMostExpensive(categoryid);

            if (product == null)
            {
                return NotFound();
            }

            return Ok(product);
        }

    }
}
