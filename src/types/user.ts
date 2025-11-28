export interface HashedPassword {
  hash: string;
  salt: string;
}

export type User = {
  id: number;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  github: string;
  linkedin: string;
  location: string;
};

export type UserWithPassword = User & {
  password: HashedPassword | null;
};
