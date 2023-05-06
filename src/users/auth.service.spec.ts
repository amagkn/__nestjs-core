import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from 'src/users/auth.service';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    const users: User[] = [];

    fakeUsersService = {
      find: (email) => Promise.resolve(users.filter((u) => u.email === email)),
      create: async (email: string, password: string) => {
        const newUser = {
          id: Math.floor(Math.random() * 99999),
          email,
          password,
        } as User;

        users.push(newUser);

        return Promise.resolve(newUser);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('test@test.com', '12345');

    expect(user.password).toBeTruthy();
    expect(user.password).not.toEqual('12345');

    const [salt, hash] = user.password.split('.');

    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('test@test.com', '12345');

    await expect(service.signup('test@test.com', '12345')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws an error if signin is called with an unused email', async () => {
    await expect(service.signin('test@test.com', '12345')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws an error if an invalid password is provided', async () => {
    // Оставил как пример: если не хочется заводить состояние fakeUsersService, можно просто переопределять его методы

    // fakeUsersService.find = () =>
    //   Promise.resolve([
    //     {
    //       id: 1,
    //       email,
    //       password: 'somePasswordThatNotMatching.yeahItsWrongPassword',
    //     },
    //   ] as User[]);
    await service.signup('test@test.com', '12345');

    await expect(
      service.signin('test@test.com', 'someInvalidPassword'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns a user if correct password is provided', async () => {
    await service.signup('test@test.com', '12345');

    const user = await service.signin('test@test.com', '12345');

    expect(user).toBeDefined();
  });
});
