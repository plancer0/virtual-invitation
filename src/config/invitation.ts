import type { InvitationConfig } from "../types/invitation";
import { DISPLAY_DATE, EVENT_LOCATION } from "../lib/event";
import foto1 from "../Images/1.jpeg";
import foto2 from "../Images/2.jpeg";
import foto3 from "../Images/3.jpeg";
import foto4 from "../Images/4.jpeg";

const venueQuery = encodeURIComponent(EVENT_LOCATION);
const venueLat = 14.452510771339947;
const venueLng = -90.5618720207432;

/**
 * Todo lo que cambia de una invitacion a otra vive aqui. Para crear otra,
 * basta con duplicar este archivo y las imagenes: el resto de la pagina lee
 * de esta configuracion y no necesita tocarse.
 *
 * La fecha y el sitio se leen de lib/event para no repetirlos: ese modulo es
 * tambien el que alimenta el archivo .ics de "agregar al calendario".
 */
export const invitation: InvitationConfig = {
  name: "Rachell",
  parents: "Ronald y Mildred",
  date: DISPLAY_DATE,

  texts: {
    intro:
      "Hay momentos que se guardan para siempre, y este es uno de ellos. Acompáñame a celebrar mis quince rodeada de las personas que más quiero, y hagamos de esta noche un recuerdo inolvidable.",
    photos: "Hoy escribo un nuevo capítulo y quiero compartirlo contigo.",
    closing: "Te esperamos",
    gift: "El mejor regalo es compartir este día con nosotros. Si gusta otorgar un obsequio, se agradecerá que sea en efectivo.",
  },

  venue: {
    name: "Chalet la Rioja",
    googleMapsUrl: "https://maps.app.goo.gl/pmV3aJcxpxYGNmWp9",
    appleMapsUrl: "https://maps.apple/p/77-YP_gU.WBj7A",
    wazeUrl: "https://waze.com/ul/h9fxd5nyz3",
    uberUrl: `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${venueLat}&dropoff[longitude]=${venueLng}&dropoff[formatted_address]=${venueQuery}&dropoff[nickname]=${encodeURIComponent("Chalet la Rioja")}`,
  },

  dressCode: {
    type: "Gala",
    reservedColors: [
      { name: "Morado", hex: "#8D6FAE" },
      // Gris frio oscurecido: el plata real (#C0C0C0) sobre el fondo lila
      // da un contraste de 1.4 y no se lee.
      { name: "Plateado", hex: "#7C7C8A" },
    ],
  },

  rsvp: {
    phoneNumber: "50242432127",
    deadline: new Date("2026-10-01T00:00:00"),
  },

  // El orden es el del despliegue: arriba-izq, arriba-der, abajo-izq, abajo-der.
  photos: [
    { src: foto1, position: "object-center" },
    { src: foto2, position: "object-center" },
    // De cuerpo entero y muy alargada: centrada le cortaba la cabeza.
    { src: foto3, position: "object-top" },
    // Horizontal: al recortarla a vertical hay que elegir que lado conservar.
    { src: foto4, position: "object-[93%_50%]", zoom: "scale-125 origin-right" },
  ],
};
