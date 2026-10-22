/**
 * Utilidades para formateo, sanitización de teléfonos y enlaces directos de WhatsApp (wa.me)
 * enfocado en Argentina (+54 9 ...) pero compatible con números internacionales.
 */

/**
 * Limpia y normaliza un número telefónico al formato internacional de WhatsApp.
 * Ejemplo para Argentina:
 * - "011 15 4444-5555" -> "5491144445555"
 * - "341 612-3456"     -> "5493416123456"
 * - "+54 9 11 4444-5555" -> "5491144445555"
 * - "+54 11 4444-5555"   -> "5491144445555"
 */
export function cleanWhatsAppPhone(input: string | null | undefined): string | null {
  if (!input) return null;

  // Extraer solo dígitos
  let digits = input.replace(/\D/g, '');
  if (!digits) return null;

  // Si empieza con 0 (código interurbano nacional en Argentina, ej 011, 0341)
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Si ya tiene el prefijo completo de Argentina para WhatsApp (+54 9)
  if (digits.startsWith('549')) {
    return digits;
  }

  // Si empieza con 54 pero le falta el 9 de celular argentino
  if (digits.startsWith('54')) {
    const rest = digits.slice(2);
    // Si el resto tiene 10 dígitos (código de área + número), insertamos el 9
    if (rest.length === 10) {
      return `549${rest}`;
    }
    // Si tiene 12 dígitos y empieza con 15 después del área (ej. 54 11 15 4444 5555)
    if (rest.length === 12 && rest.slice(2, 4) === '15') {
      return `549${rest.slice(0, 2)}${rest.slice(4)}`;
    }
    return `549${rest}`;
  }

  // Si tiene el "15" local después de 2 o 3 dígitos de área (ej: 11 15 4444 5555 o 341 15 612 3456)
  if (digits.length === 12 && (digits.slice(2, 4) === '15' || digits.slice(3, 5) === '15')) {
    if (digits.slice(2, 4) === '15') {
      digits = `${digits.slice(0, 2)}${digits.slice(4)}`;
    } else {
      digits = `${digits.slice(0, 3)}${digits.slice(5)}`;
    }
  }

  // Si es un número argentino estándar de 10 dígitos (ej. 1144445555 o 3416123456)
  if (digits.length === 10) {
    return `549${digits}`;
  }

  // Si es otro formato internacional (mínimo 8 dígitos)
  if (digits.length >= 8) {
    return digits;
  }

  return null;
}

export interface WhatsAppTemplateVars {
  nombre?: string;
  gimnasio?: string;
  plan?: string;
  fecha_vencimiento?: string;
  monto?: string;
  recibo_numero?: string | number;
}

/**
 * Reemplaza las variables {variable} en la plantilla de texto.
 */
export function renderWhatsAppMessage(template: string, vars: WhatsAppTemplateVars): string {
  let message = template;

  if (vars.nombre) message = message.replaceAll('{nombre}', vars.nombre);
  if (vars.gimnasio) message = message.replaceAll('{gimnasio}', vars.gimnasio);
  if (vars.plan) message = message.replaceAll('{plan}', vars.plan);
  if (vars.fecha_vencimiento) message = message.replaceAll('{fecha_vencimiento}', vars.fecha_vencimiento);
  if (vars.monto) message = message.replaceAll('{monto}', vars.monto);
  if (vars.recibo_numero !== undefined) {
    message = message.replaceAll('{recibo_numero}', String(vars.recibo_numero));
  }

  return message;
}

/**
 * Construye la URL oficial de wa.me para abrir WhatsApp Web o App con mensaje precargado.
 */
export function buildWhatsAppUrl(rawPhone: string, message: string): string | null {
  const cleanPhone = cleanWhatsAppPhone(rawPhone);
  if (!cleanPhone) return null;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
