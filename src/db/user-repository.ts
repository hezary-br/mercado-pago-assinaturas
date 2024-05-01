class User {
  plan: "free" | "pro"
  constructor(readonly username: string) {
    this.plan = "free"
  }

  changePlan(plan: "free" | "pro") {
    this.plan = plan
  }
}

const users: Record<string, User> = {
  vitormarkis: new User("vitormarkis"),
  kauan: new User("kauan"),
  leo: new User("leo"),
  thomas: new User("thomas"),
}

export const usersRepository = {
  get(username: string): Promise<User> {
    const foundUser = users[username]
    if (!foundUser)
      return Promise.reject(`No user found with username: [${username}]`)
    return Promise.resolve(foundUser)
  },
  list(): Promise<User[]> {
    const usersList = Object.values(users)
    return Promise.resolve(usersList)
  },
  save(user: User): Promise<User> {
    users[user.username] = user
    return Promise.resolve(user)
  },
}
