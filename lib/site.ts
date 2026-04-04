export const company = {
  name: "Soluciones Informáticas",
  legalName: "Soluciones Informáticas",
  slogan: "Tecnología inteligente para empresas y profesionales",
  phoneDisplay: "0998622737",
  phoneIntl: "593998622737",
  email: "solucionesinformaticas226@gmail.com",
  whatsappMessage: "Hola, quiero información sobre sus servicios tecnológicos."
};

export const whatsappUrl = `https://wa.me/${company.phoneIntl}?text=${encodeURIComponent(company.whatsappMessage)}`;

export const serviceCards = [
  {
    title: "Software empresarial",
    eyebrow: "Sistemas web",
    description:
      "Desarrollo de sistemas web empresariales, paneles administrativos, CRM, portales internos y plataformas hechas a la medida."
  },
  {
    title: "Apps conectadas",
    eyebrow: "Experiencias móviles",
    description:
      "Aplicaciones móviles y soluciones conectadas con APIs, bases de datos, autenticación, notificaciones y sincronización en tiempo real."
  },
  {
    title: "Automatización",
    eyebrow: "Ahorro operativo",
    description:
      "Automatización de procesos, bots, recordatorios, formularios y flujos para ventas, soporte y seguimiento de clientes."
  },
  {
    title: "Informática forense",
    eyebrow: "Evidencia digital",
    description:
      "Peritaje informático, análisis de evidencia digital, trazabilidad técnica y soporte para casos especializados."
  },
  {
    title: "Inteligencia artificial",
    eyebrow: "Automatización inteligente",
    description:
      "Chatbots, asistentes virtuales, clasificación automática, respuestas inteligentes y herramientas de IA aplicadas al negocio."
  },
  {
    title: "Sistemas de citas",
    eyebrow: "Conversión y seguimiento",
    description:
      "Agendamiento online con confirmaciones, recordatorios, panel administrativo y base lista para evolucionar a SaaS."
  }
] as const;

export const defaultServices = [
  {
    name: "Diagnóstico inicial",
    slug: "diagnostico-inicial",
    shortDescription: "Revisión del requerimiento, prioridades del negocio y propuesta técnica inicial.",
    description: "Sesión inicial para entender el problema, alcance y mejor camino técnico."
  },
  {
    name: "Desarrollo de software",
    slug: "desarrollo-de-software",
    shortDescription: "Sistemas web empresariales hechos a medida para procesos internos o atención al cliente.",
    description: "Construcción de sistemas administrativos, CRM, ERP y plataformas operativas."
  },
  {
    name: "Aplicaciones móviles",
    slug: "aplicaciones-moviles",
    shortDescription: "Apps conectadas con APIs, bases de datos y flujos sincronizados.",
    description: "Desarrollo de aplicaciones móviles y experiencias conectadas con backend."
  },
  {
    name: "Automatización de procesos",
    slug: "automatizacion-de-procesos",
    shortDescription: "Bots, formularios, notificaciones y flujos que reducen tareas manuales.",
    description: "Automatización de operaciones, seguimiento comercial y tareas repetitivas."
  },
  {
    name: "Informática forense",
    slug: "informatica-forense",
    shortDescription: "Análisis de evidencia digital, soporte técnico y trazabilidad especializada.",
    description: "Peritaje informático, análisis de evidencia y documentación técnica."
  },
  {
    name: "Chatbot e IA",
    slug: "chatbot-e-ia",
    shortDescription: "Asistentes inteligentes para soporte, ventas y automatización avanzada.",
    description: "Integración de chatbots, asistentes y procesos impulsados por IA."
  },
  {
    name: "Asesoría tecnológica",
    slug: "asesoria-tecnologica",
    shortDescription: "Acompañamiento para decidir arquitectura, herramientas e integraciones.",
    description: "Consultoría para evolucionar procesos, sistemas y estrategia digital."
  }
] as const;

export const valuePoints = [
  "Arquitectura profesional lista para crecer",
  "Automatización por WhatsApp y correo",
  "Panel administrativo para operación diaria",
  "Base técnica preparada para evolucionar a SaaS"
] as const;

export const processSteps = [
  {
    step: "01",
    title: "Diagnóstico y alcance",
    description: "Analizamos tu necesidad, el flujo del negocio y la mejor solución para resolverlo de forma profesional."
  },
  {
    step: "02",
    title: "Diseño y desarrollo",
    description: "Construimos interfaces claras, backend robusto e integraciones reales con enfoque en rendimiento y escalabilidad."
  },
  {
    step: "03",
    title: "Automatización y despliegue",
    description: "Conectamos base de datos, notificaciones, paneles y dejamos tu sistema listo para operar y crecer."
  }
] as const;

export const adminHighlights = [
  "Ver citas agendadas y estado de cada solicitud",
  "Confirmar, reprogramar o cancelar reservas",
  "Administrar servicios, clientes y notas",
  "Consultar estadísticas para tomar decisiones"
] as const;
