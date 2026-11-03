---
name: spec-driven-development
description: Crea especificaciones funcionales y técnicas rigurosas antes de escribir código. Define requerimientos, modelos de datos, flujos de usuario, casos de error y criterios de aceptación verificables. Úsalo al iniciar cualquier módulo, funcionalidad compleja o refactorización significativa.
---

# Desarrollo Guiado por Especificaciones (Spec-Driven Development)

## Visión General

Programar sin una especificación clara es la principal causa de retrabajo, código huérfano y desacuerdos con el cliente. Una especificación (Spec) no es burocracia: es el contrato ejecutable de lo que el sistema debe hacer, cómo reaccionará ante errores y cuándo se considerará terminado.

## Estructura Estándar de una Especificación

Toda especificación generada bajo este estándar debe contener:

### 1. Resumen Ejecutivo & Contexto
- **Objetivo**: ¿Qué problema resuelve esta feature y para quién?
- **Alcance (In Scope)**: Qué incluye exactamente esta entrega.
- **Fuera de Alcance (Out of Scope)**: Qué NO se construirá explícitamente en esta fase para evitar feature creep.

### 2. Casos de Uso & Flujos de Usuario
- Flujo principal (Happy Path) paso a paso.
- Flujos alternativos y manejo de excepciones (fallo de red, validación fallida, permisos insuficientes).

### 3. Modelo de Datos & Esquema SQL / Drizzle
- Nuevas tablas, columnas, tipos enum o modificaciones de esquema.
- Relaciones, claves foráneas, restricciones de unicidad y reglas de borrado (`ON DELETE CASCADE / RESTRICT`).

### 4. Contratos de Interfaz (API & Server Actions)
- Firmas de funciones, tipos TypeScript de entrada (`Input`) y salida (`Response / Result`).
- Códigos de estado HTTP o payloads tipados de error.

### 5. Criterios de Aceptación Verificables (Given-When-Then)
Cada criterio debe ser binario y comprobable:
- **Dado que** el usuario es un Técnico y el proyecto está en estado 'En_Ejecucion'.
- **Cuando** envíe las cantidades reales consumidas en obra.
- **Entonces** el sistema descuenta el stock físico del catálogo y recalcula el total con el precio unitario congelado.

### 6. Consideraciones de Seguridad y Rendimiento
- Permisos RBAC requeridos (`SuperAdmin`, `Admin`, `Tecnico`).
- Índices necesarios en base de datos para evitar table scans.
- Sanitización de inputs y prevención OWASP.\n