import type { APIRoute } from "astro";
import {
  EVENT_DESCRIPTION,
  EVENT_END,
  EVENT_LOCATION,
  EVENT_START,
  EVENT_TITLE,
  toCalendarStamp,
} from "../lib/event";

// iCalendar exige CRLF y escapar comas, puntos y comas y saltos de linea.
function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

export const GET: APIRoute = () => {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Invitacion Rachell//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:xv-rachell-2026-11-28@invitacion",
    // Fecha de creacion del objeto iCal: fija, para que el build sea reproducible.
    `DTSTAMP:${toCalendarStamp(new Date("2026-08-28T00:00:00Z"))}`,
    // En UTC (sufijo Z) para que cada telefono lo convierta a su hora local.
    `DTSTART:${toCalendarStamp(EVENT_START)}`,
    `DTEND:${toCalendarStamp(EVENT_END)}`,
    `SUMMARY:${escapeText(EVENT_TITLE)}`,
    `LOCATION:${escapeText(EVENT_LOCATION)}`,
    `DESCRIPTION:${escapeText(EVENT_DESCRIPTION)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(EVENT_TITLE)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="xv-rachell.ics"',
    },
  });
};
