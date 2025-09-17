import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  //bueno este toca editarlo, porque esto se muestra ne pantalla, es gracioso
  getHello(): string {
    return 'Hello World!';
  }
}
