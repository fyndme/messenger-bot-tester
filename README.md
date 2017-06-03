# Test your FB messenger bots

Makes it easy to test Node and non-Node Facebook messenger bots locally.

Project forked from https://github.com/borisvida/messenger-bot-tester

## Validation
- Validates the shape of API requests
- Validates that responses follows the correct script

## Installation
```bash
$ npm i --save-dev tarjimly-messenger-bot-tester
```

## Usage
Example that uses mochajs to run tests  
###test.js
```javascript

const BotTester = require('messenger-bot-tester');

describe('bot test', function() {
  // webHookURL points to where yout bot is currently listening
  // choose a port for the test framework to listen on
  const testingPort = 3100;
  const webHookURL = 'http://localhost:' + 3000 + '/webhook';
  const tester = new BotTester.default(testingPort, webHookURL);

  before(function(){
    // start your own bot here or having it running already in the background
    // redirect all Facebook Requests to http://localhost:3100/v2.6 and not https://graph.facebook.com/v2.6
    return tester.startListening();
  });

  it('hi', function(){
    const theScript = new BotTester.Script('132', '20');
    theScript.sendTextMessage('hi');  //mock user sending "hi"
    theScript.expectTextResponses([   //either response is valid
      'Hey!',
      'Welcome',
    ]);
    return tester.runScript(theScript);
  });
})
```
Run the tests
```
$ mocha test.js
```

## Scripts
Scripts are broken down into messages and responses. Messages are sent from a simulated user to your bot. Responses are what should be sent back to the user.

## Messages
- Text user types free form text
- Postback user clicked a button
- QuickReply user clicked a quick reply button
- Delay wait for a specified time
- Custom, subclass `Message` and provide a custom `send()` that return a Promise
- *Attachement not implemented yet*

## Responses
- Texte validate correct text was sent
- Image validate correct URL was sent
- Audio validate correct URL was sent
- File validate correct URL was sent
- Video validate correct URL was sent
- Quick Reply validate correct text was sent *(does not validate buttons yet)*
- Button Template validate correct text and buttons were sent
- Generic Template validates correct element count was sent
- Receipt Template validates correct element count was sent
- Custom, subclass `Response` and provide custom `check(payload)` that return `bool` if response is correct
