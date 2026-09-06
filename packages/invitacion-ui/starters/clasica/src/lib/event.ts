// Datos del evento en un solo sitio: los usan la pagina, el boton de agendar
// y el archivo .ics.
//
// PLACEHOLDER: reemplaza estos valores por los del evento real.

// Hora de pared del evento, tal y como se anuncia en la invitacion.
const WALL_CLOCK = "2026-12-31T18:00:00";

// Desfase horario fijo de la zona del evento (aqui, UTC-6). Fijar el desfase
// evita que el instante dependa de la zona horaria de la maquina que compila,
// que en un CI suele ser UTC. Ajusta este valor a la zona real del evento.
const TZ_OFFSET = "-06:00";

export const EVENT_TITLE = "Nombre del evento";
export const EVENT_LOCATION = "Nombre del lugar, Ciudad, Pais";
export const EVENT_DESCRIPTION =
  "Te espero para celebrar este dia. Nos vemos ahi.";

/** Instante absoluto de inicio. Para .ics y enlaces de calendario. */
export const EVENT_START = new Date(`${WALL_CLOCK}${TZ_OFFSET}`);

/** Fin estimado de la celebracion. */
export const EVENT_END = new Date(EVENT_START.getTime() + 6 * 60 * 60 * 1000);

/**
 * Misma hora de pared, pero interpretada en la zona local de quien compila.
 * Es la que se pinta en la pagina: al formatearla tambien en local, siempre
 * muestra la misma hora sin importar donde se genere el sitio.
 */
export const DISPLAY_DATE = new Date(WALL_CLOCK);

/** Formato basico UTC que exigen iCalendar y Google Calendar: 20261231T000000Z */
export function toCalendarStamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/** Enlace de Google Calendar, el camino mas fiable en Android. */
export const GOOGLE_CALENDAR_URL =
  "https://calendar.google.com/calendar/render?" +
  new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT_TITLE,
    dates: `${toCalendarStamp(EVENT_START)}/${toCalendarStamp(EVENT_END)}`,
    location: EVENT_LOCATION,
    details: EVENT_DESCRIPTION,
  }).toString();
