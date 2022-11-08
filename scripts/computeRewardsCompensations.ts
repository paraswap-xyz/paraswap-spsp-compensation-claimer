import fs from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { parse } from 'csv-parse';
import path from 'path';
import _, { uniq } from 'lodash';
import { assert } from 'ts-essentials';
import { MerkleTree } from 'merkletreejs';
import { ethers } from 'ethers';

type Leaf = {
  index: number;
  address: string;
  rewards: bigint;
  proof: string[];
};

const constructMerkleTree = (
  claimables: { rewards: bigint; address: string }[],
) => {
  const hashedLeaves = claimables.map(({ address, rewards }, index) => {
    const e = ethers.utils.solidityPack(
      ['uint256', 'address', 'uint256'],
      [index, address, rewards.toString()],
    );
    return ethers.utils.keccak256(e);
  });

  const merkleTree = new MerkleTree(hashedLeaves, ethers.utils.keccak256, {
    sort: true,
  });

  const root = merkleTree.getHexRoot();

  const { leaves, leafByAddress } = claimables.reduce<{
    leaves: Leaf[];
    leafByAddress: Record<string, Leaf>;
  }>(
    (acc, claimable, index) => {
      const hashedLeaf = hashedLeaves[index];
      const { address } = claimable;
      const proof = merkleTree.getHexProof(hashedLeaf);
      const leaf: Leaf = { ...claimable, index, proof };

      acc.leaves.push(leaf);
      acc.leafByAddress[address] = leaf;

      return acc;
    },
    { leaves: [], leafByAddress: {} },
  );

  return {
    root,
    leaves,
    leafByAddress,
  };
};

const getApwineBalancesByAddress = (p: string) =>
  new Promise<Record<string, [string, string, string, string, string]>>(
    resolve => {
      const csvData: [string, string][] = [];

      fs.createReadStream(p)
        .pipe(parse({ delimiter: ',' }))
        .on('data', csvrow => {
          csvData.push(csvrow);
        })
        .on('end', () => {
          csvData.shift();

          resolve(
            Object.fromEntries(
              csvData.map(v => [
                v[0].toLowerCase(),
                v as unknown as [string, string, string, string, string],
              ]),
            ),
          );
        });
    },
  );

const serializeDeepBigInt = (obj: Record<string, unknown>) =>
  JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v));

const PARASWAP_FUTURE_VAULT =
  '0xb9df660caaa62d47df265a469c8b77f661efc18d'.toLowerCase();
const AMM = '0xa4085c106c7a9a7ad0574865bbd7cac5e1098195'.toLowerCase();
const FUTURE_WALLET =
  '0x0AdB804fE292AF95C05e3c03E6ea372116b37D69'.toLowerCase();

const sPSP4 = '0x6b1D394Ca67fDB9C90BBd26FE692DdA4F4f53ECD'.toLowerCase();
const sPSP10 = '0x36d69afE2194F9A1756ba1956CE2e0287A40F671'.toLowerCase();
const PSP = '0xcafe001067cdef266afb7eb5a286dcfd277f3de5'.toLowerCase();

type PSPStakesForStaker<T, U = T> = {
  pspStaked: T;
  breakdownByStakingContract: { [contractAddress: string]: U };
};

type Response = {
  pspStakersWithStake: { [staker: string]: PSPStakesForStaker<string> };
};

const TARGET_TOTAL_REWARDS_SPSP4 = 170_000n * 10n ** 18n;
const TARGET_TOTAL_REWARDS_SPSP10 = 19_621n * 10n ** 18n;

const n = (b: bigint) => b / 10n ** 18n;
const BLOCK_NUMBER = 15712957;

