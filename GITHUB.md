# Guía de Git y GitHub

Pautas para subir los cambios y traer el proyecto desde GitHub.

## Conceptos básicos

- **`origin`**: el repositorio remoto en GitHub (`https://github.com/Israbs/TuComida.git`).
- **`main`**: la rama principal del proyecto.
- **`commit`**: una "foto" del estado del proyecto con un mensaje.
- **`push`**: sube tus commits locales a GitHub.
- **`pull`**: baja los commits de GitHub a tu máquina.
- **`clone`**: copia el proyecto de GitHub a una máquina nueva.

## 1. Configuración inicial (una sola vez)

```bash
# Si es la primera vez que clonás en una máquina nueva:
git clone https://github.com/Israbs/TuComida.git
cd TuComida

# Configurar tu identidad (solo si nunca la seteas antes):
git config user.name "Tu Nombre"
git config user.email "tu@email.com"
```

Después de clonar hay que instalar dependencias y preparar el entorno:

```bash
npm install
# Copiar el ejemplo de variables de entorno y completarlo:
copy .env.example .env
# Crear la base de datos y cargar los datos de demo:
npx prisma db push
npm run seed
```

## 2. Flujo diario (subir cambios a GitHub)

```bash
# 1) Ver qué cambió
git status

# 2) Traer cambios de GitHub (si trabajás con más personas)
git pull origin main

# 3) Marcar los archivos que querés subir
git add -A            # agrega todo
# o archivos puntuales:
git add src/app/pos/page.tsx

# 4) Guardar el commit con un mensaje descriptivo
git commit -m "feat: descripción corta de lo que hice"

# 5) Subirlo a GitHub
git push origin main
```

### Mensajes de commit recomendados

- `feat: ...` — nueva funcionalidad
- `fix: ...` — corrección de un bug
- `refactor: ...` — reorganización de código
- `docs: ...` — documentación
- `chore: ...` — tareas menores (config, dependencias)

Ejemplo: `feat: app de pedidos online por restaurante`

## 3. Traer cambios desde GitHub (otra máquina)

```bash
# Actualizar tu copia local con lo último de GitHub:
git pull origin main
```

### Conflictos

Si `git pull` avisa de conflictos, es porque vos y otra persona tocaron el
mismo archivo. Los archivos en conflicto quedan marcados con `<<<<<<<`.
Hay que abrirlos, quedarse con la versión correcta, y luego:

```bash
git add <archivo-resuelto>
git commit -m "fix: resolucion de conflictos"
git push origin main
```

### ¿Olvidé hacer `git pull`?

No es problema: el `pull` solo se necesita si un compañero subió cambios.
Simplemente hacelo justo antes de pushear:

```bash
git pull origin main   # baja lo que subió el otro
git push origin main   # recién ahora subís lo tuyo
```

Si el push te da error de rechazo, esa es la causa: corré `git pull`,
resolvé conflictos si aparecen, y volvé a `git push`.

## 4. Archivos que NO se suben (ya ignorados)

Estos quedan afuera del repositorio porque son locales o sensibles:

| Qué | Por qué |
| --- | --- |
| `.env` | Contiene secretos (claves, tokens). Solo se sube `.env.example` |
| `*.db` | Base de datos local |
| `/uploads` | Imágenes subidas por los usuarios (se generan en runtime) |
| `/node_modules` | Dependencias (se instalan con `npm install`) |
| `/.next/` | Build local de Next.js |
| `*.log` | Logs del servidor (ej: `server-prod.log`) |
| `/src/generated/prisma` | Código generado por Prisma |

**Nunca** commitees `.env` con claves reales ni subas archivos ignorados
con `git add -f`.

### El `.env` de tu compañero

El archivo `.env` **no se sube a GitHub** (está ignorado). Si trabajás con un
compañero, que él genere el suyo:

```bash
copy .env.example .env   # y completar los valores reales
```

Las claves reales (`AUTH_SECRET`, `RESEND_API_KEY`, etc.) se comparten por un
canal privado (WhatsApp, Drive, correo), **nunca** por el repositorio.

> Si comparten la misma base de datos y sesiones, el `AUTH_SECRET` debe ser
> idéntico en ambas máquinas. Con SQLite local (cada uno su `dev.db`) cada uno
> puede tener el suyo.

## 5. Problemas comunes

| Problema | Solución |
| --- | --- |
| `push` rechazado por cambios en GitHub | `git pull origin main` y volver a `git push` |
| Subí un archivo que no debía | `git rm --cached <archivo>` y agregalo a `.gitignore` |
| Quiero deshacer el último commit sin borrar cambios | `git reset --soft HEAD~1` |
| No sé qué cambió | `git diff` (sin commitear) o `git log --oneline -10` |
| Quiero ver el estado remoto | `git remote -v` y `git status` |

## 6. Buenas prácticas

- Commitear seguido con mensajes cortos y descriptivos.
- `git pull` antes de empezar a trabajar si hay más gente en el repo.
- No pushear directo a `main` en proyectos grandes; usar ramas:
  ```bash
  git checkout -b mi-feature
  # ... trabajar ...
  git add -A
  git commit -m "feat: mi feature"
  git push origin mi-feature
  ```
- Mantener `.env` y los secretos fuera del repo.