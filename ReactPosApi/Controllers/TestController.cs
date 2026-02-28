using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ReactPosApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TestController : ControllerBase
    {
        [HttpGet("config")]
        public IActionResult GetConfig()
        {
            var status = "its working";
            return Ok(status);
        }
    }
}
