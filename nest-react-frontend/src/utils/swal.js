import Swal from 'sweetalert2';

// Success alert
export const showSuccess = (title, text = '', timer = 2000) => {
  return Swal.fire({
    icon: 'success',
    title: title,
    text: text,
    timer: timer,
    showConfirmButton: timer === 0,
    confirmButtonColor: '#3BB77E',
    timerProgressBar: true
  });
};

// Error alert
export const showError = (title, text = '') => {
  return Swal.fire({
    icon: 'error',
    title: title,
    text: text,
    confirmButtonColor: '#dc3545'
  });
};

// Warning alert
export const showWarning = (title, text = '') => {
  return Swal.fire({
    icon: 'warning',
    title: title,
    text: text,
    confirmButtonColor: '#ffc107'
  });
};

// Info alert
export const showInfo = (title, text = '') => {
  return Swal.fire({
    icon: 'info',
    title: title,
    text: text,
    confirmButtonColor: '#17a2b8'
  });
};

// Confirmation dialog
export const showConfirm = (title, text = '', confirmText = 'Yes', cancelText = 'No') => {
  return Swal.fire({
    title: title,
    text: text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3BB77E',
    cancelButtonColor: '#dc3545',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText
  });
};

// Loading alert
export const showLoading = (title = 'Please wait...') => {
  Swal.fire({
    title: title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// Close any open alert
export const closeAlert = () => {
  Swal.close();
};

