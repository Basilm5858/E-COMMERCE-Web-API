using AutoMapper;
using E_COMMERCE_MANAGEMENT.DTOs;
using E_COMMERCE_MANAGEMENT.Models;
using E_COMMERCE_MANAGEMENT.Repos.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Data;

namespace E_COMMERCE_MANAGEMENT.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;

        public OrderController(IMapper mapper, IUnitOfWork unitOfWork)
        {
            _mapper = mapper;
            _unitOfWork = unitOfWork;
        }

        [HttpGet("GetById")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _unitOfWork.OrderCustomRepo.GetByIdWithItemDetails(id);

            if (order == null)
            {
                return NotFound();
            }

            var res = _mapper.Map<OrderDTO>(order);
            return Ok(res);
        }

        [HttpGet("CalculateTotalRevenue")]
        public async Task<IActionResult> CalculateTotalRevenue()
        {
            var order = await _unitOfWork.OrderCustomRepo.CalculateTotalRevenue();

            if (order == null)
            {
                return NotFound();
            }
            return Ok(order);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("Create")]
        public async Task<IActionResult> Create(CreateOrderDTO dto)
        {
            var exiuser = await _unitOfWork.UserCustomRepo.GetById(dto.UserId);
            if (exiuser == null)
            {
                return BadRequest("user not found");
            }

            var order = _mapper.Map<Order>(dto);

            await _unitOfWork.OrderCustomRepo.AddAsync(order);
            await _unitOfWork.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
        }


        [Authorize(Roles = "Admin")]
        [HttpPatch("UpdateStatus")]
        public async Task<IActionResult> UpdateStatus(int id, UpdateStatusDTO dto)
        {
            var order = await _unitOfWork.OrderCustomRepo.GetById(id);
            if (order == null)
            {
                return BadRequest("order not found");

            }

            order.Status = dto.Status;

            await _unitOfWork.SaveChangesAsync();

            return NoContent();
        }

    }
}
