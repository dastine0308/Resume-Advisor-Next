export interface HashedPassword {
  hash: string;
  salt: string;
}

export type User = {
  id: string;
  email: string | null;
  name: string | null;
  phoneNumber: string | null;
};

export type UserWithPassword = User & {
  password: HashedPassword | null;
};
