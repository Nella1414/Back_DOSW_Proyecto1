import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RadicadoCounter,
  RadicadoCounterDocument,
} from '../entities/radicado-counter.entity';

@Injectable()
export class RadicadoService {
  private readonly logger = new Logger(RadicadoService.name);
  private readonly MAX_RETRIES = 3;

  constructor(
    @InjectModel(RadicadoCounter.name)
    private radicadoCounterModel: Model<RadicadoCounterDocument>,
  ) {}

  /**
   * Genera el siguiente radicado único para el año actual
   */
  async generateRadicado(): Promise<string> {
    const currentYear = new Date().getFullYear();
    let lastError: Error | null = null;

    // Implementar reintentos para garantizar atomicidad
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        this.logger.debug(
          `Generando radicado para año ${currentYear} (intento ${attempt}/${this.MAX_RETRIES})`,
        );

        // Usar findOneAndUpdate con upsert para operación atómica
        const counter = await this.radicadoCounterModel.findOneAndUpdate(
          { year: currentYear },
          { $inc: { sequence: 1 } },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
          },
        );

        // Formatear radicado: YYYY-NNNNNN
        const paddedSequence = counter.sequence.toString().padStart(6, '0');
        const radicado = `${currentYear}-${paddedSequence}`;

        this.logger.log(
          `Radicado generado exitosamente: ${radicado} (secuencia: ${counter.sequence})`,
        );
        return radicado;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Error generando radicado (intento ${attempt}/${this.MAX_RETRIES}): ${error.message}`,
          error.stack,
        );

        // Esperar antes de reintentar (backoff exponencial)
        if (attempt < this.MAX_RETRIES) {
          const delayMs = Math.pow(2, attempt - 1) * 100; // 100ms, 200ms, 400ms
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    // Si todos los intentos fallaron
    this.logger.error(
      `Falló la generación de radicado después de ${this.MAX_RETRIES} intentos`,
      lastError?.stack,
    );
    throw new InternalServerErrorException(
      `No se pudo generar el radicado después de ${this.MAX_RETRIES} intentos. Por favor intente nuevamente.`,
    );
  }

  /**
   * Obtiene el último radicado generado para un año
   */
  async getLastRadicado(year?: number): Promise<string | null> {
    try {
      const targetYear = year || new Date().getFullYear();

      this.logger.debug(`Consultando último radicado para año ${targetYear}`);

      const counter = await this.radicadoCounterModel.findOne({
        year: targetYear,
      });

      if (!counter || counter.sequence === 0) {
        this.logger.debug(
          `No se encontraron radicados para el año ${targetYear}`,
        );
        return null;
      }

      const paddedSequence = counter.sequence.toString().padStart(6, '0');
      const radicado = `${targetYear}-${paddedSequence}`;

      this.logger.debug(`Último radicado encontrado: ${radicado}`);
      return radicado;
    } catch (error) {
      this.logger.error(
        `Error obteniendo último radicado para año ${year}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error al consultar el último radicado',
      );
    }
  }

  /**
   * Obtiene estadísticas de radicados por año
   */
  async getRadicadoStats(): Promise<{ year: number; count: number }[]> {
    try {
      this.logger.debug('Consultando estadísticas de radicados');

      const stats = await this.radicadoCounterModel
        .find({}, { year: 1, sequence: 1, _id: 0 })
        .sort({ year: -1 })
        .lean()
        .then((counters) =>
          counters.map((c) => ({ year: c.year, count: c.sequence })),
        );

      this.logger.debug(
        `Estadísticas obtenidas: ${stats.length} años registrados`,
      );
      return stats;
    } catch (error) {
      this.logger.error(
        `Error obteniendo estadísticas de radicados: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Error al consultar estadísticas de radicados',
      );
    }
  }
}
