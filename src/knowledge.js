const SALON_INFO = {
  nombre: "Lash Angels",
  direccion: "Carrer de Martí, 121, Gràcia, Barcelona, 08024",
  horario: "Lunes a Sábado de 10:00 a 20:00. Cerrado los domingos.",
  horarioExtra: "Fuera de horario es posible con precio doble.",
  ultimaCitaExtensiones: "La última cita para extensiones es a las 18:00 (máximo 18:30).",
  treatwell: "También se puede reservar en Treatwell: https://widget.treatwell.es/establecimiento/lash-angels/",

  servicios: [
    // EXTENSIONES DE PESTAÑAS
    { nombre: "Extensiones Clásico 1D (pelo a pelo)", precio: 55, duracion: "1h 30min" },
    { nombre: "Extensiones Volumen 2D", precio: 60, duracion: "2h" },
    { nombre: "Extensiones Volumen 3D", precio: 65, duracion: "2h" },
    { nombre: "Extensiones Volumen 4D", precio: 70, duracion: "2h" },
    { nombre: "Extensiones Volumen 5D", precio: 75, duracion: "2h" },
    { nombre: "Extensiones Volumen 6D", precio: 75, duracion: "2h" },
    { nombre: "Extensiones Hollywood 7-10D", precio: 80, duracion: "2h" },
    { nombre: "Extensiones Volumen Ruso 10D+", precio: 85, duracion: "2h" },

    // EFECTOS ESPECIALES
    { nombre: "Efecto Mojado (light)", precio: 60, duracion: "2h" },
    { nombre: "Efecto Mojado (strong)", precio: 65, duracion: "2h" },
    { nombre: "Efecto Kim Kardashian", precio: 75, duracion: "2h" },
    { nombre: "Efecto Anime", precio: 75, duracion: "2h" },
    { nombre: "Efecto Eyeliner / Efecto Máscara", precio: 60, duracion: "2h" },
    { nombre: "Efecto Discreto y Natural", precio: 55, duracion: "2h" },
    { nombre: "Extensiones de Esquinas", precio: 50, duracion: "1h" },
    { nombre: "Pestañas de Colores (suplemento)", precio: "+10 sobre el precio base", duracion: "" },

    // RELLENOS Y RETIRADA
    { nombre: "Relleno de extensiones (2-3 semanas)", precio: "precio del servicio - 10€", duracion: "1h 30min" },
    { nombre: "Retirada de extensiones", precio: 10, duracion: "20min" },

    // LASHES (LIFTING / TINTE)
    { nombre: "Tinte de pestañas", precio: 15, duracion: "20min" },
    { nombre: "Lifting de pestañas + tinte", precio: 50, duracion: "1h" },
    { nombre: "Laminación de pestañas", precio: 50, duracion: "1h" },
    { nombre: "Permanente y tinte de pestañas", precio: 50, duracion: "1h" },

    // BROW
    { nombre: "Diseño de cejas", precio: 15, duracion: "30min" },
    { nombre: "Diseño de cejas + tinte/henna", precio: 30, duracion: "30min" },
    { nombre: "Tinte de cejas con henna", precio: 30, duracion: "30min" },
    { nombre: "Laminado de cejas (sin tinte)", precio: 40, duracion: "45min" },
    { nombre: "Laminado de cejas + tinte", precio: 45, duracion: "45min" },

    // COMBO
    { nombre: "Set lifting pestañas + laminado de cejas", precio: 85, duracion: "1h 45min" },
  ]
};

module.exports = SALON_INFO;