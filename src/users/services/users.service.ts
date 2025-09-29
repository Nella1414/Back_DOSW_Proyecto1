import { Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../entities/user.entity';
import { Model } from 'mongoose';

/**
 * * Users Management Service
 *
 * ! Servicio parcialmente implementado - Solo create y findAll funcionan
 * ? Este servicio maneja cuentas de usuario del sistema (autenticacion)
 * ? Diferente del StudentsService que maneja perfil academico
 * TODO: Implementar findOne, update y remove correctamente
 * TODO: Agregar validaciones de unicidad de email
 * TODO: Implementar soft delete en lugar de hard delete
 * TODO: Agregar metodos de busqueda por email y roles
 */
@Injectable()
export class UsersService {
  /**
   * * Constructor injects User MongoDB model
   * @param usersModule - Mongoose model for User collection operations
   */
  constructor(
    @InjectModel(User.name) private usersModule: Model<UserDocument>,
  ) {}

  /**
   * * Create new user account
   * ? Funcion implementada correctamente
   * ? Crea usuario en base de datos directamente
   * TODO: Agregar validacion de email unico
   * TODO: Agregar hash de password si no viene hasheado
   */
  async create(createUserDto: CreateUserDto) {
    const userCreated = await this.usersModule.create(createUserDto);
    return userCreated;
  }

  /**
   * * Get all users
   * ? Funcion implementada correctamente
   * ? Retorna todos los usuarios sin filtros
   * TODO: Agregar paginacion para mejorar performance
   * TODO: Agregar filtros por rol, estado activo, etc
   * TODO: Excluir campos sensibles como password en response
   */
  async findAll() {
    const users = await this.usersModule.find({});
    return users;
  }

  /**
   * ! Funcion sin implementar - Retorna string placeholder
   * ? Debe buscar usuario por ID de MongoDB
   * ? Debe excluir password del response
   * TODO: Implementar busqueda por ObjectId
   * TODO: Agregar manejo de errores NotFoundException
   */
  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  /**
   * ! Funcion sin implementar - Retorna string placeholder
   * ? Debe actualizar usuario existente por ID
   * ? Validar que email siga siendo unico si se cambia
   * TODO: Implementar findByIdAndUpdate con validaciones
   * TODO: Prevenir actualizacion de campos criticos como password directamente
   */
  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  /**
   * ! Funcion sin implementar - Retorna string placeholder
   * ? Debe eliminar usuario (preferiblemente soft delete)
   * ? Validar que no tenga enrollments activos antes de eliminar
   * TODO: Implementar soft delete marcando active: false
   * TODO: Agregar validacion de dependencias antes de eliminar
   */
  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
