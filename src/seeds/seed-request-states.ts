import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import {
  RequestStateDefinition,
  RequestStateDefinitionDocument,
} from '../change-requests/entities/request-state-definition.entity';

export async function seedRequestStates() {
  console.log('Starting request states seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);

  const stateModel = app.get<Model<RequestStateDefinitionDocument>>(
    getModelToken(RequestStateDefinition.name),
  );

  try {
    // Limpiar estados existentes
    console.log('Clearing existing states...');
    await stateModel.deleteMany({});

    // Estados iniciales
    const initialStates = [
      {
        name: 'PENDING',
        description: 'Solicitud pendiente de revisión',
        color: '#FFA500', // Orange
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'IN_REVIEW',
        description: 'Solicitud en proceso de revisión',
        color: '#3B82F6', // Blue
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'WAITING_INFO',
        description: 'Esperando información adicional del estudiante',
        color: '#F59E0B', // Amber
        isActive: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'APPROVED',
        description: 'Solicitud aprobada',
        color: '#10B981', // Green
        isActive: true,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'REJECTED',
        description: 'Solicitud rechazada',
        color: '#EF4444', // Red
        isActive: true,
        order: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    console.log('Creating initial states...');
    const createdStates = await stateModel.insertMany(initialStates);

    console.log('\n✅ Request States Seeded Successfully!');
    console.log('=========================================\n');
    
    createdStates.forEach((state) => {
      console.log(`✓ ${state.name}: ${state.description} (${state.color})`);
    });

    console.log('\n=========================================\n');

    return createdStates;
  } catch (error) {
    console.error('Error seeding request states:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedRequestStates()
    .then(() => {
      console.log('State seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('State seeding failed:', error);
      process.exit(1);
    });
}