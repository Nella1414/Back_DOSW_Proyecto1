import { Injectable } from '@nestjs/common';

/**
 * * Application Main Service
 *
 * ? Servicio basico de la aplicacion principal
 * ? Solo contiene endpoint de saludo para verificar funcionamiento
 * TODO: Agregar endpoints de health check y status
 * TODO: Implementar metricas de uso de la aplicacion
 * TODO: Agregar informacion de version y configuracion
 */
@Injectable()
export class AppService {
  /**
   * * Basic hello world endpoint
   * ? Endpoint simple para verificar que la API funciona
   * TODO: Agregar informacion util como version, uptime, etc
   */
  getHello(): string {
    return 'Hello World!';
  }
}
