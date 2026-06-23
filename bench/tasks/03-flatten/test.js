const assert = require("assert");
const { flattenDeep } = require("./solution");
assert.deepStrictEqual(flattenDeep([1,[2,[3,[4]],5]]), [1,2,3,4,5]);
assert.deepStrictEqual(flattenDeep([]), []);
assert.deepStrictEqual(flattenDeep([1,2,3]), [1,2,3]);
console.log("ALL PASS");
