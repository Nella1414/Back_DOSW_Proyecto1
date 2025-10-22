import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import {
  ValidTransition,
  ValidTransitionDocument,
} from '../change-requests/entities/valid-transition.entity';
import { Permission } from '../roles/entities/role.entity';

export async function seedValidTransitions() {
  console.log('Starting valid transitions seeding...');

  const app = await NestFactory.createApplicationContext(AppModule);

  const transitionModel = app.get<Model<ValidTransitionDocument>>(
    getModelToken(ValidTransition.name),
  );

  try {
    // Limpiar transiciones existentes
    console.log('Clearing existing transitions...');
    await transitionModel.deleteMany({});

    // Transiciones iniciales según los requerimientos
    const initialTransitions = [
      // Desde PENDING
      {
        fromState: 'PENDING',
        toState: 'IN_REVIEW',
        description: 'Iniciar revisión de la solicitud',
        requiresReason: false,
        requiredPermissions: [Permission.VIEW_REPORTS],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fromState: 'PENDING',
        toState: 'APPROVED',
        description: 'Aprobar solicitud directamente',
        requiresReason: false,
        requiredPermissions: [Permission.UPDATE_ENROLLMENT],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fromState: 'PENDING',
        toState: 'REJECTED',
        description: 'Rechazar solicitud',
        requiresReason: true,
        requiredPermissions: [Permission.UPDATE_ENROLLMENT],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fromState: 'PENDING',
        toState: 'WAITING_INFO',
        description: 'Solicitar información adicional al estudiante',
        requiresReason: true,
        requiredPermissions: [Permission.VIEW_REPORTS],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Desde IN_REVIEW
      {
        fromState: 'IN_REVIEW',
        toState: 'APPROVED',
        description: 'Aprobar solicitud después de revisión',
        requiresReason: false,
        requiredPermissions: [Permission.UPDATE_ENROLLMENT],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fromState: 'IN_REVIEW',
        toState: 'REJECTED',
        description: 'Rechazar solicitud después de revisión',
        requiresReason: true,
        requiredPermissions: [Permission.UPDATE_ENROLLMENT],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fromState: 'IN_REVIEW',
        toState: 'WAITING_INFO',
        description: 'Solicitar más información durante la revisión',
        requiresReason: true,
        requiredPermissions: [Permission.VIEW_REPORTS],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Desde WAITING_INFO
      {
        fromState: 'WAITING_INFO',
        toState: 'IN_REVIEW',
        description: 'Reanudar revisión con nueva información',
        requiresReason: false,
        requiredPermissions: [Permission.VIEW_REPORTS],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fromState: 'WAITING_INFO',
        toState: 'APPROVED',
        description: 'Aprobar después de recibir información',
        requiresReason: false,
        requiredPermissions: [Permission.UPDATE_ENROLLMENT],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        fromState: 'WAITING_INFO',
        toState: 'REJECTED',
        description: 'Rechazar después de recibir información',
        requiresReason: true,
        requiredPermissions: [Permission.UPDATE_ENROLLMENT],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // Estados finales (APPROVED y REJECTED) no tienen transiciones salientes
      // por defecto, pero se pueden agregar si se requiere reapertura de casos
    ];

    console.log('Creating initial transitions...');
    const createdTransitions = await transitionModel.insertMany(
      initialTransitions,
    );

    console.log('\n✅ Valid Transitions Seeded Successfully!');
    console.log('===========================================\n');
    console.log('📊 Transition Matrix:\n');

    // Agrupar por estado origen para mejor visualización
    const groupedTransitions = createdTransitions.reduce(
      (acc, transition) => {
        if (!acc[transition.fromState]) {
          acc[transition.fromState] = [];
        }
        acc[transition.fromState].push(transition);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    Object.entries(groupedTransitions).forEach(([fromState, transitions]) => {
      console.log(`\n📍 From ${fromState}:`);
      transitions.forEach((t) => {
        const reasonBadge = t.requiresReason ? '⚠️  [Requires Reason]' : '';
        const permsBadge =
          t.requiredPermissions.length > 0
            ? `🔒 [${t.requiredPermissions.join(', ')}]`
            : '';
        console.log(
          `   → ${t.toState}: ${t.description} ${reasonBadge} ${permsBadge}`,
        );
      });
    });

    console.log('\n===========================================');
    console.log(`✅ Total transitions created: ${createdTransitions.length}\n`);

    return createdTransitions;
  } catch (error) {
    console.error('Error seeding valid transitions:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedValidTransitions()
    .then(() => {
      console.log('Transition seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Transition seeding failed:', error);
      process.exit(1);
    });
}