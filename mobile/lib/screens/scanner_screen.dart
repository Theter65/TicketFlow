import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:flutter_vibrate/flutter_vibrate.dart';
import '../services/api_service.dart';

class ScannerScreen extends StatefulWidget {
  final Map<String, dynamic> event;

  const ScannerScreen({super.key, required this.event});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  bool isProcessing = false;
  Map<String, dynamic>? lastResult;

  void _onDetect(BarcodeCapture capture) async {
    if (isProcessing) return;
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? code = barcodes.first.rawValue;
    if (code == null || code.isEmpty) return;

    setState(() {
      isProcessing = true;
    });

    // Validar en PostgreSQL a través de la API
    final response = await ApiService.validateTicket(
      code: code,
      eventId: widget.event['id'],
      deviceInfo: 'Flutter-Staff-App',
    );

    final validation = response['data'] ?? {};
    final bool success = validation['success'] == true;
    final String resultType = validation['result'] ?? 'unknown';

    // Feedback Háptico
    bool canVibrate = await Vibrate.canVibrate;
    if (canVibrate) {
      if (success) {
        Vibrate.feedback(FeedbackType.success);
      } else {
        Vibrate.feedback(FeedbackType.error);
      }
    }

    setState(() {
      lastResult = validation;
    });

    _showResultDialog(validation, success, resultType);
  }

  void _showResultDialog(Map<String, dynamic> validation, bool success, String resultType) {
    showModalBottomSheet(
      context: context,
      isDismissible: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        Color bgColor;
        IconData icon;
        String title;

        if (success) {
          bgColor = const Color(0xFF10B981); // Emerald
          icon = Icons.check_circle_outline;
          title = "ACCESO AUTORIZADO";
        } else if (resultType == 'already_used') {
          bgColor = const Color(0xFFEF4444); // Red
          icon = Icons.highlight_off;
          title = "ENTRADA YA UTILIZADA";
        } else {
          bgColor = const Color(0xFFF59E0B); // Amber
          icon = Icons.warning_amber_outlined;
          title = "ENTRADA NO VÁLIDA";
        }

        return Container(
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            border: Border(top: BorderSide(color: bgColor, width: 3)),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 64, color: bgColor),
              const SizedBox(height: 12),
              Text(
                title,
                style: TextStyle(
                  color: bgColor,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                validation['message'] ?? '',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 13),
              ),
              const SizedBox(height: 16),
              if (validation['attendee_name'] != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black45,
                    border: Border.all(color: Colors.white12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("TITULAR: ${validation['attendee_name']}",
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      if (validation['tier'] != null)
                        Text("PASE: ${validation['tier']}",
                            style: const TextStyle(color: Color(0xFF3CC6D9), fontSize: 12)),
                      if (validation['scan_count'] != null)
                        Text("INTENTOS DE ENTRADA: ${validation['scan_count']}",
                            style: const TextStyle(color: Colors.redAccent, fontSize: 11)),
                    ],
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
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  onPressed: () {
                    Navigator.pop(ctx);
                    setState(() {
                      isProcessing = false;
                    });
                  },
                  child: const Text("LISTO PARA SIGUIENTE ENTRADA", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        );
      },
    ).whenComplete(() {
      setState(() {
        isProcessing = false;
      });
    });
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.event['name'] ?? 'Evento',
                style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
            const Text("ESCÁNER DE PUERTA EN VIVO",
                style: TextStyle(color: Color(0xFF3CC6D9), fontSize: 10, letterSpacing: 1.2)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on, color: Colors.white),
            onPressed: () => controller.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_ios, color: Colors.white),
            onPressed: () => controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: _onDetect,
          ),

          // Retícula de escaneo tipo Starlink
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white.withOpacity(0.6), width: 1.5),
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),

          // Barra inferior con instrucciones
          Positioned(
            bottom: 30,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.75),
                borderRadius: BorderRadius.circular(30),
                border: Border.all(color: Colors.white24),
              ),
              child: const Text(
                "Enfoca el código QR de la entrada para validar automáticamente",
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
