import dotenv from "dotenv"
import express from "express"
import "express-async-errors"
import { MercadoPagoConfig, Payment } from "mercadopago"
import morgan from "morgan"
dotenv.config()

const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN as string,
})

const payment = new Payment(client)

const app = express()
app.use(morgan("dev"))

app.get("/create-payment", async (req, res) => {
  console.log({ env: process.env.ACCESS_TOKEN })
  const email = createEmailTestUser()

  try {
    const response = await payment.create({
      body: {
        additional_info: {
          items: [
            {
              id: "MLB2907679857",
              title: "Point Mini",
              quantity: 1,
              unit_price: 58.8,
            },
          ],
        },
        payer: {
          email,
        },
        transaction_amount: 110.0,
        installments: 1,
        payment_method_id: "master",
      },
      requestOptions: {
        idempotencyKey: "something",
      },
    })
    console.log(response)
  } catch (error) {
    console.log(error)
  }

  res.send("show")
})

app.listen(4000, () => {
  console.log("Server running on port 4000.")
})

function createEmailTestUser() {
  const random = Math.floor(Math.random() * 1000000)
  const email = "test_user" + random + "@testuser.com"
  return email
}
