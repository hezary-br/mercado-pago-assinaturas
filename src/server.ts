import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import express from "express"
import "express-async-errors"
import {
  CardToken,
  Customer,
  CustomerCard,
  MercadoPagoConfig,
  PreApproval,
  PreApprovalPlan,
} from "mercadopago"
import morgan from "morgan"
import { usersRepository } from "./db/user-repository"
dotenv.config()

const client = new MercadoPagoConfig({
  accessToken: process.env.ACCESS_TOKEN as string,
})

const cardToken = new CardToken(client)
const customerCard = new CustomerCard(client)
cardToken.create({
  body: {
    card_id: "",
  },
})
const preApproval = new PreApproval(client)
const preApprovalPlan = new PreApprovalPlan(client)

const customer = new Customer(client)

const app = express()
app.use(cookieParser())
app.use(express.json())

app.use(express.static("src/public"))
app.use(morgan("dev"))

app.post("/", (req, res) => {
  console.log(req.body)
  console.log(req.params)
  console.log(req.headers)
  res.send("Received!")
})

app.get("/users", async (req, res) => {
  try {
    const users = await usersRepository.list()
    return res.status(200).json(users)
  } catch (error) {
    return res.status(400).json(error)
  }
})

app.get("/users/:username", async (req, res) => {
  try {
    const users = await usersRepository.get(req.params.username)
    return res.status(200).json(users)
  } catch (error) {
    return res.status(400).json(error)
  }
})

app.get("/get-plan/:planId", async (req, res) => {
  try {
    const found = await preApprovalPlan.get({
      preApprovalPlanId: req.params.planId,
    })
    return res.status(200).json(found)
  } catch (error) {
    return res.status(400).json(error)
  }
})

app.get("/search", async (req, res) => {
  try {
    const found = await customer.search()
    return res.status(200).json(found)
  } catch (error) {
    return res.status(400).json(error)
  }
})

app.get("/customer/:id", async (req, res) => {
  try {
    const found = await customer.get({
      customerId: req.body.params.id,
    })
    return res.status(200).json(found)
  } catch (error) {
    return res.status(400).json(error)
  }
})

app.get("/get-plan-root/:planId", async (req, res) => {
  try {
    const found = await preApproval.get({
      id: req.params.planId,
    })

    console.log(found)

    // const payerData = await customer.get({
    //   customerId: found.payer_id!,
    // })

    return res.status(200).json({ ...found })
  } catch (error) {
    return res.status(400).json(error)
  }
})

app.post("/success", async (req, res) => {
  const { action, type, date } = req.body
  switch (action) {
    case "payment.created":
    case "created":
    case "updated":
      switch (type) {
        case "subscription_preapproval":
          console.log("Uma assinatura foi criada, processando...")
          const found = await preApproval.get({
            id: req.body.data?.id,
          })
          const user = await usersRepository.get(found.external_reference!)
          user.changePlan("pro")
          await usersRepository.save(user)
          console.log("Updated user's plan.")
        case "subscription_authorized_payment":
          console.log("Parcela da assinatura paga!", req.body)
      }
    default:
      console.log({ action, type })
  }
  return res.status(204).end()
})

app.get("/create-payment", async (req, res) => {
  const email = createEmailTestUser()

  try {
    const response = await preApprovalPlan.create({
      body: {
        reason: "Plano Ouro - Hourboost",
        auto_recurring: {
          repetitions: 12,
          transaction_amount: 18,
          currency_id: "BRL",
          frequency: 1,
          frequency_type: "months",
          billing_day: 10,
          billing_day_proportional: true,
        },
        payment_methods_allowed: {
          payment_types: [{ id: "credit_card" }],
        },
        back_url: "https://hourboost-mercadopago.ultrahook.com",
      },
    })

    return res.status(307).redirect(response.init_point!)
    // return res.status(200).json(response)
  } catch (error) {
    console.log(error)
    return res.status(200).json({ error })
  }
})

app.get("/create-payment-root", async (req, res) => {
  const email = createEmailTestUser()

  try {
    const username = req.cookies["username"]
    if (!username) throw new Error("No username.")

    const response = await preApproval.create({
      body: {
        reason: "test",
        external_reference: username,
        payer_email: "test_user_1314812285@testuser.com",
        auto_recurring: {
          frequency: 1,
          frequency_type: "days",
          transaction_amount: 10,
          currency_id: "BRL",
        },
        back_url: "https://hourboost-mercadopago.ultrahook.com",
        status: "pending",
      },
    })

    return res.status(307).redirect(response.init_point!)
    // return res.status(200).json(response)
  } catch (error) {
    console.log(error)
    return res.status(200).json({ error })
  }
})

app.listen(4000, () => {
  console.log("Server running on port 4000.")
})

function createEmailTestUser() {
  const random = Math.floor(Math.random() * 1000000)
  const email = "test_user" + random + "@testuser.com"
  return email
}
