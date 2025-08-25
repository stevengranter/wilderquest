import 'dotenv/config'
import mysql, { ResultSetHeader } from 'mysql2/promise'
import { faker } from '@faker-js/faker'
import * as emoji from 'node-emoji'
import { createId } from '@paralleldrive/cuid2'
import { createNameId } from 'mnemonic-id'
import { genSaltSync, hashSync } from 'bcrypt-ts'
import fs from 'fs'
import env from './config/app.config.js'
import * as os from 'node:os'

type User = {
    username: string
    email: string
    password: string // Log the password before hashing
    created_at: Date
    updated_at: Date
    user_cuid: string
}

const db = await mysql.createConnection({
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    database: env.MYSQL_DATABASE,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
})

const API_URL = 'https://api.inaturalist.org/v1/observations/species_counts'

type inatApiParams = {
    lat: number
    lng: number
    radius?: number
    per_page?: number
    order_by?: string
    quality_grade?: string
    verifiable?: boolean
}

// Fetch real taxa from iNaturalist based on location
const fetchLocationTaxa = async (
    lat: number,
    lng: number,
    limit: number = 20
) => {
    try {
        const params: inatApiParams = {
            lat,
            lng,
            radius: 50, // 50km radius
            per_page: Math.min(limit * 2, 100), // Get more than needed for variety
            quality_grade: 'research',
            verifiable: true,
        }

        const queryString = Object.entries(params)
            .map(
                ([key, value]) =>
                    `${key}=${encodeURIComponent(value.toString())}`
            )
            .join('&')

        const response = await fetch(`${API_URL}?${queryString}`)

        if (!response.ok) {
            console.warn(
                `iNaturalist API error: ${response.status}. Using fallback taxa.`
            )
            return generateFallbackTaxa(limit)
        }

        const data = await response.json()

        if (!data.results || data.results.length === 0) {
            console.warn(
                `No observations found for location ${lat}, ${lng}. Using fallback taxa.`
            )
            return generateFallbackTaxa(limit)
        }

        // Extract taxon IDs and shuffle for variety
        const taxonIds = data.results
            .map((result: { taxon: { id: number } }) => result.taxon.id)
            .filter((id: number) => id && id > 0)

        // Shuffle and return requested number
        const shuffled = taxonIds.sort(() => 0.5 - Math.random())
        const selected = shuffled.slice(0, limit)

        console.log(
            `Fetched ${selected.length} real taxa for location ${lat}, ${lng}`
        )
        return selected
    } catch (error) {
        console.error('Error fetching taxa from iNaturalist:', error)
        console.log('Using fallback random taxa')
        return generateFallbackTaxa(limit)
    }
}

