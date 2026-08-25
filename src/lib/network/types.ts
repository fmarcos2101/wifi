export type GrantAccessInput = {
  username: string;
  password: string;
  hours: number;
  mac?: string | null;
};

export type RevokeAccessInput = {
  username: string;
  mac?: string | null;
};

export type NetworkController = {
  grantAccess: (input: GrantAccessInput) => Promise<void>;
  revokeAccess: (input: RevokeAccessInput) => Promise<void>;
};
