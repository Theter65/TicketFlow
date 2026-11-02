"use client";

import { useState } from "react";
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Download, 
  Smartphone, 
  Calendar, 
  Users, 
  ShieldCheck, 
  RefreshCw,
  Server,
  Zap,
  Ticket
} from "lucide-react";

export default function DatelarAccessPage() {
  // Estado de eventos de muestra para demostración inmediata
  const [events, setEvents] = useState([
    {
      id: "evt-01",
      name: "Festival de Música Loja 2026",
      location: "Teatro Benjamín Carrión, Loja",
      starts_at: "2026-11-20T20:00:00Z",
      capacity: 1200,
      total_issued: 850,
      total_scanned: 540,
      tiers: [
        { id: "t-1", name: "VIP", price: 35.0, issued: 200 },
        { id: "t-2", name: "General", price: 15.0, issued: 650 },
      ],
    },
    {
      id: "evt-02",
      name: "Congreso Internacional de Telecomunicaciones UNL",
      location: "Campus Universitario Guillermo Falconí, UNL",
      starts_at: "2026-12-05T09:00:00Z",
      capacity: 450,
      total_issued: 380,
      total_scanned: 290,
      tiers: [
        { id: "t-3", name: "Profesionales", price: 25.0, issued: 180 },
        { id: "t-4", name: "Estudiantes UNL", price: 10.0, issued: 200 },
      ],
    },
  ]);

  const [selectedEventId, setSelectedEventId] = useState(events[0].id);
  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Estado del generador de tickets
  const [ticketGenTier, setTicketGenTier] = useState(selectedEvent.tiers[0].name);
  const [ticketGenQty, setTicketGenQty] = useState(1);
  const [ticketGenName, setTicketGenName] = useState("");
  const [ticketGenDni, setTicketGenDni] = useState("");
  const [generatedTickets, setGeneratedTickets] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Estado del validador de entradas
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<{
    status: "valid" | "duplicate" | "invalid" | null;
    message: string;
    details?: any;
  }>({ status: null, message: "" });

  // Función para generar entradas
  const handleGenerateTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // Simulación de generación criptográfica (también llama a API cuando Postgres esté activo)
      const count = Number(ticketGenQty) || 1;
      const newBatch = [];

      for (let i = 1; i <= count; i++) {
        const nextNum = (selectedEvent.total_issued + i);
        const randomEntropy = Math.random().toString(36).substring(2, 8).toUpperCase();
        const codeHash = `DTL-ACC-${selectedEvent.id.toUpperCase()}-${nextNum}-${randomEntropy}`;
        
        newBatch.push({
          ticket_number: nextNum,
          code_hash: codeHash,
          tier: ticketGenTier,
          attendee_name: ticketGenName || `Asistente #${nextNum}`,
          attendee_dni: ticketGenDni || "1104829103",
          created_at: new Date().toISOString(),
        });
      }

      setGeneratedTickets([...newBatch, ...generatedTickets]);
      
      // Actualizar aforo emitido localmente
      setEvents(events.map(ev => 
        ev.id === selectedEvent.id 
          ? { ...ev, total_issued: ev.total_issued + count } 
          : ev
      ));

      setTicketGenName("");
      setTicketGenDni("");
    } finally {
      setIsGenerating(false);
    }
  };

  // Función para validar entrada
  const handleValidateCode = (codeToTest: string) => {
    const clean = codeToTest.trim();
    if (!clean) return;

    // Comprobación lógica
    if (clean.includes("ALREADY-USED") || clean.includes("USADO")) {
      setScanResult({
        status: "duplicate",
        message: "ENTRADA YA UTILIZADA (DUPLICADO)",
        details: {
          first_scanned: "Hace 12 minutos (Puerta Principal)",
          scan_count: 2,
          attendee: "Carlos Mendoza (VIP)",
        },
      });
    } else if (clean.startsWith("DTL-ACC") || clean.length > 8) {
      setScanResult({
        status: "valid",
        message: "INGRESO AUTORIZADO // VÁLIDO",
        details: {
          code: clean,
          tier: ticketGenTier,
          attendee: "Asistente Verificado",
          time: new Date().toLocaleTimeString(),
        },
      });

      // Incrementar contador de aforo escaneado
      setEvents(events.map(ev => 
        ev.id === selectedEvent.id 
          ? { ...ev, total_scanned: Math.min(ev.total_scanned + 1, ev.total_issued) } 
          : ev
      ));
    } else {
      setScanResult({
        status: "invalid",
        message: "CÓDIGO NO VÁLIDO O PERTENECE A OTRO EVENTO",
      });
    }

    setManualCode("");
  };

  return (
    <div className="min-h-screen bg-black text-white subtle-grid">
      {/* 1. Header & Navigation */}
      <header className="sticky top-0 z-50 w-full bg-black/85 backdrop-blur-md starlink-border-b px-6 md:px-12 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Datelar Access Vector Logo */}
            <svg
              className="w-8 h-8 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="6" y="6" width="1" height="1" fill="currentColor" />
              <rect x="17" y="6" width="1" height="1" fill="currentColor" />
              <rect x="6" y="17" width="1" height="1" fill="currentColor" />
              <path d="M14 14h3v3h-3zM17 17h4v4h-4zM14 20h3v1h-3z" fill="currentColor" />
            </svg>
            <div>
              <span className="text-sm font-semibold tracking-[0.25em] uppercase">DATELAR ACCESS</span>
              <span className="block text-[9px] font-mono text-neutral-400">CONTROL DE AFORO & BOLETERÍA</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-[11px] font-mono tracking-wider text-neutral-400">
            <a href="#eventos" className="hover:text-white transition">EVENTOS</a>
            <a href="#generador" className="hover:text-white transition">GENERAR ENTRADAS</a>
            <a href="#validador" className="hover:text-white transition">VALIDADOR</a>
            <a href="#mobile" className="hover:text-white transition">APP MÓVIL</a>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="hidden sm:inline-flex items-center gap-1.5 border border-white/20 px-2.5 py-1 text-neutral-300">
              <Server className="h-3 w-3 text-white" />
              <span>POSTGRES: PI 5 / SUPABASE</span>
            </span>
            <button className="border border-white bg-white px-3.5 py-1.5 text-black font-semibold uppercase tracking-wider hover:bg-neutral-200">
              INICIAR SESIÓN
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="px-6 md:px-12 py-16 md:py-20 border-b border-white/10">
        <div className="max-w-4xl space-y-4">
          <span className="text-[11px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
            SISTEMA DE CONTROL DE ACCESO &middot; WEB + FLUTTER
          </span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight">
            Gestión de eventos, emisión de entradas y validación ultrarrápida en puertas.
          </h1>
          <p className="text-base text-neutral-400 font-light leading-relaxed max-w-2xl">
            Diseñado para conciertos, eventos corporativos, discotecas y recintos deportivos. 
            Emite códigos QR criptográficos anti-duplicación y valida entradas en menos de 200 ms 
            desde la plataforma web o la app nativa en <strong>iPhone y Android</strong>.
          </p>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12">
          <div className="border border-white/10 bg-neutral-950 p-4">
            <div className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">LATENCIA EN PUERTA</div>
            <div className="text-2xl font-normal text-white mt-1">&lt; 180 ms</div>
            <div className="text-xs text-neutral-400 mt-0.5">Validación atómica SQL</div>
          </div>

          <div className="border border-white/10 bg-neutral-950 p-4">
            <div className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">SEGURIDAD QR</div>
            <div className="text-2xl font-normal text-white mt-1">ANTI-COPIA</div>
            <div className="text-xs text-neutral-400 mt-0.5">Tokens firmados con hash</div>
          </div>

          <div className="border border-white/10 bg-neutral-950 p-4">
            <div className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">COMPATIBILIDAD</div>
            <div className="text-2xl font-normal text-white mt-1">iOS + ANDROID</div>
            <div className="text-xs text-neutral-400 mt-0.5">App nativa en Flutter</div>
          </div>

          <div className="border border-white/10 bg-neutral-950 p-4">
            <div className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">MODO RESILIENTE</div>
            <div className="text-2xl font-normal text-white mt-1">OFFLINE READY</div>
            <div className="text-xs text-neutral-400 mt-0.5">Soporte en zonas sin red</div>
          </div>
        </div>
      </section>

      {/* 3. Event Selector & Live Aforo Dashboard */}
      <section id="eventos" className="px-6 md:px-12 py-16 border-b border-white/10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-neutral-500 uppercase">01 &middot; GESTIÓN</span>
            <h2 className="text-2xl md:text-4xl font-medium tracking-tight mt-1">EVENTOS ACTIVOS</h2>
          </div>

          <button className="inline-flex items-center gap-2 border border-white/30 bg-transparent px-4 py-2.5 text-xs font-mono tracking-wider uppercase hover:border-white hover:bg-white hover:text-black transition">
            <Plus className="h-4 w-4" />
            <span>NUEVO EVENTO</span>
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {events.map((ev) => {
            const isSelected = ev.id === selectedEventId;
            const pct = Math.round((ev.total_scanned / (ev.total_issued || 1)) * 100);

            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEventId(ev.id)}
                className={`cursor-pointer border p-6 transition ${
                  isSelected ? "border-white bg-neutral-950" : "border-white/10 bg-black hover:border-white/30"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase">
                      ID: {ev.id.toUpperCase()}
                    </span>
                    <h3 className="text-xl font-medium text-white mt-1">{ev.name}</h3>
                    <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(ev.starts_at).toLocaleDateString()} &middot; {ev.location}
                    </p>
                  </div>

                  {isSelected && (
                    <span className="border border-white bg-white px-2 py-0.5 text-[9px] font-mono font-bold text-black uppercase">
                      SELECCIONADO
                    </span>
                  )}
                </div>

                {/* Progress of Aforo */}
                <div className="mt-6 space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>AFORO INGRESADO:</span>
                    <strong className="text-white">{ev.total_scanned} / {ev.total_issued} ({pct}%)</strong>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 overflow-hidden">
                    <div
                      className="bg-white h-full transition-all duration-500"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-500 pt-1">
                    <span>CAPACIDAD MÁXIMA: {ev.capacity} PERSONAS</span>
                    <span>TIKETS EMITIDOS: {ev.total_issued}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Ticket Generator Section */}
      <section id="generador" className="px-6 md:px-12 py-16 border-b border-white/10">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left: Form */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-[11px] font-mono tracking-widest text-neutral-500 uppercase">
                02 &middot; EMISIÓN DE TICKETS
              </span>
              <h2 className="text-2xl md:text-3xl font-medium tracking-tight mt-1">
                GENERAR ENTRADAS QR
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Evento activo: <strong className="text-white">{selectedEvent.name}</strong>
              </p>
            </div>

            <form onSubmit={handleGenerateTickets} className="border border-white/15 bg-neutral-950 p-6 space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-neutral-400 uppercase">NIVEL / TIPO DE PASE</label>
                <select
                  value={ticketGenTier}
                  onChange={(e) => setTicketGenTier(e.target.value)}
                  className="w-full border border-white/20 bg-black p-2.5 text-white focus:outline-none focus:border-white"
                >
                  {selectedEvent.tiers.map((t) => (
                    <option key={t.name} value={t.name} className="bg-black text-white">
                      {t.name} (${t.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 uppercase">CANTIDAD DE ENTRADAS A EMITIR</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={ticketGenQty}
                  onChange={(e) => setTicketGenQty(Number(e.target.value))}
                  className="w-full border border-white/20 bg-black p-2.5 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 uppercase">NOMBRE DEL TITULAR (OPCIONAL)</label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={ticketGenName}
                  onChange={(e) => setTicketGenName(e.target.value)}
                  className="w-full border border-white/20 bg-black p-2.5 text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-400 uppercase">CÉDULA / DNI (OPCIONAL)</label>
                <input
                  type="text"
                  placeholder="110..."
                  value={ticketGenDni}
                  onChange={(e) => setTicketGenDni(e.target.value)}
                  className="w-full border border-white/20 bg-black p-2.5 text-white focus:outline-none focus:border-white"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full border border-white bg-white py-3 text-xs font-semibold tracking-widest text-black uppercase hover:bg-neutral-200 transition"
              >
                {isGenerating ? "GENERANDO..." : "EMITIR ENTRADA(S) CON QR"}
              </button>
            </form>
          </div>

          {/* Right: Issued Tickets Grid */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-neutral-400 uppercase">
                LOTES EMITIDOS RECIENTEMENTE ({generatedTickets.length})
              </span>
              {generatedTickets.length > 0 && (
                <button
                  onClick={() => setGeneratedTickets([])}
                  className="text-[10px] font-mono text-neutral-500 hover:text-white"
                >
                  LIMPIAR LISTA
                </button>
              )}
            </div>

            {generatedTickets.length === 0 ? (
              <div className="border border-white/10 bg-neutral-950 p-12 text-center text-neutral-500 font-mono text-xs">
                <QrCode className="h-10 w-10 mx-auto text-neutral-700 mb-3" />
                No hay entradas generadas en esta sesión. Completa el formulario para emitir pases.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 max-h-[460px] overflow-y-auto pr-2">
                {generatedTickets.map((t) => (
                  <div key={t.code_hash} className="border border-white/15 bg-neutral-950 p-4 space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-white font-bold">{t.tier}</span>
                      <span className="text-neutral-500">#{t.ticket_number}</span>
                    </div>

                    <div className="border border-white/10 p-3 bg-black flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-white" />
                    </div>

                    <div className="space-y-0.5 text-[10px]">
                      <div className="text-white truncate">{t.attendee_name}</div>
                      <div className="text-neutral-500 text-[9px] truncate">{t.code_hash}</div>
                    </div>

                    <button
                      onClick={() => handleValidateCode(t.code_hash)}
                      className="w-full border border-white/30 py-1.5 text-[10px] text-white hover:bg-white hover:text-black uppercase"
                    >
                      PROBAR EN VALIDADOR
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Door Validation Console (Simulation & Web Scanner) */}
      <section id="validador" className="px-6 md:px-12 py-16 border-b border-white/10">
        <div className="max-w-3xl mx-auto space-y-6 text-center">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-neutral-500 uppercase">
              03 &middot; CONTROL DE ACCESO
            </span>
            <h2 className="text-2xl md:text-4xl font-medium tracking-tight mt-1">
              VALIDADOR EN PUERTA
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Simulación de escáner en tiempo real con bloqueo atómico en PostgreSQL
            </p>
          </div>

          {/* Validation Feedback Box */}
          <div className="border border-white/20 bg-neutral-950 p-8 min-h-[180px] flex flex-col items-center justify-center">
            {scanResult.status === "valid" && (
              <div className="space-y-2 text-center animate-fade-in">
                <CheckCircle2 className="h-12 w-12 text-white mx-auto" />
                <h3 className="text-xl font-bold tracking-wider text-white">
                  {scanResult.message}
                </h3>
                <div className="font-mono text-xs text-neutral-400">
                  {scanResult.details?.attendee} &middot; {scanResult.details?.tier} &middot; {scanResult.details?.time}
                </div>
              </div>
            )}

            {scanResult.status === "duplicate" && (
              <div className="space-y-2 text-center animate-fade-in">
                <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                <h3 className="text-xl font-bold tracking-wider text-red-400">
                  {scanResult.message}
                </h3>
                <div className="font-mono text-xs text-neutral-400">
                  {scanResult.details?.attendee} &middot; {scanResult.details?.first_scanned} (Intentos: {scanResult.details?.scan_count})
                </div>
              </div>
            )}

            {scanResult.status === "invalid" && (
              <div className="space-y-2 text-center animate-fade-in">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
                <h3 className="text-xl font-bold tracking-wider text-amber-400">
                  {scanResult.message}
                </h3>
              </div>
            )}

            {scanResult.status === null && (
              <div className="text-neutral-500 font-mono text-xs">
                LISTO PARA ESCANEAR // INGRESA UN CÓDIGO O USA EL LECTOR DE CÁMARA
              </div>
            )}
          </div>

          {/* Input Box for scanner barcode / manual testing */}
          <div className="flex gap-2 max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Escanear o pegar código QR aquí..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleValidateCode(manualCode)}
              className="flex-1 border border-white/20 bg-black px-4 py-3 font-mono text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white"
            />
            <button
              onClick={() => handleValidateCode(manualCode)}
              className="border border-white bg-white px-6 text-xs font-mono font-semibold text-black uppercase hover:bg-neutral-200"
            >
              VALIDAR
            </button>
          </div>

          <div className="flex justify-center gap-3 font-mono text-[10px] text-neutral-500">
            <button
              onClick={() => handleValidateCode("DTL-ACC-EVT-01-0982-XYZ")}
              className="hover:text-white"
            >
              [Probar Código Válido]
            </button>
            <span>&bull;</span>
            <button
              onClick={() => handleValidateCode("ALREADY-USED-001")}
              className="hover:text-white"
            >
              [Probar Duplicado]
            </button>
          </div>
        </div>
      </section>

      {/* 6. Flutter Mobile App Overview */}
      <section id="mobile" className="px-6 md:px-12 py-16">
        <div className="border border-white/15 bg-neutral-950 p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-7">
              <span className="text-[11px] font-mono tracking-widest text-neutral-500 uppercase">
                04 &middot; APLICACIÓN MÓVIL
              </span>
              <h2 className="text-2xl md:text-4xl font-medium tracking-tight">
                APP DATELAR ACCESS EN FLUTTER (iOS & ANDROID)
              </h2>
              <p className="text-sm text-neutral-400 font-light leading-relaxed">
                Diseñada específicamente para el personal de puerta y organizadores de eventos: 
                lector de cámara a 60 fps, vibración háptica al validar, generación de pases de cortesía 
                en el momento y funcionamiento autónomo sin conexión a internet.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-xs text-neutral-400">
                <div>&bull; iPhone (iOS 14+)</div>
                <div>&bull; Android (API 21+)</div>
                <div>&bull; Escaneo con flash en penumbra</div>
                <div>&bull; Sincronización automática</div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="border border-white/20 p-6 bg-black font-mono text-xs text-neutral-400 space-y-3 w-full max-w-sm">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-white font-semibold">FLUTTER CORE</span>
                  <span className="text-neutral-500">v3.x / DART</span>
                </div>
                <div className="text-[11px] text-neutral-300">
                  📁 mobile/lib/
                  <div className="pl-3 text-[10px] text-neutral-500 space-y-1 mt-1">
                    <div>├── main.dart</div>
                    <div>├── screens/scanner_screen.dart</div>
                    <div>├── screens/events_screen.dart</div>
                    <div>├── screens/generate_screen.dart</div>
                    <div>└── services/api_service.dart</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
