import express from 'express'
import cors from 'cors'
import { PrismaClient, User } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

const port = process.env.PORT

// see all my friends
app.get('/my-friends/:ourId', async (req, res) => {
  const ourId = Number(req.params.ourId)
  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ friend1Id: ourId }, { friend2Id: ourId }] },
    include: {
      friend1: true,
      friend2: true
    }
  })

  const myFriends: User[] = []

  for (let friendship of friendships) {
    if (friendship.friend1Id === ourId) myFriends.push(friendship.friend2)
    else myFriends.push(friendship.friend1)
  }

  res.send(myFriends)
})

// search all users
app.get('/search/:username', async (req, res) => {
  const username = req.params.username
  const results = await prisma.user.findMany({
    where: { username: { contains: username } }
  })
  res.send(results)
})

// make a friend
app.post('/make-friend', async (req, res) => {
  try {
    const ourId = req.body.ourId
    const theirId = req.body.theirId

    const friendship = await prisma.friendship.create({
      data: { friend1Id: ourId, friend2Id: theirId },
      include: { friend2: true }
    })

    res.send({
      message: `You are now friends with user ${theirId}`,
      user: friendship.friend2
    })
  } catch (error) {
    // @ts-ignore
    res.status(400).send({ error: error.message })
  }
})

// remove a friend
app.delete('/remove-friend', async (req, res) => {
  const ourId = req.body.ourId
  const theirId = req.body.theirId

  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { friend1Id: ourId, friend2Id: theirId },
        { friend1Id: theirId, friend2Id: ourId }
      ]
    }
  })

  res.send({ message: `You are no longer friends with ${theirId}` })
})

app.listen(port, () => {
  console.log(`Listening: http://localhost:${port}`)
})
