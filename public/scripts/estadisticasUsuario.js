
document.addEventListener('DOMContentLoaded', async () => {
  // Poner año apenas carga el DOM
  const spanAnio = document.getElementById('anio');
  if (spanAnio) {
    spanAnio.textContent = new Date().getFullYear();
  } else {
    console.warn('No existe año en el DOM');
  }


  // Obtener datos del usuario logueado
  let usuario;
  try {
    const res = await fetch('/api/login/me', { credentials: 'include' });
    if (!res.ok) throw new Error('No logueado');
    usuario = await res.json();
  } catch {
    alert('No ha iniciado sesión correctamente.');
    window.location.href = "../index.html";
    return;
  }

  document.getElementById('nombreUsuario').textContent = usuario.usuario;
  // 🔽 Mostrar u ocultar filtros según el tipo
  const tipoFiltro = document.getElementById('tipoFiltro');
  const filtroUnico = document.getElementById('filtroFechaUnica');
  const filtroRango = document.getElementById('filtroRangoFechas');

  tipoFiltro.addEventListener('change', () => {
    if (tipoFiltro.value === 'fecha') {
      filtroUnico.style.display = 'block';
      filtroRango.style.display = 'none';
    } else {
      filtroUnico.style.display = 'none';
      filtroRango.style.display = 'block';
    }
  });


  // 🔽 Mostrar TOP 3 de atención
  try {
  const res = await fetch('/api/estadisticas/top3', { credentials: 'include' });
  const top = await res.json();

  const container = document.getElementById('topAtenciones');
  container.innerHTML = '';
  container.classList.add('cards-container');

  top.forEach((entry, index) => {
    const div = document.createElement('div');
    div.classList.add('card');
    div.id = `top${index + 1}`;

    div.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <img class="imagen1" src="../images/foto_personal" alt="Foto" />
          <div class="info-usuario">
            <h5>#${index + 1} ${entry.nombre}</h5>
            <p>Promedio: ${entry.promedio}</p>
          </div>
        </div>
        <div class="card-back">
          <canvas id="graficoTopBar${index + 1}"></canvas>
        </div>
      </div>
    `;
    container.appendChild(div);

    // === Gráfico de barras compacto ===
    const ctx = div.querySelector(`#graficoTopBar${index + 1}`).getContext('2d');
    const color = [
      { fondo: 'rgba(255, 99, 132, 0.4)', borde: 'rgb(255, 99, 132)' },
      { fondo: 'rgba(54, 162, 235, 0.4)', borde: 'rgb(54, 162, 235)' },
      { fondo: 'rgba(255, 206, 86, 0.4)', borde: 'rgb(255, 206, 86)' }
    ][index];

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Puntualidad', 'Trato', 'Resolución'],
        datasets: [{
          label: `${entry.nombre}`,
          data: [
            entry.promedio_puntualidad || 0,
            entry.promedio_trato || 0,
            entry.promedio_resolucion || 0
          ],
          backgroundColor: color.fondo,
          borderColor: color.borde,
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 30
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        layout: { padding: { top: 6, right: 6, bottom: 2, left: 6 } },
        scales: {
          x: {
            ticks: {
              color: '#1f2937',
              font: { size: 11, weight: '600' }
            },
            grid: { display: false }
          },
          y: {
            min: 0,
            max: 5,
            ticks: { stepSize: 1, font: { size: 10 } },
            grid: { color: 'rgba(0,0,0,0.08)' }
          }
        }
      }
    });

    // Activar rotación al hacer click
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const inner = card.querySelector('.card-inner');
        inner.classList.toggle('rotated');
      });
    });
  });
} catch (err) {
  console.error(err);
  alert("Error al obtener estadísticas TOP.");
}

  // try {
  //   const res = await fetch('/api/estadisticas/top3', { credentials: 'include' });
  //   const top = await res.json();

  //   const radarContainer = document.getElementById('topAtenciones');
  //   radarContainer.innerHTML = ''; // limpiar contenedor padre
  //   radarContainer.classList.add('cards-container');

  //   top.forEach((entry, index) => {
  //     const div = document.createElement('div');
  //     div.classList.add('card');
  //     div.id = `top${index + 1}`;

  //     div.innerHTML = `
  //   <div class="card-inner">
  //     <div class="card-front">
  //       <img class="imagen1" src="../images/foto_personal" alt="Foto" />
  //       <div class="info-usuario">
  //       <h5>#${index + 1} ${entry.nombre}</h5>
  //       <p>Promedio: ${entry.promedio}</p>
  //       </div>
  //     </div>
  //     <div class="card-back">
  //       <canvas id="graficoTopRadar${index + 1}"></canvas>
  //     </div>
  //   </div>
  // `;
  //     radarContainer.appendChild(div);


  //     // Radar chart dentro del reverso
  //     const ctx = div.querySelector(`#graficoTopRadar${index + 1}`).getContext('2d');
  //     const color = [
  //       { fondo: 'rgba(255, 99, 132, 0.2)', borde: 'rgb(255, 99, 132)' },
  //       { fondo: 'rgba(54, 162, 235, 0.2)', borde: 'rgb(54, 162, 235)' },
  //       { fondo: 'rgba(255, 206, 86, 0.2)', borde: 'rgb(255, 206, 86)' }
  //     ][index];

  //     new Chart(ctx, {
  //       type: 'radar',
  //       data: {
  //         labels: ['Puntualidad', 'Trato', 'Resolución'],
  //         datasets: [{
  //           label: `${entry.nombre} ${entry.apellido}`,
  //           data: [
  //             entry.promedio_puntualidad || 0,
  //             entry.promedio_trato || 0,
  //             entry.promedio_resolucion || 0
  //           ],
  //           fill: true,
  //           backgroundColor: color.fondo,
  //           borderColor: color.borde,
  //           pointBackgroundColor: color.borde,
  //           pointBorderColor: '#fff'
  //         }]
  //       },
  //       options: {
  //         elements: { line: { borderWidth: 1 } },
  //         plugins: { legend: { display: false } },
  //         responsive: true,
          
  //         scales: {
  //           r: {
  //             min: 0, max: 5, stepSize: 1,
  //             pointLabels: { color: '#000', font: { size: 13, weight: 'bold' } }
  //           }
  //         }
  //       }
  //     });
  //     // Activar rotación al hacer click
  //     const cards = document.querySelectorAll('.card');
  //     cards.forEach(card => {
  //       card.addEventListener('click', () => {
  //         const inner = card.querySelector('.card-inner');
  //         inner.classList.toggle('rotated'); // <-- clase CSS que rotará
  //       });
  //     });
  //   });
  // } catch (err) {
  //   console.error(err);
  //   alert("Error al obtener estadísticas TOP.");
  // }

  // 🔽 Estadísticas generales
  try {
    const res = await fetch('/api/estadisticas/detalle', { credentials: 'include' });
    const detalle = await res.json();

    document.getElementById('detalleUsuario').innerHTML = `
      <p><strong>Promedio de Puntualidad:</strong> ${detalle.promedio_puntualidad ?? 'N/A'}</p>
      <p><strong>Promedio de Trato:</strong> ${detalle.promedio_trato ?? 'N/A'}</p>
      <p><strong>Promedio de Resolución:</strong> ${detalle.promedio_resolucion ?? 'N/A'}</p>
    `;

    const ctx = document.getElementById('graficoGeneral').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Puntualidad', 'Trato', 'Resolución'],
        datasets: [{
          label: 'Promedio',
          data: [detalle.promedio_puntualidad || 0, detalle.promedio_trato || 0, detalle.promedio_resolucion || 0],
          backgroundColor: ['blue', 'green', 'orange']
        }]
      }
    });

    // 🔽 Mostrar mensajes motivacionales con OpenAI
    if(detalle.promedio_puntualidad != null && detalle.promedio_trato != null && detalle.promedio_resolucion != null){
      mostrarMensajesMotivacionales(detalle);
    }

  } catch (err) {
    console.error(err);
    alert("Error al obtener estadísticas generales.");
  }

  let graficoPastel = null;

  function mostrarDatosYGrafico(filtrado, titulo = 'Promedios') {
    const container = document.getElementById('estadisticasDiarias');
    container.innerHTML = `
      <strong>${titulo}:</strong>
      Puntualidad: ${filtrado.promedio_puntualidad} |
      Trato: ${filtrado.promedio_trato} |
      Resolución: ${filtrado.promedio_resolucion}
    `;

    const canvas = document.getElementById('graficoPastel');
    canvas.style.display = 'block';

    if (graficoPastel) graficoPastel.destroy();

    const ctx = canvas.getContext('2d');
    graficoPastel = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: ['Puntualidad', 'Trato', 'Resolución'],
        datasets: [{
          label: 'Promedio',
          data: [
            filtrado.promedio_puntualidad || 0,
            filtrado.promedio_trato || 0,
            filtrado.promedio_resolucion || 0
          ],
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)'
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        scales: { r: { suggestedMin: 0, suggestedMax: 5 } }
      }
    });
  }

  async function mostrarEstadisticaPorFecha(fecha) {
    try {
      const res = await fetch('/api/estadisticas/detalle/diario', { credentials: 'include' });
      const dias = await res.json();

      const fechaFormateada = new Date(fecha).toISOString().slice(0, 10);
      const dato = dias.find(d => new Date(d.fecha).toISOString().slice(0, 10) === fechaFormateada);

      if (dato) {
        mostrarDatosYGrafico(dato, fechaFormateada);
      } else {
        document.getElementById('estadisticasDiarias').innerHTML = '<p>No hay datos para esta fecha.</p>';
        document.getElementById('graficoPastel').style.display = 'none';
        if (graficoPastel) graficoPastel.destroy();
      }
    } catch (err) {
      console.error(err);
      alert('Error al filtrar por fecha.');
    }
  }

  // 🔽 Botón FILTRAR
  document.getElementById('filtrarBtn').addEventListener('click', async () => {
    const tipoFiltro = document.getElementById('tipoFiltro').value;

    if (tipoFiltro === 'fecha') {
      const fecha = document.getElementById('fechaFiltro').value;
      if (!fecha) return alert('Selecciona una fecha');
      mostrarEstadisticaPorFecha(fecha);
    } else {
      const desde = document.getElementById('fechaInicoo').value;
      const hasta = document.getElementById('fechaFin').value;
      if (!desde || !hasta) return alert('Selecciona ambas fechas');

      try {
        const res = await fetch(`/api/estadisticas/detalle/promedio?desde=${desde}&hasta=${hasta}`, { credentials: 'include' });
        const data = await res.json();

        if (!data || (!data.promedio_puntualidad && !data.promedio_trato && !data.promedio_resolucion)) {
          document.getElementById('estadisticasDiarias').innerHTML = '<p>No hay datos para este rango.</p>';
          document.getElementById('graficoPastel').style.display = 'none';
          if (graficoPastel) graficoPastel.destroy();
        } else {
          mostrarDatosYGrafico(data, `Promedio del ${desde} al ${hasta}`);
        }
      } catch (err) {
        console.error(err);
        alert('Error al filtrar por rango de fechas.');
      }
    }
  });

  // Valor por defecto (hoy)
  document.getElementById('fechaFiltro').value = new Date().toISOString().slice(0, 10);

});

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/login/logout", {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (data.ok) {
        alert("Sesión cerrada correctamente.");
        window.location.href = "/";
      } else {
        alert("No se pudo cerrar sesión: " + data.error);
      }
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      alert("Error al conectar con el servidor.");
    }
  });
}


// Función para obtener mensajes motivacionales de OpenAI
//linea 138 y 139 son con esto de openai para las palabras motivacionales
async function mostrarMensajesMotivacionales(detalle) {
  const footer = document.getElementById('mensajeMotivacional');

  const categorias = [
    { nombre: "Puntualidad", puntaje: detalle.promedio_puntualidad },
    { nombre: "Trato", puntaje: detalle.promedio_trato },
    { nombre: "Resolución", puntaje: detalle.promedio_resolucion }
  ];

  const mensajes = await Promise.all(
    categorias.map(async c => {
      const res = await fetch('/api/generar-mensaje', {
        method: 'POST',
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria: c.nombre, puntaje: Number(c.puntaje) })
      });

      const data = await res.json();
      return `${c.nombre}: ${data.mensaje}`;
    })
  );

  footer.innerHTML = mensajes.join('<br>');
}