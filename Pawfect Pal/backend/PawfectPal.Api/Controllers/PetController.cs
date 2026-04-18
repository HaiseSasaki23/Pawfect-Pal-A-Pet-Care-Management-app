using Microsoft.AspNetCore.Mvc;
using PawfectPal.Api.Models;
using PawfectPal.Api.Services;

namespace PawfectPal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PetController : ControllerBase
    {
        private readonly PetService _petService;

        public PetController(PetService petService)
        {
            _petService = petService;
        }

        [HttpGet]
        public IActionResult GetPets()
        {
            try
            {
                return Ok(_petService.GetPets());
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetPetById(int id)
        {
            try
            {
                var pet = _petService.GetPetById(id);

                if (pet == null)
                    return NotFound(new { message = "Pet not found." });

                return Ok(pet);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public IActionResult AddPet([FromBody] Pet pet)
        {
            try
            {
                _petService.AddPet(pet);
                return Ok(new { message = "Pet added successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public IActionResult UpdatePet(int id, [FromBody] Pet pet)
        {
            try
            {
                pet.PetId = id;
                _petService.UpdatePet(pet);
                return Ok(new { message = "Pet updated successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeletePet(int id)
        {
            try
            {
                _petService.DeletePet(id);
                return Ok(new { message = "Pet deleted successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}