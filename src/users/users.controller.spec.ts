import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from 'src/users/auth.service';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';

import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  let fakeUsersService: Partial<UsersService>;
  let fakeAuthService: Partial<AuthService>;

  beforeEach(async () => {
    fakeUsersService = {
      async findOne(id: number): Promise<User | null> {
        return {
          id,
          email: 'test@test.com',
          password: '12345',
        } as User;
      },

      async find(email: string): Promise<User[]> {
        return [{ id: 1, email, password: '12345' }] as User[];
      },

      // async remove(id: number): Promise<User> {
      //   return null;
      // },
      // async update(id: number, attrs: Partial<User>): Promise<User> {
      //   return null;
      // },
    };

    fakeAuthService = {
      // async signup(email: string, password: string): Promise<User> {
      //   return null;
      // },
      //
      async signin(email: string, password: string): Promise<User> {
        return { email, password, id: 1 } as User;
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: fakeUsersService },
        { provide: AuthService, useValue: fakeAuthService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('whoAmI receives and returns the same user', async () => {
    const user = {
      id: 1,
      email: 'test@test.com',
      password: '12345',
    } as User;

    const returnedUser = await controller.whoAmI(user);

    expect(returnedUser).toEqual(user);
  });

  it('findAllUsers returns a list of users with the given email', async () => {
    const email = 'test@test.com';
    const users = await controller.findAllUsers(email);

    expect(users[0]).toBeDefined();
    expect(users[0].email).toEqual(email);
  });

  it('findUser returns a single user with the given id', async () => {
    const user = await controller.findUser('1');

    expect(user).toBeDefined();
    expect(user.id).toEqual(1);
  });

  it('findUser throws error if user is not found', async () => {
    fakeUsersService.findOne = () => null;

    await expect(controller.findUser('1')).rejects.toThrow(NotFoundException);
  });

  it('signin updates session object and returns user', async () => {
    const session: { [key: string]: any } = {};

    const user = await controller.signIn(
      {
        email: 'test@test.com',
        password: '12345',
      },
      session,
    );

    expect(user).toBeDefined();
    expect(session.userId).toBeDefined();
    expect(session.userId).toEqual(user.id);
  });
});
