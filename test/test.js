var expect = require('chai').expect;
var addTwoNumbers = require('./addTwoNumbers');

describe('addTwoNumbers()', function () {
  it('should add two numbers', function () {
    var x = 5;
    var y = 1;
    var sum1 = x + y;
    var sum2 = addTwoNumbers(x, y);
    expect(sum2).to.be.equal(sum1);
  });
});
