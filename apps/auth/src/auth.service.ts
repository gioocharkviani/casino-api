import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SignUpDto } from 'apps/api/src/auth/dto/auth.dto';
import { UserEntity } from 'libs/database/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  //SIGN UP MICROSERVICE
  async signUpMService(data: SignUpDto) {
    console.log(data);
    try {
      const user = this.userRepository.create({
        userName: data.userName,
        birthday: data.birthDay,
        email: data.email,
        lastName: data.lastName,
        password: data.password,
        phone: data.phone,
        firstName: data.firstName,
        verified: false,
      });
      const saveUserInDb = await this.userRepository.save(user);
      return saveUserInDb;
    } catch (error) {
      return error;
    }
  }
  //SIGN IN MICROSERVICE
  async signInMCervice(data: SignUpDto) {}
}
