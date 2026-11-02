import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../services/api_service.dart';

class GenerateScreen extends StatefulWidget {
  final Map<String, dynamic> event;

  const GenerateScreen({super.key, required this.event});

  @override
  State<GenerateScreen> createState() => _GenerateScreenState();
}

class _GenerateScreenState extends State<GenerateScreen> {
  final _nameController = TextEditingController();
  final _dniController = TextEditingController();
  String selectedTier = "General";
  String? generatedQrCode;
  bool isGenerating = false;

  void _generateTicket() async {
    setState(() => isGenerating = true);

    // Mock hash para demostración o llamada a API
    final randomPart = DateTime.now().millisecondsSinceEpoch.toString().substring(8);
    final code = "DTL-ACC-${widget.event['id'].toString().toUpperCase()}-$randomPart";

    setState(() {
      generatedQrCode = code;
      isGenerating = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: Text("EMISIÓN: ${widget.event['name']}",
            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("CREAR ENTRADA EN PUERTA",
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            const Text("Genera un pase individual con código criptográfico en segundos.",
                style: TextStyle(color: Colors.white54, fontSize: 13)),
            const SizedBox(height: 20),

            TextField(
              controller: _nameController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: "NOMBRE DEL ASISTENTE",
                labelStyle: TextStyle(color: Colors.white54, fontSize: 12),
                enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.white)),
              ),
            ),
            const SizedBox(height: 12),

            TextField(
              controller: _dniController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: "CÉDULA / DNI",
                labelStyle: TextStyle(color: Colors.white54, fontSize: 12),
                enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.white)),
              ),
            ),
            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: isGenerating ? null : _generateTicket,
                child: Text(isGenerating ? "GENERANDO..." : "EMITIR ENTRADA QR"),
              ),
            ),

            if (generatedQrCode != null) ...[
              const SizedBox(height: 24),
              Center(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    children: [
                      QrImageView(
                        data: generatedQrCode!,
                        version: QrVersions.auto,
                        size: 200.0,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        generatedQrCode!,
                        style: const TextStyle(color: Colors.black87, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        _nameController.text.isNotEmpty ? _nameController.text : "Entrada Válida",
                        style: const TextStyle(color: Colors.black54, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),
            ]
          ],
        ),
      ),
    );
  }
}
