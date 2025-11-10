document.addEventListener('DOMContentLoaded', async () => {
  // Obtener datos del usuario logueado
  let usuario;
  try {
    const res = await fetch('/api/login/me', { credentials: 'include' });
    if (!res.ok) throw new Error('No logueado');
    usuario = await res.json();
  } catch {
    alert('No ha iniciado sesión correctamente.');
    window.location.href = "/";
    return;
  }
});

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

// Actualización parcial de usuarios
document.getElementById('actualizarForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const cedula = document.getElementById('cedulaActualizar').value.trim();
  if (!cedula) {
    Swal.fire({
      icon: 'warning',
      title: 'Cédula faltante',
      text: 'Ingresa la cédula del usuario que deseas actualizar.'
    });
    return;
  }

  const datosActualizar = {};
  const nombre = document.getElementById('nombreActualizar').value.trim();
  const apellido = document.getElementById('apellidoActualizar').value.trim();
  const correo = document.getElementById('correoActualizar').value.trim();
  const telefono = document.getElementById('telefonoActualizar').value.trim();
  const rol = document.getElementById('rolActualizar').value;
  const usuario = document.getElementById('usuarioActualizar').value.trim();
  const contrasena = document.getElementById('contrasenaActualizar').value.trim();



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

  if (nombre) datosActualizar.nombre = nombre;
  if (apellido) datosActualizar.apellido = apellido;
  if (correo) datosActualizar.correo = correo;
  if (telefono) datosActualizar.telefono = telefono;
  if (rol) datosActualizar.rol = rol; // nombre del rol, backend lo convierte a id_rol
  if (usuario) datosActualizar.usuario = usuario;
  if (contrasena) datosActualizar.contrasena = contrasena;

  if (Object.keys(datosActualizar).length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Sin cambios',
      text: 'No se ingresó ningún campo para actualizar.'
    });
    return;
  }

  // Confirmación con botones Bootstrap
  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: "btn btn-success",
      cancelButton: "btn btn-danger"
    },
    buttonsStyling: true
  });

  const result = await swalWithBootstrapButtons.fire({
    title: "¿Actualizar usuario?",
    text: "Esta acción modificará los datos del usuario.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, actualizar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#dc3545",
    reverseButtons: true
  });

  if (result.isConfirmed) {
    try {
      const res = await fetch(`/api/usuarios/${cedula}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(datosActualizar)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        swalWithBootstrapButtons.fire({
          title: "¡Actualizado!",
          text: data.message,
          icon: "success"
        });
        document.getElementById('actualizarForm').reset();
        limpiarCamposActualizar();
      } else {
        swalWithBootstrapButtons.fire({
          title: "Error",
          text: data.message || 'Error al actualizar usuario.',
          icon: "error"
        });
      }
    } catch (error) {
      console.error(error);
      swalWithBootstrapButtons.fire({
        title: "Error",
        text: "Error en la comunicación con el servidor.",
        icon: "error"
      });
    }
  } else if (result.dismiss === Swal.DismissReason.cancel) {
    // Al cancelar
    swalWithBootstrapButtons.fire({
      title: "Cancelado",
      text: "No se realizaron cambios en el usuario.",
      icon: "info"
    });
  }
});

// Autocompletar campos al escribir la cédula y cargar roles dinámicamente
document.getElementById('cedulaActualizar').addEventListener('input', async (e) => {
  const cedula = e.target.value.trim();

  if (cedula.length >= 10) {
    try {
      const res = await fetch(`/api/usuarios/buscar-con-roles/${cedula}`);
      const data = await res.json();

      if (res.ok && data.success) {
        const usuario = data.usuario;

        document.getElementById('nombreActualizar').value = usuario.nombre || '';
        document.getElementById('apellidoActualizar').value = usuario.apellido || '';
        document.getElementById('correoActualizar').value = usuario.correo || '';
        document.getElementById('telefonoActualizar').value = usuario.telefono || '';
        document.getElementById('usuarioActualizar').value = usuario.usuario || '';
        document.getElementById('contrasenaActualizar').value = usuario.contrasena || '';

        // Cargar roles dinámicos en select con rol seleccionado
        cargarRoles(document.getElementById('rolActualizar'), usuario.rol);

      } else {
        limpiarCamposActualizar();
      }
    } catch (err) {
      console.error('Error al buscar usuario', err);
      limpiarCamposActualizar();
    }
  } else {
    limpiarCamposActualizar();
  }
});

function limpiarCamposActualizar() {
  document.getElementById('nombreActualizar').value = '';
  document.getElementById('apellidoActualizar').value = '';
  document.getElementById('correoActualizar').value = '';
  document.getElementById('telefonoActualizar').value = '';
  // Reseteamos el select de roles con solo opción "Sin cambiar"
  const selectRolActualizar = document.getElementById('rolActualizar');
  selectRolActualizar.innerHTML = '<option value="">-- Sin cambiar --</option>';
  document.getElementById('usuarioActualizar').value = '';
  document.getElementById('contrasenaActualizar').value = '';
}