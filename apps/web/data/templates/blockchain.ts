import type { Template } from "./index";

export const blockchainTemplate: Template = {
  name: "Blockchain Fundamentals",
  description: "Basic blockchain structure and chain linking principles",
  dsl: `flowchart LR
  genesis([Genesis Block])
  block1[Block #1]
  block2[Block #2]
  block3[Block #3]

  genesis --> block1
  block1 --> block2
  block2 --> block3

@animation
  step 1: show genesis
    name: "Display Genesis Block"
    description: "Display the genesis node on screen."
    duration: 1.5s
    effect: fadeIn

  step 2: highlight genesis
    name: "Highlight Genesis"
    description: "Highlight the genesis node."
    color: #4CAF50
    glow: true
    duration: 1s

  step 3: connect genesis->block1
    name: "Connect Genesis to Block #1"
    description: "Create a flow connection from genesis to block1."
    flow: particles
    speed: 2s

  step 4: show block1
    name: "Display Block #1"
    description: "Display the block1 node on screen."
    effect: slideInRight
    duration: 1s

  step 5: highlight block1
    name: "Highlight Block #1"
    description: "Highlight the block1 node."
    color: #FF9800
    pulse: true
    duration: 1s

  step 6: connect block1->block2
    name: "Connect Block #1 to Block #2"
    description: "Create a flow connection from block1 to block2."
    flow: particles
    speed: 2s

  step 7: show block2
    name: "Display Block #2"
    description: "Display the block2 node on screen."
    effect: slideInRight
    duration: 1s

  step 8: highlight block2
    name: "Highlight Block #2"
    description: "Highlight the block2 node."
    color: #FF9800
    pulse: true
    duration: 1s

  step 9: connect block2->block3
    name: "Connect Block #2 to Block #3"
    description: "Create a flow connection from block2 to block3."
    flow: particles
    speed: 2s

  step 10: show block3
    name: "Display Block #3"
    description: "Display the block3 node on screen."
    effect: slideInRight
    duration: 1s

  step 11: highlight block3
    name: "Highlight Block #3"
    description: "Highlight the block3 node."
    color: #FF9800
    pulse: true
    duration: 1s

  step 12: camera fitAll
    name: "Fit Camera to All"
    description: "Adjust camera to show the entire diagram."
    padding: 50px
    duration: 1.5s
@end

@style
  genesis:
    fill: #e8f5e9
    stroke: #4CAF50
    stroke-width: 3px

  block1, block2, block3:
    fill: #fff3e0
    stroke: #FF9800
    stroke-width: 2px
@end

@narration
  step 1:
    title: "Genesis Block - The First Block"
    text: "Blockchain always starts with the first block called the 'Genesis Block'. This block serves a similar role to the founder in a family tree. It's special because there is no previous block before it."

  step 2:
    title: "What Makes Genesis Block Special"
    text: "The Genesis Block is created only once when the blockchain network is first established. In the case of Bitcoin, it was created by Satoshi Nakamoto on January 3, 2009."

  step 3:
    title: "Blocks Linked by Hash"
    text: "The arrow between blocks represents a 'hash link'. Like puzzle pieces, each block contains the 'fingerprint (hash value)' of the previous block. If someone tries to secretly change a middle block, the fingerprint changes and gets caught immediately."

  step 5:
    title: "Block #1 - First Transaction Records"
    text: "Block #1 records the first transactions after the Genesis Block. Inside this block, the hash value of the Genesis Block is stored, firmly connecting the two blocks together."

  step 7:
    title: "Block #2 - The Chain Grows"
    text: "As new blocks are added, the chain grows longer. The more blocks stack up, the harder it is to forge past records, because changing one requires recalculating all the blocks that follow."

  step 9:
    title: "Block #3 - Continuous Growth"
    text: "Blockchain continues to grow by connecting new blocks like this. Bitcoin creates a new block approximately every 10 minutes, while Ethereum does so every 12 seconds."

  step 11:
    title: "Blockchain Completed"
    text: "This is the core principle of blockchain! Since blocks are linked like a chain via hash values, information once recorded is essentially immutable. This 'immutability' is what makes blockchain trustworthy."
@end

@config
  autoplay: true
  loop: false
  controls: true
  speed: 1.0
  tts: true
@end`,
};
