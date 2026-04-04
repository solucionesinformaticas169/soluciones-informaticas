# Soluciones Informaticas Starter

Base profesional para una web corporativa con:

- Next.js 14
- PostgreSQL
- Prisma
- Tailwind CSS
- Formulario de citas
- Panel administrativo privado
- Catalogo de servicios en base de datos
- Registro de notificaciones para WhatsApp y correo
- Cola persistente de notificaciones con reintentos

## Flujo actual

- El sitio publico presenta la marca, servicios y formulario de agendamiento.
- Las citas se guardan en PostgreSQL como `PENDING`.
- El admin puede iniciar sesion, revisar citas y cambiar estados.
- Los servicios pueden administrarse desde `/admin/services`.
- El sistema registra el intento de notificacion por WhatsApp y correo.
- Las notificaciones se encolan en base de datos y se procesan aparte para no frenar el formulario.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Variables nuevas importantes:

- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `APP_BASE_URL`
- `NOTIFICATION_PROCESSOR_SECRET`

## 3. Crear la base de datos y migrar

```bash
npx prisma migrate dev --name admin_phase
```

## 4. Ejecutar en desarrollo

```bash
npm run dev
```

## 5. Accesos principales

- Sitio publico: `/`
- Agendamiento: `/agendar`
- Login admin: `/admin/login`
- Dashboard admin: `/admin`

## 6. Siguiente fase recomendada

1. Integrar envio real de correo.
2. Conectar WhatsApp Business API.
3. Anadir disponibilidad por horarios.
4. Agregar usuarios, roles y auditoria.
5. Preparar multiempresa para evolucion a SaaS.

## 7. Procesador de notificaciones

- Endpoint interno: `/api/notifications/process`
- Requiere `Authorization: Bearer <NOTIFICATION_PROCESSOR_SECRET>` o `?secret=<NOTIFICATION_PROCESSOR_SECRET>` en produccion
- La app intenta dispararlo sola al crear o actualizar citas
- Para produccion conviene ejecutarlo tambien por cron cada minuto desde tu plataforma
- Ya se incluye [vercel.json](/C:/Users/Adrian/Documents/Pagina%20profesional/soluciones-informaticas-starter/vercel.json) con cron por minuto para Vercel
