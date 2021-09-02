

let orderbook = {
    "bids": [
        {
            "quantity": 0.77372158,
            "price": "0.00819400",
            "orders": [
                {
                    "id": "8796c22c-3e9d-4e72-b288-467bf7a26a5f",
                    "qty": 0.77372159
                }
            ]
        }
    ],
    "offers": [
        {
            "quantity": 0.77372159,
            "price": "0.00819400",
            "orders": [
                {
                    "id": "2c1f9724-6a24-4f7a-a709-055637d4a95b",
                    "qty": 0.77372159
                }
            ]
        },
        {
            "quantity": 1.27872243,
            "price": "0.00831000",
            "orders": [
                {
                    "id": "e4ba498d-8a72-4170-b20b-05224d09cbc5",
                    "qty": 1.27872243
                },
                {
                    "id": "e4ba498d-8a72-4170-b20b-05224d09cbc6",
                    "qty": 2.27872243
                },
                {
                    "id": "e4ba498d-8a72-4170-b20b-05224d09cbc7",
                    "qty": 3.27872243
                }
            ]
        }
    ]
}








let oldArr = [
    {
        "id": "e4ba498d-8a72-4170-b20b-05224d09cbc5",
        "qty": 1.27872243
    }
]

let newElement = { id: 'e4ba498d-8a72-4170-b20b-05224d09cbc5', qty: 0 }


oldArr.splice(0,1)
console.log(oldArr)