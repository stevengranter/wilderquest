import 'dotenv/config'
import mysql from 'mysql2/promise'
import {faker} from '@faker-js/faker'
import * as emoji from 'node-emoji'
import pluralize from 'pluralize'
import {createId} from '@paralleldrive/cuid2'
import {createNameId} from 'mnemonic-id'
import weighted from 'weighted'
import {genSaltSync, hashSync} from 'bcrypt-ts'
import fs from 'fs'
import dbConfig from './config/app.config.js'
import appConfig from './config/app.config.js'

type User = {
    username: string
    email: string
    password: string // Log the password before hashing
    created_at: Date
    updated_at: Date
    user_cuid: string
}

const db = await mysql.createConnection({
    host: appConfig.MYSQL_HOST,
    port: appConfig.MYSQL_PORT,
    database: appConfig.MYSQL_DATABASE,
    user: appConfig.MYSQL_USER,
    password: appConfig.MYSQL_PASSWORD,
})

const API_URL = 'https://api.inaturalist.org/v1/taxa/'

type inatApiParams = {
    q: string
    rank?: string
    order?: 'desc' | 'asc'
    order_by?: string
}

const generateFakeTaxa = (quantity: number) => {
    const taxa = []
    for (let i = 0; i < quantity; i++) {
        taxa.push(getRandomInt(5000, 999999))
    }
    return taxa
}

function getRandomInt(min: number, max: number): number {
    if (min > max) {
        throw new Error('Min id must be less than or equal to max id.')
    }

    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function capitalizeString(str: string): string {
    if (!str) {
        return str // Return the original string if it's empty or nullish
    }
    return str.charAt(0).toUpperCase() + str.slice(1)
}

const adminUser = {
    username: 'admin',
    password: 'mypassword',
    email: 'adminUser555@example.com',
    user_cuid: createId(),
    created_at: new Date(),
    updated_at: new Date(),
    role_id: 2,
}

// Function to log the raw user data to a file before password hashing
const logRawUserData = (user: User) => {
    const rawUserData = [
        user.username,
        user.email,
        user.password, // Log the password before hashing
        user.created_at,
        user.updated_at,
        user.user_cuid,
    ]

    // Append the data to a CSV file
    const csvRow = rawUserData.join(',') + '\n'

    fs.appendFile('raw_users.dev.csv', csvRow, (err) => {
        if (err) {
            console.error('Error logging user data:', err)
        } else {
            console.log('User data logged to file.')
        }
    })
}

// Function to ensure the CSV header is written to the file
const writeCsvHeader = () => {
    const header = 'username,email,password,created_at,updated_at,user_cuid\n'
    fs.writeFile('raw_users.dev.csv', header, (err) => {
        if (err) {
            console.error('Error writing CSV header:', err)
        }
    })
}

// Ensure the CSV header is written when the script starts
writeCsvHeader()

const createFakeUser = () => {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const username = createNameId({capitalize: true, delimiter: ''})
    const email = username.toLowerCase() + '@' + faker.internet.domainName()
    const password = faker.internet.password({length: 8, memorable: true})
    const role_id = 1
    const created_at = faker.date.between({
        from: '2020-01-01',
        to: Date.now(),
    })
    const updated_at = faker.date.between({
        from: '2020-01-01',
        to: Date.now(),
    })
    const user_cuid = createId()
    return {
        username,
        email,
        password,
        role_id,
        created_at,
        updated_at,
        user_cuid,
    }
}

const createFakeCollection = (animal = faker.animal.type()) => {
    const user_id = getRandomInt(1, 12)
    // const animal = animal || faker.animal.type()
    const animalEmoji = emoji.find(animal)
    // let animalEmojiStr = ""
    // if (animalEmoji) {animalEmojiStr = animalEmoji.emoji.toString()}
    const prefixStr = ['', 'Awesome ', 'My favourite ', 'I love ']
    const suffixStr = ['', ' ❤️', animalEmoji?.emoji || '😍', '!']
    const weights = [0.49, 0.17, 0.17, 0.17]
    const nameStr =
        weighted.select(prefixStr, weights) +
        pluralize(animal) +
        ' ' +
        weighted.select(suffixStr, weights)
    const name = capitalizeString(nameStr)
    const created_at = faker.date.between({
        from: '2020-01-01',
        to: Date.now(),
    })
    const updated_at = faker.date.between({
        from: '2020-01-01',
        to: Date.now(),
    })
    const is_private = faker.number.int({ min: 0, max: 1 })
    console.log(
        `Creating collection for user ${user_id} with name ${name} and emoji ${animalEmoji?.emoji}`,
    )
    return {
        name,
        user_id,
        emoji: animalEmoji?.emoji || '🐾',
        created_at,
        updated_at,
        is_private,
    }
}

const createUsers = async (quantity: number) => {
    const userIds = []
    for (let i = 0; i < quantity; i++) {
        const user = createFakeUser()
        logRawUserData(user)
        const user_id = await addUserToDatabase(user)

        if (!user_id) {
            console.log('Error adding user to db')
            return
        }
        // Generate collections
        const numberOfCollections = getRandomInt(0, 5)
        for (let j = 0; j < numberOfCollections; j++) {
            const animal = faker.animal.type()
            const collection = createFakeCollection(animal)
            collection.user_id = user_id
            const collection_id = await addRowToTable('collections', collection)
            const numberOfTaxa = getRandomInt(1, 29)
            const taxaArray = generateFakeTaxa(numberOfTaxa)
            for (const taxon_id of taxaArray) {
                await addRowToTable('collections_to_taxa', {
                    collection_id,
                    taxon_id,
                })
            }
            userIds.push(user_id)
        }
    }
    return userIds
}

const dropTable = async (tableName: string) => {
    await db.execute(`DROP TABLE ${tableName}`)
}

async function addUserToDatabase(user: User) {
    const {password: UNSAFEPassword} = user
    const securePassword = hashSync(UNSAFEPassword, genSaltSync(10))
    const safeUser = {...user, password: securePassword}
    return await addRowToTable('users', safeUser)
}

async function addRowToTable<T extends object>(tableName: string, data: T) {
    const columns = Object.keys(data).join(', ')
    const values = Object.values(data)
    const placeholders = values.map(() => '?').join(', ')
    try {
        const [result] = await db.execute<any>(
            `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
            values
        )
        return result.insertId // Return the ID of the newly inserted record
    } catch (error) {
        console.error(`Error creating record in ${tableName}:`, error)
        throw error
    }
}

const users = await createUsers(12)
const admin = await addUserToDatabase(adminUser)
if (admin) {
    console.log('Admin created successfully:')
    console.log(adminUser)
}
db.end()

// console.log(users)
// console.log(collections)
console.log(users)

// console.log(await addRowsToTable("collections",collections))
// console.log(await(fetchInatTaxa({q:"squirrel",})));