const generateFallbackTaxa = (quantity: number) => {
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

function _capitalizeString(str: string): string {
    if (!str) {
        return str // Return the original string if it's empty or nullish
    }
    return str.charAt(0).toUpperCase() + str.slice(1)
}

// Generate a realistic location with coordinates
const generateLocation = () => {
    const locations = [
        // Canadian locations (75%)
        {
            name: 'Banff National Park, Alberta',
            lat: 51.496705,
            lng: -115.928917,
            place_id: 'banff_np_ab',
        },
        {
            name: 'Stanley Park, Vancouver',
            lat: 49.301389,
            lng: -123.143889,
            place_id: 'stanley_park_vancouver',
        },
        {
            name: 'Algonquin Provincial Park, Ontario',
            lat: 45.86,
            lng: -78.35,
            place_id: 'algonquin_pp_on',
        },
        {
            name: 'Mont-Royal, Montreal',
            lat: 45.504167,
            lng: -73.590278,
            place_id: 'mont_royal_montreal',
        },
        {
            name: 'Jasper National Park, Alberta',
            lat: 52.8734,
            lng: -118.0814,
            place_id: 'jasper_np_ab',
        },
        {
            name: 'Gros Morne National Park, Newfoundland',
            lat: 49.593056,
            lng: -57.806944,
            place_id: 'gros_morne_np_nl',
        },
        {
            name: 'Point Pelee National Park, Ontario',
            lat: 42.203611,
            lng: -82.515833,
            place_id: 'point_pelee_np_on',
        },
        {
            name: 'Pacific Rim National Park, BC',
            lat: 49.015278,
            lng: -125.774722,
            place_id: 'pacific_rim_np_bc',
        },
        {
            name: 'Prince Edward Island National Park',
            lat: 46.416667,
            lng: -63.083333,
            place_id: 'pei_np',
        },
        {
            name: 'Riding Mountain National Park, Manitoba',
            lat: 50.655833,
            lng: -99.948056,
            place_id: 'riding_mountain_np_mb',
        },
        {
            name: 'Thousand Islands National Park, Ontario',
            lat: 44.366667,
            lng: -75.916667,
            place_id: 'thousand_islands_np_on',
        },
        {
            name: 'La Mauricie National Park, Quebec',
            lat: 46.65,
            lng: -72.916667,
            place_id: 'la_mauricie_np_qc',
        },
        // International locations (25%)
        {
            name: 'Hyde Park, London',
            lat: 51.508611,
            lng: -0.163611,
            place_id: 'hyde_park_london',
        },
        {
            name: 'Kruger National Park, South Africa',
            lat: -24.0058,
            lng: 31.4914,
            place_id: 'kruger_np_za',
        },
        {
            name: 'Monteverde Cloud Forest, Costa Rica',
            lat: 10.3,
            lng: -84.783333,
            place_id: 'monteverde_cr',
        },
        {
            name: 'Fuji-Hakone-Izu National Park, Japan',
            lat: 35.360833,
            lng: 138.7275,
            place_id: 'fuji_hakone_izu_np_jp',
        },
    ]
    return faker.helpers.arrayElement(locations)
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
        user.password,
        user.created_at ? user.created_at.toISOString() : '',
        user.updated_at ? user.updated_at.toISOString() : '',
        user.user_cuid,
    ]

    // Get the current date in YYYY.MM.DD format
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0') // Months are 0-indexed
    const day = now.getDate().toString().padStart(2, '0')
    const dateString = `${year}.${month}.${day}`

    // Get the OS name and release version
    const osPlatform = os.platform() // e.g., 'darwin', 'win32', 'linux'
    const osRelease = os.release() // e.g., '23.5.0', '10.0.19045', '6.5.0-35-generic'

    // Combine and sanitize for filename
    // Replace non-alphanumeric, non-hyphen, non-dot characters with underscores
    // And convert dots in release to underscores to prevent issues with file extensions
    const osIdentifier = `${osPlatform}_${osRelease}`
        .replace(/[^a-zA-Z0-9-.]/g, '_')
        .replace(/\./g, '_')

    // Construct the filename with the OS identifier
    const filename = `users_table_data_${dateString}.${osIdentifier}.dev.csv`

    // Append the data to a CSV file
    const csvRow = rawUserData.join(',') + '\n'

    fs.appendFile(filename, csvRow, (err) => {
        if (err) {
            console.error('Error logging user data:', err)
        } else {
            console.log(`User data logged to ${filename}.`)
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
    const _firstName = faker.person.firstName()
    const _lastName = faker.person.lastName()
    const username = createNameId({ capitalize: true, delimiter: '' })
    const email = username.toLowerCase() + '@' + faker.internet.domainName()
    const password = faker.internet.password({ length: 8, memorable: true })
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

const createFakeQuest = async (animal = faker.animal.type()) => {
    const user_id = getRandomInt(1, 12)
    const animalEmoji = emoji.find(animal)

    const questTypes = [
        'Wildlife Survey',
        'Nature Photography',
        'Species Discovery',
        'Biodiversity Count',
        'Wildlife Tracking',
        'Nature Explorer',
        'EcoQuest',
    ]
    const questSuffixes = [
        'Mission',
        'Adventure',
        'Expedition',
        'Challenge',
        'Journey',
        'Survey',
        'Hunt',
    ]

    const location = generateLocation()

    // Sometimes include location in quest name (40% chance)
    const includeLocation = Math.random() < 0.4
    const questType = faker.helpers.arrayElement(questTypes)
    const questSuffix = faker.helpers.arrayElement(questSuffixes)

    let name: string
    if (includeLocation) {
        // Extract short location name (e.g., "Central Park" from "Central Park, NYC")
        const shortLocation = location.name.split(',')[0]
        const locationTemplates = [
            `${shortLocation} ${questType}`,
            `${questType} at ${shortLocation}`,
            `${shortLocation} ${questSuffix}`,
            `${questType} in ${shortLocation}`,
        ]
        const template = faker.helpers.arrayElement(locationTemplates)
        name = `${template} ${animalEmoji?.emoji || '🔍'}`
    } else {
        name = `${questType} ${questSuffix} ${animalEmoji?.emoji || '🔍'}`
    }

    // Generate date range for quest (could be past, present, or future)
    const startDate = faker.date.between({
        from: '2024-01-01',
        to: '2025-12-31',
    })
    const endDate = faker.date.between({
        from: startDate,
        to: new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000), // Max 30 days later
    })

    const created_at = faker.date.between({
        from: '2020-01-01',
        to: Date.now(),
    })
    const updated_at = faker.date.between({
        from: created_at,
        to: Date.now(),
    })

    const is_private = faker.number.int({ min: 0, max: 1 })
    const status = faker.helpers.arrayElement(['active', 'paused', 'ended'])

    console.log(
        `Creating quest for user ${user_id}: "${name}" at ${location.name}`
    )

    return {
        name: name,
        user_id,
        created_at,
        updated_at,
        is_private,
        status,
        location_name: location.name,
        latitude: location.lat,
        longitude: location.lng,
        place_id: location.place_id,
        date_time_start: startDate,
        date_time_end: endDate,
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

        // Generate quests for this user
        const numberOfQuests = getRandomInt(0, 4)
        for (let j = 0; j < numberOfQuests; j++) {
            const animal = faker.animal.type()
            const quest = await createFakeQuest(animal)
            quest.user_id = user_id
            const quest_id = await addRowToTable('quests', quest)

            // Add taxa to the quest based on location
            const numberOfTaxa = getRandomInt(5, 20)
            const taxaArray = await fetchLocationTaxa(
                quest.latitude,
                quest.longitude,
                numberOfTaxa
            )

            for (const taxon_id of taxaArray) {
                await addRowToTable('quests_to_taxa', {
                    quest_id,
                    taxon_id,
                })
            }

            // Add small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100))
        }
        userIds.push(user_id)
    }
    return userIds
}

const _dropTable = async (tableName: string) => {
    await db.execute(`DROP TABLE ${tableName}`)
}

async function addUserToDatabase(user: User) {
    const { password: UNSAFEPassword } = user
    const securePassword = hashSync(UNSAFEPassword, genSaltSync(10))
    const safeUser = { ...user, password: securePassword }
    return await addRowToTable('users', safeUser)
}

async function addRowToTable<T extends object>(tableName: string, data: T) {
    const columns = Object.keys(data).join(', ')
    const values = Object.values(data)
    const placeholders = values.map(() => '?').join(', ')
    try {
        // FIXME: This should be properly typed.
        const [result] = await db.execute<ResultSetHeader>(
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
let _admin
try {
    _admin = await addUserToDatabase(adminUser)
    console.log('Admin created successfully:')
    console.log(adminUser)
} catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ER_DUP_ENTRY') {
        console.log('Admin user already exists, skipping creation')
    } else {
        console.error('Error creating admin user:', error)
        throw error
    }
}

// Create some additional standalone quests with different characteristics
console.log('Creating additional sample quests...')

const sampleQuests = [
    {
        name: 'Urban Wildlife Photography Challenge 📸',
        user_id: getRandomInt(1, 12),
        status: 'active' as const,
        is_private: false,
        location_name: 'Stanley Park, Vancouver',
        latitude: 49.301389,
        longitude: -123.143889,
        place_id: 'stanley_park_vancouver',
        date_time_start: new Date('2024-06-01'),
        date_time_end: new Date('2024-08-31'),
    },
    {
        name: 'Spring Bird Migration Count 🐦',
        user_id: getRandomInt(1, 12),
        status: 'active' as const,
        is_private: false,
        location_name: 'Point Pelee National Park, Ontario',
        latitude: 42.203611,
        longitude: -82.515833,
        place_id: 'point_pelee_np_on',
        date_time_start: new Date('2024-03-20'),
        date_time_end: new Date('2024-06-21'),
    },
    {
        name: 'African Safari Documentation 🦁',
        user_id: getRandomInt(1, 12),
        status: 'paused' as const,
        is_private: true,
        location_name: 'Kruger National Park, South Africa',
        latitude: -24.0058,
        longitude: 31.4914,
        place_id: 'kruger_np_za',
        date_time_start: new Date('2024-04-15'),
        date_time_end: new Date('2024-10-15'),
    },
]

for (const questData of sampleQuests) {
    const created_at = faker.date.between({
        from: '2024-01-01',
        to: Date.now(),
    })
    const updated_at = faker.date.between({
        from: created_at,
        to: Date.now(),
    })

    const quest = {
        ...questData,
        created_at,
        updated_at,
    }

    const quest_id = await addRowToTable('quests', quest)

    // Add location-based taxa to each sample quest
    const numberOfTaxa = getRandomInt(8, 25)
    const taxaArray = await fetchLocationTaxa(
        quest.latitude,
        quest.longitude,
        numberOfTaxa
    )
    for (const taxon_id of taxaArray) {
        await addRowToTable('quests_to_taxa', {
            quest_id,
            taxon_id,
        })
    }

    console.log(
        `Created sample quest: ${quest.name} with ${taxaArray.length} location-based taxa`
    )

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200))
}

db.end()

console.log('Seed completed!')
console.log(`Created ${users?.length} users with quests`)
console.log('Created admin user')
console.log('Created sample quests')
