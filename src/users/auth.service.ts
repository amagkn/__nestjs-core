import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { randomBytes, scrypt } from 'crypto';
import { UsersService } from 'src/users/users.service';
import { promisify } from 'util';

const scryptPromised = promisify(scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    const users = await this.usersService.find(email);

    if (users.length) {
      throw new BadRequestException('email in use');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scryptPromised(password, salt, 32)) as Buffer;

    const result = salt + '.' + hash.toString('hex');

    return this.usersService.create(email, result);
  }

  async signin(email: string, password: string) {
    const [user] = await this.usersService.find(email);

    if (!user) {
      throw new ForbiddenException('wrong email or password');
    }

    const [salt, storedHash] = user.password.split('.');

    const hash = (await scryptPromised(password, salt, 32)) as Buffer;

    if (hash.toString('hex') !== storedHash) {
      throw new ForbiddenException('wrong email or password');
    }

    return user;
  }
}
