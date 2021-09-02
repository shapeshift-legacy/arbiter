
//let test = [{price:10}]

// let test = []
// test.price = 10
//
// console.log(test)
// console.log(test.price)
// console.log(test[0])

// test.price


let element = []

element.price = '0.012126'
element[0] = { id: 'ef4d3994-2950-4fed-bcd9-668d28f73631',
    price: '0.012126',
    quantity: 1,
    status: 'Working',
    isBuy: true }


let element2 = []

element2.price = '0.012127'




levels = [
        element,
        element2
    ]

console.log("before: ", levels)
levels.splice(1, 1)
console.log("after: ", levels)