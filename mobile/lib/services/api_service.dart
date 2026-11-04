import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // URL por defecto para Raspberry Pi en la red local UNL
  static String baseUrl = 'http://192.168.101.21:3000/api';

  static Future<void> setCustomBaseUrl(String url) async {
    baseUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_base_url', url);
  }

  static Future<void> loadBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('api_base_url');
    if (saved != null && saved.isNotEmpty) {
      baseUrl = saved;
    }
  }

  static Future<Map<String, dynamic>?> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('user_data');
    if (raw != null) {
      try {
        return jsonDecode(raw);
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
    await prefs.remove('user_data');
  }

  // 1. Iniciar Sesión (Organizador o Validador)
  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('jwt_token', data['token']);
        await prefs.setString('user_data', jsonEncode(data['user']));
        return {'success': true, 'user': data['user']};
      }
      return {'success': false, 'error': data['error'] ?? 'Credenciales incorrectas'};
    } catch (e) {
      return {'success': false, 'error': 'Error de conexión: $e'};
    }
  }

  // 2. Obtener Lista de Eventos Activos
  static Future<List<dynamic>> getEvents() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/events'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['events'] ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // 3. Validar Ticket con el Escáner (Llamada Atómica a Postgres)
  static Future<Map<String, dynamic>> validateTicket({
    required String code,
    required String eventId,
    String? deviceInfo,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/tickets/validate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'code': code,
          'event_id': eventId,
          'device_info': deviceInfo ?? 'Flutter-Mobile',
        }),
      );

      final data = jsonDecode(response.body);
      return data;
    } catch (e) {
      return {
        'success': false,
        'data': {
          'result': 'network_error',
          'message': 'ERROR DE CONEXIÓN O SERVIDOR NO ALCANZABLE',
        }
      };
    }
  }

  // 4. Generar Entrada desde el Teléfono
  static Future<Map<String, dynamic>> generateTicket({
    required String eventId,
    required String tierId,
    int quantity = 1,
    String? attendeeName,
    String? attendeeDni,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/tickets/generate'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'event_id': eventId,
          'tier_id': tierId,
          'quantity': quantity,
          'attendee_name': attendeeName,
          'attendee_dni': attendeeDni,
        }),
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}
