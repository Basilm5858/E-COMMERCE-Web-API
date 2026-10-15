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
    public class CategoryController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public CategoryController(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        [HttpGet("GetAllCategories")]
        public async Task<IActionResult> GetAll()
        {
            var category = await _unitOfWork.CategoryCustomRepo.GetAll();

            if(category == null)
            {
                return NotFound();
            }
            var res = _mapper.Map<ICollection<CategoryDTO>>(category);
            return Ok(res);
        }
        [HttpGet("GetById")]
        public async Task<IActionResult> GetById(int id)
        {
            var category = await _unitOfWork.CategoryCustomRepo.GetById(id);

            if (category == null)
            {
                return NotFound();
            }

            var res = _mapper.Map<CategoryDTO>(category);
            return Ok(res);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("Create")]
        public async Task<IActionResult> Create(CreateCategoryDTO dto)
        {
            var category = _mapper.Map<Category>(dto);

            await _unitOfWork.CategoryCustomRepo.AddAsync(category);
            await _unitOfWork.SaveChangesAsync();


            return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
        }


    }
}
