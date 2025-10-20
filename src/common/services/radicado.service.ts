import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RadicadoCounter, RadicadoCounterDocument } from '../entities/radicado-counter.entity';

@Injectable()
export class RadicadoService {
  constructor(
    @InjectModel(RadicadoCounter.name)
    private radicadoCounterModel: Model<RadicadoCounterDocument>,
  ) {}

  /**
   * Genera el siguiente radicado único para el año actual
   */
  async generateRadicado(): Promise<string> {
    const currentYear = new Date().getFullYear();

    // Usar findOneAndUpdate con upsert para operación atómica
    const counter = await this.radicadoCounterModel.findOneAndUpdate(
      { year: currentYear },
      { $inc: { sequence: 1 } },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true 
      }
    );

    // Formatear radicado: YYYY-NNNNNN
    const paddedSequence = counter.sequence.toString().padStart(6, '0');
    return `${currentYear}-${paddedSequence}`;
  }

  /**
   * Obtiene el último radicado generado para un año
   */
  async getLastRadicado(year?: number): Promise<string | null> {
    const targetYear = year || new Date().getFullYear();
    
    const counter = await this.radicadoCounterModel.findOne({ year: targetYear });
    
    if (!counter || counter.sequence === 0) {
      return null;
    }

    const paddedSequence = counter.sequence.toString().padStart(6, '0');
    return `${targetYear}-${paddedSequence}`;
  }

  /**
   * Obtiene estadísticas de radicados por año
   */
  async getRadicadoStats(): Promise<{ year: number; count: number }[]> {
    return this.radicadoCounterModel
      .find({}, { year: 1, sequence: 1, _id: 0 })
      .sort({ year: -1 })
      .lean()
      .then(counters => 
        counters.map(c => ({ year: c.year, count: c.sequence }))
      );
  }
}