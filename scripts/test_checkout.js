async function testCheckout() {
  const response = await fetch('http://localhost:3002/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId: 1, // Ahmad Fauzi
      type: 'CREDIT',
      tenor: 12,
      dpAmount: 840000,
      items: [
        {
          productId: 5, // AC Daikin
          quantity: 1,
          price: 4200000
        }
      ]
    })
  })

  if (response.ok) {
    const data = await response.json()
    console.log('Transaction Created successfully:')
    console.log(JSON.stringify(data, null, 2))
  } else {
    const error = await response.json()
    console.log('Error creating transaction:', error)
  }
}

testCheckout()
