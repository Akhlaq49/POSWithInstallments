using ReactPosApi.DTOs;

namespace ReactPosApi.Services;

public interface ICustomerService
{
    Task<List<CustomerDto>> GetAllAsync();
    Task<CustomerDto?> GetByIdAsync(int id);
    Task<CustomerDto> CreateAsync(CreateCustomerDto dto);
    Task<CustomerDto?> UpdateAsync(int id, CreateCustomerDto dto);
    Task<CustomerDto?> UploadPictureAsync(int id, IFormFile picture);
    Task<bool> DeleteAsync(int id);
}
