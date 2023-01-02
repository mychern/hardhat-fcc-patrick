// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";


error Raffle__PayMoreToEnterRaffle();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle__UpkeepNotNeeded(uint256 currBal, uint256 num_players, uint256 raffleState);


/**
 * @title A sample Raffle Contract
 * @author Mark
 * @notice This contract is for mocking lec 9 of Patrick Collins's FCC course. About making a
 *         verifiably random lottery generator.
 * @dev Contect implements Chainlink VRF v2 and Chainlink automation compatibility interface (formerly keepers).
 */
contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    /* Type declarations */
    enum RaffleState {
        OPEN,
        CALCULATING
    } // uint256 0 = OPEN, 1 = CALCULATING
    
    // State variables
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery variables
    address private s_recentWinner;
    RaffleState private s_raffleState;

    // Events
    event RaffleEnter(address indexed player);
    event RequestRaffleWinner(uint256 indexed requestId);
    event AddressPickedWinner(address indexed winnerPicked);

    // Functions
    constructor(
        address /*required by parent contract*/ vrfCoordinatorV2, // contract, so probably need to build a mock for it.
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) /*required as part of the contract inherited*/ VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) revert Raffle__PayMoreToEnterRaffle();
        if (s_raffleState != RaffleState.OPEN) revert Raffle__NotOpen();
        s_players.push(payable(msg.sender));
        // Emit an event when we updated a dynamic array or mapping.
        // Named events with the function name reversed.
        emit RaffleEnter(msg.sender);
    }

    /**
     * @dev When `checkUpNeeded` returns true as Chainlink Automation nodes listen
     * to it, performUpKeep() runs on-chain.
     * Conditions for `checkUpNeeded` to be true:
     * 1. Time interval should have passed
     * 2. The lottery should have at least 1 play with some ETH input
     * 3. Our subscription is funded with LINK
     * 4. The lottery should be in an "open" state.
     */
    function checkUpkeep(
        bytes memory /*because calldata doesnt work with string*/ /*checkData*/
    ) public 
      view 
      override 
      returns (
        bool upkeepNeeded,
        bytes memory /* performData */
      ) 
    {
        bool isOpen = RaffleState.OPEN == s_raffleState;
        bool timePassed = (block.timestamp - s_lastTimeStamp) > i_interval;
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = isOpen && timePassed && hasPlayers && hasBalance;
    }
    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        // require(upkeepNeeded, "Upkeep not needed");
        if (!upkeepNeeded) {
            revert Raffle__UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }
        // Request the random number
        // Once we get it, do something with it.
        s_raffleState = RaffleState.CALCULATING;
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane, // gasLane (which sets a limit on the gas spent)
            i_subscriptionId, // subscription on chainlink needed to fund the link (as covered in sub-lecture on chainlink keeper)
            REQUEST_CONFIRMATIONS, // Number of block confirmations to wait before responding. Security measure.
            i_callbackGasLimit, // Limit the gas so that the fulfillRandomWords cant be something thats insanely expensive
            NUM_WORDS // number of random numbers to be produced.
        );
        emit RequestRaffleWinner(requestId);
    }
    function fulfillRandomWords(
        uint256 /*requestId, since never used*/,
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_raffleState = RaffleState.OPEN; // Reset raffleState after one round.
        s_players = new address payable[](0); // Reset players list after a winner has been selected for the previous round.
        s_lastTimeStamp = block.timestamp;
        (bool callSuccess, ) = recentWinner.call{value:address(this).balance}("");
        if (!callSuccess) revert Raffle__TransferFailed();
        emit AddressPickedWinner(recentWinner);
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 idx) public view returns (address) {
        return s_players[idx];
    }

    function getRecentWinner() public view returns(address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords()
      public
      pure /*pure is used for cases including returning a constant variable*/ 
      returns (
        uint256
      )
    {
        return NUM_WORDS; // In bytecode because is constant
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
