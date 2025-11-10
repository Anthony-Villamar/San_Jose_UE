// document.addEventListener('DOMContentLoaded', async () => {
//   // Obtener datos del usuario logueado
//   let usuario;
//   try {
//     const res = await fetch('/api/login/me', { credentials: 'include' });
//     if (!res.ok) throw new Error('No logueado');
//     usuario = await res.json();
//   } catch {
//     alert('No ha iniciado sesión correctamente.');
//     window.location.href = "/";
//     return;
//   }
// });

// Función para cargar roles dinámicamente en un select
async function cargarRoles(selectElement, selectedRol = '') {
  try {
    const res = await fetch('/api/usuarios/roles');
    if (!res.ok) throw new Error('Error al cargar roles');
    const roles = await res.json(); // debe ser array de strings ["secretaria", "docente", ...]

    // Limpiar opciones previas (excepto el primer option)
    const primerOption = selectElement.querySelector('option');
    selectElement.innerHTML = '';
    if (primerOption) selectElement.appendChild(primerOption);

    roles.forEach(rol => {
      const option = document.createElement('option');
      option.value = rol;
      option.textContent = rol.charAt(0).toUpperCase() + rol.slice(1);
      if (rol === selectedRol) option.selected = true;
      selectElement.appendChild(option);
    });
  } catch (err) {
    console.error(err);
  }
}

// Cargar roles en el select de registro al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  cargarRoles(document.getElementById('rol'));
  // El select de actualización se llenará dinámicamente al buscar usuario (ver más abajo)
});

// Registro de usuarios
document.getElementById('registroForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // datos del formulario...
  const cedula = document.getElementById('cedula').value.trim();
  const nombre = document.getElementById('nombre').value.trim();
  const apellido = document.getElementById('apellido').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const usuario = document.getElementById('usuarioNuevo').value.trim();
  const contrasena = document.getElementById('contrasenaNuevo').value.trim();
  const rol = document.getElementById('rol').value;

  const regexUsuario = /^[a-zA-Z]+$/;
  if (!regexUsuario.test(usuario)) {
    alert('El usuario solo puede contener letras.');
    return;
  }

  const regexContrasena = /^[a-zA-Z0-9]+$/;
  if (!regexContrasena.test(contrasena)) {
    alert('La contraseña solo puede contener letras y números.');
    return;
  }

  if (!cedula || !nombre || !apellido || !correo || !telefono || !usuario || !contrasena || !rol) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos incompletos',
      text: 'Por favor completa todos los campos.'
    });
    return;
  }

  try {
    const res = await fetch('/api/usuarios/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cedula_usuario: cedula,
        nombre,
        apellido,
        correo,
        telefono,
        usuario,
        contrasena,
        rol
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      Swal.fire({
        icon: 'success',
        title: '¡Usuario registrado!',
        text: data.message,
        confirmButtonColor: '#28a745'
      });
      document.getElementById('registroForm').reset();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.message || data.error || 'Error al registrar usuario.'
      });
    }

  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error en la comunicación con el servidor.'
    });
  }
});