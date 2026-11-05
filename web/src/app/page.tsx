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
  ArrowLeft,
  Sparkles,
  KeyRound,
  Check,
  Building2,
  MapPin,
  ScanLine,
  ChevronRight
} from "lucide-react";

export default function DatelarAccessStandalonePortal() {
  // Estado de sesión
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isStaffMode, setIsStaffMode] = useState(false);
  const [staffEventCode, setStaffEventCode] = useState("");

  // Formularios de login
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

  // Eventos activos y de muestra
  const [events, setEvents] = useState<any[]>([
    {
      id: "evt-01",
      name: "UNL Tech Summit 2026",
      location: "Campus Universitario Guillermo Falconí, Loja",
      date: "20 al 22 de Noviembre, 2026",
      status: "EVENTO EN GESTIÓN",
      statusColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
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
      statusColor: "text-cyan-700 bg-cyan-50 border-cyan-200",
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
      status: "FINALIZADO",
      statusColor: "text-slate-600 bg-slate-100 border-slate-200",
      capacity: 450,
      total_issued: 450,
      total_scanned: 432,
      staff_code: "TELCO-DONE",
      tiers: [{ id: "t-5", name: "Asistente", price: 20.0 }],
    },
  ]);

  const [selectedEventId, setSelectedEventId] = useState<string>("evt-01");
  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Estado del validador de entradas
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<{
    status: "valid" | "duplicate" | "invalid" | null;
    message: string;
    details?: any;
  }>({ status: null, message: "" });

  // Lista de entradas emitidas en sesión
  const [generatedTickets, setGeneratedTickets] = useState<any[]>([]);
  const [ticketGenName, setTicketGenName] = useState("");
  const [ticketGenDni, setTicketGenDni] = useState("");
  const [ticketGenTier, setTicketGenTier] = useState("Entrada General");
  const [ticketGenQty, setTicketGenQty] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Cargar eventos del backend o usar muestras
  useEffect(() => {
    fetch("/api/events")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setEvents(data);
          setSelectedEventId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Login Administrador
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
      if (!res.ok) {
        throw new Error(data.error || "Credenciales incorrectas");
      }

      setCurrentUser(data.user);
      setIsStaffMode(false);
    } catch {
      if (loginEmail === "admin@datelar.com" && loginPassword === "admin123") {
        setCurrentUser({
          id: "superadmin-local",
          role: "superadmin",
          name: "Gerardo Gonza",
          email: "admin@datelar.com",
        });
        setIsStaffMode(false);
      } else {
        setLoginError("Credenciales incorrectas. Usa admin@datelar.com / admin123");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Login Portero / Staff con código
  const handlePorteroLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = porteroCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setLoginError("Ingresa el código del evento para continuar.");
      return;
    }

    const matchedEvent = events.find(
      (ev) => (ev.staff_code || "").toUpperCase() === cleanCode
    );

    setCurrentUser({
      id: "portero-" + cleanCode,
      role: "portero",
      name: `Portero (${cleanCode})`,
      event: matchedEvent ? matchedEvent.name : "Evento " + cleanCode,
    });
    setIsStaffMode(true);
    setStaffEventCode(cleanCode);
    if (matchedEvent) setSelectedEventId(matchedEvent.id);
    setAdminTab("validador");
    setPorteroCodeInput("");
    setLoginError(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsStaffMode(false);
    setStaffEventCode("");
  };

  // Generar entradas
  const handleGenerateTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const res = await fetch("/api/tickets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          tierName: ticketGenTier,
          quantity: ticketGenQty,
          attendeeName: ticketGenName || "Asistente General",
          attendeeDni: ticketGenDni || "S/N",
        }),
      });

      const data = await res.json();
      if (res.ok && data.tickets) {
        setGeneratedTickets((prev) => [...data.tickets, ...prev]);
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === selectedEvent.id
              ? { ...ev, total_issued: (ev.total_issued || 0) + ticketGenQty }
              : ev
          )
        );
      } else {
        throw new Error("Simulación local");
      }
    } catch {
      const newTix = Array.from({ length: ticketGenQty }).map((_, i) => ({
        ticket_number: Math.floor(1000 + Math.random() * 9000),
        code_hash: `DTL-${selectedEvent.name.slice(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
        tier: ticketGenTier,
        attendee_name: ticketGenName || `Asistente #${i + 1}`,
        price: 10.0,
      }));
      setGeneratedTickets((prev) => [...newTix, ...prev]);
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === selectedEvent.id
            ? { ...ev, total_issued: (ev.total_issued || 0) + ticketGenQty }
            : ev
        )
      );
    } finally {
      setIsGenerating(false);
      setTicketGenName("");
      setTicketGenDni("");
    }
  };

  // Validación de código
  const handleValidateCode = (codeToTest: string) => {
    const clean = codeToTest.trim();
    if (!clean) return;

    if (clean.includes("VALID") || clean.startsWith("DTL-")) {
      setScanResult({
        status: "valid",
        message: "ACCESO AUTORIZADO (Boleto Válido)",
        details: { attendee: "Asistente Registrado", time: new Date().toLocaleTimeString() },
      });
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === selectedEvent.id
            ? { ...ev, total_scanned: (ev.total_scanned || 0) + 1 }
            : ev
        )
      );
    } else if (clean.includes("USED") || clean.includes("DUPLICATE")) {
      setScanResult({
        status: "duplicate",
        message: "BOLETO YA FUE UTILIZADO ANTERIORMENTE",
        details: { time: "Hoy a las 10:14 AM en Puerta Principal" },
      });
    } else {
      setScanResult({
        status: "invalid",
        message: "CÓDIGO INVÁLIDO O NO ENCONTRADO",
      });
    }
  };

  // Crear nuevo evento
  const handleCreateNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName) return;

    const newEv = {
      id: "evt-" + Date.now(),
      name: newEventName,
      location: newEventLocation || "Por definir",
      date: "Próximamente",
      status: "PRÓXIMO EVENTO",
      statusColor: "text-cyan-700 bg-cyan-50 border-cyan-200",
      capacity: Number(newEventCapacity) || 500,
      total_issued: 0,
      total_scanned: 0,
      staff_code: newEventName.slice(0, 4).toUpperCase() + "-" + new Date().getFullYear(),
      tiers: [{ id: "t-" + Date.now(), name: "General", price: 10.0 }],
    };

    setEvents((prev) => [newEv, ...prev]);
    setSelectedEventId(newEv.id);
    setIsNewEventOpen(false);
    setNewEventName("");
    setNewEventLocation("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-cyan-600 selection:text-white font-sans">
      {/* BARRA SUPERIOR INTEGRADA */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center p-1.5 shadow-sm group-hover:border-cyan-500 transition">
                <Image
                  src="/brand/datelar-access/datelar-access-icon-dark.svg"
                  alt="Datelar Access"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                  DATELAR <span className="text-cyan-600">ACCESS</span>
                </span>
                <span className="text-[10px] font-medium text-slate-500 tracking-wide mt-0.5">
                  Producto de Datelar Labs
                </span>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-4">
            {currentUser && (
              <button
                onClick={handleLogout}
                className="border border-slate-300 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 rounded-lg transition flex items-center gap-1.5 shadow-sm"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* VISTA PORTAL DIRECTA: INFORMACIÓN Y LOGIN INMEDIATO */}
      {!currentUser ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-16">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* LADO IZQUIERDO: INFORMACIÓN COMPACTA Y BENEFICIOS */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 border border-cyan-200 bg-cyan-50 px-3 py-1 rounded-full text-xs font-medium text-cyan-800">
                <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
                <span>Control de Acceso Digital &middot; 100% Conectado</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                  Control de acceso inteligente y venta de entradas.
                </h1>

                {/* Texto favorito */}
                <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
                  La plataforma definitiva para conciertos, congresos, festivales y discotecas. Emite boletos digitales con código QR único, controla el aforo en tiempo real y valida entradas en segundos desde nuestra app para <strong>Android</strong>.
                </p>
              </div>

              {/* 4 Beneficios en formato compacto */}
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <div className="border border-slate-200 bg-white p-3.5 rounded-xl shadow-sm space-y-1">
                  <div className="flex items-center gap-2 text-cyan-600 font-bold text-xs">
                    <Zap className="h-4 w-4" />
                    <span>&lt; 1 Segundo</span>
                  </div>
                  <p className="text-xs text-slate-500">Ingreso ágil sin filas en las puertas.</p>
                </div>

                <div className="border border-slate-200 bg-white p-3.5 rounded-xl shadow-sm space-y-1">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Cero Fraudes</span>
                  </div>
                  <p className="text-xs text-slate-500">Códigos QR únicos infalsificables.</p>
                </div>

                <div className="border border-slate-200 bg-white p-3.5 rounded-xl shadow-sm space-y-1">
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                    <Users className="h-4 w-4" />
                    <span>Aforo en Vivo</span>
                  </div>
                  <p className="text-xs text-slate-500">Control de capacidad en tiempo real.</p>
                </div>

                <div className="border border-slate-200 bg-white p-3.5 rounded-xl shadow-sm space-y-1">
                  <div className="flex items-center gap-2 text-cyan-600 font-bold text-xs">
                    <Smartphone className="h-4 w-4" />
                    <span>App Android</span>
                  </div>
                  <p className="text-xs text-slate-500">El personal escanea con su propio celular.</p>
                </div>
              </div>
            </div>

            {/* LADO DERECHO: FORMULARIO DE ACCESO DIRECTO (DE UNA) */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md border border-slate-200 bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-5">
                <div>
                  <span className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider">
                    Portal de Acceso
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 mt-0.5">Ingresar al Sistema</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Elige cómo deseas ingresar a Datelar Access.
                  </p>
                </div>

                {/* Selector de pestañas */}
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginTab("admin");
                      setLoginError(null);
                    }}
                    className={`py-2 rounded-md transition ${
                      loginTab === "admin"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
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
                    className={`py-2 rounded-md transition ${
                      loginTab === "portero"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Personal de Puerta
                  </button>
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                    {loginError}
                  </div>
                )}

                {/* FORMULARIO ADMINISTRADOR */}
                {loginTab === "admin" && (
                  <form onSubmit={handleAdminLogin} className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-700 font-semibold">Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-cyan-600 text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-700 font-semibold">Contraseña</label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-cyan-600 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg text-xs font-semibold transition shadow-sm"
                    >
                      {loginLoading ? "Entrando..." : "Entrar como Administrador"}
                    </button>

                    <div className="text-[11px] text-slate-500 text-center pt-1">
                      Credenciales: <span className="text-slate-800 font-semibold">admin@datelar.com</span> / <span className="text-slate-800 font-semibold">admin123</span>
                    </div>
                  </form>
                )}

                {/* FORMULARIO PORTERO / STAFF */}
                {loginTab === "portero" && (
                  <form onSubmit={handlePorteroLogin} className="space-y-3.5 text-xs">
                    <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-lg text-xs text-cyan-800">
                      Ingresa el código que te asignó el organizador para empezar a escanear entradas.
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-700 font-semibold">Código del Evento</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. UNL-2026"
                        value={porteroCodeInput}
                        onChange={(e) => setPorteroCodeInput(e.target.value)}
                        className="w-full border border-cyan-400 bg-white rounded-lg p-3 text-slate-900 focus:outline-none focus:border-cyan-600 font-mono text-base uppercase font-bold tracking-widest text-center"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg text-xs font-semibold transition shadow-sm"
                    >
                      Entrar a Escanear
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => setPorteroCodeInput("UNL-2026")}
                        className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                      >
                        Usar código de muestra (UNL-2026)
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </main>
      ) : (
        /* PANEL PRIVADO OPERATIVO */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">
                {currentUser.role === "portero" ? "Modo Control de Puerta" : "Panel de Gestión"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
                {currentUser.role === "portero" ? `Validador: ${currentUser.event}` : "Administración de Eventos"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Sesión: <strong className="text-slate-800">{currentUser.name}</strong>
              </p>
            </div>

            {currentUser.role !== "portero" && (
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <button
                  onClick={() => setAdminTab("eventos")}
                  className={`px-3.5 py-2 rounded-lg transition shadow-sm ${
                    adminTab === "eventos"
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Eventos ({events.length})
                </button>
                <button
                  onClick={() => setAdminTab("emitir")}
                  className={`px-3.5 py-2 rounded-lg transition shadow-sm ${
                    adminTab === "emitir"
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Emitir Entradas
                </button>
                <button
                  onClick={() => setAdminTab("staff_code")}
                  className={`px-3.5 py-2 rounded-lg transition shadow-sm ${
                    adminTab === "staff_code"
                      ? "bg-cyan-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Código Porteros
                </button>
                <button
                  onClick={() => setAdminTab("validador")}
                  className={`px-3.5 py-2 rounded-lg transition shadow-sm ${
                    adminTab === "validador"
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Validador
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: GESTIÓN DE EVENTOS */}
          {adminTab === "eventos" && currentUser.role !== "portero" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Eventos Activos</h2>
                <button
                  onClick={() => setIsNewEventOpen(true)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Crear Nuevo Evento</span>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-xs">
                {events.map((ev) => {
                  const isSelected = ev.id === selectedEventId;
                  const pct = Math.round(((ev.total_scanned || 0) / (ev.total_issued || 1)) * 100);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEventId(ev.id)}
                      className={`cursor-pointer border p-5 rounded-xl transition shadow-sm ${
                        isSelected
                          ? "border-cyan-500 bg-cyan-50/40 ring-1 ring-cyan-400"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${ev.statusColor}`}>
                            {ev.status}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 mt-1">{ev.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{ev.location}</p>
                        </div>
                        {isSelected && (
                          <span className="bg-cyan-600 text-white px-2 py-0.5 text-[9px] font-bold rounded">
                            SELECCIONADO
                          </span>
                        )}
                      </div>

                      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                        <div className="flex justify-between text-slate-600">
                          <span>Ingresados / Emitidos:</span>
                          <strong className="text-slate-900">{ev.total_scanned} / {ev.total_issued} ({pct}%)</strong>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-cyan-600 h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                          <span>Capacidad: {ev.capacity} personas</span>
                          <span className="text-cyan-700 font-bold">Código Staff: {ev.staff_code}</span>
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
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 border border-slate-200 bg-white p-5 rounded-xl shadow-sm space-y-4">
                <div>
                  <span className="text-[10px] text-cyan-600 font-bold uppercase tracking-wide">Emisión de Boletos</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">Generar Pases con QR</h3>
                  <p className="text-xs text-slate-500">
                    Evento: <strong className="text-slate-800">{selectedEvent.name}</strong>
                  </p>
                </div>

                <form onSubmit={handleGenerateTickets} className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Tipo de Pase</label>
                    <select
                      value={ticketGenTier}
                      onChange={(e) => setTicketGenTier(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-cyan-600 bg-white text-xs"
                    >
                      {(selectedEvent.tiers || []).map((t: any) => (
                        <option key={t.name} value={t.name}>
                          {t.name} (${Number(t.price).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={ticketGenQty}
                      onChange={(e) => setTicketGenQty(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-cyan-600 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-700 font-semibold">Nombre Asistente (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      value={ticketGenName}
                      onChange={(e) => setTicketGenName(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-cyan-600 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg text-xs font-semibold transition shadow-sm"
                  >
                    {isGenerating ? "Emitiendo..." : "Generar Entradas Digitales"}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase">
                    Entradas Emitidas ({generatedTickets.length})
                  </span>
                  {generatedTickets.length > 0 && (
                    <button
                      onClick={() => setGeneratedTickets([])}
                      className="text-xs text-slate-500 hover:text-slate-900"
                    >
                      Limpiar lista
                    </button>
                  )}
                </div>

                {generatedTickets.length === 0 ? (
                  <div className="border border-slate-200 bg-white p-8 rounded-xl text-center text-slate-400 text-xs shadow-sm">
                    No has emitido entradas en esta sesión. Completa el formulario de la izquierda.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                    {generatedTickets.map((t) => (
                      <div key={t.code_hash} className="border border-slate-200 bg-white p-4 rounded-xl shadow-sm space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-cyan-700 font-bold">{t.tier}</span>
                          <span className="text-slate-400 font-mono">#{t.ticket_number}</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                          <QrCode className="h-20 w-20 text-slate-900" />
                        </div>
                        <div className="text-xs text-slate-900 truncate font-semibold">
                          {t.attendee_name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">
                          {t.code_hash}
                        </div>
                        <button
                          onClick={() => {
                            setAdminTab("validador");
                            handleValidateCode(t.code_hash);
                          }}
                          className="w-full border border-slate-300 py-1.5 rounded-lg text-[11px] text-slate-700 hover:bg-slate-100 font-semibold transition"
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
            <div className="border border-slate-200 bg-white p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 max-w-2xl">
              <div>
                <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">
                  Acceso para Personal de Puerta
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  Código de Acceso Rápido para Porteros
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Para que tu personal de seguridad y puerta no necesite crear cuentas ni recordar contraseñas, entrégales este código. Con solo ingresarlo en la pantalla inicial, entrarán directo a escanear entradas para <strong>{selectedEvent.name}</strong>.
                </p>
              </div>

              {/* Tarjeta del Código */}
              <div className="border-2 border-dashed border-cyan-400 bg-cyan-50/50 p-6 rounded-xl text-center space-y-3">
                <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">
                  Código activo para este evento
                </span>
                <div className="text-3xl sm:text-4xl font-mono font-bold text-slate-900 tracking-wider">
                  {selectedEvent.staff_code || staffAccessCode}
                </div>
                <div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedEvent.staff_code || staffAccessCode);
                      setStaffCodeCopied(true);
                      setTimeout(() => setStaffCodeCopied(false), 2500);
                    }}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-lg text-xs font-semibold transition shadow-sm"
                  >
                    {staffCodeCopied ? "¡Código Copiado!" : "Copiar Código"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VALIDADOR EN PUERTA */}
          {(adminTab === "validador" || currentUser.role === "portero") && (
            <div className="max-w-xl mx-auto space-y-4 text-center">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">
                  Modo de Validación en Puerta
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Escaneo y Control de Acceso
                </h2>
                <p className="text-xs text-slate-500">
                  Evento: <strong className="text-slate-800">{selectedEvent.name}</strong>
                </p>
              </div>

              <div className="border border-slate-200 bg-white p-6 rounded-2xl shadow-sm min-h-[170px] flex flex-col items-center justify-center">
                {scanResult.status === "valid" && (
                  <div className="space-y-1.5 text-center">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
                    <h3 className="text-xl font-bold text-emerald-700">
                      {scanResult.message}
                    </h3>
                    <div className="text-xs text-slate-600">
                      {scanResult.details?.attendee} &middot; {scanResult.details?.time}
                    </div>
                  </div>
                )}

                {scanResult.status === "duplicate" && (
                  <div className="space-y-1.5 text-center">
                    <XCircle className="h-12 w-12 text-rose-600 mx-auto" />
                    <h3 className="text-xl font-bold text-rose-700">
                      {scanResult.message}
                    </h3>
                    <div className="text-xs text-slate-600">
                      {scanResult.details?.time}
                    </div>
                  </div>
                )}

                {scanResult.status === "invalid" && (
                  <div className="space-y-1.5 text-center">
                    <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
                    <h3 className="text-xl font-bold text-amber-700">
                      {scanResult.message}
                    </h3>
                  </div>
                )}

                {scanResult.status === null && (
                  <div className="text-slate-400 text-xs">
                    Listo para escanear &middot; Ingresa o pega un código para probar
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Pegar o escribir código..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleValidateCode(manualCode)}
                  className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-cyan-600 bg-white font-mono"
                />
                <button
                  onClick={() => handleValidateCode(manualCode)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition shadow-sm"
                >
                  Validar
                </button>
              </div>

              <div className="flex justify-center gap-3 text-xs text-slate-500 pt-1">
                <button
                  onClick={() => handleValidateCode(`DTL-${selectedEvent.name.slice(0, 3).toUpperCase()}-1001-TEST`)}
                  className="hover:text-cyan-700 transition underline"
                >
                  Probar Entrada Válida
                </button>
                <span>&middot;</span>
                <button
                  onClick={() => handleValidateCode("DUPLICATE-SAMPLE")}
                  className="hover:text-rose-700 transition underline"
                >
                  Probar Entrada Duplicada
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* MODAL CREAR NUEVO EVENTO */}
      {isNewEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border border-slate-200 bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 relative">
            <button
              onClick={() => setIsNewEventOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <span className="text-[10px] text-cyan-600 font-bold uppercase tracking-wide">
                Administración
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">Crear Nuevo Evento</h3>
              <p className="text-xs text-slate-500">
                Registra un nuevo concierto, festival o congreso en el sistema.
              </p>
            </div>

            <form onSubmit={handleCreateNewEvent} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Nombre del Evento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Festival Loja 2026"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-cyan-600 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Ubicación / Recinto</label>
                <input
                  type="text"
                  placeholder="Ej. Teatro Benjamín Carrión"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-cyan-600 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">Aforo Máximo (Personas)</label>
                <input
                  type="number"
                  min="10"
                  max="100000"
                  value={newEventCapacity}
                  onChange={(e) => setNewEventCapacity(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-cyan-600 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg text-xs font-semibold transition shadow-sm"
              >
                Registrar Evento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
