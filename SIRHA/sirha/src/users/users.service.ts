import { Injectable } from '@nestjs/common';
import { User, UserRole } from '../common/interfaces';

@Injectable()
export class UsersService {
  private users: User[] = [];
  private idCounter = 1;

  create(username: string, password: string, role: UserRole = UserRole.STUDENT): User {
    const user: User = { id: this.idCounter++, username, password, role, groupIds: [] };
    this.users.push(user);
    return user;
  }

  findAll() { return this.users; }

  findById(id: number) { return this.users.find(u => u.id === id); }

  findByUsername(username: string) { return this.users.find(u => u.username === username); }

  // Añade un grupo al estudiante
  addGroup(userId: number, groupId: number) {
    const user = this.findById(userId);
    if (user && !user.groupIds.includes(groupId)) {
      user.groupIds.push(groupId);
      return user;
    }
    return null;
  }
}