const APWINE_INDEXES = {
  ADDRESS: 0,
  PT_BALANCE: 1,
  EXPIRED_LIQ: 2,
  FYT: 3,
  CLAIMABLE_YIED: 4,
};
async function computeTotalRewards() {
  const apwineBalancesByAddress = await getApwineBalancesByAddress(
    path.join(__dirname, `./apwine_snapshot_${BLOCK_NUMBER}.csv`),
  );
  // computed by fetching holders addresses from covalent and fetching each balances of each staker
  const { pspStakersWithStake } = JSON.parse(
    await readFile(path.join(__dirname, `./spsps_snapshot_${BLOCK_NUMBER}.json`), 'utf8'),
  ) as Response;

  const {
    TotalPSPStakedInSPSP4: TOTAL_PSP_STAKED_IN_SPSP4,
    TotalPSPStakedInSPSP10: TOTAL_PSP_STAKED_IN_SPSP10,
  } = Object.values(pspStakersWithStake).reduce(
    (acc, curr) => {
      acc.TotalPSPStakedInSPSP4 += BigInt(
        curr.breakdownByStakingContract[sPSP4] || 0,
      );
      acc.TotalPSPStakedInSPSP10 += BigInt(
        curr.breakdownByStakingContract[sPSP10] || 0,
      );

      return acc;
    },
    {
      TotalPSPStakedInSPSP4: 0n,
      TotalPSPStakedInSPSP10: 0n,
    },
  );

  const allAddress = uniq([
    ...Object.keys(apwineBalancesByAddress),
    ...Object.keys(pspStakersWithStake),
  ]).filter(
    a => ![PARASWAP_FUTURE_VAULT, FUTURE_WALLET, AMM].includes(a.toLowerCase()),
  );

  let TOTAL_PRECISE_REWARDS = 0n;

  const REWARDS_BY_STAKER = allAddress.reduce<
    {
      address: string;
      rewards: bigint;
      descr: {
        total_psp_staked_in_spsp4: bigint;
        total_psp_staked_in_spsp10: bigint;
        rewards_from_spsp4: bigint;
        rewards_from_spsp10: bigint;
      };
      apwine_descr?: {
        total_psp_staked_in_spsp4_in_apwine: bigint;
        pt_balance: bigint;
        fyt_accrued: bigint;
        claimable_yield: bigint;
        expired_liquidity: bigint;
      };
    }[]
  >((acc, address) => {
    assert(
      address === address.toLowerCase(),
      'address should be lowercased already',
    );

    const pt_balance = BigInt(
      apwineBalancesByAddress[address]?.[APWINE_INDEXES.PT_BALANCE] || 0,
    );
    const fyt_accrued = BigInt(
      apwineBalancesByAddress[address]?.[APWINE_INDEXES.FYT] || 0,
    );
    const claimable_yield = BigInt(
      apwineBalancesByAddress[address]?.[APWINE_INDEXES.CLAIMABLE_YIED] || 0,
    );
    const expired_liquidity = BigInt(
      apwineBalancesByAddress[address]?.[APWINE_INDEXES.EXPIRED_LIQ] || 0,
    );

    const total_psp_staked_in_spsp4_in_apwine =
      pt_balance + fyt_accrued + claimable_yield + expired_liquidity;

    const total_psp_staked_in_spsp4 =
      BigInt(
        pspStakersWithStake[address]?.breakdownByStakingContract[sPSP4] || 0,
      ) + total_psp_staked_in_spsp4_in_apwine;

    const total_psp_staked_in_spsp10 = BigInt(
      pspStakersWithStake[address]?.breakdownByStakingContract[sPSP10] || 0,
    );

    if (!total_psp_staked_in_spsp4 && !total_psp_staked_in_spsp10) return acc;

    const rewards_from_spsp4 =
      (total_psp_staked_in_spsp4 * TARGET_TOTAL_REWARDS_SPSP4) /
      TOTAL_PSP_STAKED_IN_SPSP4;

    const rewards_from_spsp10 =
      (total_psp_staked_in_spsp10 * TARGET_TOTAL_REWARDS_SPSP10) /
      TOTAL_PSP_STAKED_IN_SPSP10;

    const rewards_from_spsp4_and_spsp10 =
      rewards_from_spsp4 + rewards_from_spsp10;

    TOTAL_PRECISE_REWARDS += rewards_from_spsp4_and_spsp10;

    const entry = {
      address,
      rewards: rewards_from_spsp4_and_spsp10,
      descr: {
        rewards_formatted: +rewards_from_spsp4_and_spsp10.toString() / 10 ** 18,
        total_psp_staked_in_spsp10,
        rewards_from_spsp10,
        total_psp_staked_in_spsp4,
        rewards_from_spsp4,
      },
      ...(total_psp_staked_in_spsp4_in_apwine && {
        apwine_descr: {
          total_psp_staked_in_spsp4_in_apwine: n( // error here should not normalise but data already computed
            total_psp_staked_in_spsp4_in_apwine,
          ),
          pt_balance,
          fyt_accrued,
          claimable_yield,
          expired_liquidity,
        },
      }),
    };

    acc.push(entry);

    return acc;
  }, []);

  const tree = constructMerkleTree(REWARDS_BY_STAKER);

  const data = {
    CHAIN_ID: 1,
    BLOCK_NUMBER,
    TOTAL_PRECISE_REWARDS,
    TARGET_TOTAL_REWARDS_SPSP4,
    TARGET_TOTAL_REWARDS_SPSP10,
    TOTAL_PSP_STAKED_IN_SPSP4,
    TOTAL_PSP_STAKED_IN_SPSP10,
    CONTRACTS: {
      PSP,
      sPSP4,
      sPSP10,
      APWINE_PARASWAP_FUTURE_VAULT: PARASWAP_FUTURE_VAULT,
      APWINE_HYDRID_FUTURE_WALLET: FUTURE_WALLET,
      APWINE_AMM: AMM,
    },
    MERKLE_ROOT: tree.root,
    REWARDS_BY_STAKER: tree.leaves,
  };

  await writeFile(
    path.join(__dirname, `rewards-compensation-spsp4-spsp10-block-${BLOCK_NUMBER}.json`),
    serializeDeepBigInt(data),
  );
}

computeTotalRewards();