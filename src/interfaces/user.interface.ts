export interface IUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserDto {
  name: string;
  email: string;
}

export interface IUpdateUserDto extends Partial<ICreateUserDto> {} 