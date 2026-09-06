// Conversiones de color compartidas por el script de recoloreado.

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}

export function rgbToHex([r, g, b]) {
  return "#" + [r, g, b]
    .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0"))
    .join("");
}

export function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

export function hslToRgb([h, s, l]) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/**
 * Construye la transformacion que lleva la gama de origen a la de destino.
 *
 * No repinta con un color plano: rota el tono y escala la saturacion, asi que
 * el sombreado interno de las acuarelas sobrevive. El desplazamiento de
 * luminosidad se atenua en los extremos (factor 1-|2l-1|) para que el blanco
 * del papel siga siendo blanco y los trazos oscuros no se destinan.
 *
 * Solo se mueven los tonos de la familia del color de origen (`ventana`, en
 * grados). Sin ese limite, la rotacion arrastra tambien lo que no es de la
 * paleta: la corona es dorada con morado, y teñirla entera dejaba el oro
 * azul. El efecto se desvanece hacia el borde de la ventana para que no
 * aparezca un escalon entre el pixel movido y el vecino intacto.
 */
export function makeRecolor(fromHex, toHex, { ventana = 70 } = {}) {
  const [fh, fs, fl] = rgbToHsl(hexToRgb(fromHex));
  const [th, ts, tl] = rgbToHsl(hexToRgb(toHex));
  const dh = th - fh;
  const satScale = fs === 0 ? 1 : ts / fs;
  const dl = tl - fl;
  const media = ventana / 360;

  return (rgb) => {
    const [h, s, l] = rgbToHsl(rgb);

    // Distancia circular al tono de origen, en vueltas (0 a 0.5).
    let d = Math.abs(h - fh) % 1;
    if (d > 0.5) d = 1 - d;
    if (d >= media) return rgb;

    // Dos pesos, los dos graduales. Un corte seco producia moteado: el papel
    // del sobre ronda justo el umbral de gris, asi que unos pixeles se
    // movian y sus vecinos no, y aparecian manchas.
    //   - por tono: 1 en el centro de la ventana, 0 en el borde.
    //   - por saturacion: los grises no tienen tono que rotar, moverlos los
    //     teniria de un color que en el original no existia.
    const pesoTono = Math.min(1, (1 - d / media) * 1.6);
    const pesoSat = Math.max(0, Math.min(1, (s - 0.02) / 0.08));
    const peso = pesoTono * pesoSat;
    if (peso <= 0) return rgb;

    return hslToRgb([
      h + dh * peso,
      Math.max(0, Math.min(1, s * (1 + (satScale - 1) * peso))),
      Math.max(0, Math.min(1, l + dl * peso * (1 - Math.abs(2 * l - 1)))),
    ]);
  };
}
