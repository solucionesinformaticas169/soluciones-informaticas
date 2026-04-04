export const company = {
  name: "Soluciones Informaticas",
  legalName: "Soluciones Informaticas",
  slogan: "Tecnologia inteligente para empresas y profesionales",
  phoneDisplay: "0998622737",
  phoneIntl: "593998622737",
  email: "solucionesinformaticas226@gmail.com",
  whatsappMessage: "Hola, quiero informacion sobre sus servicios tecnologicos."
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
    eyebrow: "Experiencias moviles",
    description:
      "Aplicaciones moviles y soluciones conectadas con APIs, bases de datos, autenticacion, notificaciones y sincronizacion en tiempo real."
  },
  {
    title: "Automatizacion",
    eyebrow: "Ahorro operativo",
    description:
      "Automatizacion de procesos, bots, recordatorios, formularios y flujos para ventas, soporte y seguimiento de clientes."
  },
  {
    title: "Informatica forense",
    eyebrow: "Evidencia digital",
    description:
      "Peritaje informatico, analisis de evidencia digital, trazabilidad tecnica y soporte para casos especializados."
  },
  {
    title: "Inteligencia artificial",
    eyebrow: "Automatizacion inteligente",
    description:
      "Chatbots, asistentes virtuales, clasificacion automatica, respuestas inteligentes y herramientas de IA aplicadas al negocio."
  },
  {
    title: "Sistemas de citas",
    eyebrow: "Conversion y seguimiento",
    description:
      "Agendamiento online con confirmaciones, recordatorios, panel administrativo y base lista para evolucionar a SaaS."
  }
] as const;

export const defaultServices = [
  {
    name: "Diagnostico inicial",
    slug: "diagnostico-inicial",
    shortDescription: "Revision del requerimiento, prioridades del negocio y propuesta tecnica inicial.",
    description: "Sesion inicial para entender el problema, alcance y mejor camino tecnico."
  },
  {
    name: "Desarrollo de software",
    slug: "desarrollo-de-software",
    shortDescription: "Sistemas web empresariales hechos a medida para procesos internos o atencion al cliente.",
    description: "Construccion de sistemas administrativos, CRM, ERP y plataformas operativas."
  },
  {
    name: "Aplicaciones moviles",
    slug: "aplicaciones-moviles",
    shortDescription: "Apps conectadas con APIs, bases de datos y flujos sincronizados.",
    description: "Desarrollo de aplicaciones moviles y experiencias conectadas con backend."
  },
  {
    name: "Automatizacion de procesos",
    slug: "automatizacion-de-procesos",
    shortDescription: "Bots, formularios, notificaciones y flujos que reducen tareas manuales.",
    description: "Automatizacion de operaciones, seguimiento comercial y tareas repetitivas."
  },
  {
    name: "Informatica forense",
    slug: "informatica-forense",
    shortDescription: "Analisis de evidencia digital, soporte tecnico y trazabilidad especializada.",
    description: "Peritaje informatico, analisis de evidencia y documentacion tecnica."
  },
  {
    name: "Chatbot e IA",
    slug: "chatbot-e-ia",
    shortDescription: "Asistentes inteligentes para soporte, ventas y automatizacion avanzada.",
    description: "Integracion de chatbots, asistentes y procesos impulsados por IA."
  },
  {
    name: "Asesoria tecnologica",
    slug: "asesoria-tecnologica",
    shortDescription: "Acompanamiento para decidir arquitectura, herramientas e integraciones.",
    description: "Consultoria para evolucionar procesos, sistemas y estrategia digital."
  }
] as const;

export const valuePoints = [
  "Arquitectura profesional lista para crecer",
  "Automatizacion por WhatsApp y correo",
  "Panel administrativo para operacion diaria",
  "Base tecnica preparada para evolucionar a SaaS"
] as const;

export const processSteps = [
  {
    step: "01",
    title: "Diagnostico y alcance",
    description: "Analizamos tu necesidad, el flujo del negocio y la mejor solucion para resolverlo de forma profesional."
  },
  {
    step: "02",
    title: "Diseno y desarrollo",
    description: "Construimos interfaces claras, backend robusto e integraciones reales con enfoque en rendimiento y escalabilidad."
  },
  {
    step: "03",
    title: "Automatizacion y despliegue",
    description: "Conectamos base de datos, notificaciones, paneles y dejamos tu sistema listo para operar y crecer."
  }
] as const;

export const adminHighlights = [
  "Ver citas agendadas y estado de cada solicitud",
  "Confirmar, reprogramar o cancelar reservas",
  "Administrar servicios, clientes y notas",
  "Consultar estadisticas para tomar decisiones"
] as const;
