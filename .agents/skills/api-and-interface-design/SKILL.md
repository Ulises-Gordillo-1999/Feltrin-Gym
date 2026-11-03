---
name: api-and-interface-design
description: Guía para el diseño de APIs, contratos de tipos y límites de interfaces estables. Úsalo al diseñar endpoints REST, Server Actions, esquemas de bases de datos, contratos de TypeScript entre módulos o al establecer límites claros entre frontend y backend.
---

# Diseño de APIs e Interfaces (API & Interface Design)

## Visión General

Diseña interfaces estables, autodescriptivas y difíciles de usar incorrectamente. Una buena interfaz hace que lo correcto sea fácil y lo incorrecto sea casi imposible. Este principio aplica a Server Actions de Next.js, endpoints REST, esquemas de base de datos Drizzle y contratos de tipos en TypeScript.

## Principios Fundamentales

### 1. Ley de Hyrum
> "Con un número suficiente de usuarios de una API, todos los comportamientos observables de tu sistema serán dependencias de alguien, sin importar lo que prometa el contrato formal."

- **Sé intencional con lo que expones**: Cada campo público o comportamiento observable es un compromiso a largo plazo.
- **No filtres detalles internos de implementación**: Si el cliente no necesita conocer la estructura interna de la base de datos, no la expongas directamente.
- **Diseña pensando en la evolución**: Diseña tipos extensibles con objetos de opciones en lugar de largas listas de argumentos posicionales.

### 2. Contrato Primero (Contract First)
Define siempre los tipos TypeScript de entrada (`Input`) y salida (`Result / Response`) antes de escribir la lógica:

```typescript
export interface CrearTransaccionInput {
  tipo: "Ingreso" | "Egreso";
  categoria: string;
  monto: number;
  moneda: "ARS" | "USDT";
  metodoPago: "Efectivo" | "Transferencia" | "Tarjeta Virtual/Crypto";
  proyectoId?: string;
  descripcion?: string;
}

export type CrearTransaccionResult = 
  | { success: true; transaccionId: string }
  | { success: false; error: string; code?: "SALDO_INSUFICIENTE" | "NO_AUTORIZADO" };
```

### 3. Server Actions de Next.js Tipadas y Seguras
- Valida la sesión y los permisos de rol (`SuperAdmin`, `Admin`, `Tecnico`) al inicio de cada acción.
- Valida los argumentos en el servidor (con `zod` o validadores estrictos).
- Retorna siempre objetos de resultado predecibles sin arrojar excepciones no controladas al cliente.\n