import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

const web3Grants = [
  {
    name: "Uniswap Grants Program",
    details: "Funding for DeFi projects building on Uniswap.",
    category: "DeFi",
    link: "https://unigrants.org/"
  },
  {
    name: "Ethereum Foundation Grants",
    details: "Support for Ethereum ecosystem development.",
    category: "Infrastructure",
    link: "https://ethereum.foundation/grants/"
  },
  {
    name: "Aave Grants DAO",
    details: "Funding for projects building on Aave.",
    category: "DeFi",
    link: "https://aavegrants.org/"
  },
  {
    name: "Gitcoin Grants",
    details: "Quadratic funding for open source web3 projects.",
    category: "Tooling",
    link: "https://gitcoin.co/grants/"
  },
  {
    name: "Polygon Grants",
    details: "Support for projects building on Polygon.",
    category: "Layer 2",
    link: "https://polygon.technology/grants/"
  },
  {
    name: "Aragon Grants",
    details: "Funding for DAO infrastructure and tooling.",
    category: "DAOs",
    link: "https://aragon.org/grants"
  },
  {
    name: "Mask Network Grants",
    details: "Support for privacy and social web3 tools.",
    category: "Privacy",
    link: "https://mask.io/grants"
  },
  {
    name: "ZKSync Grants",
    details: "Funding for zero-knowledge and Layer 2 projects.",
    category: "Layer 2",
    link: "https://zksync.io/grants/"
  },
  {
    name: "OpenSea Grants",
    details: "Support for NFT ecosystem projects.",
    category: "NFTs",
    link: "https://opensea.io/grants"
  },
  {
    name: "Decentraland DAO Grants",
    details: "Funding for metaverse and gaming projects.",
    category: "Gaming",
    link: "https://decentraland.org/dao/"
  }
];

function getRandomGrant(i: number) {
  const grant = web3Grants[Math.floor(Math.random() * web3Grants.length)];
  return {
    submitted_at: new Date().toISOString(),
    name: `${grant.name} #${i+1}`,
    details: `${grant.details} (Instance ${i+1})`,
    user_id: `user_${(i % 100) + 1}`,
    matched_grantees: `grantee_${(i % 200) + 1}`,
    answers: `Answer for ${grant.name} (Instance ${i+1})`,
    category: grant.category,
    subcategory: "",
    link: grant.link
  };
}

async function seedWeb3Grants() {
  for (let i = 0; i < 1000; i++) {
    const grant = getRandomGrant(i);
    await supabase.from('grants').insert([grant]);
  }
  console.log('Seeded 1000 web3 grants!');
}

seedWeb3Grants(); 