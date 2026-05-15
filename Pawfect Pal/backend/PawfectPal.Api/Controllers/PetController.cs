using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PawfectPal.Api.Models;
using PawfectPal.Api.Services;
using System.Security.Claims;

namespace PawfectPal.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PetController : ControllerBase
    {
        private readonly PetService _petService;

        public PetController(PetService petService)
        {
            _petService = petService;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet]
        public IActionResult GetPets()
        {
            try
            {
                return Ok(_petService.GetPets());
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpGet("my")]
        public IActionResult GetMyPets()
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                var pets = _petService.GetPetsByUserId(userId);

                return Ok(pets);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetPetById(int id)
        {
            try
            {
                var pet = _petService.GetPetById(id);

                if (pet == null)
                {
                    return NotFound(new
                    {
                        message = "Pet not found."
                    });
                }

                return Ok(pet);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpGet("user/{userId}")]
        public IActionResult GetPetsByUserId(int userId)
        {
            try
            {
                int loggedInUserId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                string role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

                // Users can only access their own pets
                if (role != "Admin" && loggedInUserId != userId)
                {
                    return Forbid();
                }

                var pets = _petService.GetPetsByUserId(userId);

                return Ok(pets);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [HttpPost]
        public IActionResult AddPet([FromBody] Pet pet)
        {
            try
            {
                int userId = int.Parse(
                    User.FindFirst(ClaimTypes.NameIdentifier)!.Value
                );

                pet.UserId = userId;

                _petService.AddPet(pet);

                return Ok(new
                {
                    message = "Pet added successfully."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public IActionResult UpdatePet(int id, [FromBody] Pet pet)
        {
            try
            {
                pet.PetId = id;

                _petService.UpdatePet(pet);

                return Ok(new
                {
                    message = "Pet updated successfully."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public IActionResult DeletePet(int id)
        {
            try
            {
                _petService.DeletePet(id);

                return Ok(new
                {
                    message = "Pet deleted successfully."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }
    }
}