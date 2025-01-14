import { ethers } from "hardhat";

export async function deployContract(
  options: { fee: number } = {
    fee: 0,
  }
) {
  // eslint-disable-next-line no-unused-vars
  const [_owner, randomAddress] = await ethers.getSigners();

  const MathHelper = await ethers.getContractFactory("MathHelper");
  const mathHelper = await MathHelper.deploy();

  const PositionHelper = await ethers.getContractFactory("PositionHelper", {
    libraries: {
 //     MathHelper: mathHelper.address,
    },
  });
  const positionHelper = await PositionHelper.deploy();

  const RebalancePoolHelper = await ethers.getContractFactory(
    "RebalancePoolHelper",
    {
      libraries: {
        PositionHelper: positionHelper.address,
      },
    }
  );
  const rebalanceHelper = await RebalancePoolHelper.deploy();

  const CoreContract = await ethers.getContractFactory("CoreContract");
  const coreContract = await CoreContract.deploy();
  await coreContract.deployed();

  const TreasuryContract = await ethers.getContractFactory("Treasury");
  const treasury = await TreasuryContract.deploy();
  await treasury.deployed();

  const ChipTokenContract = await ethers.getContractFactory("Chip");
  const chipToken = await ChipTokenContract.deploy(
    await coreContract.signer.getAddress()
  );

  const LongCfdEthContract = await ethers.getContractFactory("EthLongCfd");
  const longCfdTOken = await LongCfdEthContract.deploy(_owner.address);
  await longCfdTOken.deployed();

  const ShortCfdEthContract = await ethers.getContractFactory("EthShortCfd");
  const shortCfdToken = await ShortCfdEthContract.deploy(_owner.address);
  await shortCfdToken.deployed();

  const PriceConsumerV3Contract = await ethers.getContractFactory(
    "MockPriceOracle"
  );
  const priceConsumer = await PriceConsumerV3Contract.deploy();
  await priceConsumer.deployed();

  const PoolContract = await ethers.getContractFactory("Pool", {
    libraries: {
      PositionHelper: positionHelper.address,
      RebalancePoolHelper: rebalanceHelper.address,
      MathHelper: mathHelper.address,
    },
  });
  const pool = await PoolContract.deploy(
    priceConsumer.address,
    chipToken.address,
    longCfdTOken.address,
    shortCfdToken.address,
    treasury.address,
    options.fee
  );
  await pool.deployed();

  await longCfdTOken.transferOwnerShip(pool.address);
  await shortCfdToken.transferOwnerShip(pool.address);

  return {
    ChipTokenContract,
    CoreContract,
    chipToken,
    coreContract,
    randomAddress,
    longCfdTOken,
    shortCfdToken,
    PoolContract,
    pool,
    treasury,
    priceConsumer,
  };
}
