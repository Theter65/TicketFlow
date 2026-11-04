import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'scanner_screen.dart';
import 'generate_screen.dart';
import 'login_screen.dart';

class EventsScreen extends StatefulWidget {
  final Map<String, dynamic>? currentUser;

  const EventsScreen({super.key, this.currentUser});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  List<dynamic> events = [];
  bool isLoading = true;
  Map<String, dynamic>? user;

  @override
  void initState() {
    super.initState();
    user = widget.currentUser;
    _initData();
  }

  Future<void> _initData() async {
    if (user == null) {
      user = await ApiService.getCurrentUser();
    }
    await _loadEvents();
  }

  Future<void> _loadEvents() async {
    setState(() => isLoading = true);
    final data = await ApiService.getEvents();
    setState(() {
      events = data.isNotEmpty
          ? data
          : [
              {
                'id': '3beac8d9-ba09-4fb6-9829-45ad560de121',
                'name': 'UNL Tech Summit 2026',
                'location': 'Campus Guillermo Falconí Espinosa, UNL, Loja',
                'total_issued': 500,
                'total_scanned': 0,
                'capacity': 650,
              }
            ];
      isLoading = false;
    });
  }

  Future<void> _handleLogout() async {
    await ApiService.logout();
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final userName = user?['name'] ?? 'Usuario Datelar';
    final userRole = (user?['role'] ?? 'admin').toString().toUpperCase();

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "DATELAR ACCESS",
              style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: 2),
            ),
            Text(
              "$userName  •  [$userRole]",
              style: const TextStyle(color: Colors.white38, fontSize: 11),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _loadEvents,
            tooltip: "Actualizar Eventos",
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white70),
            onPressed: _handleLogout,
            tooltip: "Cerrar Sesión",
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.white))
          : events.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.event_busy, color: Colors.white38, size: 48),
                      const SizedBox(height: 12),
                      const Text("No hay eventos activos registrados.", style: TextStyle(color: Colors.white70)),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.black),
                        onPressed: _loadEvents,
                        child: const Text("Reintentar"),
                      )
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: events.length,
                  itemBuilder: (context, index) {
                    final ev = events[index];
                    final issued = ev['total_issued'] ?? 1;
                    final scanned = ev['total_scanned'] ?? 0;
                    final capacity = ev['capacity'] ?? issued;
                    final pct = ((scanned / (issued > 0 ? issued : 1)) * 100).toInt();

                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F0F0F),
                        border: Border.all(color: Colors.white12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.between,
                            children: [
                              Expanded(
                                child: Text(
                                  ev['name'] ?? 'Evento',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Colors.white10,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  "ACTIVO",
                                  style: TextStyle(color: Color(0xFF3CC6D9), fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              const Icon(Icons.place_outlined, color: Colors.white38, size: 14),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  ev['location'] ?? 'Ubicación no especificada',
                                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 18),

                          // Barra de aforo y métricas
                          Row(
                            mainAxisAlignment: MainAxisAlignment.between,
                            children: [
                              const Text("CONTROL DE ACCESO:", style: TextStyle(color: Colors.white70, fontSize: 11)),
                              Text(
                                "$scanned escaneados / $issued emitidos ($pct%)",
                                style: const TextStyle(color: Color(0xFF3CC6D9), fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: (scanned / (issued > 0 ? issued : 1)).clamp(0.0, 1.0),
                              backgroundColor: Colors.white12,
                              color: const Color(0xFF3CC6D9),
                              minHeight: 6,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            "Capacidad total del recinto: $capacity personas",
                            style: const TextStyle(color: Colors.white38, fontSize: 11),
                          ),

                          const SizedBox(height: 20),
                          Row(
                            children: [
                              Expanded(
                                flex: 3,
                                child: ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.white,
                                    foregroundColor: Colors.black,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  icon: const Icon(Icons.qr_code_scanner, size: 18),
                                  label: const Text(
                                    "ESCANEAR ENTRADAS",
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 0.5),
                                  ),
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (_) => ScannerScreen(event: ev)),
                                    );
                                  },
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                flex: 2,
                                child: OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Colors.white,
                                    side: const BorderSide(color: Colors.white24),
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  icon: const Icon(Icons.confirmation_number_outlined, size: 16),
                                  label: const Text("EMITIR", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (_) => GenerateScreen(event: ev)),
                                    );
                                  },
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}
