# Pagos con PayPhone

## Alcance

- Pagina publica `/pagos`: concepto y monto total en USD. Los datos del titular se completan directamente en PayPhone.
- Monto permitido: USD 1 a USD 5.000, hasta dos decimales. El limite del comercio en PayPhone puede ser menor.
- El monto es el total acordado; se cobra exactamente ese valor, sin calculos ni recargos automaticos.
- La Cajita oficial captura la tarjeta. Esta aplicacion no guarda tarjeta, CVV ni respuestas completas del proveedor.
- Historial protegido en `/admin/payments`, filtros por estado y 20 registros por pagina.
- No modifica suscripciones, credenciales ni bases de datos del SaaS medico.

## Configuracion previa

1. Aplicar la migracion en la base de datos de ESTE proyecto: `npx prisma migrate deploy`.
2. En PayPhone Developer configurar la aplicacion WEB para el dominio de Soluciones Informaticas. No reemplazar el dominio ni el retorno de la aplicacion del SaaS medico; usar una aplicacion independiente si hace falta.
3. Registrar como retorno `https://www.solucionesinformaticas.dev/api/payments/payphone/return` (o el dominio definitivo del proyecto).
4. Configurar las variables indicadas abajo en el entorno correspondiente.
5. Probar con credenciales de prueba del proveedor antes de activar produccion.

El historial exige ademas un `AUTH_SECRET` aleatorio de al menos 32 caracteres y la sesion administrativa. No usar las claves de ejemplo. Cambiar esta clave invalida las sesiones existentes.

En un build de produccion de Vercel, `scripts/deploy-payment-migrations.cjs` verifica el historial y aplica exclusivamente las migraciones de pagos pendientes. Si encuentra migraciones anteriores ajenas a pagos o una migracion sin terminar, detiene el build. En local y Preview no modifica bases de datos. Esto permite usar la conexion protegida del entorno sin descargar secretos de produccion.

Variables:

```dotenv
PAYPHONE_ENABLED=false
PAYPHONE_ENVIRONMENT=test
PAYPHONE_TOKEN=
PAYPHONE_STORE_ID=
```

La pagina no selecciona tasas, no calcula ni desglosa impuestos y no emite facturas tributarias. Cualquier calculo o facturacion se coordina externamente. El cliente ingresa el total final acordado. La Cajita recibe ese mismo total en sus campos `amount` y `amountWithoutTax`, sin un desglose calculado por esta web.

La migracion `payment_total_only` elimina exclusivamente la configuracion y las columnas del desglose anterior. Conserva los pagos, sus montos totales, referencias y estados. Las migraciones previas se conservan para no alterar el historial de instalaciones que ya las hayan aplicado.

`PAYPHONE_ENABLED=true` habilita el formulario solo cuando el resto de la configuracion es valida. `PAYPHONE_ENVIRONMENT` es una etiqueta local; NO convierte credenciales reales en credenciales de prueba ni cambia el endpoint. El ambiente real depende de la configuracion del proveedor. No copiar automaticamente los secretos del otro proyecto.

La Cajita requiere su token en el navegador, segun el contrato de integracion de PayPhone. Nunca colocar credenciales de otros servicios ni secretos administrativos en sus opciones. Confirmar con el proveedor el alcance del token y restringir el dominio registrado.

## Confirmacion y errores

El servidor confirma con PayPhone y compara identificador del cliente, transaccion del proveedor, moneda USD, monto en centavos y estado aprobado. Las URL de retorno no son prueba de pago. Una concesion temporal en PostgreSQL evita confirmaciones concurrentes; los estados aprobados no vuelven a procesarse. Las referencias del proveedor son unicas.

Si hay un timeout o respuesta inconsistente, el estado queda en revision, nunca en aprobado o rechazado por suposicion. El cliente puede reintentar verificar sin crear otro cobro. Si PayPhone ya confirmo pero la respuesta o escritura local se perdio, puede ser necesaria conciliacion manual en PayPhone Business. El panel no permite aprobar pagos manualmente.

PayPhone exige confirmar dentro de cinco minutos del pago y puede reversar un cobro no confirmado. Es imprescindible comprobar el retorno publico antes del lanzamiento. No existe un webhook ni una tarea de conciliacion automatica en esta implementacion: si el cliente no vuelve al sitio, no se debe asumir que el pago fue aprobado.

El enlace del resultado contiene un UUID aleatorio y funciona como referencia privada: no muestra nombre, correo, telefono ni datos de tarjeta. No compartir ese enlace publicamente.

## Verificacion

`npm run test:payments` ejecuta pruebas locales con respuestas simuladas, sin tarjetas, red ni escrituras a bases de datos. `npx tsc --noEmit` valida tipos.

Antes de produccion probar: monto invalido, campos vacios, carga de Cajita en movil, aprobacion de prueba, cancelacion, retorno repetido, monto o moneda distintos y perdida de conexion. Verificar historial en el panel con la sesion administrativa y comprobar que usuarios sin sesion no pueden verlo.

Documentacion oficial: https://docs.payphone.app/cajita-de-pagos
