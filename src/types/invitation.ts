import type { ImageMetadata } from "astro";
import type { Palette } from "./palette";

/** Un color destacado dentro de un texto, con su valor ya listo para pintar. */
export interface HighlightedColor {
  name: string;
  hex: string;
}

export interface VenueConfig {
  /** Nombre que se muestra en la tarjeta de recepcion. */
  name: string;
  /** Enlaces de las apps de mapas. Se pegan tal cual, sin construirlos. */
  googleMapsUrl: string;
  appleMapsUrl: string;
  wazeUrl: string;
  uberUrl: string;
}

export interface DressCodeConfig {
  /** Tipo de etiqueta: "Gala", "Formal"... */
  type: string;
  /** Colores reservados. Ojo al contraste sobre el fondo lila: un plata real
   *  (#C0C0C0) queda ilegible, por eso se guarda el hex ya ajustado. */
  reservedColors: HighlightedColor[];
}

export interface RsvpConfig {
  /** Numero de WhatsApp con prefijo de pais y sin signos. */
  phoneNumber: string;
  /** Fecha limite. Se formatea en la seccion, no aqui. */
  deadline: Date;
}

export interface PhotoConfig {
  src: ImageMetadata;
  /** Encuadre dentro del marco de la polaroid: clase object-position. */
  position?: string;
  /** Acercamiento extra sobre el encuadre de object-cover. */
  zoom?: string;
}

export interface InvitationConfig {
  /** Nombre de la quinceanera. */
  name: string;
  /** Color de toda la invitacion. Se puede tomar de `config/palettes.ts` o
   *  escribir a mano. Ver `types/palette.ts`. */
  palette: Palette;
  parents: string;
  /** Fecha que se pinta en pantalla. El instante absoluto vive en lib/event. */
  date: Date;
  texts: {
    /** Bajo el titulo "Mis 15 anos". */
    intro: string;
    /** Bajo las fotos. */
    photos: string;
    /** Cierre de la invitacion. */
    closing: string;
    /** Parrafo de la tarjeta de regalo. */
    gift: string;
  };
  venue: VenueConfig;
  dressCode: DressCodeConfig;
  rsvp: RsvpConfig;
  /** Las cuatro fotos, en el orden en que se despliegan. */
  photos: PhotoConfig[];
}
