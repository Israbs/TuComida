# Guía de Trabajo Colaborativo con Git y GitHub

## Índice

1. [Primera vez — Configuración inicial](#1-primera-vez--configuración-inicial)
2. [Flujo diario — Cómo trabajar en paralelo](#2-flujo-diario--cómo-trabajar-en-paralelo)
3. [Resolver conflictos](#3-resolver-conflictos)
4. [Buenas prácticas](#4-buenas-prácticas)
5. [Resumen visual](#5-resumen-visual)

---

## 1. Primera vez — Configuración inicial

### 1.1 Instalar Git

Descargar desde: https://git-scm.com/downloads

Verificar instalación:
```bash
git --version
```

### 1.2 Configurar tu identidad

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### 1.3 Clonar el proyecto

```bash
# Ir a la carpeta donde quieres tener el proyecto
cd C:\Users\TuUsuario\Documents

# Clonar
git clone https://github.com/tu-usuario/tucomida.git

# Entrar al proyecto
cd tucomida
```

### 1.4 Instalar dependencias y base de datos

```bash
# Solo la primera vez
npm install

# Crear la base de datos local
npx tsx node_modules/prisma/build/index.js db push

# Cargar datos de prueba
npx tsx prisma/seed.ts

# Iniciar servidor
npm run dev
```

Abrir `http://localhost:3000`

---

## 2. Flujo diario — Cómo trabajar en paralelo

### Concepto clave

Nunca trabajes directamente en `main`. Cada funcionalidad nueva se hace en su propia **rama** (branch). Así ambos pueden trabajar sin pisarse.

### 2.1 Al empezar el día

```bash
# Asegurarte de estar en main con lo último
git checkout main
git pull origin main

# Crear una rama para tu tarea
git checkout -b feature/nombre-de-tarea
```

Ejemplos de nombres de rama:
- `feature/pos-pantalla`
- `feature/kds-tiempo-real`
- `feature/crud-mesas`
- `fix/error-precio-inventario`

### 2.2 Mientras trabajas

```bash
# Ver qué archivos cambiaste
git status

# Ver los cambios línea por línea
git diff
```

Haz commits pequeños y frecuentes (cada vez que completes una parte lógica):

```bash
# Agregar archivos específicos al commit
git add src/app/(dashboard)/pos/page.tsx
git add src/trpc/routers/pos.ts

# O agregar todos los cambios
git add -A

# Crear el commit con un mensaje descriptivo
git commit -m "feat: agregar pantalla básica de POS con selección de productos"
```

**Mensajes de commit — ejemplos:**
| Tipo | Mensaje |
|---|---|
| Nueva funcionalidad | `feat: agregar CRUD de mesas` |
| Corrección de error | `fix: precio no se guardaba correctamente` |
| Mejora sin cambio funcional | `refactor: separar lógica de pedidos en hook` |
| Cosméticos | `style: ajustar padding del sidebar` |
| Documentación | `docs: actualizar README con nuevos módulos` |

### 2.3 Subir tu rama al remoto

```bash
# Primera vez que subes esa rama
git push -u origin feature/nombre-de-tarea

# Las siguientes veces (ya está vinculada)
git push
```

### 2.4 Cuando termines la tarea — Pull Request

1. Ir a https://github.com/tu-usuario/tucomida
2. Verás un banner amarillo: _"feature/nombre-de-tarea had recent pushes"_
3. Click en **"Compare & pull request"**
4. Escribir un título y descripción de lo que hiciste
5. Click en **"Create pull request"**
6. Tu compañero revisa y hace click en **"Merge pull request"**

### 2.5 Actualizar tu rama con cambios de main

Mientras trabajas, tu compañero puede haber mergeado cambios a `main`. Para traerlos a tu rama:

```bash
git checkout feature/nombre-de-tarea
git merge main
```

Si no hay conflictos, listo. Si los hay, ver [Sección 3](#3-resolver-conflictos).

### 2.6 Al finalizar el día (o antes de irte)

```bash
# Subir lo que tengas, aunque no esté terminado
git add -A
git commit -m "wip: avance en POS"
git push
```

Así tu compañero puede ver tu progreso.

---

## 3. Resolver conflictos

Ocurre cuando dos personas modificaron la misma línea del mismo archivo.

### 3.1 Identificar el conflicto

```bash
git merge main

# Git te dirá qué archivos tienen conflicto:
#   Auto-merging src/app/(dashboard)/inventory/page.tsx
#   CONFLICT (content): Merge conflict in src/app/(dashboard)/inventory/page.tsx
```

### 3.2 Resolverlo

Abrir el archivo en conflicto. Verás algo así:

```tsx
<<<<<<< HEAD (tu rama)
  const [formPrice, setFormPrice] = useState("");
=======
  const [formPrice, setFormPrice] = useState("0");
>>>>>>> main
```

- `<<<<<<< HEAD` = tu código
- `=======` = separador
- `>>>>>>> main` = código de main

Edita para dejar la versión correcta (o una combinación de ambas) y **elimina los marcadores** `<<<<<<`, `======`, `>>>>>>`:

```tsx
  const [formPrice, setFormPrice] = useState("");
```

### 3.3 Finalizar la resolución

```bash
# Agregar el archivo ya resuelto
git add src/app/(dashboard)/inventory/page.tsx

# Completar el merge
git commit -m "fix: resolver conflicto en inventory/page.tsx"

# Subir
git push
```

---

## 4. Buenas prácticas

### 4.1 Antes de hacer push

```bash
# Verificar que compila
npm run build

# Verificar que no hay errores de lint
npm run lint
```

Si algo falla, **no hagas push**. Arregla primero.

### 4.2 Reglas de oro

- ✅ Hacer commits pequeños y frecuentes
- ✅ Un commit = una cosa lógica
- ✅ Mensajes descriptivos en español o inglés
- ✅ Correr `npm run build` antes de push
- ✅ Siempre trabajar en una rama, nunca en `main`
- ✅ Pull de `main` antes de empezar el día
- ❌ No subir `node_modules` (ya está en `.gitignore`)
- ❌ No subir `.env` con credenciales reales
- ❌ No hacer commits de código que no compile

### 4.3 Si alguien ya mergeó a main y tú necesitas sus cambios

```bash
git checkout feature/tu-rama
git merge main
```

Haz esto **a diario** para evitar conflictos grandes.

---

## 5. Resumen visual

```
TIEMPO → → → → → → → → → → → → → → → → → → → →
                                                  FEAT: merge a main
main  ●───────●────────────────────●─────────────●──
          \                      /                \
ramas      ●──●──●              ●──●               ●──●
           TÚ                  COMPAÑERO          TÚ (nueva)
           (POS)               (KDS)              (Mesas)
```

### Comandos que usarás el 90% del tiempo

```bash
# 1. Traer lo último
git checkout main && git pull origin main

# 2. Crear rama para tu tarea
git checkout -b feature/mi-tarea

# 3. Trabajar... editar archivos...

# 4. Commitear
git add -A && git commit -m "feat: descripción"

# 5. Subir
git push -u origin feature/mi-tarea

# 6. Ir a GitHub y crear Pull Request

# 7. Cuando terminen, borrar la rama local
git checkout main && git branch -d feature/mi-tarea
```

---

> **¿Dudas?** siempre comunicacion entre los dos angel
