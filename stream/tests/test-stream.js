'use strict'

var o = require('../../ospec/ospec')

o.spec('stream', function () {
  var prop

  o.beforeEach(function () {
    prop = require('../../stream')
  })

  o.spec('scan', function () {
    var scan

    o.beforeEach(function () {
      scan = require('../scan')
    })

    o('defaults to seed', function () {
      var parent = prop()
      var child = scan(function (out, p) {
        return out - p
      }, 123, parent)
      o(child()).equals(123)
    })

    o('accumulates values as expected', function () {
      var parent = prop()
      var child = scan(function (arr, p) {
        return arr.concat(p)
      }, [], parent)

      parent(7)
      parent('11')
      parent(undefined)
      parent({ a: 1 })
      var result = child()

      // deepEquals fails on arrays?
      o(result[0]).equals(7)
      o(result[1]).equals('11')
      o(result[2]).equals(undefined)
      o(result[3]).deepEquals({ a: 1 })
    })
  })

  o.spec('scanMerge', function () {
    var scanMerge

    o.beforeEach(function () {
      scanMerge = require('../scan-merge')
    })

    o('defaults to seed', function () {
      var parent1 = prop()
      var parent2 = prop()

      var child = scanMerge([
        [parent1, function (out, p1) {
          return out + p1
        }],
        [parent2, function (out, p2) {
          return out + p2
        }]
      ], -10)

      o(child()).equals(-10)
    })

    o('accumulates as expected', function () {
      var parent1 = prop()
      var parent2 = prop()

      var child = scanMerge([
        [parent1, function (out, p1) {
          return out + p1
        }],
        [parent2, function (out, p2) {
          return out + p2 + p2
        }]
      ], 'a')

      parent1('b')
      parent2('c')
      parent1('b')

      o(child()).equals('abccb')
    })
  })
})
