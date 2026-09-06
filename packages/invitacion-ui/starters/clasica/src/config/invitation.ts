import type { InvitationConfig } from "@invitacion/ui/types/invitation.ts";
import { palettes } from "@invitacion/ui/palettes.ts";
import { DISPLAY_DATE, EVENT_LOCATION } from "../lib/event";
import foto1 from "../Images/1.jpeg";
import foto2 from "../Images/2.jpeg";
import foto3 from "../Images/3.jpeg";
import foto4 from "../Images/4.jpeg";

const venueQuery = encodeURIComponent(EVENT_LOCATION);
// PLACEHOLDER: coordenadas del lugar, para el enlace de Uber. Se pueden sacar
// abriendo el sitio en Google Maps y copiando la latitud/longitud de la URL.
const venueLat = 0;
const venueLng = 0;

/**
 * Todo lo que cambia de una invitacion a otra vive aqui. Para crear otra,
 * basta con duplicar este archivo y las imagenes: el resto de la pagina lee
 * de esta configuracion y no necesita tocarse.
 *
 * La fecha y el sitio se leen de lib/event para no repetirlos: ese modulo es
 * tambien el que alimenta el archivo .ics de "agregar al calendario".
 */
export const invitation: InvitationConfig = {
  // PLACEHOLDER: nombre de quien celebra.
  name: "Nombre",
  // Cambiar esta linea retinta la pagina entera. Para una gama propia, en vez
  // del nombre de una paleta se puede poner el objeto: { base: "#...", ... }.
  palette: palettes.lila,
  // PLACEHOLDER: quienes invitan (padres, familia, etc.).
  parents: "Nombre de quien invita",
  date: DISPLAY_DATE,

  texts: {
    // PLACEHOLDER: textos de cada seccion.
    intro:
      "Hay momentos que se guardan para siempre, y este es uno de ellos. Acompáñame a celebrar este día rodeado de las personas que más quiero.",
    photos: "Hoy escribo un nuevo capítulo y quiero compartirlo contigo.",
    closing: "Te esperamos",
    gift: "El mejor regalo es compartir este día con nosotros.",
  },

  venue: {
    // PLACEHOLDER: nombre y enlaces del lugar. Cada enlace se obtiene
    // compartiendo la ubicacion desde la app correspondiente.
    name: "Nombre del lugar",
    googleMapsUrl: "https://maps.app.goo.gl/",
    appleMapsUrl: "https://maps.apple/",
    wazeUrl: "https://waze.com/ul/",
    uberUrl: `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${venueLat}&dropoff[longitude]=${venueLng}&dropoff[formatted_address]=${venueQuery}&dropoff[nickname]=${encodeURIComponent("Nombre del lugar")}`,
  },

  dressCode: {
    // PLACEHOLDER: tipo de etiqueta y colores reservados (si aplica).
    type: "Formal",
    reservedColors: [],
  },

  rsvp: {
    // PLACEHOLDER: numero de WhatsApp con prefijo de pais y sin signos.
    phoneNumber: "50200000000",
    deadline: new Date("2026-12-01T00:00:00"),
  },

  // PLACEHOLDER: las cuatro fotos, en el orden en que se despliegan (arriba-
  // izq, arriba-der, abajo-izq, abajo-der). Reemplaza src/Images/1.jpeg..4.jpeg
  // por fotos reales y ajusta la posicion si el recorte corta algo importante.
  photos: [
    { src: foto1, position: "object-center" },
    { src: foto2, position: "object-center" },
    { src: foto3, position: "object-center" },
    { src: foto4, position: "object-center" },
  ],
};
