export type GrantAccessInput = {
  username: string;
  hours: number;
  mac?: string | null;
};

export type NetworkController = {
  grantAccess: (input: GrantAccessInput) => Promise<void>;
  revokeAccess: (username: string) => Promise<void>;
};
