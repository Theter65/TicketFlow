import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'scanner_screen.dart';
import 'generate_screen.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  List<dynamic> events = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  Future<void> _loadEvents() async {
    setState(() => isLoading = true);
    final data = await ApiService.getEvents();
    setState(() {
      events = data.isNotEmpty
          ? data
          : [
              {
                'id': 'evt-01',
                'name': 'Festival de Música Loja 2026',
                'location': 'Teatro Benjamín Carrión',
                'total_issued': 850,
                'total_scanned': 540,
                'capacity': 1200,
              },
              {
                'id': 'evt-02',
                'name': 'Congreso Telecom UNL 2026',
                'location': 'Campus Guillermo Falconí',
                'total_issued': 380,
                'total_scanned': 290,
                'capacity': 450,
              }
            ];
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: const Text(
          "DATELAR ACCESS",
          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 2),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _loadEvents,
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.white))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: events.length,
              itemBuilder: (context, index) {
                final ev = events[index];
                final issued = ev['total_issued'] ?? 1;
                final scanned = ev['total_scanned'] ?? 0;
                final pct = ((scanned / (issued > 0 ? issued : 1)) * 100).toInt();

                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    border: Border.all(color: Colors.white12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ev['name'] ?? 'Evento',
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        ev['location'] ?? '',
                        style: const TextStyle(color: Colors.white54, fontSize: 13),
                      ),
                      const SizedBox(height: 16),

                      // Barra de aforo en vivo
                      Row(
                        mainAxisAlignment: MainAxisAlignment.between,
                        children: [
                          const Text("AFORO EN VIVO:", style: TextStyle(color: Colors.white70, fontSize: 11)),
                          Text("$scanned / $issued ($pct%)",
                              style: const TextStyle(color: Color(0xFF3CC6D9), fontWeight: FontWeight.bold, fontSize: 12)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: (scanned / (issued > 0 ? issued : 1)).clamp(0.0, 1.0),
                          backgroundColor: Colors.white12,
                          color: const Color(0xFF3CC6D9),
                          minHeight: 6,
                        ),
                      ),

                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                foregroundColor: Colors.black,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              icon: const Icon(Icons.qr_code_scanner, size: 18),
                              label: const Text("ESCANEAR", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => ScannerScreen(event: ev)),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white,
                              side: const BorderSide(color: Colors.white24),
                              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            icon: const Icon(Icons.add, size: 18),
                            label: const Text("EMITIR", style: TextStyle(fontSize: 12)),
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => GenerateScreen(event: ev)),
                              );
                            },
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
