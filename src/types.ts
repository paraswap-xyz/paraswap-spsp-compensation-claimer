export type HexData = `0x{string}`;
export type Config = {
  [chainId: number]: { claimer: string; url: string };
};

export type UserClaimData = {
  address: string;
  rewards: string;
  index: number;
  proof: string[];
  descr: {
    rewards_formatted: number;
    total_psp_staked_in_spsp10: string;
    rewards_from_spsp10: string;
    total_psp_staked_in_spsp4: string;
    rewards_from_spsp4: string;
  };
  apwine_descr?: {
    total_psp_staked_in_spsp4_in_apwine: string;
    pt_balance: string;
    fyt_accrued: string;
    claimable_yield: string;
    expired_liquidity: string;
  };
};

export type GlobalClaimData = {
  BLOCK_NUMBER: number;
  TOTAL_PRECISE_REWARDS: string;
  TARGET_TOTAL_REWARDS_SPSP4: string;
  TARGET_TOTAL_REWARDS_SPSP10: string;
  TOTAL_PSP_STAKED_IN_SPSP4: string;
  TOTAL_PSP_STAKED_IN_SPSP10: string;
  REWARDS_BY_STAKER: UserClaimData[];
};
