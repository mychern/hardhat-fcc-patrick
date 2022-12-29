// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0; // 0.8.12 is latest

// ^0.8.7 means anything that is newer than 0.8.7, including
// >=0.8.7 <0.9.0 is also a good way to restrict

contract simpleStorage {
    uint256 public favoriteNumber; // setting this public gives an additional button to see this variable
    // because setting to public is equivalent to creating a getter function
    // in Solidity.

    struct People {
        uint256 favoriteNumber;
        string firstName;
    }
    People[] public people;

    mapping(string => uint256) public nameToFavoriteNumber;

    function store(uint256 _favoriteNumber) public virtual {
        favoriteNumber = _favoriteNumber;
    }

    function retrieve() public view returns (uint256) {
        return favoriteNumber;
    }

    function addPerson(uint _favoriteNumber, string memory _firstName) public {
        // people.push(People({favoriteNumber:_favoriteNumber, firstName:_firstName}));
        people.push(People(_favoriteNumber, _firstName));
        nameToFavoriteNumber[_firstName] = _favoriteNumber;
    }

    /* Again, this is the same as setting the variable, favoriteNumber, to public.
     * important to note the use of 'view'
    function getFN() public view returns(uint) {
        return favoriteNumber;
    }
    */
}

// contract is located at this addr: 0xd9145CCE52D386f254917e481eB44e9943F39138
// each time calling the function actually triggers another transaction (message txn)
