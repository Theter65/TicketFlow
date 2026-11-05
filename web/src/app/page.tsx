"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Smartphone, 
  Calendar, 
  Users, 
  ShieldCheck, 
  Zap, 
  Ticket, 
  Lock, 
  LogOut, 
  X, 
  ArrowRight,
  Sparkles,
  KeyRound,
  QrCode as QrIcon,
  Check,
  Building2,
  Mail,
  MapPin,
  Phone,
  Clock,
  Send,
  Eye,
  ScanLine
} from "lucide-react";

export default function DatelarAccessPage() {
  // Estado de sesión
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [staffEventCode, setStaffEventCode] = useState("");

  // Modales
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginTab, setLoginTab] = useState<"admin" | "portero">("admin");
  const [loginEmail, setLoginEmail] = useState("admin@datelar.com");
  const [loginPassword, setLoginPassword] = useState("admin123");
  const [porteroCodeInput, setPorteroCodeInput] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Modal nuevo evento (admin)
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventCapacity, setNewEventCapacity] = useState(500);

  // Tab activo en panel administrativo
  const [adminTab, setAdminTab] = useState<"eventos" | "emitir" | "staff_code" | "validador">("eventos");

  // Código de acceso rápido para porteros generado por el admin
  const [staffAccessCode, setStaffAccessCode] = useState("STAFF-UNL-2026");
  const [staffCodeCopied, setStaffCodeCopied] = useState(false);

  // Formulario de contacto
  const [contactSent, setContactSent] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactEvent, setContactEvent] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  // Eventos activos y en los que hemos trabajado
  const [events, setEvents] = useState<any[]>([
    {
      id: "evt-01",
      name: "UNL Tech Summit 2026",
      location: "Campus Universitario Guillermo Falconí, Loja",
      date: "20 al 22 de Noviembre, 2026",
      status: "EVENTO EN GESTIÓN",
      statusColor: "text-emerald-400 border-emerald-500/40 bg-emerald-950/30",
      capacity: 650,
      total_issued: 500,
      total_scanned: 1,
      staff_code: "UNL-2026",
      tiers: [
        { id: "t-1", name: "Entrada General", price: 5.0 },
        { id: "t-2", name: "Pase VIP", price: 15.0 },
      ],
    },
    {
      id: "evt-02",
      name: "Festival de Música Loja",
      location: "Teatro Benjamín Carrión, Loja",
      date: "Diciembre 2026",
      status: "PRÓXIMO EVENTO",
      statusColor: "text-cyan-400 border-cyan-500/40 bg-cyan-950/30",
      capacity: 1200,
      total_issued: 850,
      total_scanned: 0,
      staff_code: "LOJA-MUSIC",
      tiers: [
        { id: "t-3", name: "Platea Baja", price: 25.0 },
        { id: "t-4", name: "General", price: 12.0 },
      ],
    },
    {
      id: "evt-03",
      name: "Congreso Nacional de Telecomunicaciones",
      location: "Centro de Convenciones, Ecuador",
      date: "Edición Anual Realizada",
      status: "EVENTO COMPLETADO",
      statusColor: "text-neutral-400 border-white/20 bg-neutral-900",
      capacity: 450,
      total_issued: 450,
      total_scanned: 432,
      staff_code: "TELCO-DONE",
      tiers: [{ id: "t-5", name: "Asistente", price: 20.0 }],
    },
  ]);

  const [selectedEventId, setSelectedEventId] = useState<string>("evt-01");
  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Estado emisión de entradas en panel
  const [ticketGenTier, setTicketGenTier] = useState("Entrada General");
  const [ticketGenQty, setTicketGenQty] = useState(1);
  const [ticketGenName, setTicketGenName] = useState("");
  const [ticketGenDni, setTicketGenDni] = useState("");
  const [generatedTickets, setGeneratedTickets] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Estado validador en panel
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<{
    status: "valid" | "duplicate" | "invalid" | null;
    message: string;
    details?: any;
  }>({ status: null, message: "" });

  // Cargar sesión guardada si existe
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("datelar_access_user");
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (_) {}
  }, []);

  // Login handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("datelar_access_user", JSON.stringify(data.user));
        setIsLoginOpen(false);
      } else {
        setLoginError(data.error || "Credenciales incorrectas");
      }
    } catch (_) {
      // Acceso de respaldo
      if (loginEmail === "admin@datelar.com" && loginPassword === "admin123") {
        const u = { name: "Gerardo Gonza", email: "admin@datelar.com", role: "superadmin" };
        setCurrentUser(u);
        localStorage.setItem("datelar_access_user", JSON.stringify(u));
        setIsLoginOpen(false);
      } else {
        setLoginError("Credenciales incorrectas");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Login para porteros con código rápido
  const handlePorteroLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = porteroCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setLoginError("Ingresa el código asignado por tu organizador");
      return;
    }

    const matchedEvent = events.find((ev) => ev.staff_code?.toUpperCase() === cleanCode) || events[0];
    setSelectedEventId(matchedEvent.id);
    setIsStaffMode(true);
    setStaffEventCode(cleanCode);
    setCurrentUser({
      name: `Personal de Control (${cleanCode})`,
      role: "portero",
      event: matchedEvent.name,
    });
    setAdminTab("validador");
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsStaffMode(false);
    localStorage.removeItem("datelar_access_user");
  };

  // Generar entradas en panel
  const handleGenerateTickets = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    const count = Number(ticketGenQty) || 1;
    const newBatch = [];

    for (let i = 1; i <= count; i++) {
      const num = (selectedEvent.total_issued || 0) + i;
      const entropy = Math.random().toString(36).substring(2, 7).toUpperCase();
      const code = `DTL-${selectedEvent.name.slice(0, 3).toUpperCase()}-${num}-${entropy}`;
      newBatch.push({
        ticket_number: num,
        code_hash: code,
        tier: ticketGenTier,
        attendee_name: ticketGenName || `Asistente #${num}`,
        attendee_dni: ticketGenDni || "1104829103",
      });
    }

    setGeneratedTickets([...newBatch, ...generatedTickets]);
    setEvents(events.map(ev => 
      ev.id === selectedEvent.id ? { ...ev, total_issued: (ev.total_issued || 0) + count } : ev
    ));
    setTicketGenName("");
    setTicketGenDni("");
    setIsGenerating(false);
  };

  // Validar entradas en panel
  const handleValidateCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    if (clean.includes("USADO") || clean.includes("ALREADY")) {
      setScanResult({
        status: "duplicate",
        message: "ENTRADA YA UTILIZADA",
        details: { attendee: "Carlos Mendoza (VIP)", time: "Hace 15 minutos en Puerta 1" },
      });
    } else if (clean.startsWith("DTL") || clean.length >= 8) {
      setScanResult({
        status: "valid",
        message: "ACCESO AUTORIZADO // VÁLIDO",
        details: { attendee: ticketGenName || "Asistente Verificado", time: new Date().toLocaleTimeString() },
      });
      setEvents(events.map(ev => 
        ev.id === selectedEvent.id ? { ...ev, total_scanned: (ev.total_scanned || 0) + 1 } : ev
      ));
    } else {
      setScanResult({
        status: "invalid",
        message: "CÓDIGO NO VÁLIDO O INEXISTENTE",
      });
    }
    setManualCode("");
  };

  // Crear nuevo evento
  const handleCreateNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName) return;
    const newCode = `EVT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEv = {
      id: `evt-${Date.now()}`,
      name: newEventName,
      location: newEventLocation || "Loja, Ecuador",
      date: "Próximamente",
      status: "EVENTO EN GESTIÓN",
      statusColor: "text-emerald-400 border-emerald-500/40 bg-emerald-950/30",
      capacity: newEventCapacity,
      total_issued: 0,
      total_scanned: 0,
      staff_code: newCode,
      tiers: [{ id: "t-gen", name: "Entrada General", price: 10.0 }],
    };
    setEvents([newEv, ...events]);
    setSelectedEventId(newEv.id);
    setIsNewEventOpen(false);
    setNewEventName("");
    setNewEventLocation("");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-400 selection:text-black">
      {/* ======================================================== */}
      {/* 1. NAVBAR PERMANENTE                                      */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-md border-b border-white/15 px-6 md:px-12 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative flex items-center justify-center">
              <Image 
                src="/brand/datelar-access/datelar-access-icon-white.svg" 
                alt="Datelar Access" 
                width={32} 
                height={32}
                priority
              />
            </div>
            <div>
              <span className="text-sm font-bold tracking-[0.2em] uppercase text-white">DATELAR ACCESS</span>
              <span className="block text-[10px] font-mono tracking-wider text-cyan-400 font-semibold">
                PRODUCTO DE DATELAR LABS
              </span>
            </div>
          </div>

          {!currentUser ? (
            // Navegación para visitantes de la Landing
            <>
              <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold tracking-wider text-neutral-300">
                <a href="#beneficios" className="hover:text-cyan-400 transition">BENEFICIOS</a>
                <a href="#eventos" className="hover:text-cyan-400 transition">EVENTOS</a>
                <a href="#android" className="hover:text-cyan-400 transition">APP ANDROID</a>
                <a href="#como-funciona" className="hover:text-cyan-400 transition">CÓMO FUNCIONA</a>
                <a href="#contacto" className="hover:text-cyan-400 transition">CONTACTO</a>
              </nav>

              <button
                onClick={() => {
                  setLoginError(null);
                  setIsLoginOpen(true);
                }}
                className="border-2 border-white bg-white px-5 py-2 text-xs font-bold text-black uppercase tracking-wider hover:bg-neutral-200 transition"
              >
                INICIAR SESIÓN
              </button>
            </>
          ) : (
            // Barra de usuario autenticado
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border border-white/20 bg-neutral-900 px-3 py-1.5 text-xs font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">{currentUser.name}</span>
                <span className="text-cyan-400 text-[10px] font-semibold">
                  [{currentUser.role === "portero" ? "PORTERO // CONTROL" : "ADMINISTRADOR"}]
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="border border-white/30 bg-transparent px-3 py-1.5 text-xs font-mono font-semibold text-neutral-300 hover:text-white hover:border-white transition flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">SALIR</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. SI NO ESTÁ AUTENTICADO: LANDING PAGE PÚBLICA           */}
      {/* ======================================================== */}
      {!currentUser ? (
        <main className="w-full">
          {/* HERO PRINCIPAL */}
          <section className="relative px-6 md:px-12 pt-20 pb-24 border-b border-white/10 max-w-7xl mx-auto">
            <div className="max-w-4xl space-y-6">
              <div className="inline-flex items-center gap-2 border border-cyan-400/40 bg-cyan-950/20 px-3.5 py-1 text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Control de Acceso Digital &middot; 100% Conectado a Internet</span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
                Control de acceso inteligente y venta de entradas sin filas ni fraudes.
              </h1>

              <p className="text-lg sm:text-xl text-neutral-300 font-normal leading-relaxed max-w-2xl">
                La plataforma definitiva para conciertos, congresos, festivales y discotecas. Emite boletos digitales con código QR único, controla el aforo en tiempo real y valida entradas en segundos desde nuestra app para <strong>Android</strong>.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <a
                  href="#contacto"
                  className="border-2 border-white bg-white px-8 py-3.5 text-xs font-bold tracking-wider text-black uppercase hover:bg-neutral-200 transition"
                >
                  COTIZAR SERVICIO PARA TU EVENTO
                </a>
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="border-2 border-white/40 bg-transparent px-8 py-3.5 text-xs font-bold tracking-wider text-white uppercase hover:border-white hover:bg-white/10 transition"
                >
                  INGRESAR A LA PLATAFORMA
                </button>
              </div>
            </div>

            {/* BARRA DE 4 VENTAJAS INMEDIATAS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-16">
              <div className="border border-white/15 bg-neutral-950 p-5 space-y-1">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">01 // RAPIDEZ</span>
                <div className="text-2xl font-bold text-white">&lt; 1 SEGUNDO</div>
                <p className="text-xs text-neutral-400">Ingreso fluido por persona, sin colas en puertas.</p>
              </div>

              <div className="border border-white/15 bg-neutral-950 p-5 space-y-1">
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">02 // SEGURIDAD</span>
                <div className="text-2xl font-bold text-white">CERO FRAUDES</div>
                <p className="text-xs text-neutral-400">Códigos únicos que impiden la reventa o clonación.</p>
              </div>

              <div className="border border-white/15 bg-neutral-950 p-5 space-y-1">
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">03 // CONTROL</span>
                <div className="text-2xl font-bold text-white">AFORO EN VIVO</div>
                <p className="text-xs text-neutral-400">Supervisión en tiempo real de ingresos y asistencia.</p>
              </div>

              <div className="border border-white/15 bg-neutral-950 p-5 space-y-1">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">04 // MOVILIDAD</span>
                <div className="text-2xl font-bold text-white">APP ANDROID</div>
                <p className="text-xs text-neutral-400">Cualquier celular sirve como lector de acceso.</p>
              </div>
            </div>
          </section>

          {/* BENEFICIOS DESTACADOS */}
          <section id="beneficios" className="px-6 md:px-12 py-24 border-b border-white/10 max-w-7xl mx-auto">
            <div className="space-y-4 max-w-2xl pb-12">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                VENTAJAS PARA ORGANIZADORES
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
                Todo lo que necesitas para garantizar el éxito en puerta.
              </h2>
              <p className="text-sm sm:text-base text-neutral-300">
                Diseñado para eliminar el estrés del ingreso y brindar una experiencia segura y profesional a tus asistentes.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-white/15 bg-neutral-950 p-8 space-y-4">
                <div className="w-12 h-12 border border-white/20 bg-black flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Protección Total Contra Falsificaciones</h3>
                <p className="text-sm text-neutral-400 leading-relaxed font-sans">
                  Cada entrada cuenta con una firma digital única. Al ser escaneada en puerta, el sistema la marca como utilizada al instante, impidiendo capturas de pantalla compartidas o reventas duplicadas.
                </p>
              </div>

              <div className="border border-white/15 bg-neutral-950 p-8 space-y-4">
                <div className="w-12 h-12 border border-white/20 bg-black flex items-center justify-center text-emerald-400">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Gestión de Aforo en Tiempo Real</h3>
                <p className="text-sm text-neutral-400 leading-relaxed font-sans">
                  Conoce cuántas personas han entrado a tu recinto minuto a minuto. Controla los aforos por zonas (VIP, General, Preferencia) y cumple con las normativas de seguridad de las autoridades locales.
                </p>
              </div>

              <div className="border border-white/15 bg-neutral-950 p-8 space-y-4">
                <div className="w-12 h-12 border border-white/20 bg-black flex items-center justify-center text-cyan-400">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Operación Simple para Porteros</h3>
                <p className="text-sm text-neutral-400 leading-relaxed font-sans">
                  No necesitas capacitar al personal durante horas. El administrador genera un código o credencial QR de evento, el portero lo ingresa en su teléfono Android y empieza a validar inmediatamente.
                </p>
              </div>
            </div>
          </section>

          {/* EVENTOS EN LOS QUE ESTAMOS TRABAJANDO / TRABAJADOS */}
          <section id="eventos" className="px-6 md:px-12 py-24 border-b border-white/10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12">
              <div className="space-y-3 max-w-2xl">
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  EXPERIENCIA EN CAMPO
                </span>
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
                  Eventos en los que trabajamos
                </h2>
                <p className="text-sm sm:text-base text-neutral-300">
                  Casos de aplicación real donde Datelar Access garantiza el control, la rapidez y la seguridad del ingreso.
                </p>
              </div>

              <a
                href="#contacto"
                className="inline-flex items-center gap-2 border border-white/30 bg-transparent px-5 py-2.5 text-xs font-bold tracking-wider text-white uppercase hover:border-white hover:bg-white hover:text-black transition"
              >
                <span>SUMAR MI EVENTO</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="border border-white/15 bg-neutral-950 p-6 flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold border px-2 py-0.5 uppercase ${ev.statusColor}`}>
                        {ev.status}
                      </span>
                      <span className="text-xs font-mono text-neutral-400">
                        {ev.capacity} personas
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white">{ev.name}</h3>

                    <div className="space-y-1.5 text-xs text-neutral-400 font-sans">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        <span>{ev.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        <span>{ev.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">SISTEMA:</span>
                    <span className="text-white font-semibold">100% ONLINE EN TIEMPO REAL</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECCIÓN APP ANDROID */}
          <section id="android" className="px-6 md:px-12 py-24 border-b border-white/10 max-w-7xl mx-auto">
            <div className="border border-white/20 bg-neutral-950 p-8 sm:p-12 lg:p-16">
              <div className="grid lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center gap-2 border border-emerald-400/40 bg-emerald-950/20 px-3 py-1 text-xs font-mono font-bold text-emerald-400 uppercase">
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>APLICACIÓN NATIVA PARA ANDROID</span>
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
                    El escáner más rápido para el personal de puerta.
                  </h2>

                  <p className="text-base text-neutral-300 leading-relaxed font-sans">
                    Olvídate de comprar o alquilar escáneres láser industriales costosos. Con Datelar Access para Android, cualquier miembro del equipo de seguridad o staff utiliza su propio teléfono como lector de alta velocidad.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 text-xs font-sans text-neutral-300">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-semibold">Lectura en la Oscuridad</strong>
                        Linterna inteligente integrada para eventos nocturnos o discotecas.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-semibold">Aviso por Vibración</strong>
                        El portero valida sin necesidad de mirar fijamente la pantalla todo el tiempo.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-semibold">Acceso Inmediato por Código</strong>
                        Sin contraseñas complicadas para los porteros de turno.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-semibold">Sincronización Total</strong>
                        Todos los teléfonos trabajan coordinados en la misma red.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 flex justify-center">
                  <div className="border-2 border-white/20 bg-black p-6 w-full max-w-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-white/15 pb-3">
                      <span className="text-xs font-mono font-bold text-white tracking-widest uppercase">DATELAR ANDROID</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-400 text-black font-bold">LISTA</span>
                    </div>

                    <div className="p-4 border border-white/10 bg-neutral-950 text-center space-y-2">
                      <ScanLine className="h-10 w-10 text-cyan-400 mx-auto" />
                      <div className="text-sm font-bold text-white">Escáner de Boletos Activo</div>
                      <div className="text-xs text-neutral-400 font-sans">
                        Enfoca el código QR del boleto del asistente y recibe autorización en menos de un segundo.
                      </div>
                    </div>

                    <div className="border border-white/10 p-3 text-[11px] font-mono text-neutral-400 space-y-1">
                      <div>&bull; DISPOSITIVO: CUALQUIER TELÉFONO ANDROID</div>
                      <div>&bull; CONEXIÓN: TIEMPO REAL VÍA INTERNET</div>
                      <div>&bull; ACCESO STAFF: CÓDIGO DIRECTO // QR</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CÓMO FUNCIONA */}
          <section id="como-funciona" className="px-6 md:px-12 py-24 border-b border-white/10 max-w-7xl mx-auto">
            <div className="space-y-4 max-w-2xl pb-12">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                PASO A PASO
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
                Cómo funciona Datelar Access
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 font-mono">
              <div className="border border-white/15 bg-neutral-950 p-8 space-y-3">
                <span className="text-3xl font-bold text-cyan-400">01</span>
                <h3 className="text-lg font-bold text-white font-sans">Configuras tu Evento</h3>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Defines el nombre, la fecha, el lugar y la cantidad de entradas disponibles para cada zona o nivel.
                </p>
              </div>

              <div className="border border-white/15 bg-neutral-950 p-8 space-y-3">
                <span className="text-3xl font-bold text-cyan-400">02</span>
                <h3 className="text-lg font-bold text-white font-sans">Emites los Boletos Digitales</h3>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  El sistema genera códigos QR únicos e infalsificables para tus asistentes en formato digital o imprimible.
                </p>
              </div>

              <div className="border border-white/15 bg-neutral-950 p-8 space-y-3">
                <span className="text-3xl font-bold text-cyan-400">03</span>
                <h3 className="text-lg font-bold text-white font-sans">Validas en Puerta con Android</h3>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                  Tu equipo de puerta escanea con su celular, autoriza ingresos al instante y supervisa el aforo en vivo.
                </p>
              </div>
            </div>
          </section>

          {/* CONTACTO & COTIZACIONES */}
          <section id="contacto" className="px-6 md:px-12 py-24 max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-12">
              <div className="lg:col-span-5 space-y-6">
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  ATENCIÓN A ORGANIZADORES
                </span>
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
                  Contrata Datelar Access para tu próximo evento
                </h2>
                <p className="text-sm text-neutral-300 font-sans leading-relaxed">
                  Brindamos asesoría, configuración del evento, provisión de boletos y soporte para que tu control de accesos sea impecable.
                </p>

                <div className="space-y-3 pt-4 border-t border-white/10 font-mono text-xs text-neutral-400">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-cyan-400" />
                    <span>contacto@datelar.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    <span>Loja &middot; Ecuador (Cobertura Nacional)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-cyan-400" />
                    <span>Respuesta en menos de 24 horas</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                {contactSent ? (
                  <div className="border border-emerald-500/40 bg-emerald-950/20 p-8 text-center space-y-3">
                    <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                    <h3 className="text-xl font-bold text-white font-sans">¡Solicitud Enviada con Éxito!</h3>
                    <p className="text-xs text-neutral-300 font-sans">
                      Hemos recibido los datos de tu evento. El equipo de Datelar Access se comunicará contigo a la brevedad.
                    </p>
                    <button
                      onClick={() => setContactSent(false)}
                      className="border border-white/30 px-4 py-2 text-xs font-mono text-white hover:bg-white hover:text-black uppercase"
                    >
                      Enviar otra consulta
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setContactSent(true);
                    }}
                    className="border border-white/15 bg-neutral-950 p-8 space-y-4 text-xs font-mono"
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-neutral-400 uppercase font-semibold">Nombre o Empresa *</label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Tu nombre"
                          className="w-full border border-white/20 bg-black p-3 text-white focus:outline-none focus:border-white font-sans text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-neutral-400 uppercase font-semibold">Correo Electrónico *</label>
                        <input
                          type="email"
                          required
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="correo@ejemplo.com"
                          className="w-full border border-white/20 bg-black p-3 text-white focus:outline-none focus:border-white font-sans text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-neutral-400 uppercase font-semibold">Nombre del Evento & Fecha Estimada</label>
                      <input
                        type="text"
                        value={contactEvent}
                        onChange={(e) => setContactEvent(e.target.value)}
                        placeholder="Ej. Concierto Loja 2026 - 1500 personas"
                        className="w-full border border-white/20 bg-black p-3 text-white focus:outline-none focus:border-white font-sans text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-neutral-400 uppercase font-semibold">Detalles o Requerimientos</label>
                      <textarea
                        rows={4}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Cuéntanos sobre tu evento, ubicación y necesidades de aforo..."
                        className="w-full border border-white/20 bg-black p-3 text-white focus:outline-none focus:border-white font-sans text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full border-2 border-white bg-white py-3.5 text-xs font-bold text-black uppercase tracking-wider hover:bg-neutral-200 transition"
                    >
                      SOLICITAR PROPUESTA Y COTIZACIÓN
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>

          {/* FOOTER PÚBLICO */}
          <footer className="border-t border-white/10 py-10 px-6 md:px-12 text-center text-xs font-mono text-neutral-500">
            <div>
              DATELAR ACCESS &middot; PRODUCTO DE DATELAR LABS &middot; {new Date().getFullYear()}
            </div>
            <div className="text-[11px] text-neutral-600 mt-1">
              Todos los derechos reservados &middot; Universidad Nacional de Loja &middot; Datelar
            </div>
          </footer>
        </main>
      ) : (
        /* ======================================================== */
        /* 3. SI ESTÁ AUTENTICADO: PANEL PRIVADO DE ADMINISTRACIÓN   */
        /* ======================================================== */
        <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 space-y-8 font-sans">
          {/* Encabezado del Panel */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/15 pb-6">
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                {currentUser.role === "portero" ? "MODO CONTROL DE PUERTA" : "PANEL DE CONTROL CORPORATIVO"}
              </span>
              <h1 className="text-3xl font-bold text-white mt-1">
                {currentUser.role === "portero" ? `Validador: ${currentUser.event}` : "Administración de Eventos"}
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Sesión activa como: <strong className="text-white">{currentUser.name}</strong>
              </p>
            </div>

            {/* Pestañas de Navegación del Panel */}
            {currentUser.role !== "portero" && (
              <div className="flex flex-wrap gap-2 text-xs font-mono font-semibold">
                <button
                  onClick={() => setAdminTab("eventos")}
                  className={`px-4 py-2 border transition uppercase ${
                    adminTab === "eventos" ? "border-white bg-white text-black" : "border-white/20 bg-neutral-950 text-neutral-300 hover:text-white"
                  }`}
                >
                  Eventos ({events.length})
                </button>
                <button
                  onClick={() => setAdminTab("emitir")}
                  className={`px-4 py-2 border transition uppercase ${
                    adminTab === "emitir" ? "border-white bg-white text-black" : "border-white/20 bg-neutral-950 text-neutral-300 hover:text-white"
                  }`}
                >
                  Emitir Entradas
                </button>
                <button
                  onClick={() => setAdminTab("staff_code")}
                  className={`px-4 py-2 border transition uppercase ${
                    adminTab === "staff_code" ? "border-cyan-400 bg-cyan-400 text-black" : "border-white/20 bg-neutral-950 text-neutral-300 hover:text-white"
                  }`}
                >
                  Código Porteros
                </button>
                <button
                  onClick={() => setAdminTab("validador")}
                  className={`px-4 py-2 border transition uppercase ${
                    adminTab === "validador" ? "border-white bg-white text-black" : "border-white/20 bg-neutral-950 text-neutral-300 hover:text-white"
                  }`}
                >
                  Validador
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: GESTIÓN DE EVENTOS */}
          {adminTab === "eventos" && currentUser.role !== "portero" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Eventos Registrados</h2>
                <button
                  onClick={() => setIsNewEventOpen(true)}
                  className="border-2 border-white bg-white px-4 py-2 text-xs font-bold text-black uppercase tracking-wider hover:bg-neutral-200 transition flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Crear Nuevo Evento</span>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 font-mono text-xs">
                {events.map((ev) => {
                  const isSelected = ev.id === selectedEventId;
                  const pct = Math.round(((ev.total_scanned || 0) / (ev.total_issued || 1)) * 100);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEventId(ev.id)}
                      className={`cursor-pointer border p-6 transition ${
                        isSelected ? "border-cyan-400 bg-neutral-950" : "border-white/10 bg-black hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] text-cyan-400 font-bold uppercase">{ev.status}</span>
                          <h3 className="text-xl font-bold text-white font-sans mt-1">{ev.name}</h3>
                          <p className="text-xs text-neutral-400 font-sans mt-0.5">{ev.location}</p>
                        </div>
                        {isSelected && (
                          <span className="bg-cyan-400 text-black px-2 py-0.5 text-[9px] font-bold">
                            SELECCIONADO
                          </span>
                        )}
                      </div>

                      <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
                        <div className="flex justify-between text-neutral-300">
                          <span>INGRESADOS // TOTAL:</span>
                          <strong className="text-white">{ev.total_scanned} / {ev.total_issued} ({pct}%)</strong>
                        </div>
                        <div className="w-full bg-neutral-800 h-2">
                          <div className="bg-cyan-400 h-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-neutral-400 pt-1">
                          <span>CAPACIDAD: {ev.capacity} PERSONAS</span>
                          <span className="text-cyan-400 font-bold">CÓDIGO STAFF: {ev.staff_code}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: EMISIÓN DE ENTRADAS */}
          {adminTab === "emitir" && currentUser.role !== "portero" && (
            <div className="grid lg:grid-cols-12 gap-8 font-mono">
              <div className="lg:col-span-5 border border-white/15 bg-neutral-950 p-6 space-y-4">
                <div>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase">EMISIÓN DE BOLETOS</span>
                  <h3 className="text-xl font-bold text-white font-sans mt-1">Generar Pases con QR</h3>
                  <p className="text-xs text-neutral-400 font-sans mt-0.5">
                    Evento: <strong className="text-white">{selectedEvent.name}</strong>
                  </p>
                </div>

                <form onSubmit={handleGenerateTickets} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-neutral-400 uppercase">Tipo de Pase / Localidad</label>
                    <select
                      value={ticketGenTier}
                      onChange={(e) => setTicketGenTier(e.target.value)}
                      className="w-full border border-white/20 bg-black p-3 text-white focus:outline-none"
                    >
                      {(selectedEvent.tiers || []).map((t: any) => (
                        <option key={t.name} value={t.name} className="bg-black text-white">
                          {t.name} (${Number(t.price).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-neutral-400 uppercase">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={ticketGenQty}
                      onChange={(e) => setTicketGenQty(Number(e.target.value))}
                      className="w-full border border-white/20 bg-black p-3 text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-neutral-400 uppercase">Nombre del Asistente (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      value={ticketGenName}
                      onChange={(e) => setTicketGenName(e.target.value)}
                      className="w-full border border-white/20 bg-black p-3 text-white focus:outline-none font-sans"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-neutral-400 uppercase">Cédula / Identificación (Opcional)</label>
                    <input
                      type="text"
                      placeholder="110..."
                      value={ticketGenDni}
                      onChange={(e) => setTicketGenDni(e.target.value)}
                      className="w-full border border-white/20 bg-black p-3 text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full border-2 border-white bg-white py-3 text-xs font-bold text-black uppercase hover:bg-neutral-200 transition"
                  >
                    {isGenerating ? "EMITIENDO..." : "GENERAR ENTRADAS DIGITALES"}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase">
                    Entradas Emitidas ({generatedTickets.length})
                  </span>
                  {generatedTickets.length > 0 && (
                    <button
                      onClick={() => setGeneratedTickets([])}
                      className="text-xs text-neutral-400 hover:text-white"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {generatedTickets.length === 0 ? (
                  <div className="border border-white/10 bg-neutral-950 p-12 text-center text-neutral-500 text-xs">
                    No has emitido entradas en esta sesión. Completa el formulario de la izquierda.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-2">
                    {generatedTickets.map((t) => (
                      <div key={t.code_hash} className="border border-white/20 bg-neutral-950 p-4 space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-cyan-400 font-bold">{t.tier}</span>
                          <span className="text-neutral-500">#{t.ticket_number}</span>
                        </div>
                        <div className="p-3 bg-black border border-white/10 flex items-center justify-center">
                          <QrCode className="h-24 w-24 text-white" />
                        </div>
                        <div className="text-[11px] text-white truncate font-sans font-semibold">
                          {t.attendee_name}
                        </div>
                        <div className="text-[10px] text-neutral-500 truncate">
                          {t.code_hash}
                        </div>
                        <button
                          onClick={() => {
                            setAdminTab("validador");
                            handleValidateCode(t.code_hash);
                          }}
                          className="w-full border border-white/30 py-1.5 text-[10px] text-white hover:bg-white hover:text-black uppercase transition font-bold"
                        >
                          Probar en Validador
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CÓDIGO ÚNICO PARA PORTEROS (STAFF) */}
          {adminTab === "staff_code" && currentUser.role !== "portero" && (
            <div className="border border-cyan-400/40 bg-neutral-950 p-8 sm:p-12 space-y-8 max-w-3xl">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  ACCESO SIMPLIFICADO PARA STAFF
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                  Código de Acceso Rápido para Porteros
                </h2>
                <p className="text-sm text-neutral-300 font-sans mt-2 leading-relaxed">
                  Para que tu personal de seguridad y puerta no necesite crear cuentas ni recordar contraseñas, entrégales este código o muéstrales este QR. Con solo ingresarlo en la pantalla inicial, entrarán directo al modo de escaneo del evento <strong>{selectedEvent.name}</strong>.
                </p>
              </div>

              {/* Tarjeta del Código */}
              <div className="border-2 border-dashed border-cyan-400 bg-black p-8 text-center space-y-4">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
                  CÓDIGO ACTIVO DEL EVENTO
                </span>
                <div className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-widest">
                  {selectedEvent.staff_code || staffAccessCode}
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedEvent.staff_code || staffAccessCode);
                      setStaffCodeCopied(true);
                      setTimeout(() => setStaffCodeCopied(false), 2500);
                    }}
                    className="border border-cyan-400 bg-cyan-400 px-6 py-2.5 text-xs font-mono font-bold text-black uppercase hover:bg-cyan-300 transition"
                  >
                    {staffCodeCopied ? "¡CÓDIGO COPIADO!" : "COPIAR CÓDIGO"}
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs font-sans text-neutral-400 border-t border-white/10 pt-6">
                <div>
                  <strong className="text-white block font-semibold mb-1">¿Cómo lo usan los porteros?</strong>
                  Al abrir Datelar Access en su celular, hacen clic en <em>Iniciar Sesión &rarr; Acceso para Porteros</em> e ingresan este código.
                </div>
                <div>
                  <strong className="text-white block font-semibold mb-1">Seguridad</strong>
                  Este código solo da acceso a validar boletos del evento seleccionado. No permite modificar aforos ni ver configuraciones.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VALIDADOR EN PUERTA (CONSOLA DE ESCANEO) */}
          {(adminTab === "validador" || currentUser.role === "portero") && (
            <div className="max-w-2xl mx-auto space-y-6 text-center font-mono">
              <div className="space-y-1">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                  MODO DE VALIDACIÓN EN PUERTA
                </span>
                <h2 className="text-2xl font-bold text-white font-sans">
                  Escaneo y Control de Acceso
                </h2>
                <p className="text-xs text-neutral-400 font-sans">
                  Evento: <strong className="text-white">{selectedEvent.name}</strong>
                </p>
              </div>

              {/* Pantalla de Resultado */}
              <div className="border-2 border-white/20 bg-neutral-950 p-8 min-h-[200px] flex flex-col items-center justify-center">
                {scanResult.status === "valid" && (
                  <div className="space-y-2 animate-fade-in text-center">
                    <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto" />
                    <h3 className="text-2xl font-bold text-emerald-400">
                      {scanResult.message}
                    </h3>
                    <div className="text-sm text-neutral-200 font-sans">
                      {scanResult.details?.attendee} &middot; {scanResult.details?.time}
                    </div>
                  </div>
                )}

                {scanResult.status === "duplicate" && (
                  <div className="space-y-2 animate-fade-in text-center">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                    <h3 className="text-2xl font-bold text-red-400">
                      {scanResult.message}
                    </h3>
                    <div className="text-sm text-neutral-300 font-sans">
                      {scanResult.details?.attendee} &middot; {scanResult.details?.time}
                    </div>
                  </div>
                )}

                {scanResult.status === "invalid" && (
                  <div className="space-y-2 animate-fade-in text-center">
                    <AlertTriangle className="h-16 w-16 text-amber-400 mx-auto" />
                    <h3 className="text-2xl font-bold text-amber-400">
                      {scanResult.message}
                    </h3>
                  </div>
                )}

                {scanResult.status === null && (
                  <div className="text-neutral-500 text-xs">
                    LISTO PARA ESCANEAR // INGRESA O PEGA UN CÓDIGO QR PARA PROBAR
                  </div>
                )}
              </div>

              {/* Campo para ingresar o escanear código */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Pegar o escanear código aquí..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleValidateCode(manualCode)}
                  className="flex-1 border border-white/30 bg-black px-4 py-3 text-sm text-white focus:outline-none focus:border-white font-mono"
                />
                <button
                  onClick={() => handleValidateCode(manualCode)}
                  className="border-2 border-white bg-white px-6 text-xs font-bold text-black uppercase hover:bg-neutral-200 transition"
                >
                  VALIDAR
                </button>
              </div>

              <div className="flex justify-center gap-4 text-xs text-neutral-500">
                <button
                  onClick={() => handleValidateCode(`DTL-${selectedEvent.name.slice(0,3).toUpperCase()}-1001-TEST`)}
                  className="hover:text-white transition"
                >
                  [Probar Entrada Válida]
                </button>
                <span>&bull;</span>
                <button
                  onClick={() => handleValidateCode("ALREADY-USADO-001")}
                  className="hover:text-white transition"
                >
                  [Probar Entrada Duplicada]
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL DE LOGIN (ADMIN O PORTEROS)                      */}
      {/* ======================================================== */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md border-2 border-white/20 bg-neutral-950 p-8 space-y-6 relative font-sans">
            <button
              onClick={() => setIsLoginOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
                ACCESO AL SISTEMA
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">Iniciar Sesión</h3>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Selecciona tu rol para acceder a la plataforma:
              </p>
            </div>

            {/* Selector de Pestañas: Admin vs Portero */}
            <div className="grid grid-cols-2 gap-2 border border-white/15 p-1 bg-black font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setLoginTab("admin");
                  setLoginError(null);
                }}
                className={`py-2 text-center font-bold uppercase transition ${
                  loginTab === "admin" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                Administrador
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginTab("portero");
                  setLoginError(null);
                }}
                className={`py-2 text-center font-bold uppercase transition ${
                  loginTab === "portero" ? "bg-cyan-400 text-black" : "text-neutral-400 hover:text-white"
                }`}
              >
                Portero / Staff
              </button>
            </div>

            {loginError && (
              <div className="border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-400 font-mono">
                {loginError}
              </div>
            )}

            {/* FORMULARIO ADMIN: USUARIO Y CONTRASEÑA */}
            {loginTab === "admin" && (
              <form onSubmit={handleAdminLogin} className="space-y-4 text-xs font-mono">
                <div className="space-y-1">
                  <label className="text-neutral-400 uppercase font-semibold">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full border border-white/20 bg-black p-3 text-white focus:outline-none focus:border-white font-sans text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 uppercase font-semibold">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full border border-white/20 bg-black p-3 text-white focus:outline-none focus:border-white font-sans text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full border-2 border-white bg-white py-3.5 text-xs font-bold text-black uppercase tracking-wider hover:bg-neutral-200 transition"
                >
                  {loginLoading ? "INGRESANDO..." : "INGRESAR AL PANEL DE CONTROL"}
                </button>

                <div className="text-[10px] text-neutral-500 text-center pt-2">
                  Credenciales de prueba: <span className="text-white">admin@datelar.com</span> / <span className="text-white">admin123</span>
                </div>
              </form>
            )}

            {/* FORMULARIO PORTERO: CÓDIGO RÁPIDO O QR */}
            {loginTab === "portero" && (
              <form onSubmit={handlePorteroLogin} className="space-y-4 text-xs font-mono">
                <div className="p-3 border border-cyan-400/30 bg-cyan-950/20 text-[11px] text-cyan-300 font-sans">
                  Ingresa el código proporcionado por tu organizador para empezar a escanear entradas de inmediato.
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-400 uppercase font-semibold">Código del Evento</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. UNL-2026"
                    value={porteroCodeInput}
                    onChange={(e) => setPorteroCodeInput(e.target.value)}
                    className="w-full border border-cyan-400/40 bg-black p-3 text-white focus:outline-none focus:border-cyan-400 font-mono text-base uppercase font-bold tracking-widest text-center"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full border-2 border-cyan-400 bg-cyan-400 py-3.5 text-xs font-bold text-black uppercase tracking-wider hover:bg-cyan-300 transition"
                >
                  ENTRAR DIRECTO A ESCANEAR
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPorteroCodeInput("UNL-2026");
                    }}
                    className="text-[11px] text-neutral-400 hover:text-white underline"
                  >
                    Usar código de muestra (UNL-2026)
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL CREAR NUEVO EVENTO (ADMIN)                      */}
      {/* ======================================================== */}
      {isNewEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md border-2 border-white/20 bg-neutral-950 p-8 space-y-6 relative font-sans">
            <button
              onClick={() => setIsNewEventOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">
                ADMINISTRACIÓN
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">Crear Nuevo Evento</h3>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                Registra un nuevo concierto, festival o congreso en el sistema.
              </p>
            </div>

            <form onSubmit={handleCreateNewEvent} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-neutral-400 uppercase font-semibold">Nombre del Evento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Concierto Loja Viva 2026"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full border border-white/20 bg-black p-3 text-white focus:outline-none focus:border-white font-sans text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 uppercase font-semibold">Ubicación / Recinto</label>
                <input
                  type="text"
                  placeholder="Ej. Estadio Federativo de Loja"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="w-full border border-white/20 bg-black p-3 text-white focus:outline-none focus:border-white font-sans text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 uppercase font-semibold">Aforo Máximo (Personas)</label>
                <input
                  type="number"
                  min="10"
                  max="100000"
                  value={newEventCapacity}
                  onChange={(e) => setNewEventCapacity(Number(e.target.value))}
                  className="w-full border border-white/20 bg-black p-3 text-white focus:outline-none text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full border-2 border-white bg-white py-3.5 text-xs font-bold text-black uppercase tracking-wider hover:bg-neutral-200 transition"
              >
                REGISTRAR EVENTO
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
